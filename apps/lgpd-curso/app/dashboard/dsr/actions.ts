"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";

export async function listDsr() {
  const { companyId } = await requireCompany();
  return prisma.dsrRequest.findMany({
    where: { companyId },
    orderBy: [{ disparoFacilitador: "desc" }, { createdAt: "desc" }],
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
  const skip = await checkGapConcluido("FASE_6", input.id ? "Editar DSR" : "Criar DSR");
  if (skip) return skip;
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
  const skip = await checkGapConcluido("FASE_6", "Deletar DSR");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  await prisma.dsrRequest.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/dsr");
}

// === DSR Surpresa (Missão 4a) ===
// Action genérica: o DPO escolhe entre 3 caminhos neutros (Responder /
// Postergar / Outros). Cada caminho grava o gameAction correspondente +
// ajusta status. O texto opcional vai pra respostaTexto (no caso de OTHER,
// é o texto livre do DPO descrevendo o que decidiu fazer).
//
// Pontuação NÃO é mostrada ao DPO. Aparece só no Painel do Facilitador.
export async function registrarAcaoDsr(input: {
  id: string;
  acao: "RESPONDED" | "POSTPONED" | "OTHER";
  texto?: string;
}) {
  const skip = await checkGapConcluido("FASE_6", "Registrar ação DSR");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const dsr = await prisma.dsrRequest.findFirst({
    where: { id: input.id, companyId, disparoFacilitador: true },
    select: { id: true },
  });
  if (!dsr) throw new Error("Solicitação não encontrada ou não é uma 'DSR surpresa'.");

  // Map ação → status interno e texto a gravar
  const data: any = { gameAction: input.acao };
  if (input.acao === "RESPONDED") {
    data.status = "RESPONDIDA";
    data.respostaTexto = input.texto || null;
    data.respondidoEm = new Date();
  } else if (input.acao === "POSTPONED") {
    data.status = "EM_ANALISE";
    data.respostaTexto = input.texto || null;
  } else if (input.acao === "OTHER") {
    data.status = "EM_ANALISE";
    data.respostaTexto = input.texto || null;
  }

  await prisma.dsrRequest.update({
    where: { id: input.id },
    data,
  });
  revalidatePath("/dashboard/dsr");
  return { ok: true };
}
