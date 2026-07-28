"use server";

// Define a senha a partir do link do convite (token único, 7 dias).
// Ao definir, o token morre — link não é reutilizável.

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function definirSenha(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirma = String(formData.get("confirma") ?? "");
  const volta = `/definir-senha?token=${encodeURIComponent(token)}`;

  if (nova.length < 8) redirect(`${volta}&erro=curta`);
  if (nova !== confirma) redirect(`${volta}&erro=confere`);

  const user = await prisma.user.findUnique({
    where: { tokenAcesso: token },
    select: { id: true, tokenExpira: true },
  });
  if (!user || !user.tokenExpira || user.tokenExpira < new Date()) {
    redirect("/definir-senha?erro=invalido");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      senha: await bcrypt.hash(nova, 10),
      tokenAcesso: null,
      tokenExpira: null,
    },
  });
  redirect("/entrar?definida=1");
}
