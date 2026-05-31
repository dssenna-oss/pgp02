"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type IndicadorInput = {
  id?: string;
  codigo: string;
  eixoCodigo: string;
  descricao: string;
  tipo: string;
  unidade?: string;
  meta2026?: string;
  meta2027?: string;
  valorAtual?: string;
  status: string;
};

const STATUS_VALIDOS = ["CONCLUIDO", "EM_ANDAMENTO", "EM_RISCO", "ATRASADO", "A_INICIAR"];

export async function salvarIndicador(input: IndicadorInput) {
  await requireSession();
  if (!input.codigo?.trim()) throw new Error("O código é obrigatório.");
  if (!input.descricao?.trim()) throw new Error("A descrição é obrigatória.");

  const dados = {
    codigo: input.codigo.trim().toUpperCase(),
    eixoCodigo: input.eixoCodigo,
    descricao: input.descricao.trim(),
    tipo: input.tipo?.trim() || "Resultado",
    unidade: input.unidade?.trim() || null,
    meta2026: input.meta2026?.trim() || null,
    meta2027: input.meta2027?.trim() || null,
    valorAtual: input.valorAtual?.trim() || null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "A_INICIAR",
  };

  try {
    if (input.id) {
      await prisma.indicador.update({ where: { id: input.id }, data: dados });
    } else {
      const max = await prisma.indicador.aggregate({ _max: { ordem: true } });
      await prisma.indicador.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
    }
  } catch (e: any) {
    if (e?.code === "P2002") throw new Error(`Já existe um indicador com o código "${dados.codigo}".`);
    throw e;
  }

  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}

export async function excluirIndicador(id: string) {
  await requireSession();
  await prisma.indicador.delete({ where: { id } });
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}
