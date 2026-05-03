import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  RISCOS_BY_CODE,
  RISK_STATUS,
  suggestRisks,
  type RiskCode,
  type RiskStatus,
} from "@/lib/riscos-catalog";

/**
 * Endpoints da Análise de Riscos por processo (Checkpoint 5).
 *
 * Acesso: somente DPO (qualquer nível). Contribuidor é bloqueado.
 *
 * GET   → carrega o processo, todos os ProcessRisk existentes e as
 *         sugestões automáticas calculadas a partir do FormAnswers.
 * PATCH → recebe o estado completo dos 13 riscos e sincroniza no banco
 *         (insere os marcados que ainda não existem, atualiza os que já
 *         existem, deleta os desmarcados).
 *
 * Conforme metodologia da Denise: só faz sentido analisar riscos de
 * processos APROVADOS. Processos em rascunho/submetido/em revisão/devolvido
 * não permitem análise (a API recusa).
 */

const VALID_RISK_CODES = new Set(Object.keys(RISCOS_BY_CODE));
const VALID_STATUSES: ReadonlySet<string> = new Set(Object.values(RISK_STATUS));

async function loadDPOAndProcess(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return {
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      ),
    };
  }
  if (!isDPO(user.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode acessar a Análise de Riscos" },
        { status: 403 }
      ),
    };
  }
  const inv = await prisma.dataInventory.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      createdBy: { select: { name: true, email: true, setor: true } },
    },
  });
  if (!inv) {
    return {
      error: NextResponse.json(
        { error: "Processo não encontrado nesta organização" },
        { status: 404 }
      ),
    };
  }
  return { user, inv };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadDPOAndProcess(id);
  if ("error" in r) return r.error;
  const { inv } = r;

  const risks = await prisma.processRisk.findMany({
    where: { dataInventoryId: inv.id },
    include: {
      identifiedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: { riskCode: "asc" },
  });

  const suggestions = suggestRisks({
    answers: (inv as any).formAnswers,
    legalBasis: inv.legalBasis,
    legalBasisSensitive: inv.legalBasisSensitive,
    hasSensitiveData: /sens[íi]ve/i.test(inv.dataCategory ?? ""),
  });

  return NextResponse.json({
    process: {
      id: inv.id,
      serviceName: inv.serviceName,
      status: inv.status,
      setor: inv.setor,
      legalBasis: inv.legalBasis,
      legalBasisSensitive: inv.legalBasisSensitive,
      legalReviewedAt: inv.legalReviewedAt,
      createdBy: inv.createdBy,
    },
    risks,
    suggestions,
  });
}

interface IncomingRisk {
  riskCode: string;
  marked: boolean;
  description?: string | null;
  status?: string;
  autoSuggested?: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadDPOAndProcess(id);
  if ("error" in r) return r.error;
  const { user, inv } = r;

  if (inv.status !== "APROVADO") {
    return NextResponse.json(
      {
        error:
          "Análise de Riscos só pode ser feita em processos APROVADOS. Status atual: " +
          inv.status,
      },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const incoming: IncomingRisk[] = Array.isArray(body?.risks) ? body.risks : [];
  if (incoming.length === 0) {
    return NextResponse.json(
      { error: "Body deve conter array `risks`" },
      { status: 400 }
    );
  }

  // Validação dos códigos e status
  for (const r of incoming) {
    if (!VALID_RISK_CODES.has(r.riskCode)) {
      return NextResponse.json(
        { error: `Código de risco inválido: ${r.riskCode}` },
        { status: 400 }
      );
    }
    if (r.status && !VALID_STATUSES.has(r.status)) {
      return NextResponse.json(
        { error: `Status inválido: ${r.status}` },
        { status: 400 }
      );
    }
  }

  // Estado atual no banco
  const existing = await prisma.processRisk.findMany({
    where: { dataInventoryId: id },
  });
  const existingByCode = new Map(existing.map((e) => [e.riskCode, e]));

  const now = new Date();

  // Operações em transação pra atomicidade
  const ops: any[] = [];
  for (const r of incoming) {
    const prev = existingByCode.get(r.riskCode);
    if (r.marked) {
      const description = r.description?.toString().trim() || null;
      const status = (r.status as RiskStatus) ?? RISK_STATUS.IDENTIFICADO;
      if (!prev) {
        // Novo: cria
        ops.push(
          prisma.processRisk.create({
            data: {
              companyId: inv.companyId,
              dataInventoryId: inv.id,
              riskCode: r.riskCode as RiskCode,
              status,
              description,
              autoSuggested: !!r.autoSuggested,
              identifiedById: user.id,
              identifiedAt: now,
            },
          })
        );
      } else {
        // Existe: atualiza se mudou
        const changed =
          prev.description !== description ||
          prev.status !== status;
        if (changed) {
          ops.push(
            prisma.processRisk.update({
              where: { id: prev.id },
              data: {
                description,
                status,
                reviewedById: user.id,
                reviewedAt: now,
              },
            })
          );
        }
      }
    } else if (prev) {
      // Desmarcado: deleta
      ops.push(prisma.processRisk.delete({ where: { id: prev.id } }));
    }
  }

  if (ops.length > 0) {
    await prisma.$transaction(ops);
  }

  // Re-busca o estado final
  const updated = await prisma.processRisk.findMany({
    where: { dataInventoryId: id },
    include: {
      identifiedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
    orderBy: { riskCode: "asc" },
  });

  return NextResponse.json({ risks: updated });
}
