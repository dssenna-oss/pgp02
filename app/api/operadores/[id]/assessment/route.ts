export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  canEditOperator,
} from "@/lib/operadores-helpers";
import {
  generateAssessmentToken,
  ASSESSMENT_STATUS,
} from "@/lib/operadores-pontuacao";

/**
 * GET /api/operadores/[id]/assessment
 *
 * Lista todos os assessments do operador (mais recentes primeiro).
 * Devolve dados resumidos (sem `thirdPartyAnswers` completo).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true },
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  const items = await prisma.operatorAssessment.findMany({
    where: { operatorId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      reviewedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      label: a.label,
      status: a.status,
      publicToken: a.publicToken,
      sentAt: a.sentAt?.toISOString() ?? null,
      thirdPartyStartedAt: a.thirdPartyStartedAt?.toISOString() ?? null,
      thirdPartyCompletedAt: a.thirdPartyCompletedAt?.toISOString() ?? null,
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
      reviewedBy: a.reviewedBy,
      cyberScore: a.cyberScore,
      cyberMax: a.cyberMax,
      cyberPercentage: a.cyberPercentage,
      cyberRiskClass: a.cyberRiskClass,
      lgpdScore: a.lgpdScore,
      lgpdMax: a.lgpdMax,
      lgpdPercentage: a.lgpdPercentage,
      lgpdRiskClass: a.lgpdRiskClass,
      overallPercentage: a.overallPercentage,
      overallRiskClass: a.overallRiskClass,
      createdBy: a.createdBy,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}

/**
 * POST /api/operadores/[id]/assessment
 *
 * Cria nova avaliação. Apenas DPO. Body opcional: { label, sendNow: boolean }.
 *
 * Se `sendNow=true`, gera publicToken imediatamente e marca status
 * como AGUARDANDO_TERCEIRO (link pode ser compartilhado de cara).
 * Caso contrário, status fica PENDENTE até DPO clicar em "Enviar".
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
      { error: "Apenas DPO pode criar avaliações" },
      { status: 403 }
    );
  }

  const op = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, name: true },
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
  const sendNow = !!body.sendNow;
  const label = body.label
    ? String(body.label).slice(0, 200)
    : `Avaliação ${new Date().getFullYear()}`;

  const created = await prisma.operatorAssessment.create({
    data: {
      operatorId: params.id,
      label,
      status: sendNow ? ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO : ASSESSMENT_STATUS.PENDENTE,
      publicToken: sendNow ? generateAssessmentToken() : null,
      sentAt: sendNow ? new Date() : null,
      createdById: user.id,
    },
  });

  return NextResponse.json(
    {
      assessment: {
        id: created.id,
        label: created.label,
        status: created.status,
        publicToken: created.publicToken,
        sentAt: created.sentAt?.toISOString() ?? null,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
