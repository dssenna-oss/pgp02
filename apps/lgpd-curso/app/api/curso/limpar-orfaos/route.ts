// POST /api/curso/limpar-orfaos
// Deleta usuários órfãos do curso (papel.gN@curso.lgpd com companyId=null),
// sobra de turmas resetadas — o schema usa onDelete:SetNull em User.company,
// então deletar Company NÃO deleta o User. Este endpoint corrige.
// Também limpa Companies órfãs (sem grupo nem usuários).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const maxDuration = 60;

// Padrão de email dos participantes: <papel>.g<numero>@curso.lgpd
const PADRAO_EMAIL_PARTICIPANTE = /^[a-z]+\.g\d+@curso\.lgpd$/i;

export async function POST(_req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  try {
    // 1. Acha users de participante que estão órfãos (sem company)
    const orphanUsers = await prisma.user.findMany({
      where: {
        companyId: null,
        email: { endsWith: "@curso.lgpd" },
        role: { not: "ADMIN" }, // proteção extra — nunca apaga admin
      },
      select: { id: true, email: true },
    });

    const orphansToDelete = orphanUsers.filter((u) => PADRAO_EMAIL_PARTICIPANTE.test(u.email));
    const orphanIds = orphansToDelete.map((u) => u.id);

    if (orphanIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: orphanIds } } });
    }

    // 2. Acha Companies órfãs (sem grupo vinculado E sem nenhum user)
    const orphanCompanies = await prisma.company.findMany({
      where: {
        AND: [
          { users: { none: {} } },
          // Não tem como filtrar "não tem CursoGrupo" via relação inversa polimórfica
          // direto no Prisma; o jeito é buscar e filtrar no JS abaixo.
        ],
      },
      include: { _count: { select: { users: true } } },
    });
    const cursoGrupos = await prisma.cursoGrupo.findMany({
      select: { companyId: true },
    });
    const companyIdsComGrupo = new Set(cursoGrupos.map((g) => g.companyId));
    const companiesParaDeletar = orphanCompanies.filter(
      (c) => !companyIdsComGrupo.has(c.id) && c._count.users === 0
    );

    if (companiesParaDeletar.length > 0) {
      await prisma.company.deleteMany({
        where: { id: { in: companiesParaDeletar.map((c) => c.id) } },
      });
    }

    return NextResponse.json({
      ok: true,
      usersDeletados: orphansToDelete.length,
      companiesDeletadas: companiesParaDeletar.length,
      detalheUsers: orphansToDelete.map((u) => u.email),
    });
  } catch (e: any) {
    console.error("[limpar-orfaos] erro:", e);
    return NextResponse.json({
      error: `Falha ao limpar órfãos: ${e.message ?? "erro desconhecido"}`,
    }, { status: 500 });
  }
}
