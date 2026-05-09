import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_REACTION_EMOJIS } from "@/lib/forum-types";

/**
 * Toggle de reação em um post do fórum.
 *
 * POST /api/forum/[id]/reacoes
 * Body: { emoji: string } — emoji da lista FORUM_REACTION_EMOJIS
 *
 * Comportamento:
 *   - Se user já reagiu com ESSE emoji → remove (desfaz)
 *   - Se user reagiu com OUTRO emoji → substitui pelo novo
 *   - Se user nunca reagiu → cria
 *
 * Regra de visibilidade: user só pode reagir a posts que pode ler
 * (mesma lógica do GET /api/forum). Pra DMs: só author + recipient.
 *
 * Resposta: { ok: true, action: 'added'|'removed'|'replaced',
 *             emoji: string|null }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id: postId } = await params;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({ error: "User sem empresa" }, { status: 404 });
  }

  let body: { emoji?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const emoji = (body.emoji ?? "").trim();
  if (!VALID_REACTION_EMOJIS.has(emoji)) {
    return NextResponse.json(
      { error: "Emoji não permitido" },
      { status: 400 },
    );
  }

  // Confere acesso ao post (existe, é da mesma empresa, e se for DM
  // o user é author ou recipient)
  const post = await prisma.forumPost.findFirst({
    where: {
      id: postId,
      companyId: user.companyId,
      active: true,
      OR: [
        { recipientId: null }, // post público
        { authorId: user.id }, // dono da DM
        { recipientId: user.id }, // recipient da DM
      ],
    },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json(
      { error: "Post não encontrado" },
      { status: 404 },
    );
  }

  // Toggle:
  // 1) Verifica se já existe reação do user nesse post
  const existing = await prisma.forumReaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (!existing) {
    // Criar nova
    await prisma.forumReaction.create({
      data: { postId, userId: user.id, emoji },
    });
    return NextResponse.json({ ok: true, action: "added", emoji });
  }

  if (existing.emoji === emoji) {
    // Mesmo emoji → remover
    await prisma.forumReaction.delete({
      where: { postId_userId: { postId, userId: user.id } },
    });
    return NextResponse.json({ ok: true, action: "removed", emoji: null });
  }

  // Emoji diferente → substituir
  await prisma.forumReaction.update({
    where: { postId_userId: { postId, userId: user.id } },
    data: { emoji },
  });
  return NextResponse.json({ ok: true, action: "replaced", emoji });
}
