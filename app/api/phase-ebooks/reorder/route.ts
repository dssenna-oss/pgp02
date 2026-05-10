
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST - Reordenar e-books
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    const isAdmin = session.user.email === "clubedoservidor@protonmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem reordenar e-books" }, { status: 403 });
    }

    const body = await request.json();
    const { ebooks } = body; // Array de { id, order }

    if (!Array.isArray(ebooks)) {
      return NextResponse.json(
        { error: "Lista de e-books inválida" },
        { status: 400 }
      );
    }

    // Buscar empresa do usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true },
    });

    // Atualizar a ordem de cada e-book
    for (const ebook of ebooks) {
      await prisma.phaseEbook.update({
        where: {
          id: ebook.id,
          companyId: user?.companyId,
        },
        data: {
          order: ebook.order,
        },
      });
    }

    return NextResponse.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao reordenar e-books:", error);
    return NextResponse.json(
      { error: "Erro ao reordenar e-books" },
      { status: 500 }
    );
  }
}
