"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { GAP_PACOTE } from "@/lib/gap-pacote";

export async function listAnswers() {
  const { companyId } = await requireCompany();
  return prisma.gapAnswer.findMany({
    where: { companyId },
    orderBy: { controleId: "asc" },
  });
}

export async function saveAnswer(input: {
  controleId: number;
  resposta: "ADERENTE" | "PARCIAL" | "NAO_ADERENTE";
  justificativa?: string;
}) {
  const { companyId } = await requireCompany();
  const controle = GAP_PACOTE.find((c) => c.id === input.controleId);
  if (!controle) throw new Error("Controle inválido");

  const result = await prisma.gapAnswer.upsert({
    where: { companyId_controleId: { companyId, controleId: input.controleId } },
    create: {
      companyId,
      controleId: input.controleId,
      controleTexto: controle.texto,
      area: controle.area,
      resposta: input.resposta,
      justificativa: input.justificativa || null,
    },
    update: {
      resposta: input.resposta,
      justificativa: input.justificativa || null,
    },
  });

  revalidatePath("/dashboard/gap");
  return result;
}
