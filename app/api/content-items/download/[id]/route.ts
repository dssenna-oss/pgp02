
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFileUrl } from "@/lib/s3";

// GET - Download de arquivo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const item = await prisma.contentItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    if (!item.cloud_storage_path) {
      return NextResponse.json(
        { error: "Arquivo não disponível" },
        { status: 404 }
      );
    }

    // Gera URL assinada para download
    const signedUrl = await getFileUrl(item.cloud_storage_path);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Erro ao gerar URL de download:", error);
    return NextResponse.json(
      { error: "Erro ao gerar URL de download" },
      { status: 500 }
    );
  }
}
