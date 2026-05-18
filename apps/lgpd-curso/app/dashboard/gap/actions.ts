"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getPacoteAtivo } from "@/lib/gap-pacote";
import { SETORES_APOIO } from "@/lib/setores-apoio";

const RESPOSTAS_VALIDAS = ["ADERENTE", "PARCIAL", "NAO_ADERENTE", "APOIO_PENDENTE"] as const;
type Resposta = (typeof RESPOSTAS_VALIDAS)[number];

export async function listAnswers() {
  const { companyId } = await requireCompany();
  return prisma.gapAnswer.findMany({
    where: { companyId },
    orderBy: { controleId: "asc" },
  });
}

export async function saveAnswer(input: {
  controleId: number;
  resposta: Resposta;
  justificativa?: string;
  setorApoio?: string | null;
}) {
  const { companyId } = await requireCompany();
  const pacote = await getPacoteAtivo(companyId);
  const controle = pacote.find((c) => c.id === input.controleId);
  if (!controle) throw new Error("Controle inválido ou não está no pacote ativo da turma");

  if (!RESPOSTAS_VALIDAS.includes(input.resposta)) {
    throw new Error("Resposta inválida");
  }

  // Validações específicas de APOIO_PENDENTE
  let setorApoio: string | null = null;
  if (input.resposta === "APOIO_PENDENTE") {
    const setorId = input.setorApoio || "";
    if (!SETORES_APOIO.some((s) => s.id === setorId)) {
      throw new Error("Selecione um setor de apoio válido");
    }
    setorApoio = setorId;
  }

  const result = await prisma.gapAnswer.upsert({
    where: { companyId_controleId: { companyId, controleId: input.controleId } },
    create: {
      companyId,
      controleId: input.controleId,
      controleTexto: controle.texto,
      area: controle.area,
      resposta: input.resposta,
      justificativa: input.justificativa || null,
      setorApoio,
    },
    update: {
      resposta: input.resposta,
      justificativa: input.justificativa || null,
      setorApoio,
    },
  });

  revalidatePath("/dashboard/gap");
  return result;
}
