

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        ripdChecklistProgress: { select: { completedItems: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      completedItems: user.ripdChecklistProgress?.completedItems || [],
    });
  } catch (error) {
    console.error("Erro ao buscar progresso do checklist:", error);
    return NextResponse.json(
      { error: "Erro ao buscar progresso do checklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { completedItems } = body;

    if (!Array.isArray(completedItems)) {
      return NextResponse.json(
        { error: "completedItems deve ser um array" },
        { status: 400 }
      );
    }

    // Verificar se já existe progresso
    const existingProgress = await prisma.ripdChecklistProgress.findUnique({
      where: { userId: user.id },
    });

    let progress;
    if (existingProgress) {
      progress = await prisma.ripdChecklistProgress.update({
        where: { userId: user.id },
        data: { completedItems },
      });
    } else {
      progress = await prisma.ripdChecklistProgress.create({
        data: {
          userId: user.id,
          completedItems,
        },
      });
    }

    return NextResponse.json({
      message: "Progresso salvo com sucesso",
      completedItems: progress.completedItems,
    });
  } catch (error) {
    console.error("Erro ao salvar progresso do checklist:", error);
    return NextResponse.json(
      { error: "Erro ao salvar progresso do checklist" },
      { status: 500 }
    );
  }
}
