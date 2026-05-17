"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { ensureGapConcluido } from "@/lib/phase-guard";

export async function listDsr() {
  const { companyId } = await requireCompany();
  return prisma.dsrRequest.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveDsr(input: {
  id?: string;
  titularNome: string;
  titularContato: string;
  tipoSolicitacao: string;
  descricao?: string;
  respostaTexto?: string;
  status?: string;
}) {
  await ensureGapConcluido("FASE_6", input.id ? "Editar DSR" : "Criar DSR");
  const { companyId } = await requireCompany();
  const data = {
    companyId,
    titularNome: input.titularNome,
    titularContato: input.titularContato,
    tipoSolicitacao: input.tipoSolicitacao,
    descricao: input.descricao || null,
    respostaTexto: input.respostaTexto || null,
    status: input.status || "ABERTA",
    respondidoEm: input.respostaTexto ? new Date() : null,
  };
  let result;
  if (input.id) {
    result = await prisma.dsrRequest.update({ where: { id: input.id }, data: { ...data, companyId: undefined } });
  } else {
    result = await prisma.dsrRequest.create({ data });
  }
  revalidatePath("/dashboard/dsr");
  return result;
}

export async function deletarDsr(id: string) {
  await ensureGapConcluido("FASE_6", "Deletar DSR");
  const { companyId } = await requireCompany();
  await prisma.dsrRequest.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/dsr");
}
