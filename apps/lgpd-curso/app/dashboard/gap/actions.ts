"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getPacoteAtivo } from "@/lib/gap-pacote";
import { SETORES_APOIO } from "@/lib/setores-apoio";
import { calcularImport } from "@/lib/gap-import";

const RESPOSTAS_VALIDAS = [
  "ADERENTE",
  "PARCIAL",
  "NAO_ADERENTE",
  "ACAO_PLANEJADA",
  "APOIO_PENDENTE",
] as const;
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

/**
 * Importa resultados automáticos pra controles com `importavel` configurado.
 * Calcula resposta + justificativa baseado no estado atual das fases anteriores
 * (Inventário, Riscos, RIPD, Operadores, Aviso, DSR, Incidentes).
 */
export async function importarResultado(controleId: number) {
  const { companyId } = await requireCompany();
  const pacote = await getPacoteAtivo(companyId);
  const controle = pacote.find((c) => c.id === controleId);
  if (!controle) throw new Error("Controle não está no pacote ativo");
  if (!controle.importavel) throw new Error("Este controle não suporta importação automática");

  const { resposta, justificativa } = await calcularImport(companyId, controleId);

  const result = await prisma.gapAnswer.upsert({
    where: { companyId_controleId: { companyId, controleId } },
    create: {
      companyId,
      controleId,
      controleTexto: controle.texto,
      area: controle.area,
      resposta,
      justificativa,
      setorApoio: null,
    },
    update: {
      resposta,
      justificativa,
      setorApoio: null,
    },
  });
  revalidatePath("/dashboard/gap");
  return result;
}

/**
 * Cria automaticamente uma entrada no Plano de Ação a partir de um controle
 * marcado como ACAO_PLANEJADA — fecha o ciclo "GAP → Plano de Ação".
 * Idempotente: se já existe ação com origem=GAP e origemRef=controleId, não duplica.
 */
export async function criarAcaoPlanejada(controleId: number) {
  const { companyId } = await requireCompany();
  const pacote = await getPacoteAtivo(companyId);
  const controle = pacote.find((c) => c.id === controleId);
  if (!controle) throw new Error("Controle não está no pacote ativo");

  // Confere se o controle está como ACAO_PLANEJADA
  const answer = await prisma.gapAnswer.findUnique({
    where: { companyId_controleId: { companyId, controleId } },
  });
  if (!answer || answer.resposta !== "ACAO_PLANEJADA") {
    throw new Error("Marque o controle como 'Ação planejada' antes de criar no Plano");
  }

  // Idempotência: não duplica
  const origemRef = `gap-controle-${controleId}`;
  const existente = await prisma.actionPlan.findFirst({
    where: { companyId, origem: "GAP", origemRef },
  });
  if (existente) {
    return { criada: false, acao: existente };
  }

  const acao = await prisma.actionPlan.create({
    data: {
      companyId,
      origem: "GAP",
      origemRef,
      acao: `Implementar: ${controle.texto}`,
      responsavel: null,
      status: "ABERTA",
      prioridade: "MEDIA",
    },
  });
  revalidatePath("/dashboard/gap");
  revalidatePath("/dashboard/plano-acao");
  return { criada: true, acao };
}
