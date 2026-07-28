"use server";

// Server action do Perfil — salva os campos da instituição do gestor logado.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { CAMPOS_PERFIL } from "@/lib/perfil";

export async function salvarPerfil(formData: FormData) {
  const { instituicaoId } = await requireInstituicao();

  const dados: Record<string, string | null> = {};
  for (const c of CAMPOS_PERFIL) {
    const v = String(formData.get(c.campo) ?? "").trim();
    dados[c.campo] = v || null;
  }
  // Nome nunca vira null (é o rótulo da instituição em todo lugar).
  if (!dados.nome) delete dados.nome;

  await prisma.instituicao.update({ where: { id: instituicaoId }, data: dados });
  revalidatePath("/perfil");
  revalidatePath("/jornada");
  redirect("/perfil?ok=1");
}
