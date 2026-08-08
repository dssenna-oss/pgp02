import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSuperAdminAccess } from "@/lib/auth-helpers";

/**
 * 🐛 Havia aqui um `ADMIN_EMAILS` com dois endereços fixos que entraram no
 * commit RAIZ do repositório ("chore: import PGP source from Abacus AI
 * export", 29/04/2026) — vieram com o código importado, não são contas deste
 * app. Nenhum dos dois tem usuário no banco, então esta rota respondia 403
 * para todo mundo. Somado à mesma lista na tela e no menu lateral, o Painel
 * do Chatbot existia sem ter como ser aberto por ninguém.
 *
 * Agora usa `hasSuperAdminAccess` (SUPER_ADMIN_EMAIL ou papel `admin`
 * legado), a mesma regra do resto do sistema.
 *
 * ⚠️ Aqui, no servidor, a checagem é completa. Na TELA e no MENU ela só pode
 * olhar o papel: `SUPER_ADMIN_EMAIL` é variável de servidor e não chega ao
 * navegador. O efeito é falhar fechado — conta que valha só pelo e-mail não
 * vê o item no menu, mas continua entrando pela URL. Ver
 * `components/dashboard/dashboard-layout.tsx`.
 */

// Obter estatísticas do chatbot
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!hasSuperAdminAccess(session?.user)) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "stats";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (view === "stats") {
      // Estatísticas gerais
      const [totalConversations, totalMessages, totalFeedbacks, totalFiles] = await Promise.all([
        prisma.chatConversation.count(),
        prisma.chatMessage.count(),
        prisma.chatFeedback.count(),
        prisma.chatFile.count(),
      ]);

      // Feedbacks positivos vs negativos
      const [positiveFeedbacks, negativeFeedbacks] = await Promise.all([
        prisma.chatFeedback.count({ where: { rating: "like" } }),
        prisma.chatFeedback.count({ where: { rating: "dislike" } }),
      ]);

      // Análise de sentimentos
      const sentimentCounts = await prisma.chatMessage.groupBy({
        by: ["sentiment"],
        where: { sentiment: { not: null } },
        _count: { sentiment: true },
      });

      // Mensagens por dia (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentMessages = await prisma.chatMessage.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      });

      // Agrupar por dia
      const messagesByDay: Record<string, number> = {};
      recentMessages.forEach(m => {
        const day = m.createdAt.toISOString().split("T")[0];
        messagesByDay[day] = (messagesByDay[day] || 0) + 1;
      });

      // Páginas mais acessadas
      const pageContextCounts = await prisma.chatMessage.groupBy({
        by: ["pageContext"],
        where: { pageContext: { not: null } },
        _count: { pageContext: true },
        orderBy: { _count: { pageContext: "desc" } },
        take: 10,
      });

      return NextResponse.json({
        totalConversations,
        totalMessages,
        totalFeedbacks,
        totalFiles,
        positiveFeedbacks,
        negativeFeedbacks,
        satisfactionRate: totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks * 100).toFixed(1) : 0,
        sentimentCounts: sentimentCounts.reduce((acc, s) => {
          if (s.sentiment) acc[s.sentiment] = s._count.sentiment;
          return acc;
        }, {} as Record<string, number>),
        messagesByDay,
        topPages: pageContextCounts.map(p => ({
          page: p.pageContext,
          count: p._count.pageContext,
        })),
      });
    }

    if (view === "conversations") {
      // Listar conversas com filtros
      const conversations = await prisma.chatConversation.findMany({
        include: {
          user: { select: { name: true, email: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { feedback: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.chatConversation.count();

      return NextResponse.json({
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (view === "feedbacks") {
      // Listar feedbacks
      const feedbacks = await prisma.chatFeedback.findMany({
        include: {
          message: {
            include: {
              conversation: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total = await prisma.chatFeedback.count();

      return NextResponse.json({
        feedbacks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    if (view === "quotas") {
      // Listar cotas de usuários
      const quotas = await prisma.chatQuota.findMany({
        orderBy: { monthlyMessages: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Buscar informações dos usuários
      const userIds = quotas.map(q => q.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });

      const userMap = users.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as Record<string, typeof users[0]>);

      const total = await prisma.chatQuota.count();

      return NextResponse.json({
        quotas: quotas.map(q => ({
          ...q,
          user: userMap[q.userId],
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({ error: "View inválida" }, { status: 400 });

  } catch (error) {
    console.error("Erro ao buscar dados do chatbot:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Atualizar cotas de usuário (admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!hasSuperAdminAccess(session?.user)) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, maxDailyMessages, maxDailyFiles, maxMonthlyMessages, maxMonthlyFiles } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (maxDailyMessages !== undefined) updates.maxDailyMessages = maxDailyMessages;
    if (maxDailyFiles !== undefined) updates.maxDailyFiles = maxDailyFiles;
    if (maxMonthlyMessages !== undefined) updates.maxMonthlyMessages = maxMonthlyMessages;
    if (maxMonthlyFiles !== undefined) updates.maxMonthlyFiles = maxMonthlyFiles;

    const quota = await prisma.chatQuota.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates },
    });

    return NextResponse.json({ success: true, quota });

  } catch (error) {
    console.error("Erro ao atualizar cotas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
