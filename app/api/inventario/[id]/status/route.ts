import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, INVENTORY_STATUS } from "@/lib/auth-helpers";

/**
 * Endpoint do fluxo de aprovação dos processos de Inventário.
 *
 * PATCH /api/inventario/[id]/status
 *
 * Body: { status: "EM_REVISAO" | "APROVADO" | "DEVOLVIDO" | "SUBMETIDO",
 *         comment?: string }
 *
 * Regras:
 *   - Apenas DPO (Principal/Substituto/Auxiliar) pode mudar pra
 *     EM_REVISAO/APROVADO/DEVOLVIDO
 *   - Contribuidor pode mudar de DEVOLVIDO → SUBMETIDO (re-submissão)
 *   - DEVOLVIDO exige `comment` não-vazio
 *   - Transições válidas (state machine):
 *       SUBMETIDO  → EM_REVISAO | APROVADO | DEVOLVIDO
 *       EM_REVISAO → APROVADO | DEVOLVIDO
 *       DEVOLVIDO  → SUBMETIDO (apenas pelo criador, via PUT inventário
 *                                 ou esta rota)
 *       APROVADO   → (terminal — só super admin via DB direto)
 *       RASCUNHO   → SUBMETIDO (via wizard "Concluir")
 *
 * Atualiza também `reviewedById`, `reviewedAt`, `reviewComment`
 * quando o DPO atua.
 */

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  RASCUNHO: ["SUBMETIDO", "APROVADO"], // APROVADO direto se DPO criou (atalho)
  SUBMETIDO: ["EM_REVISAO", "APROVADO", "DEVOLVIDO"],
  EM_REVISAO: ["APROVADO", "DEVOLVIDO"],
  DEVOLVIDO: ["SUBMETIDO"],
  APROVADO: [], // terminal
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  const { id } = await Promise.resolve(params as any);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const targetStatus: string | undefined = body?.status;
  const comment: string = (body?.comment ?? "").toString().trim();

  if (!targetStatus || !ALLOWED_TRANSITIONS.hasOwnProperty(targetStatus)) {
    return NextResponse.json(
      { error: "Status inválido" },
      { status: 400 }
    );
  }

  // Carrega processo (deve ser da mesma org)
  const inv = await prisma.dataInventory.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!inv) {
    return NextResponse.json(
      { error: "Inventário não encontrado" },
      { status: 404 }
    );
  }

  const currentStatus = inv.status ?? (inv.isDraft ? "RASCUNHO" : "APROVADO");
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowedNext.includes(targetStatus)) {
    return NextResponse.json(
      {
        error: `Transição não permitida: ${currentStatus} → ${targetStatus}`,
      },
      { status: 409 }
    );
  }

  // Permissões por transição
  const isDpoAction =
    targetStatus === INVENTORY_STATUS.EM_REVISAO ||
    targetStatus === INVENTORY_STATUS.APROVADO ||
    targetStatus === INVENTORY_STATUS.DEVOLVIDO;

  if (isDpoAction) {
    if (!isDPO(user.role)) {
      return NextResponse.json(
        { error: "Apenas DPO pode aprovar/devolver/iniciar revisão" },
        { status: 403 }
      );
    }
  } else if (
    targetStatus === INVENTORY_STATUS.SUBMETIDO &&
    currentStatus === INVENTORY_STATUS.DEVOLVIDO
  ) {
    // Re-submissão: só o criador (ou DPO) pode
    if (!isDPO(user.role) && inv.createdById !== user.id) {
      return NextResponse.json(
        { error: "Apenas o criador pode re-submeter" },
        { status: 403 }
      );
    }
  }

  // DEVOLVIDO exige comentário (sem comentário, contribuidor não sabe o
  // que ajustar)
  if (targetStatus === INVENTORY_STATUS.DEVOLVIDO && !comment) {
    return NextResponse.json(
      {
        error:
          "Comentário obrigatório ao devolver — explique ao contribuidor o que ajustar",
      },
      { status: 400 }
    );
  }

  // Atualiza
  const data: any = {
    status: targetStatus,
    // Espelha em isDraft pra retrocompatibilidade — só RASCUNHO é "draft"
    isDraft: targetStatus === INVENTORY_STATUS.RASCUNHO,
  };
  if (isDpoAction) {
    data.reviewedById = user.id;
    data.reviewedAt = new Date();
    if (targetStatus === INVENTORY_STATUS.DEVOLVIDO) {
      data.reviewComment = comment;
    } else if (targetStatus === INVENTORY_STATUS.APROVADO) {
      // Limpa comentário antigo de devolução, se houver
      data.reviewComment = null;
    }
  }
  if (targetStatus === INVENTORY_STATUS.SUBMETIDO) {
    // Re-submissão limpa comment + reviewer pra ciclo novo
    data.reviewComment = null;
    data.reviewedById = null;
    data.reviewedAt = null;
  }

  const updated = await prisma.dataInventory.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
