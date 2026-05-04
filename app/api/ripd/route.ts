export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdToDTO,
  computeRipdStats,
  ripdAccessFilter,
  emptyRipdData,
} from "@/lib/ripd-helpers";
import { prepopulateRipdFromInventory } from "@/lib/ripd-prepopulate";

/**
 * GET /api/ripd
 *
 * Lista RIPDs da org. Filtragem por papel:
 *   - DPO: todos os RIPDs da empresa
 *   - Contribuidor: apenas os próprios
 *
 * Devolve { items, stats }.
 */
export async function GET(_request: NextRequest) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ripds = await prisma.ripd.findMany({
    where: ripdAccessFilter(user),
    include: {
      inventory: { select: { id: true, serviceName: true, status: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const items = ripds.map(ripdToDTO);
  const stats = computeRipdStats(
    ripds.map((r) => ({ status: r.status, createdById: r.createdById })),
    user.id
  );

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/ripd
 *
 * Cria novo RIPD em RASCUNHO. Body:
 *   - title (obrigatório)
 *   - inventoryId (opcional) — se preenchido, dispara pré-população
 *     puxando dados do processo do Inventário
 *
 * Permitido pra DPO + Contribuidor.
 */
export async function POST(request: NextRequest) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json(
      { error: "Título é obrigatório" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título tem no máximo 200 caracteres" },
      { status: 400 }
    );
  }

  const inventoryId = body?.inventoryId ? String(body.inventoryId) : null;

  // Pré-popula a partir do inventário (se vier) ou cria vazio
  let data;
  if (inventoryId) {
    try {
      data = await prepopulateRipdFromInventory(inventoryId, user.companyId);
    } catch {
      return NextResponse.json(
        { error: "Processo do inventário não encontrado nesta empresa" },
        { status: 404 }
      );
    }
  } else {
    data = emptyRipdData();
  }

  const created = await prisma.ripd.create({
    data: {
      companyId: user.companyId,
      inventoryId,
      title: title.slice(0, 200),
      status: "RASCUNHO",
      data: data as any,
      createdById: user.id,
    },
    include: {
      inventory: { select: { id: true, serviceName: true, status: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { versions: true } },
    },
  });

  return NextResponse.json({ ripd: ripdToDTO(created) }, { status: 201 });
}
