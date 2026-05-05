export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadIncidentAuth,
  incidentAccessFilter,
  incidentToDTO,
  computeIncidentStats,
  INCIDENT_FULL_INCLUDE,
  VALID_INCIDENT_SEVERITIES,
  VALID_INCIDENT_TYPES,
  sanitizeText,
  sanitizeRequiredText,
  sanitizeDate,
  sanitizeInt,
  sanitizeBool,
} from "@/lib/incidentes-helpers";

/**
 * GET /api/incidents
 *
 * Lista incidentes da org. Filtragem por papel:
 *   - DPO: todos
 *   - Contribuidor: somente os que ele criou
 *
 * Devolve { items: IncidentDTO[], stats: IncidentStats }.
 */
export async function GET(_request: NextRequest) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const incidents = await prisma.incident.findMany({
    where: incidentAccessFilter(user),
    include: INCIDENT_FULL_INCLUDE,
    orderBy: [{ detectedAt: "desc" }],
  });

  const items = incidents.map((i: any) => incidentToDTO(i));
  const stats = computeIncidentStats(
    incidents.map((i: any) => ({
      status: i.status,
      severity: i.severity,
      detectedAt: i.detectedAt,
      anpdNotifiedAt: i.anpdNotifiedAt,
    }))
  );

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/incidents
 *
 * Cria novo incidente. Qualquer papel pode (DPO ou Contribuidor).
 *
 * Body mínimo: { title, description, incidentType, detectedAt }.
 * Demais campos opcionais. `severity` default = MEDIO. `status` default
 * = DETECTADO.
 */
export async function POST(request: NextRequest) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = sanitizeRequiredText(body?.title, 200);
  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 }
    );
  }
  const description = sanitizeRequiredText(body?.description, 5000);
  if (!description) {
    return NextResponse.json(
      { error: "Descrição é obrigatória" },
      { status: 400 }
    );
  }

  const incidentType =
    typeof body?.incidentType === "string" &&
    VALID_INCIDENT_TYPES.has(body.incidentType)
      ? body.incidentType
      : "OUTRO";

  const detectedAt = sanitizeDate(body?.detectedAt) ?? new Date();
  const occurredAt = sanitizeDate(body?.occurredAt);

  const severity =
    typeof body?.severity === "string" &&
    VALID_INCIDENT_SEVERITIES.has(body.severity)
      ? body.severity
      : "MEDIO";

  const created = await prisma.incident.create({
    data: {
      companyId: user.companyId,
      title,
      description,
      incidentType,
      severity,
      status: "DETECTADO",
      occurredAt,
      detectedAt,
      affectedDataTypes: sanitizeText(body?.affectedDataTypes),
      hasSensitiveData: sanitizeBool(body?.hasSensitiveData),
      affectedSubjectsCategories: sanitizeText(body?.affectedSubjectsCategories),
      affectedSubjectsCount: sanitizeInt(body?.affectedSubjectsCount),
      rootCause: sanitizeText(body?.rootCause),
      attackVector: sanitizeText(body?.attackVector, 200),
      affectedSystems: sanitizeText(body?.affectedSystems),
      affectedOperators: sanitizeText(body?.affectedOperators),
      riskAssessment: sanitizeText(body?.riskAssessment),
      securityMeasuresInPlace: sanitizeText(body?.securityMeasuresInPlace),
      containmentMeasures: sanitizeText(body?.containmentMeasures),
      correctiveMeasures: sanitizeText(body?.correctiveMeasures),
      delayJustification: sanitizeText(body?.delayJustification),
      createdById: user.id,
    },
    include: INCIDENT_FULL_INCLUDE,
  });

  return NextResponse.json(
    { incident: incidentToDTO(created as any) },
    { status: 201 }
  );
}
