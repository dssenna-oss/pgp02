"use server";

// Actions do Plano de Resposta a Incidentes (PRI) — Missão 5 preparação.
// CRUD de membros da equipe + matriz RACI por etapa NIST.

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { RACI_DEFAULT, ETAPAS_NIST, type EtapaNistId, type TipoRaci } from "@/lib/pri-catalogo";

// === Listar tudo do PRI da empresa ===
export async function listarPri() {
  const { companyId } = await requireCompany();
  const [membros, raci] = await Promise.all([
    prisma.priMembroEquipe.findMany({
      where: { companyId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.priRaci.findMany({
      where: { companyId },
      orderBy: [{ etapaNist: "asc" }, { papel: "asc" }],
    }),
  ]);
  return { membros, raci };
}

// === CRUD Membro da Equipe ===
export async function salvarMembroEquipe(input: {
  id?: string;
  nome: string;
  papel: string;
  contato24h?: string;
  email?: string;
  cobertura?: string;
  observacao?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const skip = await checkGapConcluido("FASE_7", "Salvar membro da equipe PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  if (!input.nome?.trim()) return { ok: false, error: "Nome obrigatório." };
  if (!input.papel) return { ok: false, error: "Selecione um papel." };

  const data = {
    companyId,
    nome: input.nome.trim(),
    papel: input.papel,
    contato24h: input.contato24h?.trim() || null,
    email: input.email?.trim() || null,
    cobertura: input.cobertura?.trim() || null,
    observacao: input.observacao?.trim() || null,
  };

  let result;
  if (input.id) {
    result = await prisma.priMembroEquipe.update({
      where: { id: input.id },
      data: { ...data, companyId: undefined },
    });
  } else {
    result = await prisma.priMembroEquipe.create({ data });
  }
  revalidatePath("/dashboard/incidentes");
  return { ok: true, id: result.id };
}

export async function deletarMembroEquipe(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const skip = await checkGapConcluido("FASE_7", "Remover membro da equipe PRI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();
  await prisma.priMembroEquipe.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/incidentes");
  return { ok: true };
}

// === RACI ===
// Salva a matriz completa em 1 operação (delete + recreate por simplicidade).
export async function salvarRaci(
  entries: Array<{ etapaNist: string; papel: string; tipo: string }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const skip = await checkGapConcluido("FASE_7", "Salvar matriz RACI");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  // Apaga e recria — garante consistência (sem registros órfãos)
  await prisma.priRaci.deleteMany({ where: { companyId } });
  if (entries.length > 0) {
    await prisma.priRaci.createMany({
      data: entries.map((e) => ({
        companyId,
        etapaNist: e.etapaNist,
        papel: e.papel,
        tipo: e.tipo,
      })),
      skipDuplicates: true,
    });
  }
  revalidatePath("/dashboard/incidentes");
  return { ok: true };
}

// === Aplicar RACI default ===
// Cria a matriz inicial com sugestão pedagógica baseada em NIST + boas
// práticas. DPO pode editar depois.
export async function aplicarRaciDefault(): Promise<{ ok: true; aplicados: number } | { ok: false; error: string }> {
  const skip = await checkGapConcluido("FASE_7", "Aplicar RACI default");
  if (skip) return skip as any;
  const { companyId } = await requireCompany();

  // Não sobrescreve se já existe RACI
  const existente = await prisma.priRaci.count({ where: { companyId } });
  if (existente > 0) {
    return { ok: false, error: "Matriz RACI já existe. Edite manualmente ou apague antes." };
  }

  const entries = RACI_DEFAULT.map((r) => ({
    companyId,
    etapaNist: r.etapaNist,
    papel: r.papel,
    tipo: r.tipo,
  }));

  await prisma.priRaci.createMany({ data: entries, skipDuplicates: true });
  revalidatePath("/dashboard/incidentes");
  return { ok: true, aplicados: entries.length };
}
