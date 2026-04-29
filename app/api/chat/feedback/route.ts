import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST - Salvar feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, rating, comment } = body;

    if (!messageId || !rating) {
      return NextResponse.json(
        { error: "messageId e rating são obrigatórios" },
        { status: 400 }
      );
    }

    if (!['like', 'dislike'].includes(rating)) {
      return NextResponse.json(
        { error: "rating deve ser 'like' ou 'dislike'" },
        { status: 400 }
      );
    }

    // Verificar se já existe feedback para esta mensagem
    const existingFeedback = await prisma.chatFeedback.findUnique({
      where: { messageId },
    });

    if (existingFeedback) {
      // Atualizar feedback existente
      const feedback = await prisma.chatFeedback.update({
        where: { messageId },
        data: {
          rating,
          comment: comment || null,
        },
      });
      return NextResponse.json(feedback);
    }

    // Criar novo feedback
    const feedback = await prisma.chatFeedback.create({
      data: {
        messageId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Erro ao salvar feedback:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
