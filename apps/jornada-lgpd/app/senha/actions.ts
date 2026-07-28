"use server";

// Troca de senha do usuário logado (qualquer papel).

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSessao } from "@/lib/auth-server";

export async function trocarSenha(formData: FormData) {
  const sessao = await requireSessao();
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirma = String(formData.get("confirma") ?? "");

  if (nova.length < 8) redirect("/senha?erro=curta");
  if (nova !== confirma) redirect("/senha?erro=confere");

  const user = await prisma.user.findUnique({
    where: { id: sessao.id },
    select: { senha: true },
  });
  if (!user || !(await bcrypt.compare(atual, user.senha))) {
    redirect("/senha?erro=atual");
  }

  await prisma.user.update({
    where: { id: sessao.id },
    data: { senha: await bcrypt.hash(nova, 10) },
  });
  redirect("/senha?ok=1");
}
