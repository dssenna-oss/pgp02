export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { diffWordsWithSpace, diffLines } from "diff";
import { prisma } from "@/lib/db";
import { loadPolicyAuth } from "@/lib/policies-helpers";

/**
 * GET /api/politicas/[id]/diff?a=<ref>&b=<ref>
 *
 * Compara 2 versões de uma política. Cada `ref` pode ser:
 *   - "current"       → currentContent (rascunho atual)
 *   - "published"     → publishedContent (última publicação ativa)
 *   - <numero>        → versão específica do histórico (ex: "1", "2")
 *
 * Devolve diff word-level + line-level pra UI renderizar.
 *
 * Default: a=published, b=current (compara versão publicada vs rascunho).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await loadPolicyAuth();
  if ("error" in r) return r.error;
  const { user } = r;
  const { id } = await params;

  const sp = request.nextUrl.searchParams;
  const aRef = sp.get("a") ?? "published";
  const bRef = sp.get("b") ?? "current";

  const policy = await prisma.policy.findFirst({
    where: { id, companyId: user.companyId },
    select: {
      id: true,
      title: true,
      currentContent: true,
      publishedContent: true,
      currentVersion: true,
    },
  });
  if (!policy) {
    return NextResponse.json({ error: "Política não encontrada" }, { status: 404 });
  }

  const resolveRef = async (ref: string): Promise<{ label: string; content: string } | null> => {
    if (ref === "current") {
      return { label: "Rascunho atual", content: policy.currentContent };
    }
    if (ref === "published") {
      if (!policy.publishedContent) return null;
      return {
        label: `Publicada (v${policy.currentVersion})`,
        content: policy.publishedContent,
      };
    }
    // Versão histórica
    const num = parseInt(ref, 10);
    if (Number.isNaN(num)) return null;
    const v = await prisma.policyVersion.findFirst({
      where: { policyId: policy.id, version: num },
      select: { version: true, content: true, publishedAt: true },
    });
    if (!v) return null;
    return {
      label: `v${v.version} (${new Date(v.publishedAt).toLocaleDateString("pt-BR")})`,
      content: v.content,
    };
  };

  const [a, b] = await Promise.all([resolveRef(aRef), resolveRef(bRef)]);
  if (!a) {
    return NextResponse.json({ error: `Versão "a" não encontrada: ${aRef}` }, { status: 404 });
  }
  if (!b) {
    return NextResponse.json({ error: `Versão "b" não encontrada: ${bRef}` }, { status: 404 });
  }

  // Calcula 2 tipos de diff:
  // 1) word-level — pra mostrar texto inline com adições/remoções coloridas
  // 2) line-level — pra contagem agregada (linhas adicionadas/removidas)
  const wordDiff = diffWordsWithSpace(a.content, b.content);
  const lineDiff = diffLines(a.content, b.content);

  let added = 0;
  let removed = 0;
  for (const part of lineDiff) {
    if (part.added) added += part.count ?? 0;
    if (part.removed) removed += part.count ?? 0;
  }
  const sameContent = a.content === b.content;

  return NextResponse.json({
    a: { ref: aRef, label: a.label, length: a.content.length },
    b: { ref: bRef, label: b.label, length: b.content.length },
    sameContent,
    stats: { addedLines: added, removedLines: removed },
    /** Word diff: array de {value, added?, removed?}. Se não added/removed, é igual. */
    parts: wordDiff.map((p) => ({
      value: p.value,
      added: p.added ?? false,
      removed: p.removed ?? false,
    })),
  });
}
