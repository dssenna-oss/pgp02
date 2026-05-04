export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadRipdAuth, ripdAccessFilter, type RipdData } from "@/lib/ripd-helpers";
import { buildRipdDiff } from "@/lib/ripd-diff";

/**
 * GET /api/ripd/[id]/diff?a=<ref>&b=<ref>
 *
 * Devolve diff word-level + estrutural entre 2 versões do RIPD.
 *
 * Refs aceitas:
 *   - "current"   → conteúdo atual em edição (Ripd.data)
 *   - "published" → última versão publicada (Ripd.publishedContent)
 *   - <número>    → versão específica (RipdVersion.version)
 *
 * Default: a="published", b="current".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const refA = url.searchParams.get("a") ?? "published";
  const refB = url.searchParams.get("b") ?? "current";

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, ...ripdAccessFilter(user) },
    select: {
      id: true,
      data: true,
      publishedContent: true,
      publishedVersionNum: true,
    },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  const dataA = await resolveRef(ripd.id, refA, ripd);
  const dataB = await resolveRef(ripd.id, refB, ripd);

  if (!dataA) {
    return NextResponse.json(
      { error: `Versão "${refA}" não encontrada` },
      { status: 404 }
    );
  }
  if (!dataB) {
    return NextResponse.json(
      { error: `Versão "${refB}" não encontrada` },
      { status: 404 }
    );
  }

  const diff = buildRipdDiff(dataA.data, dataB.data);

  return NextResponse.json({
    a: { ref: refA, label: dataA.label, snapshotAt: dataA.snapshotAt },
    b: { ref: refB, label: dataB.label, snapshotAt: dataB.snapshotAt },
    diff,
  });
}

interface ResolvedRef {
  data: RipdData;
  label: string;
  /** ISO date string da snapshot. Null pra "current". */
  snapshotAt: string | null;
}

async function resolveRef(
  ripdId: string,
  ref: string,
  ripd: {
    data: any;
    publishedContent: any;
    publishedVersionNum: number | null;
  }
): Promise<ResolvedRef | null> {
  if (ref === "current") {
    return {
      data: ripd.data as unknown as RipdData,
      label: "Rascunho atual",
      snapshotAt: null,
    };
  }
  if (ref === "published") {
    if (!ripd.publishedContent) return null;
    return {
      data: ripd.publishedContent as unknown as RipdData,
      label: `Última publicada (v${ripd.publishedVersionNum ?? "?"})`,
      snapshotAt: null,
    };
  }
  const num = Number.parseInt(ref, 10);
  if (Number.isFinite(num) && num > 0) {
    const v = await prisma.ripdVersion.findFirst({
      where: { ripdId, version: num },
      select: { version: true, content: true, approvedAt: true },
    });
    if (!v) return null;
    return {
      data: v.content as unknown as RipdData,
      label: `Versão ${v.version}`,
      snapshotAt: v.approvedAt.toISOString(),
    };
  }
  return null;
}
