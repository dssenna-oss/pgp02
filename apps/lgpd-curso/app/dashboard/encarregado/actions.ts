"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requireSession } from "@/lib/auth-server";
import { ensureColunaDpoJustificativa } from "@/lib/coluna-dpo-justificativa";
import { revalidatePath } from "next/cache";

export async function getEncarregado() {
  await ensureColunaDpoJustificativa();
  const { companyId } = await requireCompany();
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
}) {
  await ensureColunaDpoJustificativa();
  const session = await requireSession();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO ou facilitador pode editar a identidade do Encarregado");
  }
  const { companyId } = await requireCompany();

  const result = await prisma.company.update({
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
  return result;
}

