export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadPsiAuth, psiAccessFilter, type PsiData } from "@/lib/psi-helpers";
import { buildPsiDocx } from "@/lib/psi-docx-export";

/**
 * GET /api/psi/[id]/export?source=published|current
 *
 * Devolve a PSI como arquivo DOCX (.docx).
 *
 * `source`:
 *   - "published" (default) → última versão aprovada (requer
 *     `publishedContent` não-null)
 *   - "current" → conteúdo atual em edição
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadPsiAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "published";

  const psi = await prisma.psi.findFirst({
    where: { id: params.id, ...psiAccessFilter(user) },
    include: {
      company: { select: { companyName: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });
  if (!psi) {
    return NextResponse.json({ error: "PSI não encontrada" }, { status: 404 });
  }

  let data: PsiData;
  if (source === "current") {
    data = psi.data as unknown as PsiData;
  } else {
    if (!psi.publishedContent) {
      return NextResponse.json(
        {
          error:
            "Esta PSI ainda não foi aprovada. Use ?source=current pra exportar o rascunho.",
        },
        { status: 400 }
      );
    }
    data = psi.publishedContent as unknown as PsiData;
  }

  const buffer = await buildPsiDocx({
    companyName: psi.company.companyName,
    psiTitle: psi.title,
    status: psi.status,
    publishedVersionNum: psi.publishedVersionNum,
    publishedAt: psi.publishedAt ? psi.publishedAt.toISOString() : null,
    approvedByName: psi.approvedBy?.name ?? psi.approvedBy?.email ?? null,
    generatedAt: new Date(),
    data,
  });

  const safeTitle =
    psi.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9\-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80) || "psi";
  const versionTag =
    source === "current"
      ? "rascunho"
      : psi.publishedVersionNum != null
      ? `v${psi.publishedVersionNum}`
      : "publicada";
  const filename = `PSI_${safeTitle}_${versionTag}.docx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
