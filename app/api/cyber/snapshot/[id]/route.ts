export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadCyberAuth } from "@/lib/cyber-helpers";

/**
 * GET /api/cyber/snapshot/[id] — devolve snapshot completo (com answers).
 * DELETE /api/cyber/snapshot/[id] — remove o snapshot.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const s = await prisma.cyberSnapshot.findFirst({
    where: { id: params.id, companyId: user.companyId },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!s) {
    return NextResponse.json({ error: "Snapshot não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    snapshot: {
      id: s.id,
      name: s.name,
      description: s.description,
      score: s.score,
      answers: s.answers,
      createdBy: s.createdBy,
      createdAt: s.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadCyberAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const result = await prisma.cyberSnapshot.deleteMany({
    where: { id: params.id, companyId: user.companyId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Snapshot não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
