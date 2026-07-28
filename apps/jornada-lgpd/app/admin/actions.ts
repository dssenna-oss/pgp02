"use server";

// Server actions do admin (Clube do Servidor): criar instituição + gestor
// (com convite por e-mail) e reenviar convite com senha nova.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { enviarConvite } from "@/lib/email";

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

  // Convite por e-mail (Brevo). Se falhar, o cadastro FICA — o admin repassa
  // o acesso manualmente (a tela avisa).
  const envio = await enviarConvite({
    paraEmail: gestorEmail,
    nomeGestor: gestorNome,
    nomeInstituicao: nome,
    senhaInicial: gestorSenha,
  });

  revalidatePath("/admin");
  redirect(`/admin?ok=1&mail=${envio.ok ? "ok" : "falha"}`);
}

export async function reenviarConvite(formData: FormData) {
  await requireAdmin();
  const instituicaoId = String(formData.get("instituicaoId") ?? "");

  const inst = await prisma.instituicao.findUnique({
    where: { id: instituicaoId },
    include: { users: { where: { role: "GESTOR" }, orderBy: { createdAt: "asc" }, take: 1 } },
  });
  const gestor = inst?.users[0];
  if (!inst || !gestor) redirect("/admin?erro=semgestor");

  // Gera senha nova, mas SÓ grava se o e-mail sair — senão ninguém saberia a
  // senha nova e o acesso antigo morreria junto.
  const senhaNova = randomBytes(9).toString("base64url");
  const envio = await enviarConvite({
    paraEmail: gestor.email,
    nomeGestor: gestor.nome,
    nomeInstituicao: inst.nome,
    senhaInicial: senhaNova,
  });
  if (!envio.ok) redirect("/admin?reenvio=falha");

  await prisma.user.update({
    where: { id: gestor.id },
    data: { senha: await bcrypt.hash(senhaNova, 10) },
  });

  revalidatePath("/admin");
  redirect("/admin?reenvio=ok");
}
