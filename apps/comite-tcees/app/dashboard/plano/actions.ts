"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export type EntregaInput = {
  id?: string;
  titulo: string;
  descricao?: string;
  eixoCodigo: string;
  trimestre: string;
  responsavel?: string;
  prazoTexto?: string;
  prazoData?: string; // "YYYY-MM-DD" ou ""
  status: string;
};

const STATUS_VALIDOS = ["A_INICIAR", "EM_ANDAMENTO", "CONCLUIDO", "ATRASADO"];

export async function salvarEntrega(input: EntregaInput) {
  await requireSession();
  if (!input.titulo?.trim()) throw new Error("O título é obrigatório.");
  if (!input.eixoCodigo) throw new Error("O eixo é obrigatório.");
  if (!input.trimestre) throw new Error("O trimestre é obrigatório.");

  const dados = {
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    eixoCodigo: input.eixoCodigo,
    trimestre: input.trimestre,
    responsavel: input.responsavel?.trim() || null,
    prazoTexto: input.prazoTexto?.trim() || null,
    prazoData: input.prazoData ? new Date(`${input.prazoData}T12:00:00`) : null,
    status: STATUS_VALIDOS.includes(input.status) ? input.status : "A_INICIAR",
  };

  if (input.id) {
    await prisma.entrega.update({ where: { id: input.id }, data: dados });
  } else {
    const max = await prisma.entrega.aggregate({ _max: { ordem: true } });
    await prisma.entrega.create({ data: { ...dados, ordem: (max._max.ordem ?? 0) + 1 } });
  }

  // A Visão geral (% execução, progresso por eixo) e o Calendário derivam destas.
  revalidatePath("/dashboard/plano");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

export async function excluirEntrega(id: string) {
  await requireSession();
  await prisma.entrega.delete({ where: { id } });
  revalidatePath("/dashboard/plano");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
