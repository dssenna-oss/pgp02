export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadCapacitacaoAuth,
  canManageCapacitacao,
  toCapacitacaoDTO,
  computeCapacitacaoStats,
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

/**
 * GET /api/capacitacao
 *
 * Lista todos os eventos de capacitação da empresa + stats consolidadas.
 * Acessível a qualquer papel autenticado (DPO + Contribuidor) — todos podem
 * ver o programa de capacitação. Apenas DPO pode criar/editar.
 *
 * Query params:
 *   ?status=PLANEJADO|REALIZADO|CANCELADO
 *   ?eixo=ONBOARDING|...
 *   ?audience=GERAL|...
 */
export async function GET(request: NextRequest) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const sp = request.nextUrl.searchParams;
  const where: {
    companyId: string;
    status?: string;
    eixo?: string;
    audience?: string;
  } = { companyId: user.companyId };

  const status = sp.get("status");
  if (status && isValidStatus(status)) where.status = status;
  const eixo = sp.get("eixo");
  if (eixo && isValidEixo(eixo)) where.eixo = eixo;
  const audience = sp.get("audience");
  if (audience && isValidAudience(audience)) where.audience = audience;

  const rows = await prisma.capacitacaoEvento.findMany({
    where,
    include: CAPACITACAO_FULL_INCLUDE,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  const items = rows.map(toCapacitacaoDTO);

  // Stats: sempre calcula sobre TUDO (sem aplicar filtros) pra UI ter totais
  // consistentes mesmo durante navegação por filtros.
  const allRows = await prisma.capacitacaoEvento.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      title: true,
      eixo: true,
      audience: true,
      status: true,
      scheduledAt: true,
      evidenceUrl: true,
    },
  });
  const stats = computeCapacitacaoStats(allRows);

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/capacitacao
 * Cria um novo evento de capacitação. DPO-only.
 */
export async function POST(request: NextRequest) {
  const r = await loadCapacitacaoAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  if (!canManageCapacitacao(user.role)) {
    return NextResponse.json(
      { error: "Apenas DPOs podem cadastrar eventos de capacitação" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const title = sanitizeRequiredText(body.title, 200);
  const eixo = body.eixo;
  const type = body.type;
  const audience = body.audience;

  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 },
    );
  }
  if (!isValidEixo(eixo)) {
    return NextResponse.json(
      { error: "Eixo inválido" },
      { status: 400 },
    );
  }
  if (!isValidType(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!isValidAudience(audience)) {
    return NextResponse.json({ error: "Público inválido" }, { status: 400 });
  }

  const description = sanitizeText(body.description, 5000);
  const status = isValidStatus(body.status) ? body.status : "PLANEJADO";
  const recurrence = isValidRecurrence(body.recurrence) ? body.recurrence : "UNICO";
  const scheduledAt = sanitizeDate(body.scheduledAt);
  const completedAt = sanitizeDate(body.completedAt);
  const attendeesCount = sanitizeIntPositive(body.attendeesCount);
  const notes = sanitizeText(body.notes, 5000);

  // Vínculos opcionais — valida que pertence à mesma org
  let operatorId: string | null = null;
  if (typeof body.operatorId === "string" && body.operatorId.trim()) {
    const op = await prisma.operator.findFirst({
      where: { id: body.operatorId, companyId: user.companyId },
      select: { id: true },
    });
    if (op) operatorId = op.id;
  }
  let incidentId: string | null = null;
  if (typeof body.incidentId === "string" && body.incidentId.trim()) {
    const inc = await prisma.incident.findFirst({
      where: { id: body.incidentId, companyId: user.companyId },
      select: { id: true },
    });
    if (inc) incidentId = inc.id;
  }

  const created = await prisma.capacitacaoEvento.create({
    data: {
      companyId: user.companyId,
      title,
      description,
      eixo,
      type,
      audience,
      status,
      recurrence,
      scheduledAt,
      completedAt,
      attendeesCount,
      notes,
      operatorId,
      incidentId,
      createdById: user.id,
    },
    include: CAPACITACAO_FULL_INCLUDE,
  });

  return NextResponse.json(toCapacitacaoDTO(created), { status: 201 });
}
