"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { computeDueDate } from "@/lib/dsr-helpers";

export type DsrInput = {
  id?: string;
  protocolNumber: string;
  origin: string;
  titularName: string;
  titularCategory: string;
  requestedRights: string[];
  detailedRequest?: string;
  receivedAt: string; // "YYYY-MM-DD"
  status?: string;
};

function parseReceived(d: string): Date {
  // fixa meio-dia local pra evitar deslocamento de fuso
  return new Date(`${d}T12:00:00`);
}

export async function salvarDsr(input: DsrInput): Promise<{ ok: true }> {
  await requireSession();
  if (!input.protocolNumber?.trim()) throw new Error("Informe o protocolo do pedido.");
  if (!input.titularName?.trim()) throw new Error("Informe o nome do titular.");
  if (!input.receivedAt) throw new Error("Informe a data de recebimento.");

  const receivedAt = parseReceived(input.receivedAt);
  const dueDate = computeDueDate(receivedAt);

  const dados = {
    protocolNumber: input.protocolNumber.trim(),
    origin: input.origin || "ouvidoria",
    titularName: input.titularName.trim(),
    titularCategory: input.titularCategory || "cidadao",
    requestedRights: input.requestedRights ?? [],
    detailedRequest: input.detailedRequest?.trim() || null,
    receivedAt,
    dueDate,
    status: input.status || "RECEBIDA",
  };

  if (input.id) {
    await prisma.dataSubjectRequest.update({ where: { id: input.id }, data: dados });
  } else {
    await prisma.dataSubjectRequest.create({ data: dados });
  }
  revalidatePath("/dashboard/execucao/dsr");
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}

/** Registra a resposta institucional ao titular e fecha o pedido. */
export async function responderDsr(input: {
  id: string;
  decision: string;
  responseText: string;
  responseActions?: string;
}): Promise<{ ok: true }> {
  const session = await requireSession();
  const autor = session.user?.name || session.user?.email || null;
  if (!input.responseText?.trim()) throw new Error("Descreva a resposta ao titular.");

  await prisma.dataSubjectRequest.update({
    where: { id: input.id },
    data: {
      decision: input.decision,
      responseText: input.responseText.trim(),
      responseActions: input.responseActions?.trim() || null,
      responseDate: new Date(),
      respondedBy: autor,
      status: input.decision === "INDEFERIDO" ? "INDEFERIDA" : "RESPONDIDA",
    },
  });
  revalidatePath("/dashboard/execucao/dsr");
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}

export async function mudarStatusDsr(id: string, status: string): Promise<{ ok: true }> {
  await requireSession();
  await prisma.dataSubjectRequest.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/execucao/dsr");
  return { ok: true };
}

export async function excluirDsr(id: string): Promise<{ ok: true }> {
  await requireSession();
  await prisma.dataSubjectRequest.delete({ where: { id } });
  revalidatePath("/dashboard/execucao/dsr");
  revalidatePath("/dashboard/indicadores");
  return { ok: true };
}
