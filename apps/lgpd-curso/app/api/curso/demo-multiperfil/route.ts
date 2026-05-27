// GET /api/curso/demo-multiperfil?turmaSlug=X
// Retorna JSON com os papéis × grupos da turma + senha de exibição,
// pra o Painel Multi-Perfil do facilitador montar URLs de login rápido.
//
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";
import { ensureColunaSenhaExibicao } from "@/lib/coluna-senha-turma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  await ensureColunaSenhaExibicao();

  const turmaSlug = req.nextUrl.searchParams.get("turmaSlug");
  if (!turmaSlug) {
    return NextResponse.json({ error: "turmaSlug obrigatório" }, { status: 400 });
  }

  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: turmaSlug },
    include: {
      grupos: {
        orderBy: { numero: "asc" },
        include: {
          company: {
            select: {
              name: true,
              users: {
                select: { id: true, email: true, papel: true, role: true },
                orderBy: { papel: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!turma) {
    return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
  }

  // Monta a estrutura ordenada por grupo, papel canônico do órgão
  const grupos = turma.grupos.map((g) => {
    const orgao = (g.orgao === "CM" ? "CM" : "PM") as "PM" | "CM";
    const papeisDef = papeisPorOrgao(orgao);
    const papeis = papeisDef.map((p) => {
      const user = g.company.users.find((u) => u.papel === p.papel);
      return {
        papel: p.papel,
        nomeAmigavel: p.nomeAmigavel,
        role: p.role,
        responsabilidade: p.responsabilidade,
        email: user?.email || null,
        userId: user?.id || null,
      };
    });
    return {
      grupoId: g.id,
      numero: g.numero,
      orgao,
      companyName: g.company.name,
      papeis,
    };
  });

  return NextResponse.json({
    turma: {
      id: turma.id,
      nome: turma.nome,
      slug: turma.slug,
      cidade: turma.cidade,
      senhaExibicao: turma.senhaExibicao, // null se ainda não foi setada
    },
    grupos,
  });
}
