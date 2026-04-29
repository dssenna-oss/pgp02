
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const categories = await prisma.contentCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { contentItems: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Apenas administradores podem criar categorias" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const image = formData.get("image") as File | null;
    const order = parseInt(formData.get("order") as string) || 0;

    if (!name) {
      return NextResponse.json(
        { error: "Nome da categoria é obrigatório" },
        { status: 400 }
      );
    }

    // Upload da imagem para S3 se fornecida
    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      const { uploadFile } = await import("@/lib/s3");
      const buffer = Buffer.from(await image.arrayBuffer());
      const sanitizedName = image.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      imageUrl = await uploadFile(buffer, sanitizedName, image.type);
    }

    const category = await prisma.contentCategory.create({
      data: {
        name,
        description,
        imageUrl,
        order,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
