// GET /api/curso/turmas-senhas
// Lista as turmas com a senha de acesso (texto) pra o widget do facilitador
// na sidebar. Admin-only. Garante a coluna senhaExibicao antes de ler.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunaSenhaExibicao } from "@/lib/coluna-senha-turma";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  try {
    await ensureColunaSenhaExibicao();
    const turmas = await prisma.cursoTurma.findMany({
      orderBy: [{ proximoCurso: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        nome: true,
        cidade: true,
        senhaExibicao: true,
        proximoCurso: true,
      },
    });
    return NextResponse.json({ ok: true, turmas });
  } catch (e: any) {
    console.error("[turmas-senhas] erro:", e);
    return NextResponse.json({ error: e.message ?? "Erro ao listar turmas" }, { status: 500 });
  }
}
