
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Listar e-books de uma fase
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const phase = searchParams.get("phase");

    if (!phase) {
      return NextResponse.json({ error: "Fase é obrigatória" }, { status: 400 });
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa associada" }, { status: 400 });
    }

    // Buscar e-books da fase, ordenados
    const ebooks = await prisma.phaseEbook.findMany({
      where: {
        companyId: user.companyId,
        phase: phase,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(ebooks);
  } catch (error) {
    console.error("Erro ao listar e-books:", error);
    return NextResponse.json(
      { error: "Erro ao listar e-books" },
      { status: 500 }
    );
  }
}

// POST - Criar novo e-book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = session.user.email === "clubedoservidor@protonmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem criar e-books" }, { status: 403 });
    }

    const body = await request.json();
    const { phase, title, embedUrl } = body;

    if (!phase || !title || !embedUrl) {
      return NextResponse.json(
        { error: "Fase, título e URL de embed são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa associada" }, { status: 400 });
    }

    // Buscar todos os e-books existentes e normalizar a ordenação
    const existingEbooks = await prisma.phaseEbook.findMany({
      where: {
        companyId: user.companyId,
        phase: phase,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Normalizar a ordem dos e-books existentes (0, 1, 2, 3...)
    for (let i = 0; i < existingEbooks.length; i++) {
      if (existingEbooks[i].order !== i) {
        await prisma.phaseEbook.update({
          where: { id: existingEbooks[i].id },
          data: { order: i },
        });
      }
    }

    // Novo e-book será adicionado no final com ordem = quantidade de existentes
    const newOrder = existingEbooks.length;

    // Criar e-book
    const ebook = await prisma.phaseEbook.create({
      data: {
        companyId: user.companyId,
        phase,
        title,
        embedUrl,
        order: newOrder,
      },
    });

    return NextResponse.json(ebook, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar e-book:", error);
    return NextResponse.json(
      { error: "Erro ao criar e-book" },
      { status: 500 }
    );
  }
}
