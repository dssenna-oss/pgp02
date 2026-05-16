"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany, requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function listInventario() {
  const { companyId } = await requireCompany();
  return prisma.dataInventory.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
}

export async function listInventarioWithUsers() {
  const { companyId } = await requireCompany();
  const items = await prisma.dataInventory.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
  });
  // Buscar nome dos donos / revisores
  const userIds = Array.from(new Set([
    ...items.map((i) => i.createdById).filter(Boolean),
    ...items.map((i) => i.reviewedById).filter(Boolean),
  ])) as string[];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, papel: true } })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  return items.map((i) => ({
    ...i,
    creator: i.createdById ? userMap[i.createdById] : null,
    reviewer: i.reviewedById ? userMap[i.reviewedById] : null,
  }));
}

export async function getInventario(id: string) {
  const { companyId } = await requireCompany();
  return prisma.dataInventory.findFirst({ where: { id, companyId } });
}

export async function saveInventario(input: {
  id?: string;
  nome: string;
  setor?: string;
  finalidade?: string;
  baseLegal?: string;
  tiposDados?: string;
  dadosSensiveis?: boolean;
  retencao?: string;
  compartilhamento?: string;
  medidasSeguranca?: string;
}) {
  const { companyId, session } = await requireCompany();

  // Se for edição, valida permissão: criador, DPO ou ADMIN podem editar
  if (input.id) {
    const existing = await prisma.dataInventory.findFirst({ where: { id: input.id, companyId } });
    if (!existing) throw new Error("Processo não encontrado");
    const canEdit =
      existing.createdById === session.user.id ||
      session.user.role === "DPO" ||
      session.user.role === "ADMIN";
    if (!canEdit) throw new Error("Apenas o dono do processo, o DPO ou o facilitador podem editar");
    // Se estava DEVOLVIDO e o criador editou, volta pra RASCUNHO automaticamente
    const novoStatus = existing.status === "DEVOLVIDO" ? "RASCUNHO" : existing.status;
    const result = await prisma.dataInventory.update({
      where: { id: input.id },
      data: {
        nome: input.nome,
        setor: input.setor || null,
        finalidade: input.finalidade || null,
        baseLegal: input.baseLegal || null,
        tiposDados: input.tiposDados || null,
        dadosSensiveis: !!input.dadosSensiveis,
        retencao: input.retencao || null,
        compartilhamento: input.compartilhamento || null,
        medidasSeguranca: input.medidasSeguranca || null,
        status: novoStatus,
      },
    });
    revalidatePath("/dashboard/inventario");
    return result;
  }

  // Criação
  const result = await prisma.dataInventory.create({
    data: {
      companyId,
      nome: input.nome,
      setor: input.setor || null,
      finalidade: input.finalidade || null,
      baseLegal: input.baseLegal || null,
      tiposDados: input.tiposDados || null,
      dadosSensiveis: !!input.dadosSensiveis,
      retencao: input.retencao || null,
      compartilhamento: input.compartilhamento || null,
      medidasSeguranca: input.medidasSeguranca || null,
      status: "RASCUNHO",
      createdById: session.user.id,
    },
  });
  revalidatePath("/dashboard/inventario");
  return result;
}

// Contribuidor: submete ao DPO
export async function submeterInventario(id: string) {
  const { companyId, session } = await requireCompany();
  const inv = await prisma.dataInventory.findFirst({ where: { id, companyId } });
  if (!inv) throw new Error("Processo não encontrado");

  const canSubmit = inv.createdById === session.user.id || session.user.role === "ADMIN";
  if (!canSubmit) throw new Error("Apenas o dono do processo pode submeter ao DPO");

  if (!["RASCUNHO", "DEVOLVIDO"].includes(inv.status)) {
    throw new Error(`Não é possível submeter um processo com status ${inv.status}`);
  }

  await prisma.dataInventory.update({
    where: { id },
    data: { status: "SUBMETIDO", submittedAt: new Date(), feedbackDpo: null },
  });
  revalidatePath("/dashboard/inventario");
}

// DPO: aprova
export async function aprovarInventario(id: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode aprovar processos");
  }
  const inv = await prisma.dataInventory.findFirst({ where: { id, companyId } });
  if (!inv) throw new Error("Processo não encontrado");
  if (inv.status !== "SUBMETIDO") {
    throw new Error("Só é possível aprovar processos submetidos ao DPO");
  }
  await prisma.dataInventory.update({
    where: { id },
    data: { status: "APROVADO", reviewedById: session.user.id, reviewedAt: new Date(), feedbackDpo: null },
  });
  revalidatePath("/dashboard/inventario");
}

// DPO: devolve com motivo
export async function devolverInventario(id: string, motivo: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode devolver processos");
  }
  if (!motivo || motivo.trim().length < 5) {
    throw new Error("Informe o motivo da devolução (mínimo 5 caracteres)");
  }
  const inv = await prisma.dataInventory.findFirst({ where: { id, companyId } });
  if (!inv) throw new Error("Processo não encontrado");
  if (inv.status !== "SUBMETIDO") {
    throw new Error("Só é possível devolver processos submetidos ao DPO");
  }
  await prisma.dataInventory.update({
    where: { id },
    data: { status: "DEVOLVIDO", reviewedById: session.user.id, reviewedAt: new Date(), feedbackDpo: motivo.trim() },
  });
  revalidatePath("/dashboard/inventario");
}

export async function deletarInventario(id: string) {
  const { companyId, session } = await requireCompany();
  const inv = await prisma.dataInventory.findFirst({ where: { id, companyId } });
  if (!inv) throw new Error("Processo não encontrado");
  if (inv.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Apenas o dono do processo pode removê-lo");
  }
  if (inv.status === "APROVADO") {
    throw new Error("Não é possível remover um processo já aprovado pelo DPO");
  }
  await prisma.dataInventory.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/inventario");
}
