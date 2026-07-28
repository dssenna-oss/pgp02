"use server";

// Server actions do admin (Clube do Servidor): criar instituição + gestor.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export async function criarInstituicao(formData: FormData) {
  await requireAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim() || null;
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase() || null;
  const gestorNome = String(formData.get("gestorNome") ?? "").trim();
  const gestorEmail = String(formData.get("gestorEmail") ?? "").trim().toLowerCase();
  const gestorSenha = String(formData.get("gestorSenha") ?? "").trim();

  if (!nome || !gestorNome || !gestorEmail || gestorSenha.length < 8) {
    redirect("/admin?erro=campos");
  }
  const jaExiste = await prisma.user.findUnique({ where: { email: gestorEmail } });
  if (jaExiste) redirect("/admin?erro=email");

  const inst = await prisma.instituicao.create({ data: { nome, cidade, uf } });
  await prisma.user.create({
    data: {
      email: gestorEmail,
      nome: gestorNome,
      senha: await bcrypt.hash(gestorSenha, 10),
      role: "GESTOR",
      instituicaoId: inst.id,
    },
  });

  revalidatePath("/admin");
  redirect("/admin?ok=1");
}
