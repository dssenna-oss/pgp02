export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPolicyAuth, policyToDTO } from "@/lib/policies-helpers";
import {
  aggregateInventoryData,
  applyAggregatedSnapshot,
  hasAggregatablePlaceholders,
} from "@/lib/policy-data-aggregator";

/**
 * POST /api/politicas/[id]/refresh-from-inventory
 *
 * Roda o aggregator do Inventário e atualiza o `currentContent` da
 * política substituindo os 3 placeholders {{categorias_dados}},
 * {{matriz_tratamento}} e {{tipos_compartilhamento}} por blocos
 * markdown gerados a partir dos processos APROVADOS e operadores
 * cadastrados na organização.
 *
 * Comportamento:
 *   - Snapshot fica congelado em `aggregatedDataSnapshot` (JSON) +
 *     timestamp em `aggregatedAt`. Edições manuais do DPO depois
 *     desta chamada não são sobrescritas pelo Inventário.
 *   - Se o template não tiver nenhum dos 3 placeholders, devolve 400
 *     pra evitar substituições silenciosas.
 *   - Se a política já está PUBLICADA, ainda permite atualizar o
 *     rascunho — só vira público quando "publicar" for chamado.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO pode atualizar política" },
      { status: 403 },
    );
  }
  const { id } = await params;

  // 1. Carrega a política + dados pra agregação em paralelo
  const [policy, processes, operators, company] = await Promise.all([
    prisma.policy.findFirst({
      where: { id, companyId: user.companyId },
    }),
    prisma.dataInventory.findMany({
      where: { companyId: user.companyId, status: "APROVADO" },
      select: {
        serviceName: true,
        personalData: true,
        legalBasis: true,
        purpose: true,
        dataSubjects: true,
        sharing: true,
        status: true,
      },
    }),
    prisma.operator.findMany({
      where: { companyId: user.companyId },
      select: {
        name: true,
        cnpj: true,
        relationType: true,
        operatorType: true,
      },
    }),
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, slug: true, companyName: true },
    }),
  ]);

  if (!policy) {
    return NextResponse.json(
      { error: "Política não encontrada" },
      { status: 404 },
    );
  }

  // 2. Verifica que o template tem placeholders agregáveis — senão é
  // gasto desnecessário e provavelmente erro do DPO (ele tentou
  // atualizar uma política que não usa Inventário, ex.: Política de
  // Treinamento, Norma).
  if (!hasAggregatablePlaceholders(policy.currentContent)) {
    return NextResponse.json(
      {
        error:
          "Esta política não tem placeholders do Inventário ({{categorias_dados}}, {{matriz_tratamento}}, {{tipos_compartilhamento}}). Use 'Atualizar do Inventário' apenas em Aviso de Privacidade Externo, Política de Cookies e similares.",
      },
      { status: 400 },
    );
  }

  // 3. Roda o aggregator
  const snapshot = aggregateInventoryData(processes, operators);

  // 4. Substitui placeholders no currentContent
  const newContent = applyAggregatedSnapshot(policy.currentContent, snapshot);

  // 5. Salva snapshot + timestamp + novo conteúdo
  const updated = await prisma.policy.update({
    where: { id: policy.id },
    data: {
      currentContent: newContent,
      aggregatedDataSnapshot: snapshot as any, // Prisma Json
      aggregatedAt: new Date(),
    },
    include: {
      publishedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({
    policy: policyToDTO(updated as any, company?.slug ?? null),
    snapshot: {
      processesCount: snapshot.processesCount,
      categoriesCount: snapshot.categories.length,
      matrixRows: snapshot.matrix.length,
      operatorsCount: snapshot.compartilhamentos.length,
      generatedAt: snapshot.generatedAt,
    },
  });
}
