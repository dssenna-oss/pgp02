// Helpers de autenticação no servidor — usados em pages e server actions.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session;
}

export async function requireCompany() {
  const session = await requireSession();
  if (!session.user.companyId) {
    throw new Error("Usuário não está vinculado a um grupo (companyId ausente)");
  }
  return { session, companyId: session.user.companyId };
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") throw new Error("Acesso restrito ao facilitador");
  return session;
}
