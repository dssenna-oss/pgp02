"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { ensureColunaDpoJustificativa } from "@/lib/coluna-dpo-justificativa";
import { ensureColunasEncarregado } from "@/lib/colunas-encarregado";
import { revalidatePath } from "next/cache";

// ADMIN sem companyId recebe null — página renderiza formulário vazio +
// banner de preview explica. Não crasha.
export async function getEncarregado() {
  await ensureColunaDpoJustificativa();
  await ensureColunasEncarregado();
  const session = await requireSession();
  const companyId = session.user.companyId;
  if (!companyId) return null;
  return prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      cnpj: true,
      orgao: true,
      cidade: true,
      dpoName: true,
      dpoEmail: true,
      dpoTelefone: true,
      dpoEndereco: true,
      dpoJustificativaEscolha: true,
      dpoSubstitutoNome: true,
      dpoSubstitutoEmail: true,
      dpoSubstitutoTelefone: true,
    },
  });
}

export async function saveEncarregado(input: {
  dpoName?: string;
  dpoEmail?: string;
  dpoTelefone?: string;
  dpoEndereco?: string;
  dpoJustificativaEscolha?: string;
  dpoSubstitutoNome?: string;
  dpoSubstitutoEmail?: string;
  dpoSubstitutoTelefone?: string;
}): Promise<{ ok: true } | { ok: false; motivo: "preview" }> {
  await ensureColunaDpoJustificativa();
  await ensureColunasEncarregado();
  const session = await requireSession();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO ou facilitador pode editar a identidade do Encarregado");
  }
  // Facilitador (ADMIN) em modo visualização: está sem grupo (companyId), logo
  // não há empresa pra salvar. Em vez de crashar (requireCompany lançava erro
  // genérico de produção), devolve um sinal pro form mostrar aviso amigável.
  if (!session.user.companyId) {
    return { ok: false, motivo: "preview" };
  }
  const companyId = session.user.companyId;

  await prisma.company.update({
    where: { id: companyId },
    data: {
      dpoName: input.dpoName?.trim() || null,
      dpoEmail: input.dpoEmail?.trim() || null,
      dpoTelefone: input.dpoTelefone?.trim() || null,
      dpoEndereco: input.dpoEndereco?.trim() || null,
      dpoJustificativaEscolha: input.dpoJustificativaEscolha?.trim() || null,
      dpoSubstitutoNome: input.dpoSubstitutoNome?.trim() || null,
      dpoSubstitutoEmail: input.dpoSubstitutoEmail?.trim() || null,
      dpoSubstitutoTelefone: input.dpoSubstitutoTelefone?.trim() || null,
    },
  });
  revalidatePath("/dashboard/encarregado");
  revalidatePath("/dashboard/fase-1");
  revalidatePath("/dashboard/ripd");
  revalidatePath("/dashboard/aviso");
  return { ok: true };
}

