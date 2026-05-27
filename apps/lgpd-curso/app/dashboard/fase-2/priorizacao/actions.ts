"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFase2 } from "@/lib/coluna-fase-2";
import { processosPorOrgao } from "@/lib/seeds/processos-vegas";
import {
  calcularScorePriorizacao,
  type NivelCriterio,
  type PriorizacaoSalva,
} from "@/lib/criterios-priorizacao";
import { revalidatePath } from "next/cache";

export type ProcessoContexto = {
  id: string;
  nome: string;
  setor: string;
  finalidade: string;
};

async function requireCompany() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) throw new Error("Sem empresa associada");
  return { companyId };
}

export async function getPriorizacao(): Promise<{
  processos: ProcessoContexto[];
  salva: PriorizacaoSalva | null;
}> {
  await ensureColunasFase2();
  const { companyId } = await requireCompany();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { orgao: true, priorizacaoProcessos: true },
  });
  const orgao: "PM" | "CM" = company?.orgao === "CM" ? "CM" : "PM";
  const procs = processosPorOrgao(orgao);
  const processos: ProcessoContexto[] = procs.map((p, i) => ({
    id: `${orgao.toLowerCase()}-${i + 1}`,
    nome: p.nome,
    setor: p.setor,
    finalidade: p.finalidade,
  }));
  return {
    processos,
    salva: (company?.priorizacaoProcessos as PriorizacaoSalva | null) ?? null,
  };
}

export async function salvarPriorizacao(input: {
  processos: Array<{
    processoId: string;
    criterios: Record<string, NivelCriterio>;
    justificativa: string;
  }>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ensureColunasFase2();
    const { companyId } = await requireCompany();
    const salva: PriorizacaoSalva = {
      processos: input.processos.map((p) => ({
        processoId: p.processoId,
        criterios: p.criterios,
        score: calcularScorePriorizacao(p.criterios),
        justificativa: p.justificativa,
      })),
      atualizadoEm: new Date().toISOString(),
    };
    await prisma.company.update({
      where: { id: companyId },
      data: { priorizacaoProcessos: salva },
    });
    revalidatePath("/dashboard/fase-2/priorizacao");
    revalidatePath("/dashboard/fase-2");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}
