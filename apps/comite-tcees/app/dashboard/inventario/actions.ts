"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
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
  await requireEditor();
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
  await requireEditor();
  await prisma.dataInventory.delete({ where: { id } });
  revalidatePath("/dashboard/inventario");
  return { ok: true };
}

// --- Sugestões da Carta de Serviços → Inventário ---
export type SugestaoInput = {
  nome: string;
  finalidade?: string;
  baseLegal?: string;
  compartilhamento?: string;
  publicoAlvo?: string; // data_subjects juntados
  sourceUrl?: string;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/** Cria registros no Inventário a partir das sugestões selecionadas, pulando
 *  os que já existem (match por nome normalizado). Retorna quantos entraram. */
export async function adicionarSugestoes(sugestoes: SugestaoInput[]) {
  await requireEditor();
  if (!sugestoes?.length) return { ok: true, criados: 0 };

  const existentes = await prisma.dataInventory.findMany({ select: { nome: true } });
  const jaTem = new Set(existentes.map((e) => norm(e.nome)));

  const max = await prisma.dataInventory.aggregate({ _max: { ordem: true } });
  let ordem = (max._max.ordem ?? 0) + 1;

  const novos = sugestoes
    .filter((s) => s.nome?.trim() && !jaTem.has(norm(s.nome)))
    .map((s) => ({
      nome: s.nome.trim(),
      finalidade: s.finalidade?.trim() || null,
      baseLegal: s.baseLegal?.trim() || null,
      compartilhamento: s.compartilhamento?.trim() || null,
      observacoes:
        `Sugerido da Carta de Serviços via IA.` +
        (s.publicoAlvo ? ` Público-alvo: ${s.publicoAlvo}.` : "") +
        (s.sourceUrl ? ` Fonte: ${s.sourceUrl}` : ""),
      dadosSensiveis: false,
      prioritario: false,
      status: "PRELIMINAR",
      ordem: ordem++,
    }));

  if (novos.length) await prisma.dataInventory.createMany({ data: novos });

  revalidatePath("/dashboard/inventario");
  return { ok: true, criados: novos.length };
}
