export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPsiAuth, psiAccessFilter } from "@/lib/psi-helpers";

/**
 * GET /api/psi/[id]/versions
 *
 * Lista snapshots PsiVersion da PSI, do mais recente pro mais antigo.
 * Aplica filtro de visibilidade (DPO vê tudo / Contribuidor só próprias).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, ...psiAccessFilter(user) },
    select: { id: true },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  const versions = await prisma.psiVersion.findMany({
    where: { psiId: params.id },
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
