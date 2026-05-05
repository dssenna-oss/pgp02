export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadIncidentAuth,
  incidentToDTO,
  canEditIncident,
  canDeleteIncident,
  canCloseIncident,
  canTransitionTo,
  INCIDENT_FULL_INCLUDE,
  VALID_INCIDENT_STATUSES,
  VALID_INCIDENT_SEVERITIES,
  VALID_INCIDENT_TYPES,
  sanitizeText,
  sanitizeRequiredText,
  sanitizeDate,
  sanitizeInt,
  sanitizeBool,
} from "@/lib/incidentes-helpers";

/**
 * GET /api/incidents/[id]
 *
 * Devolve um incidente específico (com communications, createdBy, closedBy).
 * Aplica filtro de visibilidade — Contribuidor só acessa os próprios.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const incident = await prisma.incident.findFirst({
    where: {
      id: params.id,
      companyId: user.companyId,
      ...(user.isDPO ? {} : { createdById: user.id }),
    },
    include: INCIDENT_FULL_INCLUDE,
  });

  if (!incident) {
    return NextResponse.json(
      { error: "Incidente não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ incident: incidentToDTO(incident as any) });
}

/**
 * PATCH /api/incidents/[id]
 *
 * Atualiza incidente. Aplica regras de papel:
 *   - DPO pode tudo
 *   - Contribuidor só edita próprio incidente que ainda não foi
 *     comunicado/encerrado
 *
 * Validações:
 *   - Transição de status obedece ao TRANSITIONS
 *   - Encerramento só pelo DPO (e seta closedAt + closedById)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const existing = await prisma.incident.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true, status: true, createdById: true, closedAt: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Incidente não encontrado" },
      { status: 404 }
    );
  }

  if (
    !canEditIncident(user, {
      createdById: existing.createdById,
      status: existing.status,
    })
  ) {
    return NextResponse.json(
      { error: "Sem permissão pra editar este incidente" },
      { status: 403 }
    );
  }

  // Construir update progressivamente — só o que veio no body
  const data: Record<string, unknown> = {};

  if (body?.title != null) {
    const t = sanitizeRequiredText(body.title, 200);
    if (!t) {
      return NextResponse.json(
        { error: "Título não pode ficar vazio" },
        { status: 400 }
      );
    }
    data.title = t;
  }
  if (body?.description != null) {
    const d = sanitizeRequiredText(body.description, 5000);
    if (!d) {
      return NextResponse.json(
        { error: "Descrição não pode ficar vazia" },
        { status: 400 }
      );
    }
    data.description = d;
  }

  if (body?.incidentType != null) {
    if (!VALID_INCIDENT_TYPES.has(body.incidentType)) {
      return NextResponse.json(
        { error: "Tipo de incidente inválido" },
        { status: 400 }
      );
    }
    data.incidentType = body.incidentType;
  }

  if (body?.severity != null) {
    if (!VALID_INCIDENT_SEVERITIES.has(body.severity)) {
      return NextResponse.json(
        { error: "Severidade inválida" },
        { status: 400 }
      );
    }
    data.severity = body.severity;
  }

  // Mudança de status: validar transição
  if (body?.status != null && body.status !== existing.status) {
    if (!VALID_INCIDENT_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "Status inválido" },
        { status: 400 }
      );
    }
    if (!canTransitionTo(existing.status, body.status)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${existing.status} → ${body.status}`,
        },
        { status: 400 }
      );
    }
    if (body.status === "ENCERRADO") {
      if (!canCloseIncident(user)) {
        return NextResponse.json(
          { error: "Apenas DPO pode encerrar incidentes" },
          { status: 403 }
        );
      }
      data.closedAt = new Date();
      data.closedById = user.id;
    }
    if (body.status === "COMUNICADO_TITULARES" && !data.subjectsNotifiedAt) {
      data.subjectsNotifiedAt = new Date();
    }
    data.status = body.status;
  }

  // Datas — só DPO pode ajustar detectedAt depois de criado
  if (body?.detectedAt != null) {
    if (!user.isDPO) {
      return NextResponse.json(
        { error: "Apenas DPO pode ajustar a data de ciência" },
        { status: 403 }
      );
    }
    const d = sanitizeDate(body.detectedAt);
    if (d) data.detectedAt = d;
  }
  if ("occurredAt" in body) {
    data.occurredAt = sanitizeDate(body.occurredAt);
  }
  if ("subjectsNotifiedAt" in body) {
    data.subjectsNotifiedAt = sanitizeDate(body.subjectsNotifiedAt);
  }

  // Campos textuais — qualquer editor preenche
  const textFields: ReadonlyArray<string> = [
    "affectedDataTypes",
    "affectedSubjectsCategories",
    "rootCause",
    "affectedSystems",
    "affectedOperators",
    "riskAssessment",
    "securityMeasuresInPlace",
    "containmentMeasures",
    "correctiveMeasures",
    "delayJustification",
    "closureNotes",
  ];
  for (const f of textFields) {
    if (f in body) {
      (data as any)[f] = sanitizeText(body[f]);
    }
  }
  if ("attackVector" in body) {
    data.attackVector = sanitizeText(body.attackVector, 200);
  }
  if ("hasSensitiveData" in body) {
    data.hasSensitiveData = sanitizeBool(body.hasSensitiveData);
  }
  if ("affectedSubjectsCount" in body) {
    data.affectedSubjectsCount = sanitizeInt(body.affectedSubjectsCount);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo válido para atualizar" },
      { status: 400 }
    );
  }

  const updated = await prisma.incident.update({
    where: { id: params.id },
    data,
    include: INCIDENT_FULL_INCLUDE,
  });

  return NextResponse.json({ incident: incidentToDTO(updated as any) });
}

/**
 * DELETE /api/incidents/[id]
 *
 * Apenas DPO. Cascade nas comunicações.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canDeleteIncident(user)) {
    return NextResponse.json(
      { error: "Apenas DPO pode excluir incidentes" },
      { status: 403 }
    );
  }

  const existing = await prisma.incident.findFirst({
    where: { id: params.id, companyId: user.companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Incidente não encontrado" },
      { status: 404 }
    );
  }

  await prisma.incident.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
