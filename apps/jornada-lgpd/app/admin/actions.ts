"use server";

// Server actions do admin (Clube do Servidor): criar instituição + gestor
// (convite por e-mail com link de DEFINIR senha) e reenviar o link de acesso.
// O e-mail nunca carrega senha; o token vale 7 dias e morre ao ser usado.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { enviarConvite } from "@/lib/email";

const URL_APP = "https://jornada-lgpd.vercel.app";
const VALIDADE_DIAS = 7;

function novoToken() {
  return {
    tokenAcesso: randomBytes(24).toString("base64url"),
    tokenExpira: new Date(Date.now() + VALIDADE_DIAS * 24 * 60 * 60 * 1000),
  };
}

export async function criarInstituicao(formData: FormData) {
  await requireAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim() || null;
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase() || null;
  const gestorNome = String(formData.get("gestorNome") ?? "").trim();
  const gestorEmail = String(formData.get("gestorEmail") ?? "").trim().toLowerCase();

  if (!nome || !gestorNome || !gestorEmail) {
    redirect("/admin?erro=campos");
  }
  const jaExiste = await prisma.user.findUnique({ where: { email: gestorEmail } });
  if (jaExiste) redirect("/admin?erro=email");

  const inst = await prisma.instituicao.create({ data: { nome, cidade, uf } });
  const { tokenAcesso, tokenExpira } = novoToken();
  await prisma.user.create({
    data: {
      email: gestorEmail,
      nome: gestorNome,
      // Senha provisória impossível de adivinhar — o gestor define a dele
      // pelo link; até lá, o login por senha não funciona (por desenho).
      senha: await bcrypt.hash(randomBytes(32).toString("base64url"), 10),
      role: "GESTOR",
      instituicaoId: inst.id,
      tokenAcesso,
      tokenExpira,
    },
  });

  const envio = await enviarConvite({
    paraEmail: gestorEmail,
    nomeGestor: gestorNome,
    nomeInstituicao: nome,
    linkDefinirSenha: `${URL_APP}/definir-senha?token=${tokenAcesso}`,
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

  // Token novo (a senha atual, se existir, segue valendo — o link serve
  // tanto pro primeiro acesso quanto pro "esqueci minha senha").
  const { tokenAcesso, tokenExpira } = novoToken();
  await prisma.user.update({ where: { id: gestor.id }, data: { tokenAcesso, tokenExpira } });

  const envio = await enviarConvite({
    paraEmail: gestor.email,
    nomeGestor: gestor.nome,
    nomeInstituicao: inst.nome,
    linkDefinirSenha: `${URL_APP}/definir-senha?token=${tokenAcesso}`,
  });

  revalidatePath("/admin");
  redirect(`/admin?reenvio=${envio.ok ? "ok" : "falha"}`);
}
