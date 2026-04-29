
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Listar itens de uma categoria
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "ID da categoria é obrigatório" },
        { status: 400 }
      );
    }

    const items = await prisma.contentItem.findMany({
      where: { categoryId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return NextResponse.json(
      { error: "Erro ao buscar itens" },
      { status: 500 }
    );
  }
}

// POST - Criar novo item de conteúdo (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar conteúdos" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const categoryId = formData.get("categoryId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as string;
    const order = parseInt(formData.get("order") as string) || 0;
    const embedUrl = formData.get("embedUrl") as string | null;
    const file = formData.get("file") as File | null;

    if (!categoryId || !title || !type) {
      return NextResponse.json(
        { error: "Categoria, título e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação do tipo
    const validTypes = ["ebook", "word", "pdf", "excel", "url", "video"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de conteúdo inválido" },
        { status: 400 }
      );
    }

    let cloud_storage_path: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    // Se é um arquivo (word, pdf, excel), faz upload
    if (["word", "pdf", "excel"].includes(type)) {
      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "Arquivo é obrigatório para este tipo de conteúdo" },
          { status: 400 }
        );
      }

      const { uploadFile } = await import("@/lib/s3");
      const buffer = Buffer.from(await file.arrayBuffer());
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      cloud_storage_path = await uploadFile(buffer, sanitizedName, file.type);
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
    }

    const item = await prisma.contentItem.create({
      data: {
        categoryId,
        title,
        description,
        type,
        order,
        embedUrl,
        fileName,
        fileSize,
        mimeType,
        cloud_storage_path,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return NextResponse.json(
      { error: "Erro ao criar item" },
      { status: 500 }
    );
  }
}
