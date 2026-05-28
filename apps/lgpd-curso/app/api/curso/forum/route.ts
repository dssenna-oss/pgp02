// Fórum da turma — suporte PÓS-curso (visível pra toda a turma).
//
// GET  /api/curso/forum?turmaId=X            → lista de tópicos da turma
// GET  /api/curso/forum?turmaId=X&threadId=Y → tópico + respostas + reações
// POST /api/curso/forum  { acao, ... }       → nova-thread | responder |
//                                              resolver | fixar | util
//
// Visibilidade: TODA a turma vê e responde. Para o participante, a turma é
// derivada do companyId (grupo). O facilitador (ADMIN) não tem grupo, então
// passa turmaId explícito. `fixar` é admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { ensureTabelasForum } from "@/lib/colunas-forum";

export const dynamic = "force-dynamic";

// Contexto do autor a partir da sessão + grupo (campos desnormalizados).
async function contextoAutor(session: any, turmaIdParam?: string | null) {
  const ehFacilitador = session.user.role === "ADMIN";
  if (ehFacilitador) {
    return {
      turmaId: turmaIdParam ?? null,
      autor: {
        autorId: session.user.id,
        autorNome: session.user.name ?? "Facilitador",
        autorPapel: null as string | null,
        autorGrupoNumero: null as number | null,
        autorOrgao: null as string | null,
        autorEhFacilitador: true,
      },
    };
  }
  const grupo = session.user.companyId
    ? await prisma.cursoGrupo.findUnique({
        where: { companyId: session.user.companyId },
        select: { turmaId: true, numero: true, orgao: true },
      })
    : null;
  return {
    turmaId: grupo?.turmaId ?? null,
    autor: {
      autorId: session.user.id,
      autorNome: session.user.name ?? "Participante",
      autorPapel: session.user.papel ?? null,
      autorGrupoNumero: grupo?.numero ?? null,
      autorOrgao: grupo?.orgao ?? null,
      autorEhFacilitador: false,
    },
  };
}

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  await ensureTabelasForum();
  const ctx = await contextoAutor(session, req.nextUrl.searchParams.get("turmaId"));
  const turmaId = ctx.turmaId;
  if (!turmaId) {
    return NextResponse.json({ error: "Turma não identificada" }, { status: 400 });
  }

  const threadId = req.nextUrl.searchParams.get("threadId");

  // Detalhe de um tópico: tópico + respostas + reações
  if (threadId) {
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread || thread.turmaId !== turmaId) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }
    const mensagens = await prisma.forumMensagem.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
    });

    // Reações (👍 útil) de tópico + todas as mensagens, em uma query
    const alvoIds = [threadId, ...mensagens.map((m) => m.id)];
    const reacoes = await prisma.forumReacao.findMany({
      where: { alvoId: { in: alvoIds } },
      select: { alvoId: true, userId: true },
    });
    const contagem: Record<string, { total: number; eu: boolean }> = {};
    for (const id of alvoIds) contagem[id] = { total: 0, eu: false };
    for (const r of reacoes) {
      const c = contagem[r.alvoId];
      if (!c) continue;
      c.total += 1;
      if (r.userId === session.user.id) c.eu = true;
    }

    return NextResponse.json({
      thread: { ...thread, uteis: contagem[threadId] },
      mensagens: mensagens.map((m) => ({ ...m, uteis: contagem[m.id] })),
      souAutorThread: thread.autorId === session.user.id,
      souFacilitador: ctx.autor.autorEhFacilitador,
    });
  }

  // Lista de tópicos da turma (fixados primeiro, depois mais recentes)
  const threads = await prisma.forumThread.findMany({
    where: { turmaId },
    orderBy: [{ fixado: "desc" }, { updatedAt: "desc" }],
  });
  const ids = threads.map((t) => t.id);
  const respostas = ids.length
    ? await prisma.forumMensagem.groupBy({
        by: ["threadId"],
        where: { threadId: { in: ids } },
        _count: { _all: true },
      })
    : [];
  const countResp: Record<string, number> = {};
  for (const r of respostas) countResp[r.threadId] = r._count._all;

  const uteisThread = ids.length
    ? await prisma.forumReacao.groupBy({
        by: ["alvoId"],
        where: { alvoTipo: "THREAD", alvoId: { in: ids } },
        _count: { _all: true },
      })
    : [];
  const countUtil: Record<string, number> = {};
  for (const u of uteisThread) countUtil[u.alvoId] = u._count._all;

  return NextResponse.json({
    souFacilitador: ctx.autor.autorEhFacilitador,
    threads: threads.map((t) => ({
      ...t,
      respostas: countResp[t.id] ?? 0,
      uteis: countUtil[t.id] ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  await ensureTabelasForum();
  const body = await req.json();
  const acao = body?.acao as string | undefined;
  const ctx = await contextoAutor(session, body?.turmaId ?? null);

  if (acao === "nova-thread") {
    if (!ctx.turmaId) {
      return NextResponse.json({ error: "Turma não identificada" }, { status: 400 });
    }
    const titulo = String(body.titulo ?? "").trim();
    const corpo = String(body.corpo ?? "").trim();
    if (!titulo || !corpo) {
      return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 });
    }
    const thread = await prisma.forumThread.create({
      data: { turmaId: ctx.turmaId, titulo, corpo, ...ctx.autor },
    });
    return NextResponse.json({ ok: true, threadId: thread.id });
  }

  if (acao === "responder") {
    const threadId = String(body.threadId ?? "");
    const corpo = String(body.corpo ?? "").trim();
    if (!threadId || !corpo) {
      return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
    }
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true, turmaId: true },
    });
    if (!thread || thread.turmaId !== ctx.turmaId) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }
    await prisma.$transaction([
      prisma.forumMensagem.create({ data: { threadId, corpo, ...ctx.autor } }),
      prisma.forumThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (acao === "resolver") {
    const threadId = String(body.threadId ?? "");
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true, turmaId: true, autorId: true, resolvido: true },
    });
    if (!thread || thread.turmaId !== ctx.turmaId) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }
    // Só o autor do tópico ou o facilitador podem marcar como resolvida.
    if (thread.autorId !== session.user.id && !ctx.autor.autorEhFacilitador) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { resolvido: !thread.resolvido },
    });
    return NextResponse.json({ ok: true, resolvido: !thread.resolvido });
  }

  if (acao === "fixar") {
    if (!ctx.autor.autorEhFacilitador) {
      return NextResponse.json({ error: "Apenas o facilitador pode fixar" }, { status: 403 });
    }
    const threadId = String(body.threadId ?? "");
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: { id: true, turmaId: true, fixado: true },
    });
    if (!thread || thread.turmaId !== ctx.turmaId) {
      return NextResponse.json({ error: "Tópico não encontrado" }, { status: 404 });
    }
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { fixado: !thread.fixado },
    });
    return NextResponse.json({ ok: true, fixado: !thread.fixado });
  }

  if (acao === "util") {
    const alvoTipo = body.alvoTipo === "MENSAGEM" ? "MENSAGEM" : "THREAD";
    const alvoId = String(body.alvoId ?? "");
    if (!alvoId) return NextResponse.json({ error: "alvoId obrigatório" }, { status: 400 });
    // Toggle: se já reagiu, remove; senão, cria.
    const existente = await prisma.forumReacao.findUnique({
      where: {
        userId_alvoTipo_alvoId: { userId: session.user.id, alvoTipo, alvoId },
      },
    });
    if (existente) {
      await prisma.forumReacao.delete({ where: { id: existente.id } });
      return NextResponse.json({ ok: true, reagiu: false });
    }
    await prisma.forumReacao.create({
      data: { userId: session.user.id, alvoTipo, alvoId },
    });
    return NextResponse.json({ ok: true, reagiu: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
