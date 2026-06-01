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

// Papéis que podem EXECUTAR ações (criar/editar/excluir) no app.
// Decisão institucional: apenas Coordenador do Comitê e Encarregado (DPO) —
// ambos cadastrados como COORDENADOR — além do ADMIN técnico. Os demais
// membros têm acesso somente de leitura. A trava real é esta, no servidor;
// esconder botões na UI é só conveniência visual.
export const EDITOR_ROLES = ["ADMIN", "COORDENADOR"] as const;

export function isEditorRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "COORDENADOR";
}

/** Exige que o usuário logado tenha permissão de edição. Use em toda server action que modifica dados. */
export async function requireEditor() {
  const session = await requireSession();
  if (!isEditorRole(session.user.role)) {
    throw new Error("Seu acesso é somente de leitura. Apenas a Coordenação e o Encarregado podem executar ações.");
  }
  return session;
}
