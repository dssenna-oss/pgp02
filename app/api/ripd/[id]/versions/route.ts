export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadRipdAuth, ripdAccessFilter } from "@/lib/ripd-helpers";

/**
 * GET /api/ripd/[id]/versions
 *
 * Lista versões congeladas (RipdVersion) do RIPD em ordem decrescente
 * por número da versão.
 *
 * Visibilidade: respeita `ripdAccessFilter` (Contribuidor só vê versões
 * de RIPDs próprios; DPO vê tudo).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, ...ripdAccessFilter(user) },
    select: { id: true, publishedVersionNum: true, status: true },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  const versions = await prisma.ripdVersion.findMany({
    where: { ripdId: ripd.id },
    orderBy: { version: "desc" },
    include: {
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    items: versions.map((v) => ({
      id: v.id,
      version: v.version,
      changeLog: v.changeLog,
      approvedAt: v.approvedAt.toISOString(),
      approvedBy: v.approvedBy,
      isCurrent: v.version === ripd.publishedVersionNum,
    })),
    publishedVersionNum: ripd.publishedVersionNum,
    currentStatus: ripd.status,
  });
}
