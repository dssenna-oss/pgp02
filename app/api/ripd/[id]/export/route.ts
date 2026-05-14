export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadRipdAuth,
  ripdAccessFilter,
  type RipdData,
} from "@/lib/ripd-helpers";
import { buildRipdDocx } from "@/lib/ripd-docx-export";

/**
 * GET /api/ripd/[id]/export?source=published|current
 *
 * Devolve o RIPD como arquivo DOCX (.docx).
 *
 * `source`:
 *   - "published" (default) → última versão aprovada (requer
 *     `publishedContent` não-null)
 *   - "current" → conteúdo atual em edição
 *
 * Visibilidade: respeita `ripdAccessFilter` (Contribuidor só vê os
 * próprios). Se source=published mas RIPD nunca foi aprovado, devolve
 * 400 com mensagem.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const r = await loadRipdAuth();
  if ("error" in r) return r.error;
  const { user } = r;

  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "published";

  const ripd = await prisma.ripd.findFirst({
    where: { id: params.id, ...ripdAccessFilter(user) },
    include: {
      inventory: { select: { serviceName: true } },
      company: { select: { companyName: true } },
    },
  });
  if (!ripd) {
    return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });
  }

  let data: RipdData;
  if (source === "current") {
    data = ripd.data as unknown as RipdData;
  } else {
    if (!ripd.publishedContent) {
      return NextResponse.json(
        {
          error:
            "Este RIPD ainda não foi aprovado. Use ?source=current pra exportar o rascunho.",
        },
        { status: 400 }
      );
    }
    data = ripd.publishedContent as unknown as RipdData;
  }

  const buffer = await buildRipdDocx({
    companyName: ripd.company.companyName,
    ripdTitle: ripd.title,
    inventoryName: ripd.inventory?.serviceName ?? null,
    status: ripd.status,
    publishedVersionNum: ripd.publishedVersionNum,
    publishedAt: ripd.publishedAt ? ripd.publishedAt.toISOString() : null,
    generatedAt: new Date(),
    data,
  });

  const safeTitle = ripd.title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "ripd";
  const versionTag =
    source === "current"
      ? "rascunho"
      : ripd.publishedVersionNum != null
      ? `v${ripd.publishedVersionNum}`
      : "publicada";
  const filename = `RIPD_${safeTitle}_${versionTag}.docx`;

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
