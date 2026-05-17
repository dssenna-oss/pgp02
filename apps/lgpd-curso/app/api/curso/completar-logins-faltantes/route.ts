// GET/POST /api/curso/completar-logins-faltantes
// Idempotente: pra cada CursoGrupo existente, compara os papéis cadastrados
// vs os papéis do seed atual (papeisPorOrgao) e CRIA os que estão faltando.
// Útil quando o seed ganha papéis novos (ex: ADMINISTRATIVO) e o user não quer
// resetar turmas existentes pra obtê-los.
//
// Senha padrão usada nos novos: "Curso2026!". Se a turma original usou outra
// senha, o admin pode trocar manualmente via UI ou criar novo endpoint.
// Admin-only.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { papeisPorOrgao } from "@/lib/seeds/processos-vegas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SENHA_PADRAO_FALLBACK = "Curso2026!";

async function completar() {
  const grupos = await prisma.cursoGrupo.findMany({
    include: {
      company: { include: { users: { select: { id: true, papel: true, email: true } } } },
      turma: { select: { nome: true } },
    },
  });

  if (grupos.length === 0) {
    return { status: "nenhuma_turma", turmas: 0, novos_logins: [] };
  }

  const passwordHash = await bcrypt.hash(SENHA_PADRAO_FALLBACK, 10);
  const novosLogins: Array<{ turma: string; grupo: number; orgao: string; papel: string; email: string }> = [];

  for (const grupo of grupos) {
    const papeisExistentes = new Set(grupo.company.users.map((u) => u.papel).filter(Boolean));
    const papeisDesejados = papeisPorOrgao(grupo.orgao as "PM" | "CM");

    for (const p of papeisDesejados) {
      if (papeisExistentes.has(p.papel)) continue; // já existe, skip

      const email = `${p.emailPrefix}.g${grupo.numero}@curso.lgpd`;

      // Checagem extra: email já pode existir órfão (de turma resetada antes do fix do cascade)
      const jaExiste = await prisma.user.findUnique({ where: { email } });
      if (jaExiste) {
        // Vincula ao grupo atual em vez de criar duplicado
        await prisma.user.update({
          where: { email },
          data: { companyId: grupo.companyId, papel: p.papel, role: p.role, isActive: true },
        });
        novosLogins.push({ turma: grupo.turma.nome, grupo: grupo.numero, orgao: grupo.orgao, papel: p.papel, email: `${email} (vinculado existente)` });
        continue;
      }

      await prisma.user.create({
        data: {
          email,
          name: `${p.nomeAmigavel} · Grupo ${grupo.numero}`,
          password: passwordHash,
          role: p.role,
          papel: p.papel,
          companyId: grupo.companyId,
          isActive: true,
        },
      });
      novosLogins.push({ turma: grupo.turma.nome, grupo: grupo.numero, orgao: grupo.orgao, papel: p.papel, email });
    }
  }

  return {
    status: novosLogins.length > 0 ? "completados" : "ja_completo",
    turmas: grupos.length,
    novos_logins: novosLogins,
    senha_padrao_usada: SENHA_PADRAO_FALLBACK,
  };
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  try {
    const result = await completar();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[completar-logins-faltantes] erro:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
