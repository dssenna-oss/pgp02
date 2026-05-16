"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

const SLUG = "aviso-privacidade";

export async function getAviso() {
  const { companyId } = await requireCompany();
  return prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
}

export async function getPrerequisitos() {
  const { companyId } = await requireCompany();
  const [ripds, operadores, dsr] = await Promise.all([
    prisma.ripd.findMany({ where: { companyId }, select: { id: true, titulo: true, status: true } }),
    prisma.operator.findMany({ where: { companyId }, select: { id: true, nome: true, contracts: { select: { clausulasLgpd: true } } } }),
    prisma.dsrRequest.findMany({ where: { companyId }, select: { id: true } }),
  ]);
  return {
    ripds: ripds.length,
    ripdsAprovados: ripds.filter((r) => r.status === "APROVADO").length,
    operadores: operadores.length,
    operadoresComClausula: operadores.filter((o) => o.contracts?.[0]?.clausulasLgpd).length,
    dsr: dsr.length,
  };
}

export async function saveAviso(conteudoMd: string) {
  const { companyId } = await requireCompany();
  const result = await prisma.policy.upsert({
    where: { companyId_slug: { companyId, slug: SLUG } },
    create: {
      companyId,
      slug: SLUG,
      titulo: "Aviso de Privacidade",
      conteudoMd,
      status: "RASCUNHO",
    },
    update: { conteudoMd },
  });
  revalidatePath("/dashboard/aviso");
  return result;
}

export async function publicarAviso() {
  const { companyId } = await requireCompany();
  const policy = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: SLUG } },
  });
  if (!policy) throw new Error("Crie o Aviso antes de publicar");

  const publicSlug = `${companyId.slice(0, 6)}-aviso`;
  const result = await prisma.policy.update({
    where: { id: policy.id },
    data: {
      status: "PUBLICADO",
      publicSlug,
      publishedAt: new Date(),
    },
  });
  revalidatePath("/dashboard/aviso");
  return result;
}
