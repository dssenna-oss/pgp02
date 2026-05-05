export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  canEditOperator,
  recommendedClauseLabel,
  type RecommendedClause,
} from "@/lib/operadores-helpers";
import { renderClauseTemplate } from "@/lib/operadores-clausulas";
import { buildPolicyDocx } from "@/lib/policies-docx-export";

const VALID_TYPES = new Set<RecommendedClause>([
  "ROBUSTA",
  "SIMPLES",
  "CC",
  "CLIENTE_OPERADOR",
  "MINUTA",
]);

/**
 * GET /api/operadores/[id]/clause?type=<RecommendedClause>&mode=<NOVA|ADITIVO>
 *
 * Devolve DOCX da cláusula contratual recomendada (ou explicitamente
 * pedida). Apenas DPO.
 *
 * `type` (opcional): se omitido, usa `operator.recommendedClause`.
 *   Se `INDEFINIDO`, devolve 400 — DPO precisa classificar primeiro.
 *
 * `mode` (opcional, default "NOVA"):
 *   - "NOVA"    → cláusula isolada pra constar em contrato em redação
 *   - "ADITIVO" → embrulhada num cabeçalho de Termo Aditivo (uso pra
 *                 adequação de contratos pré-LGPD vigentes)
 *
 * Reutiliza o parser markdown→DOCX do Checkpoint 12 (Políticas).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode baixar cláusulas" },
      { status: 403 }
    );
  }

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: {
      company: {
        select: {
          companyName: true,
          cnpj: true,
          address: true,
          dpoName: true,
          dpoEmail: true,
          dpoPhone: true,
        },
      },
    },
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const requestedType = url.searchParams.get("type") as RecommendedClause | null;
  const clauseType: RecommendedClause =
    requestedType && VALID_TYPES.has(requestedType)
      ? requestedType
      : (op.recommendedClause as RecommendedClause);

  if (clauseType === "INDEFINIDO" || !VALID_TYPES.has(clauseType)) {
    return NextResponse.json(
      {
        error:
          "Cláusula recomendada ainda não definida. Classifique a posição (Operador/Controlador) e os critérios de risco antes de gerar o DOCX.",
      },
      { status: 400 }
    );
  }

  const rawMode = url.searchParams.get("mode");
  const mode: "NOVA" | "ADITIVO" = rawMode === "ADITIVO" ? "ADITIVO" : "NOVA";

  const rendered = renderClauseTemplate({
    operator: {
      name: op.name,
      tradeName: op.tradeName,
      cnpj: op.cnpj,
      country: op.country,
      contractLabel: op.contractLabel,
      contractSignedAt:
        // Em modo aditivo, prioriza data do contrato original
        mode === "ADITIVO" && op.contractOriginalDate
          ? op.contractOriginalDate
          : op.contractSignedAt,
    },
    company: op.company,
    clauseType,
    mode,
  });
  if (!rendered) {
    return NextResponse.json(
      { error: "Template não encontrado" },
      { status: 500 }
    );
  }

  // Reutiliza o builder de DOCX das Políticas — interface já aceita
  // markdown via `content`.
  const buffer = await buildPolicyDocx({
    companyName: op.company.companyName,
    policyTitle: rendered.title,
    policyTypeLabel: recommendedClauseLabel(clauseType),
    publishedAt: null,
    version: 0,
    content: rendered.content,
  });

  // Filename safe
  const safeName = (op.tradeName || op.name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60) || "terceiro";
  const filenamePrefix = mode === "ADITIVO" ? "TermoAditivo" : "Clausula";
  const filename = `${filenamePrefix}_${clauseType}_${safeName}.docx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
