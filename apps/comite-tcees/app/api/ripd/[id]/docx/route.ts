import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { buildRipdDocx } from "@/lib/ripd-docx-export";
import { normalizeRipdData } from "@/lib/ripd-helpers";

export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [ripd, comite] = await Promise.all([
    prisma.ripd.findUnique({
      where: { id: params.id },
      include: { inventory: { select: { nome: true } } },
    }),
    prisma.comite.findFirst({ select: { instituicao: true, sigla: true } }),
  ]);
  if (!ripd) return NextResponse.json({ error: "RIPD não encontrado" }, { status: 404 });

  const companyName = comite?.instituicao || comite?.sigla || "TCE-ES";
  // Usa o conteúdo publicado se aprovado; senão o rascunho atual.
  const content = ripd.publishedContent ?? ripd.data;

  const buffer = await buildRipdDocx({
    companyName,
    ripdTitle: ripd.title,
    inventoryName: ripd.inventory?.nome ?? null,
    status: ripd.status,
    publishedVersionNum: ripd.publishedVersionNum,
    publishedAt: ripd.publishedAt ? ripd.publishedAt.toISOString() : null,
    generatedAt: new Date(),
    data: normalizeRipdData(content),
  });

  const safe = ripd.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9-]+/g, "_").slice(0, 60);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safe}.docx"`,
    },
  });
}
