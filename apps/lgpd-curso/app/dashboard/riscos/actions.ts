"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function listRiscos() {
  const { companyId } = await requireCompany();
  return prisma.processRisk.findMany({
    where: { companyId },
    include: { inventory: { select: { id: true, nome: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function listInventoriesForSelect() {
  const { companyId } = await requireCompany();
  return prisma.dataInventory.findMany({
    where: { companyId },
    select: { id: true, nome: true, setor: true, status: true, dadosSensiveis: true },
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
  const { companyId } = await requireCompany();

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
  const { companyId } = await requireCompany();
  await prisma.processRisk.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/riscos");
}
