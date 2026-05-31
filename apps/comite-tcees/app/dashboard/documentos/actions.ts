"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type DocumentoInput = {
  id?: string;
  nome: string;
  tipo?: string;
  versao?: string;
  status: string;
  atualizadoEm?: string;
  arquivoUrl?: string;
};

const STATUS_VALIDOS = ["A_ELABORAR", "ELABORADO", "PENDENTE_APROVACAO", "HOMOLOGADO", "REGISTRADA"];

export async function salvarDocumento(input: DocumentoInput) {
  await requireSession();
  if (!input.nome?.trim()) throw new Error("O nome do documento é obrigatório.");

  const dados = {
    nome: input.nome.trim(),
    tipo: input.tipo?.trim() || null,
    versao: input.versao?.trim() || null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "A_ELABORAR",
    atualizadoEm: input.atualizadoEm?.trim() || null,
    arquivoUrl: input.arquivoUrl?.trim() || null,
  };

  if (input.id) {
    await prisma.documento.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.documento.aggregate({ _max: { ordem: true } });
    await prisma.documento.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  revalidatePath("/dashboard/documentos");
  return { ok: true };
}

export async function excluirDocumento(id: string) {
  await requireSession();
  await prisma.documento.delete({ where: { id } });
  revalidatePath("/dashboard/documentos");
  return { ok: true };
}
