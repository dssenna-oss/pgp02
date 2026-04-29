import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Verificar e atualizar cotas do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar ou criar quota do usuário
    let quota = await prisma.chatQuota.findUnique({
      where: { userId: user.id },
    });

    if (!quota) {
      quota = await prisma.chatQuota.create({
        data: { userId: user.id },
      });
    }

    // Verificar se precisa resetar contadores
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let needsUpdate = false;
    const updates: any = {};

    // Reset diário
    if (quota.lastResetDate < today) {
      updates.dailyMessages = 0;
      updates.dailyFiles = 0;
      updates.lastResetDate = now;
      needsUpdate = true;
    }

    // Reset mensal
    if (quota.lastMonthReset < thisMonth) {
      updates.monthlyMessages = 0;
      updates.monthlyFiles = 0;
      updates.lastMonthReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      quota = await prisma.chatQuota.update({
        where: { userId: user.id },
        data: updates,
      });
    }

    return NextResponse.json({
      daily: {
        messages: quota.dailyMessages,
        files: quota.dailyFiles,
        maxMessages: quota.maxDailyMessages,
        maxFiles: quota.maxDailyFiles,
      },
      monthly: {
        messages: quota.monthlyMessages,
        files: quota.monthlyFiles,
        maxMessages: quota.maxMonthlyMessages,
        maxFiles: quota.maxMonthlyFiles,
      },
      canSendMessage: quota.dailyMessages < quota.maxDailyMessages && quota.monthlyMessages < quota.maxMonthlyMessages,
      canUploadFile: quota.dailyFiles < quota.maxDailyFiles && quota.monthlyFiles < quota.maxMonthlyFiles,
    });

  } catch (error) {
    console.error("Erro ao buscar quota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Incrementar uso (chamado internamente)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type } = body; // "message" ou "file"

    // Buscar ou criar quota
    let quota = await prisma.chatQuota.findUnique({
      where: { userId: user.id },
    });

    if (!quota) {
      quota = await prisma.chatQuota.create({
        data: { userId: user.id },
      });
    }

    // Verificar limites
    if (type === "message") {
      if (quota.dailyMessages >= quota.maxDailyMessages) {
        return NextResponse.json(
          { error: "Limite diário de mensagens atingido", exceeded: true },
          { status: 429 }
        );
      }
      if (quota.monthlyMessages >= quota.maxMonthlyMessages) {
        return NextResponse.json(
          { error: "Limite mensal de mensagens atingido", exceeded: true },
          { status: 429 }
        );
      }

      // Incrementar contadores
      await prisma.chatQuota.update({
        where: { userId: user.id },
        data: {
          dailyMessages: { increment: 1 },
          monthlyMessages: { increment: 1 },
        },
      });
    } else if (type === "file") {
      if (quota.dailyFiles >= quota.maxDailyFiles) {
        return NextResponse.json(
          { error: "Limite diário de arquivos atingido", exceeded: true },
          { status: 429 }
        );
      }
      if (quota.monthlyFiles >= quota.maxMonthlyFiles) {
        return NextResponse.json(
          { error: "Limite mensal de arquivos atingido", exceeded: true },
          { status: 429 }
        );
      }

      // Incrementar contadores
      await prisma.chatQuota.update({
        where: { userId: user.id },
        data: {
          dailyFiles: { increment: 1 },
          monthlyFiles: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao incrementar quota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
