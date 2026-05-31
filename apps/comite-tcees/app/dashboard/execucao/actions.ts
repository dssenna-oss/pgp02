"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type InstrumentoInput = {
  id?: string;
  nome: string;
  grupo: string;
  tipo?: string;
  baseLegal?: string;
  obrigatorio?: boolean;
  status: string;
  responsavel?: string;
  prazo?: string;
  conteudoUrl?: string;
  descricao?: string;
};

const GRUPOS = ["PUBLICO", "INTERNO", "OPERADORES_TITULAR"];
const STATUS = ["A_ELABORAR", "EM_ELABORACAO", "PENDENTE_APROVACAO", "APROVADO", "PUBLICADO"];

export async function salvarInstrumento(input: InstrumentoInput) {
  await requireSession();
  if (!input.nome?.trim()) throw new Error("O nome do instrumento é obrigatório.");

  const dados = {
    nome: input.nome.trim(),
    grupo: GRUPOS.includes(input.grupo) ? input.grupo : "INTERNO",
    tipo: input.tipo?.trim() || null,
    baseLegal: input.baseLegal?.trim() || null,
    obrigatorio: !!input.obrigatorio,
    status: STATUS.includes(input.status) ? input.status : "A_ELABORAR",
    responsavel: input.responsavel?.trim() || null,
    prazo: input.prazo ? new Date(`${input.prazo}T12:00:00`) : null,
    conteudoUrl: input.conteudoUrl?.trim() || null,
    descricao: input.descricao?.trim() || null,
  };

  if (input.id) {
    await prisma.instrumento.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.instrumento.aggregate({ _max: { ordem: true } });
    await prisma.instrumento.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }
  revalidatePath("/dashboard/execucao");
  return { ok: true };
}

export async function excluirInstrumento(id: string) {
  await requireSession();
  await prisma.instrumento.delete({ where: { id } });
  revalidatePath("/dashboard/execucao");
  return { ok: true };
}
