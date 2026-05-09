export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  VALID_FORUM_TYPES,
  VALID_FORUM_CATEGORIES,
  FORUM_POST_TYPE,
  aggregateReactions,
} from "@/lib/forum-types";

/**
 * Endpoints da listagem pública do Fórum.
 *
 * GET  /api/forum          → lista posts PÚBLICOS (recipientId=null) da
 *                            organização do user logado, com badges de
 *                            "lido"/"não lido". Suporta filtros opcionais.
 * POST /api/forum          → cria novo post. Discussion: qualquer user;
 *                            Announcement: só DPO.
 *
 * Mensagens diretas vivem em /api/forum/mensagens (separado por clareza
 * mesmo compartilhando o mesmo modelo Prisma).
 */

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || !user.companyId) {
    return { error: NextResponse.json({ error: "Usuário sem organização" }, { status: 404 }) };
  }
  return { user };
}

export async function GET(req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const type = sp.get("type");

  const where: any = {
    companyId: user.companyId,
    active: true,
    recipientId: null, // só públicos nesta rota
  };
  if (type && VALID_FORUM_TYPES.has(type)) where.type = type;
  if (category && VALID_FORUM_CATEGORIES.has(category)) where.category = category;

  const posts = await prisma.forumPost.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: { select: { replies: true } },
      reads: { where: { userId: user.id }, select: { id: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  // Stats agregadas
  const totalPublicCount = await prisma.forumPost.count({
    where: { companyId: user.companyId ?? undefined, active: true, recipientId: null },
  });
  const myPublicReadsCount = await prisma.forumPostRead.count({
    where: {
      userId: user.id,
      post: {
        companyId: user.companyId ?? undefined,
        active: true,
        recipientId: null,
      },
    },
  });
  const unreadPublic = Math.max(0, totalPublicCount - myPublicReadsCount);

  const totalDMsCount = await prisma.forumPost.count({
    where: {
      companyId: user.companyId ?? undefined,
      active: true,
      recipientId: user.id, // só DMs onde EU sou destinatário
    },
  });
  const myDMReadsCount = await prisma.forumPostRead.count({
    where: {
      userId: user.id,
      post: {
        companyId: user.companyId ?? undefined,
        active: true,
        recipientId: user.id,
      },
    },
  });
  const unreadDMs = Math.max(0, totalDMsCount - myDMReadsCount);

  const formatted = posts.map((p) => ({
    ...p,
    read: p.reads.length > 0,
    replyCount: p._count.replies,
    reactions: aggregateReactions(p.reactions, user.id),
    reads: undefined,
    _count: undefined,
  }));

  return NextResponse.json({
    posts: formatted,
    stats: {
      unreadPublic,
      unreadDMs,
      totalUnread: unreadPublic + unreadDMs,
    },
  });
}

export async function POST(req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "Título é obrigatório (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título muito longo (máximo 200 caracteres)" },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo é obrigatório" },
      { status: 400 }
    );
  }

  const type = VALID_FORUM_TYPES.has(body.type)
    ? body.type
    : FORUM_POST_TYPE.DISCUSSION;
  const category = VALID_FORUM_CATEGORIES.has(body.category)
    ? body.category
    : "GERAL";

  // Comunicado só DPO
  const userIsDPO = isDPO(user.role);
  if (type === FORUM_POST_TYPE.ANNOUNCEMENT && !userIsDPO) {
    return NextResponse.json(
      { error: "Apenas DPO pode criar Comunicados" },
      { status: 403 }
    );
  }
  // Pinned: só DPO
  const pinned = userIsDPO && !!body.pinned;

  const post = await prisma.forumPost.create({
    data: {
      companyId: user.companyId!,
      authorId: user.id,
      type,
      category,
      title,
      content,
      pinned,
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Auto-marca como lido pelo autor (não conta como não-lido pra ele)
  await prisma.forumPostRead
    .create({
      data: { postId: post.id, userId: user.id },
    })
    .catch(() => {});

  return NextResponse.json({ post }, { status: 201 });
}
