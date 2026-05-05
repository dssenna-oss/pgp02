export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  canEditOperator,
} from "@/lib/operadores-helpers";
import {
  ASSESSMENT_STATUS,
  generateAssessmentToken,
  computeAssessmentScore,
} from "@/lib/operadores-pontuacao";
import type { FormResponses } from "@/lib/operadores-formulario";

/**
 * GET /api/operadores/[id]/assessment/[assessmentId]
 *
 * Devolve um assessment completo (incluindo respostas + notas DPO).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; assessmentId: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const a = await prisma.operatorAssessment.findFirst({
    where: {
      id: params.assessmentId,
      operatorId: params.id,
      operator: { companyId: user.companyId },
    },
    include: {
      reviewedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      operator: { select: { id: true, name: true } },
    },
  });
  if (!a) {
    return NextResponse.json(
      { error: "Avaliação não encontrada" },
      { status: 404 }
    );
  }

  // Calcula score em tempo real (mesmo se status=REVISADO — deixa
  // consistente com possíveis edits após review)
  const live = computeAssessmentScore(
    (a.thirdPartyAnswers ?? {}) as unknown as FormResponses
  );

  return NextResponse.json({
    assessment: {
      id: a.id,
      operatorId: a.operatorId,
      operator: a.operator,
      label: a.label,
      status: a.status,
      publicToken: a.publicToken,
      publicUrl: a.publicToken
        ? `/avaliacao-terceiro/${a.publicToken}`
        : null,
      sentAt: a.sentAt?.toISOString() ?? null,
      thirdPartyStartedAt: a.thirdPartyStartedAt?.toISOString() ?? null,
      thirdPartyCompletedAt: a.thirdPartyCompletedAt?.toISOString() ?? null,
      thirdPartyAnswers: a.thirdPartyAnswers ?? {},
      dpoNotes: a.dpoNotes ?? {},
      reviewedById: a.reviewedById,
      reviewedBy: a.reviewedBy,
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
      // Persistido (depois de revisar)
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
      // Live (sempre atualizado conforme respostas atuais)
      live,
      createdBy: a.createdBy,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    },
  });
}

/**
 * PATCH /api/operadores/[id]/assessment/[assessmentId]
 *
 * Atualiza assessment. Apenas DPO. Acepta:
 *   - label
 *   - status: "AGUARDANDO_TERCEIRO" (envia/reenvia) — gera novo
 *     publicToken se ainda não tiver
 *   - status: "REVISADO" (finaliza após revisão) — calcula scores
 *     e persiste; exige status=RESPONDIDO
 *   - status: "CANCELADO" (cancela)
 *   - dpoNotes: { qid: "comentário" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assessmentId: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode editar avaliações" },
      { status: 403 }
    );
  }

  const existing = await prisma.operatorAssessment.findFirst({
    where: {
      id: params.assessmentId,
      operatorId: params.id,
      operator: { companyId: user.companyId },
    },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Avaliação não encontrada" },
      { status: 404 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.label === "string") {
    updates.label = body.label.slice(0, 200);
  }

  if ("dpoNotes" in body) {
    if (typeof body.dpoNotes !== "object" || Array.isArray(body.dpoNotes)) {
      return NextResponse.json(
        { error: "dpoNotes deve ser objeto" },
        { status: 400 }
      );
    }
    updates.dpoNotes = body.dpoNotes;
  }

  if (typeof body.status === "string") {
    if (body.status === ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO) {
      // Envia/reenvia — gera token se não tiver
      updates.status = ASSESSMENT_STATUS.AGUARDANDO_TERCEIRO;
      if (!existing.publicToken) {
        updates.publicToken = generateAssessmentToken();
      }
      if (!existing.sentAt) {
        updates.sentAt = new Date();
      }
    } else if (body.status === ASSESSMENT_STATUS.CANCELADO) {
      updates.status = ASSESSMENT_STATUS.CANCELADO;
      updates.publicToken = null;
    } else if (body.status === ASSESSMENT_STATUS.REVISADO) {
      // Finaliza revisão — exige RESPONDIDO
      if (existing.status !== ASSESSMENT_STATUS.RESPONDIDO) {
        return NextResponse.json(
          {
            error:
              "Só pode revisar avaliações já respondidas pelo terceiro.",
          },
          { status: 400 }
        );
      }
      const score = computeAssessmentScore(
        (existing.thirdPartyAnswers ?? {}) as unknown as FormResponses
      );
      updates.status = ASSESSMENT_STATUS.REVISADO;
      updates.reviewedById = user.id;
      updates.reviewedAt = new Date();
      updates.publicToken = null; // revoga token
      updates.cyberScore = score.cyber.score;
      updates.cyberMax = score.cyber.max;
      updates.cyberPercentage = score.cyber.percentage;
      updates.cyberRiskClass = score.cyber.riskClass;
      updates.lgpdScore = score.lgpd.score;
      updates.lgpdMax = score.lgpd.max;
      updates.lgpdPercentage = score.lgpd.percentage;
      updates.lgpdRiskClass = score.lgpd.riskClass;
      updates.overallPercentage = score.overall.percentage;
      updates.overallRiskClass = score.overall.riskClass;
    } else {
      return NextResponse.json(
        { error: `Transição de status inválida: ${body.status}` },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.operatorAssessment.update({
    where: { id: params.assessmentId },
    data: updates,
  });

  return NextResponse.json({
    assessment: {
      id: updated.id,
      status: updated.status,
      publicToken: updated.publicToken,
      publicUrl: updated.publicToken
        ? `/avaliacao-terceiro/${updated.publicToken}`
        : null,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      cyberScore: updated.cyberScore,
      cyberMax: updated.cyberMax,
      cyberPercentage: updated.cyberPercentage,
      cyberRiskClass: updated.cyberRiskClass,
      lgpdScore: updated.lgpdScore,
      lgpdMax: updated.lgpdMax,
      lgpdPercentage: updated.lgpdPercentage,
      lgpdRiskClass: updated.lgpdRiskClass,
      overallPercentage: updated.overallPercentage,
      overallRiskClass: updated.overallRiskClass,
    },
  });
}

/**
 * DELETE /api/operadores/[id]/assessment/[assessmentId]
 *
 * Exclui completamente o assessment (DPO-only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; assessmentId: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode excluir avaliações" },
      { status: 403 }
    );
  }

  const a = await prisma.operatorAssessment.findFirst({
    where: {
      id: params.assessmentId,
      operatorId: params.id,
      operator: { companyId: user.companyId },
    },
    select: { id: true },
  });
  if (!a) {
    return NextResponse.json(
      { error: "Avaliação não encontrada" },
      { status: 404 }
    );
  }

  await prisma.operatorAssessment.delete({
    where: { id: params.assessmentId },
  });
  return NextResponse.json({ ok: true });
}
