"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type RiscoInput = {
  id?: string;
  inventoryId: string;
  descricao: string;
  probabilidade: number; // 1-3
  impacto: number; // 1-3
  recomendacao?: string;
  status: string;
};

const clamp = (n: number) => (n >= 1 && n <= 3 ? Math.round(n) : 2);
const STATUS_VALIDOS = ["ABERTO", "TRATADO", "ACEITO"];

export async function salvarRisco(input: RiscoInput) {
  await requireEditor();
  if (!input.inventoryId) throw new Error("Processo do Inventário não informado.");
  if (!input.descricao?.trim()) throw new Error("Descreva o risco/ameaça.");

  const dados = {
    inventoryId: input.inventoryId,
    descricao: input.descricao.trim(),
    probabilidade: clamp(input.probabilidade),
    impacto: clamp(input.impacto),
    recomendacao: input.recomendacao?.trim() || null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "ABERTO",
  };

  if (input.id) {
    await prisma.processRisk.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.processRisk.aggregate({ _max: { ordem: true } });
    await prisma.processRisk.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard/riscos");
  return { ok: true };
}

export async function excluirRisco(id: string) {
  await requireEditor();
  await prisma.processRisk.delete({ where: { id } });
  revalidatePath("/dashboard/riscos");
  return { ok: true };
}
