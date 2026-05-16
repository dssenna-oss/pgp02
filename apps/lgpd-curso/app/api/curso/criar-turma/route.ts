// POST /api/curso/criar-turma
// Cria 1 turma + N grupos + 5 users por grupo + 2 processos pré-cadastrados por grupo.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao, processosPorOrgao } from "@/lib/seeds/processos-vegas";

// ~10 ops sequenciais no banco por grupo (company + cursoGrupo + 5 users +
// 2 processos) + bcrypt hash. Com Neon dormindo pode passar de 15s.
export const maxDuration = 60;

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

  const nome = String(body.nome || "").trim();
  const cidade = String(body.cidade || "Vegas").trim();
  const senhaPadrao = String(body.senhaPadrao || "Curso2026!").trim();
  const qtdPM = Math.max(0, Math.min(5, parseInt(body.qtdPM ?? 2)));
  const qtdCM = Math.max(0, Math.min(5, parseInt(body.qtdCM ?? 2)));

  if (!nome) return NextResponse.json({ error: "Nome da turma obrigatório" }, { status: 400 });
  if (qtdPM + qtdCM < 1) return NextResponse.json({ error: "Pelo menos 1 grupo" }, { status: 400 });

  // Verifica se a turma já existe
  const existing = await prisma.cursoTurma.findUnique({ where: { nome } });
  if (existing) {
    return NextResponse.json({ error: `Turma "${nome}" já existe. Use outro nome ou resete-a primeiro.` }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(senhaPadrao, 10);

  // Cria turma
  const turma = await prisma.cursoTurma.create({
    data: {
      nome,
      cidade,
      status: "ATIVA",
    },
  });

  const loginsGerados: Array<{
    grupo: number; orgao: string; papel: string; nome: string; email: string;
  }> = [];

  // Cria grupos em ordem: primeiro todos PM, depois todos CM
  let numeroGrupo = 0;
  const especificacoes: Array<{ orgao: "PM" | "CM"; idxLocal: number }> = [
    ...Array.from({ length: qtdPM }, (_, i) => ({ orgao: "PM" as const, idxLocal: i + 1 })),
    ...Array.from({ length: qtdCM }, (_, i) => ({ orgao: "CM" as const, idxLocal: i + 1 })),
  ];

  for (const spec of especificacoes) {
    numeroGrupo++;
    const orgaoNome = spec.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";

    // 1. Cria a Company do grupo
    const company = await prisma.company.create({
      data: {
        name: `${orgaoNome} de ${cidade} — Grupo ${numeroGrupo}`,
        orgao: spec.orgao,
        cidade,
        cnpj: spec.orgao === "PM"
          ? `00.000.000/000${numeroGrupo}-${spec.idxLocal.toString().padStart(2, "0")}`
          : `11.111.111/000${numeroGrupo}-${spec.idxLocal.toString().padStart(2, "0")}`,
      },
    });

    // 2. Vincula ao CursoGrupo
    await prisma.cursoGrupo.create({
      data: {
        turmaId: turma.id,
        numero: numeroGrupo,
        orgao: spec.orgao,
        companyId: company.id,
      },
    });

    // 3. Cria os 5 users
    const papeisDef = papeisPorOrgao(spec.orgao);
    const usersCriados: Record<string, string> = {}; // papel -> userId

    for (const p of papeisDef) {
      const email = `${p.emailPrefix}.g${numeroGrupo}@curso.lgpd`;
      const u = await prisma.user.create({
        data: {
          email,
          name: `${p.nomeAmigavel} · Grupo ${numeroGrupo}`,
          password: passwordHash,
          role: p.role,
          papel: p.papel,
          companyId: company.id,
          isActive: true,
        },
      });
      usersCriados[p.papel] = u.id;
      loginsGerados.push({
        grupo: numeroGrupo,
        orgao: spec.orgao,
        papel: p.papel,
        nome: p.nomeAmigavel,
        email,
      });
    }

    // 4. Cria os 2 processos pré-cadastrados com createdById apontando pro dono
    const processos = processosPorOrgao(spec.orgao);
    for (const proc of processos) {
      const donoId = usersCriados[proc.papelDono];
      await prisma.dataInventory.create({
        data: {
          companyId: company.id,
          nome: proc.nome,
          setor: proc.setor,
          finalidade: proc.finalidade,
          status: "RASCUNHO",
          createdById: donoId,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    turma: {
      id: turma.id,
      nome: turma.nome,
      cidade: turma.cidade,
      totalGrupos: numeroGrupo,
      totalLogins: loginsGerados.length,
    },
    logins: loginsGerados,
    senhaPadrao,
  });
}
