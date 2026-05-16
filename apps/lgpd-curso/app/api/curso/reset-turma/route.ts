// POST /api/curso/reset-turma { turmaId }
// Deleta a turma específica + cascata (CursoGrupo → Company → users/inventários/etc).
// Não afeta outras turmas.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

// Cascata pode deletar dezenas de registros. Folga pra Neon dormindo.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  let turmaId: string | undefined;
  try {
    const body = await req.json();
    turmaId = body.turmaId;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!turmaId) return NextResponse.json({ error: "turmaId obrigatório" }, { status: 400 });

  try {
    const turma = await prisma.cursoTurma.findUnique({
      where: { id: turmaId },
      include: { grupos: true },
    });
    if (!turma) return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });

    const companyIds = turma.grupos.map((g) => g.companyId);

    // Schema usa onDelete:SetNull em User.company, então deletar Company NÃO
    // deleta os Users (eles ficam órfãos com companyId=null e quebram a próxima
    // criação de turma por colidir no email único). Por isso a gente deleta
    // explicitamente todos os users das companies primeiro.
    if (companyIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          companyId: { in: companyIds },
          role: { not: "ADMIN" }, // proteção extra — nunca apaga admin
        },
      });
    }

    // Agora deleta cada Company (cascata cuida de DataInventory, Risk, etc.)
    for (const cid of companyIds) {
      await prisma.company.delete({ where: { id: cid } });
    }

    // Finalmente deleta a turma (cascata cuida de CursoGrupo)
    await prisma.cursoTurma.delete({ where: { id: turmaId } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[reset-turma] erro:", e);
    return NextResponse.json({
      error: `Falha ao resetar: ${e.message ?? "erro desconhecido"}`,
    }, { status: 500 });
  }
}
