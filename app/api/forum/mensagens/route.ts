export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Mensagens diretas (DMs) — usa o mesmo modelo `ForumPost`,
 * mas com `recipientId` preenchido (≠ posts públicos).
 *
 * GET  /api/forum/mensagens     → DMs onde o user é autor OU destinatário
 * POST /api/forum/mensagens     → envia uma DM (body: recipientId, title, content)
 *
 * Permissão (decisão 9a — todos podem mandar pra todos da mesma org).
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

export async function GET(_req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  const messages = await prisma.forumPost.findMany({
    where: {
      companyId: user.companyId!,
      active: true,
      OR: [{ authorId: user.id }, { recipientId: user.id }],
      // só DMs (recipientId não é null)
      NOT: { recipientId: null },
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { replies: true } },
      reads: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formatted = messages.map((m) => ({
    ...m,
    read: m.reads.length > 0,
    replyCount: m._count.replies,
    reads: undefined,
    _count: undefined,
  }));

  return NextResponse.json({ messages: formatted });
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

  const recipientId = String(body.recipientId ?? "").trim();
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!recipientId) {
    return NextResponse.json(
      { error: "Destinatário é obrigatório" },
      { status: 400 }
    );
  }
  if (recipientId === user.id) {
    return NextResponse.json(
      { error: "Você não pode enviar mensagem pra si mesmo" },
      { status: 400 }
    );
  }
  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "Título é obrigatório (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título muito longo" },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo é obrigatório" },
      { status: 400 }
    );
  }

  // Destinatário precisa ser da mesma organização
  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, companyId: user.companyId! },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!recipient) {
    return NextResponse.json(
      { error: "Destinatário não encontrado nesta organização" },
      { status: 404 }
    );
  }

  const message = await prisma.forumPost.create({
    data: {
      companyId: user.companyId!,
      authorId: user.id,
      recipientId: recipient.id,
      type: "DISCUSSION", // tipo é irrelevante em DMs, mas usamos default
      category: null, // DMs não têm categoria
      title,
      content,
      pinned: false,
    },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
      recipient: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Marca como lido pelo autor
  await prisma.forumPostRead
    .create({ data: { postId: message.id, userId: user.id } })
    .catch(() => {});

  return NextResponse.json({ message }, { status: 201 });
}
