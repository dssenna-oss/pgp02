"use client";

import { useSession } from "next-auth/react";

/**
 * Hook de permissão de edição (client-side).
 *
 * Retorna true apenas para papéis ADMIN/COORDENADOR — ou seja, o Coordenador
 * do Comitê e o Encarregado (DPO), além do admin técnico. Os demais membros
 * têm acesso somente de leitura.
 *
 * IMPORTANTE: isto é só conveniência visual (esconder botões). A trava de
 * segurança real está no servidor, em `requireEditor()` (lib/auth-server),
 * aplicada em todas as server actions de modificação.
 */
export function usePodeEditar(): boolean {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "ADMIN" || role === "COORDENADOR";
}
