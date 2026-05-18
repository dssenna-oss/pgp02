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
// 3 ações exclusivas pra DSRs disparados pelo facilitador. Cada uma grava
// gameAction (pra pontuação) + ajusta status/respostaTexto. Pontuação não
// é mostrada pro DPO durante o jogo (suspense pedagógico — só aparece
// no Painel do Facilitador e no Resumo Final).

// "Pedir confirmação de identidade" — manda o e-mail/resposta citando Art. 19
// LGPD. DSR fica EM_ANALISE aguardando o titular responder (no jogo, o
// titular nunca responde — propositalmente, porque é falso).
export async function pedirConfirmacaoIdentidade(input: {
  id: string;
  textoMensagem: string;
}) {
  const skip = await checkGapConcluido("FASE_6", "Pedir confirmação de identidade");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const dsr = await prisma.dsrRequest.findFirst({
    where: { id: input.id, companyId, disparoFacilitador: true },
    select: { id: true, gameAction: true },
  });
  if (!dsr) throw new Error("Solicitação não encontrada ou não é uma 'DSR surpresa'.");
  // 1ª ação trava a pontuação — não permite reverter pra ganhar +10 depois
  if (dsr.gameAction && dsr.gameAction !== "CONFIRMATION_REQUESTED") {
    throw new Error("Esta solicitação já teve uma ação registrada — não dá pra desfazer.");
  }
  await prisma.dsrRequest.update({
    where: { id: input.id },
    data: {
      gameAction: "CONFIRMATION_REQUESTED",
      status: "EM_ANALISE",
      respostaTexto: input.textoMensagem,
    },
  });
  revalidatePath("/dashboard/dsr");
  return { ok: true };
}

// "Responder direto" — atende o pedido SEM verificar identidade. Pontuação
// depende se já pediu confirmação antes ou não.
export async function responderDsrDireto(input: {
  id: string;
  textoResposta: string;
}) {
  const skip = await checkGapConcluido("FASE_6", "Responder DSR");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const dsr = await prisma.dsrRequest.findFirst({
    where: { id: input.id, companyId, disparoFacilitador: true },
    select: { id: true, gameAction: true },
  });
  if (!dsr) throw new Error("Solicitação não encontrada ou não é uma 'DSR surpresa'.");
  const novaAcao =
    dsr.gameAction === "CONFIRMATION_REQUESTED"
      ? "RESPONDED_AFTER_CONFIRMATION"
      : "RESPONDED_WITHOUT_CONFIRMATION";
  await prisma.dsrRequest.update({
    where: { id: input.id },
    data: {
      gameAction: novaAcao,
      status: "RESPONDIDA",
      respostaTexto: input.textoResposta,
      respondidoEm: new Date(),
    },
  });
  revalidatePath("/dashboard/dsr");
  return { ok: true };
}

// "Negar por falta de identificação" — recusa o pedido formalmente porque
// o solicitante não comprovou ser o titular.
export async function negarDsrPorFaltaId(input: {
  id: string;
  justificativa: string;
}) {
  const skip = await checkGapConcluido("FASE_6", "Negar DSR");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const dsr = await prisma.dsrRequest.findFirst({
    where: { id: input.id, companyId, disparoFacilitador: true },
    select: { id: true, gameAction: true },
  });
  if (!dsr) throw new Error("Solicitação não encontrada ou não é uma 'DSR surpresa'.");
  await prisma.dsrRequest.update({
    where: { id: input.id },
    data: {
      gameAction: "DENIED_NO_ID",
      status: "NEGADA",
      respostaTexto: input.justificativa,
      respondidoEm: new Date(),
    },
  });
  revalidatePath("/dashboard/dsr");
  return { ok: true };
}
