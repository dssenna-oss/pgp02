export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPsiAuth,
  psiToDTO,
  computePsiStats,
  psiAccessFilter,
  emptyPsiData,
  PSI_FULL_INCLUDE,
  generateUniquePsiSlug,
} from "@/lib/psi-helpers";
import { buildPsiSeed } from "@/lib/psi-templates";

/**
 * GET /api/psi
 *
 * Lista PSIs da org. Filtragem por papel:
 *   - DPO: todas as PSIs da empresa
 *   - Contribuidor: apenas as próprias
 *
 * Devolve { items, stats }.
 */
export async function GET(_request: NextRequest) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psis = await prisma.psi.findMany({
    where: psiAccessFilter(user),
    include: PSI_FULL_INCLUDE,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const items = psis.map(psiToDTO);
  const stats = computePsiStats(
    psis.map((p) => ({ status: p.status, createdById: p.createdById })),
    user.id
  );

  return NextResponse.json({ items, stats });
}

/**
 * POST /api/psi
 *
 * Cria nova PSI em RASCUNHO. Body:
 *   - title (obrigatório)
 *   - useSeed (opcional, default true) — se true, pré-popula com
 *     sugestões institucionais (template baseado em ISO 27001/27002).
 *
 * Permitido pra DPO + Contribuidor.
 */
export async function POST(request: NextRequest) {
  const r = await loadPsiAuth();
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

  const useSeed = body?.useSeed !== false; // default true

  // Pré-popula com template baseado no nome da empresa
  let data = emptyPsiData();
  if (useSeed) {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { companyName: true },
    });
    data = buildPsiSeed(company?.companyName ?? null);
  }

  const publicSlug = await generateUniquePsiSlug(title);

  const created = await prisma.psi.create({
    data: {
      companyId: user.companyId,
      title: title.slice(0, 200),
      status: "RASCUNHO",
      data: data as any,
      publicSlug,
      createdById: user.id,
    },
    include: PSI_FULL_INCLUDE,
  });

  return NextResponse.json({ psi: psiToDTO(created) }, { status: 201 });
}
