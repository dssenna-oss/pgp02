export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmailAsync } from "@/lib/email-sender";
import { tplForumMention } from "@/lib/email-templates";
import { extractMentionedUserIds, stripMentionMarkdown } from "@/lib/forum-mentions";

/**
 * POST /api/forum/[id]/respostas — adicionar resposta a um post.
 *
 * Em DM: só autor + destinatário podem responder.
 * Em post público: qualquer user da organização.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true },
  });
  if (!user || !user.companyId) {
    return NextResponse.json(
      { error: "Usuário sem organização" },
      { status: 404 }
    );
  }

  const post = await prisma.forumPost.findFirst({
    where: { id, companyId: user.companyId, active: true },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Post não encontrado" },
      { status: 404 }
    );
  }

  // DM: só autor + destinatário podem responder
  if (
    post.recipientId &&
    post.recipientId !== user.id &&
    post.authorId !== user.id
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const content = String(body.content ?? "").trim();
  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo é obrigatório" },
      { status: 400 }
    );
  }
  if (content.length > 5000) {
    return NextResponse.json(
      { error: "Resposta muito longa (máximo 5000 caracteres)" },
      { status: 400 }
    );
  }

  const reply = await prisma.forumReply.create({
    data: {
      postId: id,
      authorId: user.id,
      content,
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Marca como lido pelo autor (não conta como não-lido pra ele)
  await prisma.forumPostRead
    .upsert({
      where: { postId_userId: { postId: id, userId: user.id } },
      create: { postId: id, userId: user.id },
      update: { readAt: new Date() },
    })
    .catch(() => {});

  // Dispara emails pra usuários mencionados via @[Nome](mention:uid).
  // Não notifica o próprio autor mencionando ele mesmo. Filtra por
  // companyId pra blindar contra payload manipulado.
  const mentionedIds = extractMentionedUserIds(content).filter(
    (uid) => uid !== user.id,
  );
  if (mentionedIds.length > 0) {
    const mentioned = await prisma.user.findMany({
      where: {
        id: { in: mentionedIds },
        companyId: user.companyId,
        isActive: true,
        emailNotifyDm: true,
      },
      select: { email: true, name: true },
    });
    const previewText = stripMentionMarkdown(content);
    for (const u of mentioned) {
      sendEmailAsync({
        to: { email: u.email, name: u.name ?? undefined },
        tag: "forum-mention",
        ...tplForumMention({
          recipientName: u.name,
          recipientEmail: u.email,
          authorName: reply.author.name ?? reply.author.email,
          source: "reply",
          postTitle: post.title,
          contentPreview: previewText,
          postId: id,
        }),
      });
    }
  }

  return NextResponse.json({ reply }, { status: 201 });
}
