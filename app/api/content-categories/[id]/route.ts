
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Obter uma categoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const category = await prisma.contentCategory.findUnique({
      where: { id: params.id },
      include: {
        contentItems: {
          orderBy: { order: "asc" }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categoria" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar categoria (apenas admin)
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
        { error: "Apenas administradores podem editar categorias" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const image = formData.get("image") as File | null;
    const order = parseInt(formData.get("order") as string) || 0;
    const deleteImage = formData.get("deleteImage") === "true";

    if (!name) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    // Busca categoria atual para pegar a imageUrl antiga
    const currentCategory = await prisma.contentCategory.findUnique({
      where: { id: params.id },
    });

    if (!currentCategory) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    let imageUrl = currentCategory.imageUrl;

    // Se usuário quer deletar a imagem
    if (deleteImage) {
      if (imageUrl) {
        try {
          const { deleteFile } = await import("@/lib/s3");
          await deleteFile(imageUrl);
        } catch (error) {
          console.error("Erro ao deletar imagem antiga:", error);
        }
      }
      imageUrl = null;
    }
    // Se enviou nova imagem
    else if (image && image.size > 0) {
      // Deleta a imagem antiga se existir
      if (imageUrl) {
        try {
          const { deleteFile } = await import("@/lib/s3");
          await deleteFile(imageUrl);
        } catch (error) {
          console.error("Erro ao deletar imagem antiga:", error);
        }
      }

      // Upload da nova imagem
      const { uploadFile } = await import("@/lib/s3");
      const buffer = Buffer.from(await image.arrayBuffer());
      const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      imageUrl = await uploadFile(buffer, sanitizedName, image.type);
    }

    const category = await prisma.contentCategory.update({
      where: { id: params.id },
      data: {
        name,
        description,
        imageUrl,
        order,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar categoria (apenas admin)
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
        { error: "Apenas administradores podem deletar categorias" },
        { status: 403 }
      );
    }

    const category = await prisma.contentCategory.findUnique({
      where: { id: params.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Deleta a imagem se existir
    if (category.imageUrl) {
      try {
        const { deleteFile } = await import("@/lib/s3");
        await deleteFile(category.imageUrl);
      } catch (error) {
        console.error("Erro ao deletar imagem:", error);
      }
    }

    // Deleta a categoria (itens serão deletados em cascata)
    await prisma.contentCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    );
  }
}
