export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadLiaAuth, liaAccessFilter, type LiaData } from "@/lib/lia-helpers";
import { buildLiaDiff } from "@/lib/lia-diff";

/**
 * GET /api/lia/[id]/diff?a=<ref>&b=<ref>
 *
 * Devolve diff word-level entre 2 versões da LIA.
 *
 * Refs aceitas:
 *   - "current"   → conteúdo atual em edição (Lia.data)
 *   - "published" → última versão publicada (Lia.publishedContent)
 *   - <número>    → versão específica (LiaVersion.version)
 *
 * Default: a="published", b="current".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const refA = url.searchParams.get("a") ?? "published";
  const refB = url.searchParams.get("b") ?? "current";

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, ...liaAccessFilter(user) },
    select: {
      id: true,
      data: true,
      publishedContent: true,
      publishedVersionNum: true,
    },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  const dataA = await resolveRef(lia.id, refA, lia);
  const dataB = await resolveRef(lia.id, refB, lia);

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

  const diff = buildLiaDiff(dataA.data, dataB.data);

  return NextResponse.json({
    a: { ref: refA, label: dataA.label, snapshotAt: dataA.snapshotAt },
    b: { ref: refB, label: dataB.label, snapshotAt: dataB.snapshotAt },
    diff,
  });
}

interface ResolvedRef {
  data: LiaData;
  label: string;
  /** ISO date string da snapshot. Null pra "current". */
  snapshotAt: string | null;
}

async function resolveRef(
  liaId: string,
  ref: string,
  lia: {
    data: any;
    publishedContent: any;
    publishedVersionNum: number | null;
  }
): Promise<ResolvedRef | null> {
  if (ref === "current") {
    return {
      data: lia.data as unknown as LiaData,
      label: "Rascunho atual",
      snapshotAt: null,
    };
  }
  if (ref === "published") {
    if (!lia.publishedContent) return null;
    return {
      data: lia.publishedContent as unknown as LiaData,
      label: `Última publicada (v${lia.publishedVersionNum ?? "?"})`,
      snapshotAt: null,
    };
  }
  const num = Number.parseInt(ref, 10);
  if (Number.isFinite(num) && num > 0) {
    const v = await prisma.liaVersion.findFirst({
      where: { liaId, version: num },
      select: { version: true, content: true, approvedAt: true },
    });
    if (!v) return null;
    return {
      data: v.content as unknown as LiaData,
      label: `Versão ${v.version}`,
      snapshotAt: v.approvedAt.toISOString(),
    };
  }
  return null;
}
