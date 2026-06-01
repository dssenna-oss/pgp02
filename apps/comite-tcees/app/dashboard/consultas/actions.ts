"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type ConsultaInput = {
  id?: string;
  titulo: string;
  area?: string;
  descricao?: string;
  parecerCju?: string;
  status: string;
  abertaEm?: string; // YYYY-MM-DD
  respondidaEm?: string;
};

const STATUS_VALIDOS = ["RESPONDIDA", "EM_ANALISE", "PENDENCIA"];

function parseDate(v?: string): Date | null {
  return v ? new Date(`${v}T12:00:00`) : null;
}

export async function salvarConsulta(input: ConsultaInput) {
  await requireEditor();
  if (!input.titulo?.trim()) throw new Error("O título é obrigatório.");

  const dados = {
    titulo: input.titulo.trim(),
    area: input.area?.trim() || null,
    descricao: input.descricao?.trim() || null,
    parecerCju: input.parecerCju?.trim() || null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "EM_ANALISE",
    abertaEm: parseDate(input.abertaEm),
    respondidaEm: parseDate(input.respondidaEm),
  };

  if (input.id) {
    await prisma.consultaPrevia.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.consultaPrevia.aggregate({ _max: { ordem: true } });
    await prisma.consultaPrevia.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard/consultas");
  return { ok: true };
}

export async function excluirConsulta(id: string) {
  await requireEditor();
  await prisma.consultaPrevia.delete({ where: { id } });
  revalidatePath("/dashboard/consultas");
  return { ok: true };
}
