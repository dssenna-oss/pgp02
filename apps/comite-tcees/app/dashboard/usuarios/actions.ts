"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession, requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

const ROLES = ["ADMIN", "COORDENADOR", "MEMBRO"];

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

/** Cria um login para um membro. Admin/Coordenação apenas. */
export async function criarUsuario(input: {
  name: string;
  email: string;
  role: string;
  senha: string;
}): Promise<{ ok: true } | { erro: string }> {
  await requireAdmin();
  const name = input.name.trim();
  const email = normEmail(input.email);
  const role = ROLES.includes(input.role) ? input.role : "MEMBRO";

  if (!name) return { erro: "Informe o nome." };
  if (!email.includes("@")) return { erro: "E-mail inválido." };
  if (input.senha.length < 6) return { erro: "A senha inicial precisa de ao menos 6 caracteres." };

  const existe = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existe) return { erro: "Já existe um login com esse e-mail." };

  const password = await bcrypt.hash(input.senha, 10);
  await prisma.user.create({ data: { name, email, role, password } });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

/** Atualiza nome, papel e situação (ativo/inativo) de um login. */
export async function atualizarUsuario(input: {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}): Promise<{ ok: true } | { erro: string }> {
  const session = await requireAdmin();
  const role = ROLES.includes(input.role) ? input.role : "MEMBRO";

  if (input.id === session.user.id && !input.isActive) {
    return { erro: "Você não pode desativar o seu próprio acesso." };
  }
  await prisma.user.update({
    where: { id: input.id },
    data: { name: input.name.trim(), role, isActive: input.isActive },
  });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

/** Admin redefine a senha de um login (ex.: membro esqueceu). */
export async function redefinirSenha(input: {
  id: string;
  novaSenha: string;
}): Promise<{ ok: true } | { erro: string }> {
  await requireAdmin();
  if (input.novaSenha.length < 6) return { erro: "A nova senha precisa de ao menos 6 caracteres." };
  const password = await bcrypt.hash(input.novaSenha, 10);
  await prisma.user.update({ where: { id: input.id }, data: { password } });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

export async function excluirUsuario(id: string): Promise<{ ok: true } | { erro: string }> {
  const session = await requireAdmin();
  if (id === session.user.id) return { erro: "Você não pode excluir o seu próprio acesso." };
  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard/usuarios");
  return { ok: true };
}

/** Qualquer usuário troca a própria senha (confirma a atual). */
export async function trocarMinhaSenha(input: {
  senhaAtual: string;
  novaSenha: string;
}): Promise<{ ok: true } | { erro: string }> {
  const session = await requireSession();
  if (input.novaSenha.length < 6) return { erro: "A nova senha precisa de ao menos 6 caracteres." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { erro: "Usuário não encontrado." };

  const confere = await bcrypt.compare(input.senhaAtual, user.password);
  if (!confere) return { erro: "A senha atual está incorreta." };

  const password = await bcrypt.hash(input.novaSenha, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password } });
  return { ok: true };
}
