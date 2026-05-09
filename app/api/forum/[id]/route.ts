export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import { aggregateReactions } from "@/lib/forum-types";
import {
  VALID_FORUM_CATEGORIES,
} from "@/lib/forum-types";

/**
 * GET    /api/forum/[id] — detalhe do post + respostas. Marca como lido.
 *                          DM: só autor + destinatário podem ver.
 * PATCH  /api/forum/[id] — editar (autor) ou fixar/prioridade (DPO).
 * DELETE /api/forum/[id] — soft delete (autor ou DPO).
 */

async function loadPost(id: string) {
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
  const post = await prisma.forumPost.findFirst({
    where: { id, companyId: user.companyId, active: true },
  });
  if (!post) {
    return { error: NextResponse.json({ error: "Post não encontrado" }, { status: 404 }) };
  }
  return { user, post };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadPost(id);
  if ("error" in r) return r.error;
  const { user, post } = r;

  // DM: só autor + destinatário
  if (post.recipientId && post.recipientId !== user.id && post.authorId !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const full = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reactions: { select: { emoji: true, userId: true } },
      _count: { select: { replies: true } },
    },
  });

  // Marca como lido (idempotente)
  await prisma.forumPostRead
    .upsert({
      where: { postId_userId: { postId: id, userId: user.id } },
      create: { postId: id, userId: user.id },
      update: { readAt: new Date() },
    })
    .catch(() => {});

  return NextResponse.json({
    post: {
      ...full,
      replyCount: full?._count.replies ?? 0,
      reactions: aggregateReactions(full?.reactions ?? [], user.id),
      _count: undefined,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadPost(id);
  if ("error" in r) return r.error;
  const { user, post } = r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const userIsDPO = isDPO(user.role);
  const isAuthor = post.authorId === user.id;

  if (!isAuthor && !userIsDPO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const updates: any = {};

  // Autor pode editar título/conteúdo do próprio post
  if (isAuthor) {
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (t.length < 2 || t.length > 200) {
        return NextResponse.json(
          { error: "Título inválido" },
          { status: 400 }
        );
      }
      updates.title = t;
    }
    if (typeof body.content === "string") {
      const c = body.content.trim();
      if (!c) {
        return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
      }
      updates.content = c;
    }
    if (
      typeof body.category === "string" &&
      VALID_FORUM_CATEGORIES.has(body.category)
    ) {
      updates.category = body.category;
    }
  }

  // DPO pode fixar/desafixar
  if (userIsDPO && typeof body.pinned === "boolean") {
    updates.pinned = body.pinned;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  }

  const updated = await prisma.forumPost.update({
    where: { id },
    data: updates,
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadPost(id);
  if ("error" in r) return r.error;
  const { user, post } = r;

  const userIsDPO = isDPO(user.role);
  const isAuthor = post.authorId === user.id;

  if (!isAuthor && !userIsDPO) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.forumPost.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
