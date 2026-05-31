"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type InventarioInput = {
  id?: string;
  nome: string;
  unidadeGestora?: string;
  hipoteseMacro?: string;
  finalidade?: string;
  baseLegal?: string;
  tiposDados?: string;
  dadosSensiveis?: boolean;
  retencao?: string;
  compartilhamento?: string;
  medidasSeguranca?: string;
  prioritario?: boolean;
  status: string;
  observacoes?: string;
};

const STATUS_VALIDOS = ["PRELIMINAR", "EM_REVISAO", "CONCLUIDO"];

export async function salvarInventario(input: InventarioInput) {
  await requireSession();
  if (!input.nome?.trim()) throw new Error("O nome do processo é obrigatório.");

  const dados = {
    nome: input.nome.trim(),
    unidadeGestora: input.unidadeGestora?.trim() || null,
    hipoteseMacro: input.hipoteseMacro?.trim() || null,
    finalidade: input.finalidade?.trim() || null,
    baseLegal: input.baseLegal?.trim() || null,
    tiposDados: input.tiposDados?.trim() || null,
    dadosSensiveis: !!input.dadosSensiveis,
    retencao: input.retencao?.trim() || null,
    compartilhamento: input.compartilhamento?.trim() || null,
    medidasSeguranca: input.medidasSeguranca?.trim() || null,
    prioritario: !!input.prioritario,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "PRELIMINAR",
    observacoes: input.observacoes?.trim() || null,
  };

  if (input.id) {
    await prisma.dataInventory.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.dataInventory.aggregate({ _max: { ordem: true } });
    await prisma.dataInventory.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard/inventario");
  return { ok: true };
}

export async function excluirInventario(id: string) {
  await requireSession();
  await prisma.dataInventory.delete({ where: { id } });
  revalidatePath("/dashboard/inventario");
  return { ok: true };
}
