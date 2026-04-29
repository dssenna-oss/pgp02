
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

    // Gerar URL assinada para download (expira em 1 hora)
    const downloadUrl = await getFileUrl(document.cloud_storage_path, 3600);

    // Redirecionar para a URL assinada
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Erro ao gerar URL de download:", error);
    return NextResponse.json({ error: "Erro ao gerar URL de download" }, { status: 500 });
  }
}
