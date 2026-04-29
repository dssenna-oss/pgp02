
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obter um item específico
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
      include: {
        category: true
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return NextResponse.json(
      { error: "Erro ao buscar item" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar item (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem editar conteúdos" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const order = parseInt(formData.get("order") as string) || 0;
    const embedUrl = formData.get("embedUrl") as string | null;
    const file = formData.get("file") as File | null;
    const deleteFile = formData.get("deleteFile") === "true";

    if (!title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    // Busca item atual
    const currentItem = await prisma.contentItem.findUnique({
      where: { id: params.id },
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    let cloud_storage_path = currentItem.cloud_storage_path;
    let fileName = currentItem.fileName;
    let fileSize = currentItem.fileSize;
    let mimeType = currentItem.mimeType;

    // Se usuário quer deletar o arquivo
    if (deleteFile && cloud_storage_path) {
      try {
        const { deleteFile: s3DeleteFile } = await import("@/lib/s3");
        await s3DeleteFile(cloud_storage_path);
      } catch (error) {
        console.error("Erro ao deletar arquivo antigo:", error);
      }
      cloud_storage_path = null;
      fileName = null;
      fileSize = null;
      mimeType = null;
    }
    // Se enviou novo arquivo
    else if (file && file.size > 0) {
      // Deleta o arquivo antigo se existir
      if (cloud_storage_path) {
        try {
          const { deleteFile: s3DeleteFile } = await import("@/lib/s3");
          await s3DeleteFile(cloud_storage_path);
        } catch (error) {
          console.error("Erro ao deletar arquivo antigo:", error);
        }
      }

      // Upload do novo arquivo
      const { uploadFile } = await import("@/lib/s3");
      const buffer = Buffer.from(await file.arrayBuffer());
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      cloud_storage_path = await uploadFile(buffer, sanitizedName, file.type);
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    const item = await prisma.contentItem.update({
      where: { id: params.id },
      data: {
        title,
        description,
        order,
        embedUrl,
        fileName,
        fileSize,
        mimeType,
        cloud_storage_path,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar item (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem deletar conteúdos" },
        { status: 403 }
      );
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

    // Deleta o arquivo se existir
    if (item.cloud_storage_path) {
      try {
        const { deleteFile } = await import("@/lib/s3");
        await deleteFile(item.cloud_storage_path);
      } catch (error) {
        console.error("Erro ao deletar arquivo:", error);
      }
    }

    await prisma.contentItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json(
      { error: "Erro ao deletar item" },
      { status: 500 }
    );
  }
}
