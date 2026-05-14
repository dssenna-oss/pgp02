export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadLiaAuth, liaAccessFilter, type LiaData } from "@/lib/lia-helpers";
import { buildLiaDocx } from "@/lib/lia-docx-export";

/**
 * GET /api/lia/[id]/export?source=published|current
 *
 * Devolve a LIA como arquivo DOCX (.docx).
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
  const r = await loadLiaAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "published";

  const lia = await prisma.lia.findFirst({
    where: { id: params.id, ...liaAccessFilter(user) },
    include: {
      inventory: { select: { serviceName: true } },
      company: { select: { companyName: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });
  if (!lia) {
    return NextResponse.json({ error: "LIA não encontrada" }, { status: 404 });
  }

  let data: LiaData;
  if (source === "current") {
    data = lia.data as unknown as LiaData;
  } else {
    if (!lia.publishedContent) {
      return NextResponse.json(
        {
          error:
            "Esta LIA ainda não foi aprovada. Use ?source=current pra exportar o rascunho.",
        },
        { status: 400 }
      );
    }
    data = lia.publishedContent as unknown as LiaData;
  }

  const buffer = await buildLiaDocx({
    companyName: lia.company.companyName,
    liaTitle: lia.title,
    inventoryName: lia.inventory?.serviceName ?? null,
    status: lia.status,
    publishedVersionNum: lia.publishedVersionNum,
    publishedAt: lia.publishedAt ? lia.publishedAt.toISOString() : null,
    approvedByName: lia.approvedBy?.name ?? lia.approvedBy?.email ?? null,
    generatedAt: new Date(),
    data,
  });

  const safeTitle =
    lia.title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9\-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80) || "lia";
  const versionTag =
    source === "current"
      ? "rascunho"
      : lia.publishedVersionNum != null
      ? `v${lia.publishedVersionNum}`
      : "publicada";
  const filename = `LIA_${safeTitle}_${versionTag}.docx`;

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
