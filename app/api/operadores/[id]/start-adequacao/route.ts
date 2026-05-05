export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  canEditOperator,
} from "@/lib/operadores-helpers";
import {
  ACTION_ORIGIN,
  ACTION_PRIORITY,
  ACTION_STATUS,
} from "@/lib/action-plan-helpers";

/**
 * POST /api/operadores/[id]/start-adequacao
 *
 * Inicia campanha de adequação LGPD pra um operador (Checkpoint 14 H1).
 * Faz 2 coisas:
 *   1. Muda `lgpdComplianceStatus` pra `EM_ADEQUACAO`
 *   2. Cria 5 ações automáticas no Plano de Ação institucional, todas
 *      com `origin = OPERADOR` e `refOperatorId` setado:
 *        - Avaliar via formulário público (deadline +14d)
 *        - Decidir cláusula adequada (deadline +21d)
 *        - Negociar termo aditivo com o terceiro (deadline +45d)
 *        - Assinar e anexar termo aditivo (deadline +75d)
 *        - Reavaliar adequação em 12 meses
 *
 * Idempotente — se rodar 2x não duplica (verifica por título +
 * refOperatorId + ainda em aberto).
 *
 * Apenas DPO. Body opcional: { startDate?: ISO } pra controlar a base
 * dos prazos (default = hoje).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode iniciar campanha de adequação" },
      { status: 403 }
    );
  }

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: {
      id: true,
      name: true,
      contractRiskClass: true,
      lgpdComplianceStatus: true,
    },
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const startDate =
    body.startDate && typeof body.startDate === "string"
      ? new Date(body.startDate)
      : new Date();
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json(
      { error: "startDate inválida" },
      { status: 400 }
    );
  }

  // Prioridade derivada do risco do contrato
  const priority =
    op.contractRiskClass === "ALTO"
      ? ACTION_PRIORITY.ALTA
      : op.contractRiskClass === "MEDIO"
        ? ACTION_PRIORITY.MEDIA
        : ACTION_PRIORITY.BAIXA;

  // Buscar ações já existentes pra dedup (mesma campanha, mesmo operador)
  const existing = await prisma.actionPlan.findMany({
    where: {
      companyId: user.companyId,
      origin: ACTION_ORIGIN.OPERADOR,
      refOperatorId: op.id,
      status: { in: [ACTION_STATUS.A_FAZER, ACTION_STATUS.EM_ANDAMENTO] },
    },
    select: { title: true },
  });
  const seenTitles = new Set(existing.map((a) => a.title));

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  const steps = [
    {
      title: `Adequação ${op.name}: avaliar via formulário (52 perguntas)`,
      description:
        "Crie a avaliação no operador, gere o link público com publicToken e envie ao DPO/responsável LGPD do terceiro. Aguarde resposta antes de avançar.",
      dueDate: addDays(startDate, 14),
    },
    {
      title: `Adequação ${op.name}: decidir cláusula adequada`,
      description:
        "Com base no resultado da avaliação + checklist de posição (Op/Controlador) + régua de risco do contrato (6 critérios ANPD), defina qual das 5 cláusulas LGPD usar (Robusta/Simples/CC/Cliente Operador/Minuta).",
      dueDate: addDays(startDate, 21),
    },
    {
      title: `Adequação ${op.name}: negociar termo aditivo`,
      description:
        "Baixe a cláusula recomendada como TERMO ADITIVO (.docx) e envie pro terceiro. Negocie eventuais ajustes, mas mantenha as obrigações essenciais (encarregado, notificação de incidente, fim do tratamento).",
      dueDate: addDays(startDate, 45),
    },
    {
      title: `Adequação ${op.name}: assinar e anexar termo aditivo`,
      description:
        "Após assinatura das duas partes, anexe o PDF assinado em \"Anexos do contrato\" do operador, atualize a data do aditivo (contractSignedAt) e marque as cláusulas presentes (privacidade, incidente, etc.).",
      dueDate: addDays(startDate, 75),
    },
    {
      title: `Adequação ${op.name}: reavaliar em 12 meses`,
      description:
        "Reabra a avaliação com o terceiro pra confirmar que controles continuam ativos. Se o contrato mudou de objeto ou escala, refaça a régua de risco.",
      dueDate: addDays(startDate, 365),
    },
  ];

  const toCreate = steps
    .filter((s) => !seenTitles.has(s.title))
    .map((s) => ({
      companyId: user.companyId,
      title: s.title,
      description: s.description,
      origin: ACTION_ORIGIN.OPERADOR,
      refOperatorId: op.id,
      priority,
      status: ACTION_STATUS.A_FAZER,
      dueDate: s.dueDate,
      createdById: user.id,
    }));

  // Atualiza status do operador + cria ações em transaction
  await prisma.$transaction([
    prisma.operator.update({
      where: { id: op.id },
      data: { lgpdComplianceStatus: "EM_ADEQUACAO" },
    }),
    ...(toCreate.length > 0
      ? [prisma.actionPlan.createMany({ data: toCreate })]
      : []),
  ]);

  return NextResponse.json({
    ok: true,
    created: toCreate.length,
    skipped: steps.length - toCreate.length,
  });
}
