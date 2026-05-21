// POST /api/curso/redefinir-senha-turma  { turmaId, novaSenha }
// Define/altera a senha de acesso de uma turma: re-hasheia a senha de TODOS
// os participantes daquela turma e guarda a senha em texto (senhaExibicao)
// pra o facilitador poder relembrar/divulgar. Admin-only.
// Não afeta o login do facilitador (não pertence a nenhuma turma).

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaSenhaExibicao } from "@/lib/coluna-senha-turma";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const turmaId = String(body.turmaId || "").trim();
  const novaSenha = String(body.novaSenha || "").trim();
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });
  if (novaSenha.length < 4) {
    return NextResponse.json({ error: "A senha precisa ter ao menos 4 caracteres" }, { status: 400 });
  }

  try {
    await ensureColunaSenhaExibicao();

    const turma = await prisma.cursoTurma.findUnique({
      where: { id: turmaId },
      select: { id: true, nome: true, grupos: { select: { companyId: true } } },
    });
    if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

    // Re-hasheia a senha de todos os participantes da turma de uma vez.
    const companyIds = turma.grupos.map((g) => g.companyId);
    const hash = await bcrypt.hash(novaSenha, 10);
    let usuariosAtualizados = 0;
    if (companyIds.length > 0) {
      const r = await prisma.user.updateMany({
        where: { companyId: { in: companyIds } },
        data: { password: hash },
      });
      usuariosAtualizados = r.count;
    }

    // Guarda a senha em texto pra exibição.
    await prisma.cursoTurma.update({
      where: { id: turmaId },
      data: { senhaExibicao: novaSenha },
    });

    return NextResponse.json({ ok: true, turma: turma.nome, usuariosAtualizados });
  } catch (e: any) {
    console.error("[redefinir-senha-turma] erro:", e);
    return NextResponse.json({ error: e.message ?? "Erro ao redefinir senha" }, { status: 500 });
  }
}
