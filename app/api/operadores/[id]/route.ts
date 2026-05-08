export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadOperatorAuth,
  operatorAccessFilter,
  operatorToDTO,
  canEditOperator,
  canDeleteOperator,
  deriveContractStatus,
  VALID_RELATION_TYPES,
  VALID_CONTRACT_STATUSES,
  VALID_OPERATOR_TYPES,
  VALID_LGPD_COMPLIANCE_STATUSES,
} from "@/lib/operadores-helpers";
import { recalcRiskAndClause } from "@/lib/operadores-risco-contrato";

const FULL_INCLUDE = {
  responsible: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  processLinks: {
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, status: true },
      },
    },
  },
} as const;

/**
 * GET /api/operadores/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Operadores" },
      { status: 403 },
    );
  }


  const op = await prisma.operator.findFirst({
    where: { id: params.id, ...operatorAccessFilter(user) },
    include: FULL_INCLUDE,
  });
  if (!op) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  const dto = operatorToDTO(op);
  return NextResponse.json({
    operator: {
      ...dto,
      contractStatus: deriveContractStatus(
        op.contractStatus,
        op.contractExpiresAt
      ),
    },
  });
}

/**
 * PATCH /api/operadores/[id]
 *
 * Atualização ampla — aceita qualquer subset dos campos editáveis.
 * Recalcula contractRiskClass e recommendedClause SEMPRE que algum dos
 * 6 critérios ANPD ou relationType mudar.
 *
 * Apenas DPO edita.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Operadores" },
      { status: 403 },
    );
  }


  if (!canEditOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode editar operadores" },
      { status: 403 }
    );
  }

  const existing = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
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

  // Identificação
  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) {
      return NextResponse.json(
        { error: "Razão social não pode ficar vazia" },
        { status: 400 }
      );
    }
    updates.name = v.slice(0, 200);
  }
  for (const f of ["tradeName", "cnpj", "country", "description", "notes"]) {
    if (f in body) updates[f] = body[f] ? String(body[f]).slice(0, 1000) : null;
  }
  if ("operatorType" in body) {
    if (body.operatorType == null) {
      updates.operatorType = null;
    } else if (
      typeof body.operatorType === "string" &&
      VALID_OPERATOR_TYPES.has(body.operatorType)
    ) {
      updates.operatorType = body.operatorType;
    } else {
      return NextResponse.json(
        { error: "Tipo de operador inválido" },
        { status: 400 }
      );
    }
  }

  // Posição (relationType + classificationAnswers)
  if ("classificationAnswers" in body) {
    const answers = body.classificationAnswers;
    if (answers == null) {
      updates.classificationAnswers = null;
    } else if (typeof answers === "object" && !Array.isArray(answers)) {
      updates.classificationAnswers = answers;
    } else {
      return NextResponse.json(
        { error: "classificationAnswers deve ser objeto" },
        { status: 400 }
      );
    }
  }
  if ("relationType" in body) {
    if (!VALID_RELATION_TYPES.has(body.relationType)) {
      return NextResponse.json(
        { error: "Posição (relationType) inválida" },
        { status: 400 }
      );
    }
    updates.relationType = body.relationType;
  }

  // Contato terceiro
  for (const f of [
    "thirdPartyDpoName",
    "thirdPartyDpoEmail",
    "thirdPartyDpoPhone",
  ]) {
    if (f in body) updates[f] = body[f] ? String(body[f]).slice(0, 200) : null;
  }

  // Responsável interno
  if ("responsibleId" in body) {
    if (body.responsibleId == null) {
      updates.responsibleId = null;
    } else if (typeof body.responsibleId === "string") {
      const exists = await prisma.user.findFirst({
        where: { id: body.responsibleId, companyId: user.companyId },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "Responsável interno não encontrado nesta empresa" },
          { status: 404 }
        );
      }
      updates.responsibleId = body.responsibleId;
    }
  }

  // Termo de Confidencialidade
  if ("confidentialityTermSignedAt" in body) {
    updates.confidentialityTermSignedAt = body.confidentialityTermSignedAt
      ? new Date(body.confidentialityTermSignedAt)
      : null;
  }
  if ("confidentialityTermAttachment" in body) {
    updates.confidentialityTermAttachment = body.confidentialityTermAttachment
      ? String(body.confidentialityTermAttachment).slice(0, 500)
      : null;
  }

  // Contrato
  for (const f of ["contractLabel"]) {
    if (f in body) updates[f] = body[f] ? String(body[f]).slice(0, 200) : null;
  }
  for (const f of [
    "contractSignedAt",
    "contractExpiresAt",
    "contractLastReviewedAt",
    "contractOriginalDate",
  ]) {
    if (f in body) updates[f] = body[f] ? new Date(body[f]) : null;
  }
  if ("contractStatus" in body) {
    if (!VALID_CONTRACT_STATUSES.has(body.contractStatus)) {
      return NextResponse.json(
        { error: "Status de contrato inválido" },
        { status: 400 }
      );
    }
    updates.contractStatus = body.contractStatus;
  }
  if ("lgpdComplianceStatus" in body) {
    if (!VALID_LGPD_COMPLIANCE_STATUSES.has(body.lgpdComplianceStatus)) {
      return NextResponse.json(
        { error: "Status de adequação LGPD inválido" },
        { status: 400 }
      );
    }
    updates.lgpdComplianceStatus = body.lgpdComplianceStatus;
  }

  // Régua de risco — 6 booleanos
  const riskFields = [
    "largaEscala",
    "afetaTitulares",
    "novasTecnologias",
    "vigilanciaPublica",
    "decisaoAutomatizada",
    "dadosSensiveis",
  ] as const;
  for (const f of riskFields) {
    if (f in body) updates[f] = !!body[f];
  }

  // Cláusulas presentes
  for (const f of [
    "hasPrivacyClause",
    "hasIncidentClause",
    "permitsSubcontracting",
    "permitsInternationalTransfer",
    "isStandardMinute",
  ]) {
    if (f in body) updates[f] = !!body[f];
  }
  if ("incidentNotificationDays" in body) {
    if (body.incidentNotificationDays == null) {
      updates.incidentNotificationDays = null;
    } else {
      const n = Number(body.incidentNotificationDays);
      if (!Number.isFinite(n) || n < 0 || n > 365) {
        return NextResponse.json(
          { error: "incidentNotificationDays deve ser 0-365" },
          { status: 400 }
        );
      }
      updates.incidentNotificationDays = Math.round(n);
    }
  }

  // Anexos
  if ("contractAttachments" in body) {
    if (!Array.isArray(body.contractAttachments)) {
      return NextResponse.json(
        { error: "contractAttachments deve ser array" },
        { status: 400 }
      );
    }
    updates.contractAttachments = body.contractAttachments;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  // Recalcula risco + cláusula recomendada se algum dos 6 critérios ou
  // relationType mudou (ou é re-classificação manual).
  const willChangeRisk = riskFields.some((f) => f in updates);
  const willChangeRelation = "relationType" in updates;
  if (willChangeRisk || willChangeRelation) {
    const finalRelation =
      (updates.relationType as string | undefined) ?? existing.relationType;
    const finalCriteria = {
      largaEscala: (updates.largaEscala as boolean | undefined) ?? existing.largaEscala,
      afetaTitulares: (updates.afetaTitulares as boolean | undefined) ?? existing.afetaTitulares,
      novasTecnologias: (updates.novasTecnologias as boolean | undefined) ?? existing.novasTecnologias,
      vigilanciaPublica: (updates.vigilanciaPublica as boolean | undefined) ?? existing.vigilanciaPublica,
      decisaoAutomatizada: (updates.decisaoAutomatizada as boolean | undefined) ?? existing.decisaoAutomatizada,
      dadosSensiveis: (updates.dadosSensiveis as boolean | undefined) ?? existing.dadosSensiveis,
    };
    const recomp = recalcRiskAndClause(finalRelation as any, finalCriteria);
    updates.contractRiskClass = recomp.riskClass;
    updates.recommendedClause = recomp.recommendedClause;
  }

  const updated = await prisma.operator.update({
    where: { id: params.id },
    data: updates,
    include: FULL_INCLUDE,
  });

  const dto = operatorToDTO(updated);
  return NextResponse.json({
    operator: {
      ...dto,
      contractStatus: deriveContractStatus(
        updated.contractStatus,
        updated.contractExpiresAt
      ),
    },
  });
}

/**
 * DELETE /api/operadores/[id]
 *
 * Apenas DPO. Cascade remove operator_process_links.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadOperatorAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Operadores" },
      { status: 403 },
    );
  }


  if (!canDeleteOperator(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode excluir operadores" },
      { status: 403 }
    );
  }

  const existing = await prisma.operator.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Operador não encontrado" },
      { status: 404 }
    );
  }

  await prisma.operator.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// Helper de classificação fica como utilitário do client (a UI calcula
// localmente em tempo real). Persistência ocorre via PATCH com
// `classificationAnswers` + `relationType`.
