"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { RIPD_SECOES } from "@/lib/ripd-secoes";
import { checkGapConcluido } from "@/lib/phase-guard";
import { sugerirSecaoRipd, type SecaoSugerivel } from "@/lib/ripd-sugestoes";

// Inventários aprovados que ainda NÃO têm RIPD criado — pra preencher o
// dropdown de "Novo RIPD" na tela.
export async function listInventariosAprovadosSemRipd() {
  const { companyId } = await requireCompany();
  const [aprovados, ripdsExistentes] = await Promise.all([
    prisma.dataInventory.findMany({
      where: { companyId, status: "APROVADO" },
      select: { id: true, nome: true, setor: true, dadosSensiveis: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ripd.findMany({
      where: { companyId, inventoryRef: { not: null } },
      select: { inventoryRef: true },
    }),
  ]);
  const jaTemRipd = new Set(ripdsExistentes.map((r) => r.inventoryRef));
  return aprovados.filter((i) => !jaTemRipd.has(i.id));
}

// Quantos riscos a Company já registrou — pré-requisito do RIPD (Art. 38 LGPD)
export async function contarRiscos() {
  const { companyId } = await requireCompany();
  return prisma.processRisk.count({ where: { companyId } });
}

// Quantos inventários APROVADOS — pré-requisito do RIPD (Art. 38 LGPD)
export async function contarInventariosAprovados() {
  const { companyId } = await requireCompany();
  return prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } });
}

export async function listRipds() {
  const { companyId } = await requireCompany();
  const ripds = await prisma.ripd.findMany({
    where: { companyId },
    include: { sections: { orderBy: { numero: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  const userIds = Array.from(new Set([
    ...ripds.map((r) => r.createdById).filter(Boolean),
    ...ripds.map((r) => r.reviewedById).filter(Boolean),
  ])) as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, papel: true } })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  return ripds.map((r) => ({
    ...r,
    creator: r.createdById ? userMap[r.createdById] : null,
    reviewer: r.reviewedById ? userMap[r.reviewedById] : null,
  }));
}

export async function createRipd(input: { titulo: string; inventoryRef?: string }) {
  const skip = await checkGapConcluido("FASE_6", "Criar RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();

  // Pré-requisitos legais — Art. 38 LGPD exige descrição dos dados (M1)
  // e análise dos riscos (M2). RIPD sem isso nasce vazio por definição.
  const [aprovados, riscos] = await Promise.all([
    prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } }),
    prisma.processRisk.count({ where: { companyId } }),
  ]);
  if (aprovados === 0) {
    throw new Error(
      "Pré-requisito legal: tenha ao menos 1 processo APROVADO no Inventário antes de criar RIPD. Art. 38, parágrafo único LGPD exige descrição dos tipos de dados coletados."
    );
  }
  if (riscos === 0) {
    throw new Error(
      "Pré-requisito legal: identifique ao menos 1 risco antes de criar RIPD. Art. 38, parágrafo único LGPD exige análise das medidas de mitigação de risco — não dá pra mitigar o que não foi mapeado."
    );
  }
  if (!input.inventoryRef) {
    throw new Error(
      "RIPD precisa estar vinculado a um processo do Inventário. Escolha um na lista do dropdown."
    );
  }

  const ripd = await prisma.ripd.create({
    data: {
      companyId,
      titulo: input.titulo,
      inventoryRef: input.inventoryRef || null,
      createdById: session.user.id,
      sections: {
        create: RIPD_SECOES.map((s) => ({ numero: s.numero, titulo: s.titulo, conteudo: "" })),
      },
    },
    include: { sections: { orderBy: { numero: "asc" } } },
  });
  revalidatePath("/dashboard/ripd");
  return ripd;
}

export async function saveSecao(ripdId: string, numero: number, conteudo: string) {
  const skip = await checkGapConcluido("FASE_6", "Salvar secao do RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();
  const ripd = await prisma.ripd.findFirst({ where: { id: ripdId, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.status === "APROVADO") throw new Error("RIPD aprovado não pode mais ser editado");
  const canEdit =
    ripd.createdById === session.user.id ||
    session.user.role === "DPO" ||
    session.user.role === "ADMIN";
  if (!canEdit) throw new Error("Apenas o criador, o DPO ou o facilitador podem editar");

  // Se estava DEVOLVIDO e o criador editou, volta pra RASCUNHO
  const novoStatus = ripd.status === "DEVOLVIDO" ? "RASCUNHO" : ripd.status;

  await prisma.ripdSection.updateMany({
    where: { ripdId, numero },
    data: { conteudo },
  });
  if (novoStatus !== ripd.status) {
    await prisma.ripd.update({ where: { id: ripdId }, data: { status: novoStatus } });
  }
  revalidatePath("/dashboard/ripd");
}

export async function submeterRipd(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Submeter RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();
  const ripd = await prisma.ripd.findFirst({
    where: { id, companyId },
    include: { sections: { select: { conteudo: true } } },
  });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Apenas o criador do RIPD pode submetê-lo");
  }
  if (!["RASCUNHO", "DEVOLVIDO"].includes(ripd.status)) {
    throw new Error(`Não é possível submeter um RIPD com status ${ripd.status}`);
  }
  const preenchidas = ripd.sections.filter((s) => (s.conteudo || "").trim().length > 0).length;
  if (preenchidas === 0) {
    throw new Error("RIPD vazio (0/8 seções) não pode ser submetido. Preencha pelo menos 1 seção.");
  }
  await prisma.ripd.update({
    where: { id },
    data: { status: "SUBMETIDO", submittedAt: new Date(), feedbackDpo: null },
  });
  revalidatePath("/dashboard/ripd");
}

export async function aprovarRipd(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Aprovar RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode aprovar RIPDs");
  }
  const ripd = await prisma.ripd.findFirst({ where: { id, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.status !== "SUBMETIDO") throw new Error("Só é possível aprovar RIPDs submetidos");
  await prisma.ripd.update({
    where: { id },
    data: { status: "APROVADO", reviewedById: session.user.id, reviewedAt: new Date(), feedbackDpo: null },
  });
  revalidatePath("/dashboard/ripd");
}

export async function devolverRipd(id: string, motivo: string) {
  const skip = await checkGapConcluido("FASE_6", "Devolver RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode devolver RIPDs");
  }
  if (!motivo || motivo.trim().length < 5) {
    throw new Error("Informe o motivo da devolução (mínimo 5 caracteres)");
  }
  const ripd = await prisma.ripd.findFirst({ where: { id, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.status !== "SUBMETIDO") throw new Error("Só é possível devolver RIPDs submetidos");
  await prisma.ripd.update({
    where: { id },
    data: { status: "DEVOLVIDO", reviewedById: session.user.id, reviewedAt: new Date(), feedbackDpo: motivo.trim() },
  });
  revalidatePath("/dashboard/ripd");
}

/**
 * Quando o próprio DPO eh o dono do RIPD, "submeter pra si mesmo" eh estranho.
 * Esta action pula direto do RASCUNHO/DEVOLVIDO pra APROVADO sem passar por
 * SUBMETIDO. Mantém auditoria preenchendo createdById, reviewedById e datas.
 * Bloqueia aprovação com ZERO seções preenchidas (validação server-side).
 */
export async function aprovarRipdDireto(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Aprovar RIPD direto");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();

  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode aprovar diretamente");
  }
  const ripd = await prisma.ripd.findFirst({
    where: { id, companyId },
    include: { sections: { select: { conteudo: true } } },
  });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.createdById !== session.user.id) {
    throw new Error("Aprovação direta só pelo próprio criador (use 'Submeter ao DPO' caso contrário)");
  }
  if (!["RASCUNHO", "DEVOLVIDO"].includes(ripd.status)) {
    throw new Error(`RIPD com status ${ripd.status} não pode ser aprovado diretamente`);
  }
  const preenchidas = ripd.sections.filter((s) => (s.conteudo || "").trim().length > 0).length;
  if (preenchidas === 0) {
    throw new Error("RIPD vazio (0/8 seções) não pode ser aprovado. Preencha pelo menos 1 seção.");
  }
  const agora = new Date();
  await prisma.ripd.update({
    where: { id },
    data: {
      status: "APROVADO",
      reviewedById: session.user.id,
      reviewedAt: agora,
      submittedAt: ripd.submittedAt || agora,
      feedbackDpo: null,
    },
  });
  revalidatePath("/dashboard/ripd");
}

/**
 * Reabre um RIPD aprovado pra correção. Só DPO/admin pode. Muda APROVADO ->
 * RASCUNHO mantendo histórico de createdById/createdAt mas limpando reviewedAt.
 */
export async function reabrirRipd(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Reabrir RIPD aprovado");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();

  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode reabrir um RIPD aprovado");
  }
  const ripd = await prisma.ripd.findFirst({ where: { id, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.status !== "APROVADO") {
    throw new Error(`Só RIPD APROVADO pode ser reaberto (atual: ${ripd.status})`);
  }
  await prisma.ripd.update({
    where: { id },
    data: {
      status: "RASCUNHO",
      reviewedAt: null,
      reviewedById: null,
      feedbackDpo: "Reaberto pelo DPO pra correção/complemento.",
    },
  });
  revalidatePath("/dashboard/ripd");
}

/** Gera sugestão de conteúdo pra uma seção do RIPD a partir dos dados já
 *  registrados (Inventário, Riscos, Encarregado). Retorna { texto } ou
 *  PhaseSkipResult — não salva no banco. DPO revisa e edita antes de salvar. */
export async function sugerirSecao(ripdId: string, numero: SecaoSugerivel) {
  const skip = await checkGapConcluido("FASE_6", "Sugerir secao do RIPD");
  if (skip) return skip;
  const texto = await sugerirSecaoRipd(ripdId, numero);
  return { texto };
}

export async function deletarRipd(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Deletar RIPD");
  if (skip) return skip;
  const { companyId, session } = await requireCompany();
  const ripd = await prisma.ripd.findFirst({ where: { id, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Apenas o criador pode remover");
  }
  if (ripd.status === "APROVADO") {
    throw new Error("RIPD aprovado não pode ser removido");
  }
  await prisma.ripd.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/ripd");
}
