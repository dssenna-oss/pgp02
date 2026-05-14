export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadLiaAuth, liaAccessFilter } from "@/lib/lia-helpers";

/**
 * GET /api/lia/[id]/versions
 *
 * Lista snapshots LiaVersion da LIA, do mais recente pro mais antigo.
 * Aplica filtro de visibilidade (DPO vê tudo / Contribuidor só próprias).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, ...liaAccessFilter(user) },
    select: { id: true },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  const versions = await prisma.liaVersion.findMany({
    where: { liaId: params.id },
    orderBy: { version: "desc" },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    items: versions.map((v) => ({
      id: v.id,
      version: v.version,
      content: v.content,
      changeLog: v.changeLog,
      approvedAt: v.approvedAt.toISOString(),
      approvedBy: v.approvedBy
        ? { id: v.approvedBy.id, name: v.approvedBy.name, email: v.approvedBy.email }
        : null,
    })),
  });
}
