// Helpers de autenticação no servidor — usados em pages e server actions.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/**
 * Exige que o usuário seja editor (ADMIN/COORDENADOR) OU o responsável pelo
 * processo do Inventário em questão. Usado na edição de um processo específico:
 * um membro só-leitura passa a poder editar os processos atribuídos a ele
 * (via Tarefas). A trava é no servidor — não dá pra burlar pela UI.
 */
export async function requireEditorOuResponsavel(inventoryId: string) {
  const session = await requireSession();
  if (isEditorRole(session.user.role)) return session;

  const proc = await prisma.dataInventory.findUnique({
    where: { id: inventoryId },
    select: { responsavelId: true },
  });
  if (proc?.responsavelId && proc.responsavelId === session.user.id) return session;

  throw new Error("Você só pode editar os processos que foram atribuídos a você.");
}
