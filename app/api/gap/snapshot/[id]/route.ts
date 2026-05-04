export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadGapDPO } from "@/lib/gap-helpers";

/**
 * GET    /api/gap/snapshot/[id]   → detalhe completo (com payload)
 * DELETE /api/gap/snapshot/[id]   → apaga o snapshot
 *
 * Acesso: apenas DPO da mesma org.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await Promise.resolve(params as any);

  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const snap = await prisma.gapSnapshot.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!snap) {
    return NextResponse.json(
      { error: "Snapshot não encontrado nesta organização" },
      { status: 404 },
    );
  }
  return NextResponse.json({ snapshot: snap });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await Promise.resolve(params as any);

  const r = await loadGapDPO();
  if ("error" in r) return r.error;
  const { user } = r;

  const snap = await prisma.gapSnapshot.findFirst({
    where: { id, companyId: user.companyId },
    select: { id: true },
  });
  if (!snap) {
    return NextResponse.json(
      { error: "Snapshot não encontrado nesta organização" },
      { status: 404 },
    );
  }

  await prisma.gapSnapshot.delete({ where: { id: snap.id } });
  return NextResponse.json({ ok: true });
}
