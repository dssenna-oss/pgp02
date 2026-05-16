"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { RIPD_SECOES } from "@/lib/ripd-secoes";

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
  const { companyId, session } = await requireCompany();
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
