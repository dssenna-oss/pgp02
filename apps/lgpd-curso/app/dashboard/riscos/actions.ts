"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function listRiscos() {
  const { companyId } = await requireCompany();
  return prisma.processRisk.findMany({
    where: { companyId },
    include: { inventory: { select: { id: true, nome: true, createdById: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// Lista inventários do grupo, MAS filtra por papel:
//   - DPO / ADMIN  → vê todos (precisa enxergar tudo pra aprovar/coordenar)
//   - Contribuidor → vê SÓ os processos onde é createdById (dono do processo)
export async function listInventoriesForSelect() {
  const { companyId, session } = await requireCompany();
  const role = session.user.role;
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";
  return prisma.dataInventory.findMany({
    where: {
      companyId,
      ...(isDpoOuAdmin ? {} : { createdById: session.user.id }),
    },
    select: { id: true, nome: true, setor: true, status: true, dadosSensiveis: true, createdById: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveRisco(input: {
  id?: string;
  inventoryId?: string;
  riscoTitulo: string;
  descricao?: string;
  categoria?: string;
  probabilidade: "BAIXA" | "MEDIA" | "ALTA";
  impacto: "BAIXO" | "MEDIO" | "ALTO";
  mitigationPlan?: string;
}) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  // Segregação: Contribuidor só pode criar/editar risco em processo que ELE é dono.
  if (input.inventoryId && !isDpoOuAdmin) {
    const inv = await prisma.dataInventory.findFirst({
      where: { id: input.inventoryId, companyId },
      select: { createdById: true },
    });
    if (!inv) throw new Error("Processo não encontrado");
    if (inv.createdById !== session.user.id) {
      throw new Error("Você só pode adicionar risco em processo que você é dono. Peça ao DPO se quiser registrar risco em processo de outro setor.");
    }
  }

  let statusNovo: string | undefined; // pra possível reset em edição
  if (input.id && !isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id: input.id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    if (existente.inventory && existente.inventory.createdById !== session.user.id) {
      throw new Error("Você só pode editar riscos dos seus processos. Peça ao DPO se for de outro setor.");
    }
    // Se Contribuidor edita um risco DEVOLVIDO, volta pra RASCUNHO automaticamente
    if (existente.status === "DEVOLVIDO") statusNovo = "RASCUNHO";
  }

  const sevP = input.probabilidade.charAt(0);
  const sevI = input.impacto.charAt(0);
  const sevS = computeSeverity(input.probabilidade, input.impacto);
  const severityLevel = `P:${sevP};I:${sevI};S:${sevS}`;

  const data: any = {
    companyId,
    inventoryId: input.inventoryId || null,
    riscoTitulo: input.riscoTitulo,
    descricao: input.descricao || null,
    categoria: input.categoria || null,
    severityLevel,
    mitigationPlan: input.mitigationPlan || null,
  };
  if (statusNovo) data.status = statusNovo;

  let result;
  if (input.id) {
    result = await prisma.processRisk.update({
      where: { id: input.id },
      data: { ...data, companyId: undefined },
    });
  } else {
    // Novo risco: stamp createdById + status RASCUNHO
    result = await prisma.processRisk.create({
      data: {
        ...data,
        createdById: session.user.id,
        status: "RASCUNHO",
      },
    });
  }

  revalidatePath("/dashboard/riscos");
  return result;
}

function computeSeverity(p: string, i: string): "BAIXO" | "MEDIO" | "ALTO" {
  const map: Record<string, number> = { BAIXA: 1, MEDIA: 2, ALTA: 3, BAIXO: 1, MEDIO: 2, ALTO: 3 };
  const score = (map[p] || 1) * (map[i] || 1);
  if (score >= 6) return "ALTO";
  if (score >= 3) return "MEDIO";
  return "BAIXO";
}

export async function deletarRisco(id: string) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  if (!isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    if (existente.inventory && existente.inventory.createdById !== session.user.id) {
      throw new Error("Apenas o DPO ou o dono do processo pode remover este risco.");
    }
    if (existente.status === "APROVADO") {
      throw new Error("Risco APROVADO não pode ser removido. Peça ao DPO se for necessário.");
    }
  }

  await prisma.processRisk.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/riscos");
}

// ============================================================================
// Workflow Contribuidor → DPO (em LOTE por inventário/processo)
// Art. 41 §2º LGPD — encarregado aprova análises de risco
// ============================================================================

// Contribuidor (dono do processo) submete todos os riscos RASCUNHO/DEVOLVIDO daquele processo pro DPO
export async function submeterRiscosDoProcesso(inventoryId: string) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { createdById: true, nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  // Permissão: dono do processo ou DPO
  if (!isDpoOuAdmin && inv.createdById !== session.user.id) {
    throw new Error("Apenas o dono do processo ou o DPO pode submeter os riscos.");
  }

  const updated = await prisma.processRisk.updateMany({
    where: {
      companyId,
      inventoryId,
      status: { in: ["RASCUNHO", "DEVOLVIDO"] },
    },
    data: {
      status: "SUBMETIDO",
      submittedAt: new Date(),
      feedbackDpo: null, // limpa feedback anterior se houver
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco em RASCUNHO ou DEVOLVIDO pra submeter no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// DPO aprova todos os riscos SUBMETIDOS daquele processo
export async function aprovarRiscosDoProcesso(inventoryId: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode aprovar riscos.");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "SUBMETIDO" },
    data: {
      status: "APROVADO",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      feedbackDpo: null,
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco SUBMETIDO pra aprovar no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// DPO devolve todos os riscos SUBMETIDOS daquele processo com motivo
export async function devolverRiscosDoProcesso(inventoryId: string, motivo: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode devolver riscos.");
  }
  if (!motivo || motivo.trim().length < 5) {
    throw new Error("Informe o motivo da devolução (mínimo 5 caracteres).");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "SUBMETIDO" },
    data: {
      status: "DEVOLVIDO",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      feedbackDpo: motivo.trim(),
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco SUBMETIDO pra devolver no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}
