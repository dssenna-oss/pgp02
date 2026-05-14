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
export async function GET(request: NextRequest) {
  const r = await loadIncidentAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Incidentes" },
      { status: 403 },
    );
  }

  // Filtros via query string pra view inversa M:N (D2, 2026-05-10):
  // - inventoryId: incidentes que envolveram este processo do Inventário
  // - operatorId: incidentes que envolveram este operador
  // Combinam com incidentAccessFilter (auth) — não substituem.
  const inventoryId = request.nextUrl.searchParams.get("inventoryId");
  const operatorId = request.nextUrl.searchParams.get("operatorId");

  const where: any = incidentAccessFilter(user);
  if (inventoryId) {
    where.dataInventories = { some: { dataInventoryId: inventoryId } };
  }
  if (operatorId) {
    where.affectedOperatorsList = { some: { operatorId: operatorId } };
  }

  const incidents = await prisma.incident.findMany({
    where,
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
  if (!user.isDPO) {
    return NextResponse.json(
      { error: "Apenas DPO acessa Incidentes" },
      { status: 403 },
    );
  }


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

  // ----- Vínculos M:N (Checkpoint 16 / F2-F3) -----
  // Permite criar o incidente JÁ com chips de Inventário e Operadores
  // selecionados — antes precisava-se criar e depois fazer um PATCH.
  // Validação: cada id precisa pertencer à mesma companyId.
  let linkedInventoryIds: string[] = [];
  let linkedOperatorIds: string[] = [];

  if (Array.isArray(body?.linkedInventoryIds)) {
    const ids = body.linkedInventoryIds.filter(
      (x: unknown) => typeof x === "string" && x,
    ) as string[];
    if (ids.length > 0) {
      const valid = await prisma.dataInventory.findMany({
        where: { id: { in: ids }, companyId: user.companyId },
        select: { id: true },
      });
      linkedInventoryIds = valid.map((v) => v.id);
    }
  }

  if (Array.isArray(body?.linkedOperatorIds)) {
    const ids = body.linkedOperatorIds.filter(
      (x: unknown) => typeof x === "string" && x,
    ) as string[];
    if (ids.length > 0) {
      const valid = await prisma.operator.findMany({
        where: { id: { in: ids }, companyId: user.companyId },
        select: { id: true },
      });
      linkedOperatorIds = valid.map((v) => v.id);
    }
  }

  // Cria o incidente + vínculos M:N atomicamente.
  const created = await prisma.$transaction(async (tx) => {
    const inc = await tx.incident.create({
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
    });

    if (linkedInventoryIds.length > 0) {
      await tx.incidentDataInventory.createMany({
        data: linkedInventoryIds.map((dataInventoryId) => ({
          incidentId: inc.id,
          dataInventoryId,
        })),
      });
    }
    if (linkedOperatorIds.length > 0) {
      await tx.incidentOperator.createMany({
        data: linkedOperatorIds.map((operatorId) => ({
          incidentId: inc.id,
          operatorId,
        })),
      });
    }

    return tx.incident.findUnique({
      where: { id: inc.id },
      include: INCIDENT_FULL_INCLUDE,
    });
  });

  return NextResponse.json(
    { incident: incidentToDTO(created as any) },
    { status: 201 }
  );
}
