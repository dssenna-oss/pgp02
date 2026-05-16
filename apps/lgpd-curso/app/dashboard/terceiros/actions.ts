"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

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
  const { companyId } = await requireCompany();
  await prisma.operator.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/terceiros");
}
