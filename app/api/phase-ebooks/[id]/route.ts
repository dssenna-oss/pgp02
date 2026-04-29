
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT - Atualizar e-book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = session.user.email === "clubedoservidor@protonmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem editar e-books" }, { status: 403 });
    }

    const body = await request.json();
    const { title, embedUrl } = body;

    if (!title || !embedUrl) {
      return NextResponse.json(
        { error: "Título e URL de embed são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o e-book existe e pertence à empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const ebook = await prisma.phaseEbook.findFirst({
      where: {
        id: params.id,
        companyId: user?.companyId,
      },
    });

    if (!ebook) {
      return NextResponse.json({ error: "E-book não encontrado" }, { status: 404 });
    }

    // Atualizar e-book
    const updatedEbook = await prisma.phaseEbook.update({
      where: { id: params.id },
      data: {
        title,
        embedUrl,
      },
    });

    return NextResponse.json(updatedEbook);
  } catch (error) {
    console.error("Erro ao atualizar e-book:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar e-book" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar e-book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = session.user.email === "clubedoservidor@protonmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem deletar e-books" }, { status: 403 });
    }

    // Verificar se o e-book existe e pertence à empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: "Usuário sem empresa associada" }, { status: 400 });
    }

    const ebook = await prisma.phaseEbook.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!ebook) {
      return NextResponse.json({ error: "E-book não encontrado" }, { status: 404 });
    }

    // Deletar e-book
    await prisma.phaseEbook.delete({
      where: { id: params.id },
    });

    // Reordenar os e-books restantes
    const remainingEbooks = await prisma.phaseEbook.findMany({
      where: {
        companyId: user.companyId,
        phase: ebook.phase,
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Atualizar a ordem dos e-books restantes
    for (let i = 0; i < remainingEbooks.length; i++) {
      await prisma.phaseEbook.update({
        where: { id: remainingEbooks[i].id },
        data: { order: i },
      });
    }

    return NextResponse.json({ message: "E-book deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar e-book:", error);
    return NextResponse.json(
      { error: "Erro ao deletar e-book" },
      { status: 500 }
    );
  }
}
