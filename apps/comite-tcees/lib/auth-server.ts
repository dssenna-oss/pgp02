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

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && session.user.role !== "COORDENADOR") {
    throw new Error("Acesso restrito à coordenação");
  }
  return session;
}
