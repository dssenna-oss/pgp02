export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadLiaAuth,
  liaToDTO,
  computeLiaStats,
  liaAccessFilter,
  emptyLiaData,
  LIA_FULL_INCLUDE,
} from "@/lib/lia-helpers";

/**
 * GET /api/lia
 *
 * Lista LIAs da org. Filtragem por papel:
 *   - DPO: todas as LIAs da empresa
 *   - Contribuidor: apenas as próprias
 *
 * Devolve { items, stats }.
 */
export async function GET(_request: NextRequest) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lias = await prisma.lia.findMany({
    where: liaAccessFilter(user),
    include: LIA_FULL_INCLUDE,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const items = lias.map(liaToDTO);
  const stats = computeLiaStats(
    lias.map((l) => ({ status: l.status, createdById: l.createdById, data: l.data })),
    user.id
  );

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/lia
 *
 * Cria nova LIA em RASCUNHO. Body:
 *   - title (obrigatório)
 *   - inventoryId (opcional) — vincula ao processo do Inventário
 *     (Fatia 3 vai pré-popular finalidade/dados a partir dele).
 *
 * Permitido pra DPO + Contribuidor.
 */
export async function POST(request: NextRequest) {
  const r = await loadLiaAuth();
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
    return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título tem no máximo 200 caracteres" },
      { status: 400 }
    );
  }

  const inventoryId = body?.inventoryId ? String(body.inventoryId) : null;

  // Valida o inventoryId pertence à mesma empresa antes de gravar
  if (inventoryId) {
    const inv = await prisma.dataInventory.findUnique({
      where: { id: inventoryId },
      select: { companyId: true },
    });
    if (!inv || inv.companyId !== user.companyId) {
      return NextResponse.json(
        { error: "Processo do inventário não encontrado nesta empresa" },
        { status: 404 }
      );
    }
  }

  const data = emptyLiaData();

  const created = await prisma.lia.create({
    data: {
      companyId: user.companyId,
      inventoryId,
      title: title.slice(0, 200),
      status: "RASCUNHO",
      data: data as any,
      createdById: user.id,
    },
    include: LIA_FULL_INCLUDE,
  });

  return NextResponse.json({ lia: liaToDTO(created) }, { status: 201 });
}
