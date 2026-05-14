/**
 * Helper central pra registrar "o que o user editou" — usado pelas
 * rotas PATCH/POST das 6 entidades (CP27 Fatia 3).
 *
 * Estratégia:
 *   - Cada rota de mutation chama `trackLastAction()` após persistir
 *     a alteração com sucesso
 *   - O upsert pelo @@unique([userId, refType, refId]) garante 1 row
 *     por (user, entidade) — sempre mantém o mais recente
 *   - `closedCleanly=true` significa "user finalizou esse fluxo"
 *     (publish/approve/close) — esses itens somem do "Continue de
 *     onde parou" no Dashboard
 *   - Falha silenciosa: erro de tracking nunca quebra a operação
 *     principal. Logado no server e segue
 */

import { prisma } from "@/lib/db";

export type RefType =
  | "INVENTARIO"
  | "RIPD"
  | "POLITICA"
  | "INCIDENTE"
  | "LIA"
  | "PLANO_ACAO";

export interface TrackLastActionInput {
  userId: string;
  refType: RefType;
  refId: string;
  /// Rota completa pra retomar diretamente
  /// (ex: /dashboard/inventario/cmokb...).
  route: string;
  /// Label amigável que aparece no card "Continue de onde parou"
  /// (ex: "Inventário CRM", "RIPD - Cadastro de Servidores").
  label: string;
  /// Progresso 0-100 (Inventário, RIPD). Null pras entidades que não
  /// têm progresso linear (Plano de Ação, Incidente).
  completeness?: number | null;
  /// True quando o user finalizou (publish/approve/close). Some do
  /// "Continue de onde parou".
  closedCleanly?: boolean;
}

export async function trackLastAction(input: TrackLastActionInput): Promise<void> {
  try {
    await prisma.userLastAction.upsert({
      where: {
        userId_refType_refId: {
          userId: input.userId,
          refType: input.refType,
          refId: input.refId,
        },
      },
      create: {
        userId: input.userId,
        refType: input.refType,
        refId: input.refId,
        route: input.route,
        label: input.label,
        completeness: input.completeness ?? null,
        closedCleanly: input.closedCleanly ?? false,
      },
      update: {
        route: input.route,
        label: input.label,
        completeness: input.completeness ?? null,
        closedCleanly: input.closedCleanly ?? false,
        openedAt: new Date(),
      },
    });
  } catch (err) {
    // Nunca propaga — tracking é "best-effort", não pode quebrar a
    // operação principal do user.
    console.error("[trackLastAction] falha:", err);
  }
}

/**
 * Calcula completeness (0-100) pra uma string de status.
 * Usado quando a entidade tem fluxo de status fixo.
 */
export function statusToCompleteness(
  status: string,
  refType: RefType
): number | null {
  // Inventário: RASCUNHO 30 / SUBMETIDO 70 / EM_REVISAO 80 / APROVADO 100
  if (refType === "INVENTARIO") {
    switch (status) {
      case "RASCUNHO": return 30;
      case "SUBMETIDO": return 70;
      case "EM_REVISAO": return 80;
      case "DEVOLVIDO": return 50;
      case "APROVADO": return 100;
      default: return null;
    }
  }
  // RIPD/LIA: RASCUNHO 50 / EM_REVISAO 80 / APROVADO 100
  if (refType === "RIPD" || refType === "LIA") {
    switch (status) {
      case "RASCUNHO": return 50;
      case "EM_REVISAO": return 80;
      case "APROVADO": return 100;
      case "ARQUIVADO": return 100;
      default: return null;
    }
  }
  // Política: RASCUNHO 50 / PUBLICADO 100
  if (refType === "POLITICA") {
    switch (status) {
      case "RASCUNHO": return 50;
      case "PUBLICADO": return 100;
      case "ARQUIVADO": return 100;
      default: return null;
    }
  }
  return null;
}

/**
 * Verifica se um status final indica finalização limpa do fluxo.
 */
export function statusIsClosedCleanly(status: string, refType: RefType): boolean {
  if (refType === "INVENTARIO") {
    return status === "APROVADO";
  }
  if (refType === "RIPD" || refType === "LIA") {
    return status === "APROVADO" || status === "ARQUIVADO";
  }
  if (refType === "POLITICA") {
    return status === "PUBLICADO" || status === "ARQUIVADO";
  }
  if (refType === "INCIDENTE") {
    return status === "ENCERRADO" || status === "FALSO_POSITIVO";
  }
  if (refType === "PLANO_ACAO") {
    return status === "CONCLUIDA" || status === "CANCELADA";
  }
  return false;
}
