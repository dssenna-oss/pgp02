"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { RIPD_SECOES } from "@/lib/ripd-secoes";
import { ensureGapConcluido } from "@/lib/phase-guard";

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
  await ensureGapConcluido("FASE_6", "Criar RIPD");
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
  await ensureGapConcluido("FASE_6", "Salvar secao do RIPD");
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
  await ensureGapConcluido("FASE_6", "Submeter RIPD");
  const { companyId, session } = await requireCompany();
  const ripd = await prisma.ripd.findFirst({ where: { id, companyId } });
  if (!ripd) throw new Error("RIPD não encontrado");
  if (ripd.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Apenas o criador do RIPD pode submetê-lo");
  }
  if (!["RASCUNHO", "DEVOLVIDO"].includes(ripd.status)) {
    throw new Error(`Não é possível submeter um RIPD com status ${ripd.status}`);
  }
  await prisma.ripd.update({
    where: { id },
    data: { status: "SUBMETIDO", submittedAt: new Date(), feedbackDpo: null },
  });
  revalidatePath("/dashboard/ripd");
}

export async function aprovarRipd(id: string) {
  await ensureGapConcluido("FASE_6", "Aprovar RIPD");
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
  await ensureGapConcluido("FASE_6", "Devolver RIPD");
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

export async function deletarRipd(id: string) {
  await ensureGapConcluido("FASE_6", "Deletar RIPD");
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
