"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type MembroInput = {
  id?: string;
  nome: string;
  funcao: string;
  cargo?: string;
  unidade?: string;
  matricula?: string;
  inciso?: string;
  email?: string;
};

export async function salvarMembro(input: MembroInput) {
  await requireSession();
  if (!input.nome?.trim()) throw new Error("O nome é obrigatório.");
  if (!input.funcao?.trim()) throw new Error("A função é obrigatória.");

  const dados = {
    nome: input.nome.trim(),
    funcao: input.funcao.trim(),
    cargo: input.cargo?.trim() || null,
    unidade: input.unidade?.trim() || null,
    matricula: input.matricula?.trim() || null,
    inciso: input.inciso?.trim() || null,
    email: input.email?.trim() || null,
  };

  if (input.id) {
    await prisma.membro.update({ where: { id: input.id }, data: dados });
  } else {
    // novo membro entra no fim da lista
    const max = await prisma.membro.aggregate({ _max: { ordem: true } });
    await prisma.membro.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard/membros");
  return { ok: true };
}

export async function excluirMembro(id: string) {
  await requireSession();
  await prisma.membro.delete({ where: { id } });
  revalidatePath("/dashboard/membros");
  return { ok: true };
}
