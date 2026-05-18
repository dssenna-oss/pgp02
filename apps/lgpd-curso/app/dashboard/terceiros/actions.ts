"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkGapConcluido } from "@/lib/phase-guard";
import { calcularNivelRisco } from "@/lib/risco-anpd";
import type { RespostaDD } from "@/lib/due-diligence";

export async function listOperadores() {
  const { companyId } = await requireCompany();
  return prisma.operator.findMany({
    where: { companyId },
    include: { contracts: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveOperador(input: {
  id?: string;
  nome: string;
  cnpj?: string;
  servico?: string;
  contato?: string;
  contratoNumero?: string;
  contratoObjeto?: string;
  clausulasLgpd?: boolean;
}) {
  const skip = await checkGapConcluido("FASE_6", input.id ? "Editar Operador" : "Criar Operador");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  const dataOp = {
    companyId,
    nome: input.nome,
    cnpj: input.cnpj || null,
    servico: input.servico || null,
    contato: input.contato || null,
  };

  let op;
  if (input.id) {
    op = await prisma.operator.update({ where: { id: input.id }, data: { ...dataOp, companyId: undefined } });
  } else {
    op = await prisma.operator.create({ data: dataOp });
  }

  // Atualiza/cria contrato vinculado (1:1 simplificado)
  if (input.contratoNumero || input.contratoObjeto || input.clausulasLgpd !== undefined) {
    const existing = await prisma.operatorContract.findFirst({ where: { operatorId: op.id } });
    if (existing) {
      await prisma.operatorContract.update({
        where: { id: existing.id },
        data: {
          numero: input.contratoNumero || null,
          objeto: input.contratoObjeto || null,
          clausulasLgpd: !!input.clausulasLgpd,
        },
      });
    } else {
      await prisma.operatorContract.create({
        data: {
          operatorId: op.id,
          numero: input.contratoNumero || null,
          objeto: input.contratoObjeto || null,
          clausulasLgpd: !!input.clausulasLgpd,
        },
      });
    }
  }

  revalidatePath("/dashboard/terceiros");
  return op;
}

export async function deletarOperador(id: string) {
  const skip = await checkGapConcluido("FASE_6", "Deletar Operador");
  if (skip) return skip;
  const { companyId } = await requireCompany();
  await prisma.operator.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/terceiros");
}

// Salva a seleção de cláusulas do DPO pra incluir no aditamento DOCX.
// Também permite ajustar manualmente o tipoOperacao e nivelRisco (caso o
// DPO queira corrigir a sugestão automática do seed).
export async function salvarSelecaoClausulas(input: {
  operatorId: string;
  clausulasSelecionadas: string[];
  tipoOperacao?: string;
  nivelRisco?: string;
}) {
  const skip = await checkGapConcluido("FASE_6", "Salvar seleção de cláusulas");
  if (skip) return skip;
  const { companyId } = await requireCompany();

  // Garante que o operador pertence à company
  const op = await prisma.operator.findFirst({
    where: { id: input.operatorId, companyId },
    select: { id: true },
  });
  if (!op) throw new Error("Operador não encontrado.");

  const contract = await prisma.operatorContract.findFirst({
    where: { operatorId: input.operatorId },
  });
  if (!contract) throw new Error("Contrato não encontrado pra este operador.");

  await prisma.operatorContract.update({
    where: { id: contract.id },
    data: {
      clausulasSelecionadas: input.clausulasSelecionadas,
      tipoOperacao: input.tipoOperacao ?? contract.tipoOperacao,
      nivelRisco:   input.nivelRisco   ?? contract.nivelRisco,
      // Se selecionou alguma cláusula, marca clausulasLgpd=true automaticamente
      clausulasLgpd: input.clausulasSelecionadas.length > 0 ? true : contract.clausulasLgpd,
    },
  });

  revalidatePath("/dashboard/terceiros");
  return { ok: true };
}

// Salva a Avaliação de Risco do operador (Res. ANPD nº 2, art. 4º).
// O nivelRisco é RECALCULADO automaticamente pelos fatores marcados —
// não aceita override manual aqui (manter consistência com a régua).
export async function salvarAvaliacaoRisco(input: {
  operatorId: string;
  fatoresMarcados: string[];
}) {
  const skip = await checkGapConcluido("FASE_6", "Salvar avaliação de risco");
  if (skip) return skip;
  const { companyId } = await requireCompany();

  const op = await prisma.operator.findFirst({
    where: { id: input.operatorId, companyId },
    select: { id: true },
  });
  if (!op) throw new Error("Operador não encontrado.");

  const contract = await prisma.operatorContract.findFirst({
    where: { operatorId: input.operatorId },
  });
  if (!contract) throw new Error("Contrato não encontrado pra este operador.");

  const novoNivel = calcularNivelRisco(input.fatoresMarcados);

  await prisma.operatorContract.update({
    where: { id: contract.id },
    data: {
      riscoFatoresMarcados: input.fatoresMarcados,
      nivelRisco: novoNivel,
    },
  });

  revalidatePath("/dashboard/terceiros");
  return { ok: true, nivelRisco: novoNivel };
}

// Salva as respostas do Due Diligence (questionário Cyber+LGPD).
export async function salvarDueDiligence(input: {
  operatorId: string;
  respostas: Record<string, RespostaDD>;
}) {
  const skip = await checkGapConcluido("FASE_6", "Salvar due diligence");
  if (skip) return skip;
  const { companyId } = await requireCompany();

  const op = await prisma.operator.findFirst({
    where: { id: input.operatorId, companyId },
    select: { id: true },
  });
  if (!op) throw new Error("Operador não encontrado.");

  const contract = await prisma.operatorContract.findFirst({
    where: { operatorId: input.operatorId },
  });
  if (!contract) throw new Error("Contrato não encontrado pra este operador.");

  await prisma.operatorContract.update({
    where: { id: contract.id },
    data: {
      dueDiligenceRespostas: input.respostas as any,
    },
  });

  revalidatePath("/dashboard/terceiros");
  return { ok: true };
}
