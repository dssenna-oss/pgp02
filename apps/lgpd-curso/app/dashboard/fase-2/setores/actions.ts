"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFase2 } from "@/lib/coluna-fase-2";
import { processosPorOrgao } from "@/lib/seeds/processos-vegas";
import { revalidatePath } from "next/cache";

export type SetorContexto = {
  id: string;
  nomeProcesso: string;
  setor: string;
  finalidade: string;
};

export type SetorDiscutido = {
  id: string;
  discutido: boolean;
  observacao: string;
};

export type SetoresSalvos = {
  setores: SetorDiscutido[];
  atualizadoEm: string;
};

async function requireCompany() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) throw new Error("Sem empresa associada");
  return { companyId };
}

// Lê contexto + estado salvo. Contexto vem dos processos pré-cadastrados
// do órgão (PM: Saúde + RH · CM: Cerimonial + Ouvidoria).
export async function getSetores(): Promise<{
  setores: SetorContexto[];
  salvos: SetoresSalvos | null;
}> {
  await ensureColunasFase2();
  const { companyId } = await requireCompany();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { orgao: true, setoresDiscutidos: true },
  });
  const orgao: "PM" | "CM" = company?.orgao === "CM" ? "CM" : "PM";
  const processos = processosPorOrgao(orgao);
  const setores: SetorContexto[] = processos.map((p, i) => ({
    id: `${orgao.toLowerCase()}-${i + 1}`,
    nomeProcesso: p.nome,
    setor: p.setor,
    finalidade: p.finalidade,
  }));
  return {
    setores,
    salvos: (company?.setoresDiscutidos as SetoresSalvos | null) ?? null,
  };
}

export async function salvarSetores(
  setores: SetorDiscutido[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await ensureColunasFase2();
    const { companyId } = await requireCompany();
    const salvo: SetoresSalvos = {
      setores,
      atualizadoEm: new Date().toISOString(),
    };
    await prisma.company.update({
      where: { id: companyId },
      data: { setoresDiscutidos: salvo },
    });
    revalidatePath("/dashboard/fase-2/setores");
    revalidatePath("/dashboard/fase-2");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro ao salvar" };
  }
}
