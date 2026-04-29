
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/s3";

// DELETE - Excluir documento
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário é administrador
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== "clubedoservidor@protonmail.com") {
      console.log("Acesso negado: usuário não é administrador");
      return NextResponse.json(
        { error: "Acesso negado. Apenas o administrador pode excluir documentos." },
        { status: 403 }
      );
    }

    const document = await prisma.phaseDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }

    // Excluir arquivo do S3 se existir
    if (document.cloud_storage_path) {
      try {
        await deleteFile(document.cloud_storage_path);
      } catch (error) {
        console.error("Erro ao excluir arquivo do S3:", error);
      }
    }

    // Excluir do banco de dados
    await prisma.phaseDocument.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Documento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir documento:", error);
    return NextResponse.json({ error: "Erro ao excluir documento" }, { status: 500 });
  }
}
