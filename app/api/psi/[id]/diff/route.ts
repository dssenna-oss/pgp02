export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPsiAuth, psiAccessFilter, type PsiData } from "@/lib/psi-helpers";
import { buildPsiDiff } from "@/lib/psi-diff";

/**
 * GET /api/psi/[id]/diff?a=<ref>&b=<ref>
 *
 * Devolve diff word-level entre 2 versões da PSI.
 *
 * Refs aceitas:
 *   - "current"   → conteúdo atual em edição (Psi.data)
 *   - "published" → última versão publicada (Psi.publishedContent)
 *   - <número>    → versão específica (PsiVersion.version)
 *
 * Default: a="published", b="current".
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const refA = url.searchParams.get("a") ?? "published";
  const refB = url.searchParams.get("b") ?? "current";

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, ...psiAccessFilter(user) },
    select: {
      id: true,
      data: true,
      publishedContent: true,
      publishedVersionNum: true,
    },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  const dataA = await resolveRef(psi.id, refA, psi);
  const dataB = await resolveRef(psi.id, refB, psi);

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

  const diff = buildPsiDiff(dataA.data, dataB.data);

  return NextResponse.json({
    a: { ref: refA, label: dataA.label, snapshotAt: dataA.snapshotAt },
    b: { ref: refB, label: dataB.label, snapshotAt: dataB.snapshotAt },
    diff,
  });
}

interface ResolvedRef {
  data: PsiData;
  label: string;
  snapshotAt: string | null;
}

async function resolveRef(
  psiId: string,
  ref: string,
  psi: {
    data: any;
    publishedContent: any;
    publishedVersionNum: number | null;
  }
): Promise<ResolvedRef | null> {
  if (ref === "current") {
    return {
      data: psi.data as unknown as PsiData,
      label: "Rascunho atual",
      snapshotAt: null,
    };
  }
  if (ref === "published") {
    if (!psi.publishedContent) return null;
    return {
      data: psi.publishedContent as unknown as PsiData,
      label: `Última publicada (v${psi.publishedVersionNum ?? "?"})`,
      snapshotAt: null,
    };
  }
  const num = Number.parseInt(ref, 10);
  if (Number.isFinite(num) && num > 0) {
    const v = await prisma.psiVersion.findFirst({
      where: { psiId, version: num },
      select: { version: true, content: true, approvedAt: true },
    });
    if (!v) return null;
    return {
      data: v.content as unknown as PsiData,
      label: `Versão ${v.version}`,
      snapshotAt: v.approvedAt.toISOString(),
    };
  }
  return null;
}
