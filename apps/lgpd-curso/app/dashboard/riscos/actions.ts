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
// Justificativa: Contribuidor conhece o processo dele, não os dos outros setores.
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
  // DPO e admin podem qualquer coisa (precisam coordenar a análise toda).
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

  // Edição: idem — se for editar risco existente, checa dono do processo
  if (input.id && !isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id: input.id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    if (existente.inventory && existente.inventory.createdById !== session.user.id) {
      throw new Error("Você só pode editar riscos dos seus processos. Peça ao DPO se for de outro setor.");
    }
  }

  const sevP = input.probabilidade.charAt(0);            // B|M|A
  const sevI = input.impacto.charAt(0);                  // B|M|A
  const sevS = computeSeverity(input.probabilidade, input.impacto);
  const severityLevel = `P:${sevP};I:${sevI};S:${sevS}`;

  const data = {
    companyId,
    inventoryId: input.inventoryId || null,
    riscoTitulo: input.riscoTitulo,
    descricao: input.descricao || null,
    categoria: input.categoria || null,
    severityLevel,
    mitigationPlan: input.mitigationPlan || null,
  };

  let result;
  if (input.id) {
    result = await prisma.processRisk.update({ where: { id: input.id }, data: { ...data, companyId: undefined } });
  } else {
    result = await prisma.processRisk.create({ data });
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

  // Segregação: Contribuidor só pode deletar risco em processo que ELE é dono.
  if (!isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    if (existente.inventory && existente.inventory.createdById !== session.user.id) {
      throw new Error("Apenas o DPO ou o dono do processo pode remover este risco.");
    }
  }

  await prisma.processRisk.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/riscos");
}
