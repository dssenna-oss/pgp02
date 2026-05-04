export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  loadGapDPO,
  buildGapStats,
  answerToDTO,
} from "@/lib/gap-helpers";

/**
 * Snapshots do GAP Analysis (decisão 2c — versionamento manual).
 *
 * Cada snapshot captura todos os GapAnswer da empresa num ponto no tempo,
 * + os stats agregados, num único JSONB. Uso:
 *   - Histórico de versões ("como estávamos no Q1?")
 *   - Exportar Excel da época (decisão 10b)
 *
 * GET  /api/gap/snapshot       → lista (sem o payload, pra ser leve)
 * POST /api/gap/snapshot       → cria um snapshot novo do estado atual
 */

const MAX_SNAPSHOTS_PER_ORG = 50;

export async function GET(_request: NextRequest) {
  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const snapshots = await prisma.gapSnapshot.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      label: true,
      notes: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ snapshots });
}

export async function POST(request: NextRequest) {
  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const labelRaw = String(
    body.label ?? `Snapshot ${new Date().toLocaleDateString("pt-BR")}`,
  ).trim();
  const label = labelRaw.length > 120 ? labelRaw.slice(0, 120) : labelRaw;
  if (!label) {
    return NextResponse.json(
      { error: "Label do snapshot não pode ser vazio" },
      { status: 400 },
    );
  }

  const notes = body.notes ? String(body.notes).slice(0, 5000) : null;

  // Captura o estado completo
  const answers = await prisma.gapAnswer.findMany({
    where: { companyId: user.companyId },
    include: { answeredBy: { select: { name: true, email: true } } },
    orderBy: { controlCode: "asc" },
  });

  const stats = buildGapStats(answers);
  const payload = {
    answers: answers.map(answerToDTO),
    stats,
    generatedAt: new Date().toISOString(),
    generatedBy: { id: user.id, name: user.name, email: user.email },
  };

  const snap = await prisma.gapSnapshot.create({
    data: {
      companyId: user.companyId,
      label,
      notes,
      payload: payload as unknown as Prisma.InputJsonValue,
      createdById: user.id,
    },
    select: {
      id: true,
      label: true,
      notes: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  // Limita histórico a MAX por org (apaga os mais antigos quando passa)
  const total = await prisma.gapSnapshot.count({
    where: { companyId: user.companyId },
  });
  if (total > MAX_SNAPSHOTS_PER_ORG) {
    const toDelete = total - MAX_SNAPSHOTS_PER_ORG;
    const oldIds = await prisma.gapSnapshot.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "asc" },
      take: toDelete,
      select: { id: true },
    });
    if (oldIds.length > 0) {
      await prisma.gapSnapshot.deleteMany({
        where: { id: { in: oldIds.map((s) => s.id) } },
      });
    }
  }

  return NextResponse.json({ snapshot: snap }, { status: 201 });
}
