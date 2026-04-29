
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.phaseDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    if (!document.cloud_storage_path) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    // Gerar URL assinada para visualização (expira em 1 hora)
    const viewUrl = await getFileUrl(document.cloud_storage_path, 3600);

    return NextResponse.json({ url: viewUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de visualização:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de visualização" }, { status: 500 });
  }
}
