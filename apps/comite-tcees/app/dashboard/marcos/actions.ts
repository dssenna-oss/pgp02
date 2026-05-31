"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type MarcoInput = {
  id?: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  eixoCodigos: string; // "A" ou "A,B,C"
  tipo: string; // NORMAL | MAE
  status: string;
};

const STATUS_VALIDOS = ["A_INICIAR", "EM_ANDAMENTO", "CONCLUIDO", "CRITICO"];

export async function salvarMarco(input: MarcoInput) {
  await requireSession();
  if (!input.data) throw new Error("A data é obrigatória.");
  if (!input.descricao?.trim()) throw new Error("A descrição é obrigatória.");

  const dados = {
    data: new Date(`${input.data}T12:00:00`),
    descricao: input.descricao.trim(),
    eixoCodigos: (input.eixoCodigos || "").replace(/\s/g, "").toUpperCase() || "A",
    tipo: input.tipo === "MAE" ? "MAE" : "NORMAL",
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "A_INICIAR",
  };

  if (input.id) {
    await prisma.marco.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.marco.aggregate({ _max: { ordem: true } });
    await prisma.marco.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

export async function excluirMarco(id: string) {
  await requireSession();
  await prisma.marco.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
