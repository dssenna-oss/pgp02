// Helpers de autenticação no servidor (pages e server actions).

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type SessaoUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "GESTOR";
  instituicaoId: string | null;
};

export async function getSessao() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as unknown as SessaoUser) : null;
}

export async function requireSessao(): Promise<SessaoUser> {
  const u = await getSessao();
  if (!u?.id) throw new Error("Não autenticado");
  return u;
}

export async function requireAdmin(): Promise<SessaoUser> {
  const u = await requireSessao();
  if (u.role !== "ADMIN") throw new Error("Acesso restrito ao Clube do Servidor");
  return u;
}

// Gestor precisa estar vinculado a uma instituição; ADMIN pode passar uma
// instituição explícita (visão de suporte) — na E1, ADMIN sem vínculo cai fora.
export async function requireInstituicao(): Promise<{ user: SessaoUser; instituicaoId: string }> {
  const user = await requireSessao();
  if (!user.instituicaoId) throw new Error("Usuário sem instituição vinculada");
  return { user, instituicaoId: user.instituicaoId };
}
