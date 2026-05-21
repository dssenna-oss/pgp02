// POST /api/curso/criar-turma
// Cria 1 turma + N grupos + 5 users por grupo + 2 processos pré-cadastrados por grupo.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao, processosPorOrgao } from "@/lib/seeds/processos-vegas";
import { terceirosPorOrgao } from "@/lib/seeds/terceiros-vegas";
import { slugifyTurma } from "@/lib/slugify";
import { ensureColunaSenhaExibicao } from "@/lib/coluna-senha-turma";

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

  // Gera slug a partir do nome — entra nos emails dos participantes pra
  // garantir ISOLAMENTO entre turmas. Ex: "Colatina-Out-2026" → "colatina-out-2026".
  // Emails: `dpo.g1.colatina-out-2026@curso.lgpd`. Nunca colidem entre turmas.
  const slug = slugifyTurma(nome);
  if (!slug) {
    return NextResponse.json({ error: "Nome da turma sem caracteres válidos pra slug" }, { status: 400 });
  }
  // Verifica se slug já está em uso por outra turma
  const slugColisao = await prisma.cursoTurma.findFirst({ where: { slug } });
  if (slugColisao) {
    return NextResponse.json({ error: `Já existe uma turma com slug "${slug}". Escolha outro nome.` }, { status: 409 });
  }

  // Verifica se já existem users dos grupos que vamos criar (vestígio de tentativa
  // anterior que falhou no meio). Com slug, colisão só acontece se a tentativa
  // anterior usou o MESMO nome de turma. Detecta cedo e dá mensagem clara.
  const totalGrupos = qtdPM + qtdCM;
  const emailsQueSerao: string[] = [];
  for (let n = 1; n <= totalGrupos; n++) {
    const orgaoTipo = n <= qtdPM ? "PM" : "CM";
    for (const p of papeisPorOrgao(orgaoTipo)) {
      emailsQueSerao.push(`${p.emailPrefix}.g${n}.${slug}@curso.lgpd`);
    }
  }
  const colisoes = await prisma.user.findMany({
    where: { email: { in: emailsQueSerao } },
    select: { email: true },
  });
  if (colisoes.length > 0) {
    return NextResponse.json({
      error: `Já existem ${colisoes.length} usuários do slug "${slug}" (ex: ${colisoes[0].email}). Provavelmente sobrou de tentativa anterior com mesmo nome. Resete a turma "${nome}" se ela existir.`,
    }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(senhaPadrao, 10);

  // Garante a coluna senhaExibicao (auto-migração idempotente)
  await ensureColunaSenhaExibicao();

  // Cria turma
  let turma: { id: string; nome: string; cidade: string };
  try {
    turma = await prisma.cursoTurma.create({
      data: { nome, slug, cidade, status: "ATIVA", senhaExibicao: senhaPadrao },
      select: { id: true, nome: true, cidade: true },
    });
  } catch (e: any) {
    console.error("[criar-turma] falhou no create da turma:", e);
    return NextResponse.json({
      error: `Falha ao criar turma no banco: ${e.message ?? "erro desconhecido"}`,
    }, { status: 500 });
  }

  const loginsGerados: Array<{
    grupo: number; orgao: string; papel: string; nome: string; email: string;
  }> = [];

  // Cria grupos em ordem: primeiro todos PM, depois todos CM
  const especificacoes: Array<{ orgao: "PM" | "CM"; idxLocal: number }> = [
    ...Array.from({ length: qtdPM }, (_, i) => ({ orgao: "PM" as const, idxLocal: i + 1 })),
    ...Array.from({ length: qtdCM }, (_, i) => ({ orgao: "CM" as const, idxLocal: i + 1 })),
  ];

  let numeroGrupo = 0;
  try {
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
        const email = `${p.emailPrefix}.g${numeroGrupo}.${slug}@curso.lgpd`;
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

      // 5. Cria os 2 terceiros pré-cadastrados (Missão 4a parte 2 — Gestão de Terceiros)
      // com situação contratual rascunhada + tipoOperacao/nivelRisco já definidos.
      const terceiros = terceirosPorOrgao(spec.orgao);
      for (const t of terceiros) {
        const operator = await prisma.operator.create({
          data: {
            companyId: company.id,
            nome: t.nome,
            cnpj: t.cnpj,
            servico: t.servico,
            contato: t.contato,
            papel: "OPERADOR",
          },
        });
        await prisma.operatorContract.create({
          data: {
            operatorId: operator.id,
            numero: t.contrato.numero,
            objeto: t.contrato.objeto,
            clausulasLgpd: t.contrato.clausulasLgpd,
            vigenciaInicio: t.contrato.vigenciaInicioISO ? new Date(t.contrato.vigenciaInicioISO) : null,
            vigenciaFim:    t.contrato.vigenciaFimISO    ? new Date(t.contrato.vigenciaFimISO)    : null,
            observacao: t.contrato.observacao || null,
            tipoOperacao: t.contrato.tipoOperacao,
            nivelRisco: t.contrato.nivelRisco,
            clausulasSelecionadas: [],
          },
        });
      }
    }
  } catch (e: any) {
    console.error(`[criar-turma] falhou no grupo ${numeroGrupo}:`, e);
    // Cleanup best-effort: deleta tudo que pertence a essa turma pra não deixar lixo
    try {
      const grupos = await prisma.cursoGrupo.findMany({ where: { turmaId: turma.id }, select: { companyId: true } });
      const companyIds = grupos.map((g) => g.companyId);
      // Ordem inversa de criação respeitando FKs
      await prisma.operatorContract.deleteMany({ where: { operator: { companyId: { in: companyIds } } } });
      await prisma.operator.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.dataInventory.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.user.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.cursoGrupo.deleteMany({ where: { turmaId: turma.id } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
      await prisma.cursoTurma.delete({ where: { id: turma.id } });
    } catch (cleanupErr) {
      console.error("[criar-turma] falhou no cleanup também:", cleanupErr);
    }
    return NextResponse.json({
      error: `Falha ao criar grupo ${numeroGrupo}: ${e.message ?? "erro desconhecido"}. Limpamos o que tinha sido criado — pode tentar de novo.`,
    }, { status: 500 });
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
