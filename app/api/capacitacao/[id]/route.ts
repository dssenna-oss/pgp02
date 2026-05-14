export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCapacitacaoAuth,
  canManageCapacitacao,
  canDeleteCapacitacao,
  toCapacitacaoDTO,
  CAPACITACAO_FULL_INCLUDE,
  isValidEixo,
  isValidType,
  isValidAudience,
  isValidStatus,
  isValidRecurrence,
  sanitizeRequiredText,
  sanitizeText,
  sanitizeDate,
  sanitizeIntPositive,
} from "@/lib/capacitacao-helpers";
import { deleteFile } from "@/lib/s3";

/**
 * GET /api/capacitacao/[id] — detalhe de um evento
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  const ev = await prisma.capacitacaoEvento.findFirst({
    where: { id, companyId: user.companyId },
    include: CAPACITACAO_FULL_INCLUDE,
  });
  if (!ev) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json(toCapacitacaoDTO(ev));
}

/**
 * PATCH /api/capacitacao/[id] — atualizar (DPO-only).
 * Aceita atualização parcial — só sobrescreve campos enviados.
 * Auto-marca completedAt quando status muda pra REALIZADO sem completedAt.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem editar eventos de capacitação" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.capacitacaoEvento.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, status: true, completedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if ("title" in body) {
    const v = sanitizeRequiredText(body.title, 200);
    if (v) data.title = v;
  }
  if ("description" in body) {
    data.description = sanitizeText(body.description, 5000);
  }
  if ("eixo" in body && isValidEixo(body.eixo)) data.eixo = body.eixo;
  if ("type" in body && isValidType(body.type)) data.type = body.type;
  if ("audience" in body && isValidAudience(body.audience))
    data.audience = body.audience;
  if ("status" in body && isValidStatus(body.status)) {
    data.status = body.status;
    // Auto-set completedAt ao marcar como REALIZADO se não veio explicito
    if (
      body.status === "REALIZADO" &&
      !existing.completedAt &&
      !("completedAt" in body)
    ) {
      data.completedAt = new Date();
    }
  }
  if ("recurrence" in body && isValidRecurrence(body.recurrence))
    data.recurrence = body.recurrence;
  if ("scheduledAt" in body) data.scheduledAt = sanitizeDate(body.scheduledAt);
  if ("completedAt" in body) data.completedAt = sanitizeDate(body.completedAt);
  if ("attendeesCount" in body)
    data.attendeesCount = sanitizeIntPositive(body.attendeesCount);
  if ("notes" in body) data.notes = sanitizeText(body.notes, 5000);

  // Vínculos
  if ("operatorId" in body) {
    if (!body.operatorId) {
      data.operatorId = null;
    } else if (typeof body.operatorId === "string") {
      const op = await prisma.operator.findFirst({
        where: { id: body.operatorId, companyId: user.companyId },
        select: { id: true },
      });
      data.operatorId = op?.id ?? null;
    }
  }
  if ("incidentId" in body) {
    if (!body.incidentId) {
      data.incidentId = null;
    } else if (typeof body.incidentId === "string") {
      const inc = await prisma.incident.findFirst({
        where: { id: body.incidentId, companyId: user.companyId },
        select: { id: true },
      });
      data.incidentId = inc?.id ?? null;
    }
  }

  const updated = await prisma.capacitacaoEvento.update({
    where: { id },
    data,
    include: CAPACITACAO_FULL_INCLUDE,
  });

  return NextResponse.json(toCapacitacaoDTO(updated));
}

/**
 * DELETE /api/capacitacao/[id] — só DPO Principal/Substituto.
 * Apaga também a evidência do Blob (se houver).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  if (!canDeleteCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPO Principal/Substituto pode excluir eventos" },
      { status: 403 },
    );
  }
  const { id } = await params;

  const existing = await prisma.capacitacaoEvento.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true, evidenceUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  // Deleta evidência do Blob se existir (best-effort, não bloqueia se falhar)
  if (existing.evidenceUrl) {
    try {
      await deleteFile(existing.evidenceUrl);
    } catch {
      // silencioso — registro é apagado mesmo se Blob falhar
    }
  }

  await prisma.capacitacaoEvento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
