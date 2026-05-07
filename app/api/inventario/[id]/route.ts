
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canModifyInventory,
  inventoryAccessFilter,
  isDPO,
  INVENTORY_STATUS,
} from "@/lib/auth-helpers";
import { trackLastAction, statusToCompleteness, statusIsClosedCleanly } from "@/lib/track-last-action";

/**
 * Helper interno: carrega o user da sessão + busca o inventário aplicando
 * o filtro de acesso (Contribuidor só pega os próprios, DPO pega da org).
 * Retorna `{ user, inventory }` ou um erro NextResponse.
 */
async function loadAccessibleInventory(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return {
      error: NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 }),
    };
  }

  const filter = inventoryAccessFilter({
    id: user.id,
    companyId: user.companyId,
    role: user.role,
  });
  if (!filter) {
    return {
      error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }),
    };
  }

  const inventory = await prisma.dataInventory.findFirst({
    where: { ...filter, id },
  });

  if (!inventory) {
    return {
      error: NextResponse.json(
        { error: "Inventário não encontrado ou sem permissão" },
        { status: 404 }
      ),
    };
  }

  return { user, inventory };
}

// GET - Buscar inventário específico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params as any);
    const result = await loadAccessibleInventory(id);
    if ("error" in result) return result.error;
    return NextResponse.json(result.inventory);
  } catch (error) {
    console.error("Erro ao buscar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar inventário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar inventário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params as any);
    const result = await loadAccessibleInventory(id);
    if ("error" in result) return result.error;
    const { user, inventory } = result;

    // Contribuidor só pode editar os próprios; DPO edita qualquer um.
    // (loadAccessibleInventory já filtrou pra Contribuidor, mas reforçamos
    // aqui em caso de futuro endpoint de PUT desse mesmo usuário.)
    if (!canModifyInventory(user, inventory)) {
      return NextResponse.json(
        { error: "Sem permissão pra editar este inventário" },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Apenas inclui campos que vieram no body — wizard pode mandar só
    // formAnswers + isDraft sem mexer nos resumos legados.
    const update: any = {};
    const fields = [
      "serviceName", "dataCategory", "personalData", "legalBasis",
      "purpose", "dataSubjects", "retention", "storage", "sharing", "security",
    ];
    for (const f of fields) {
      if (data[f] !== undefined) update[f] = data[f];
    }
    if (data.formAnswers !== undefined) update.formAnswers = data.formAnswers;
    if (data.isDraft !== undefined) {
      update.isDraft = data.isDraft;
      // Status ao concluir o wizard:
      //   - DPO conclui → APROVADO (atalho, não precisa auto-revisar)
      //   - Contribuidor conclui → SUBMETIDO (vai pra fila de aprovação do DPO)
      //   - Voltar pra rascunho → RASCUNHO
      // Re-submissão de DEVOLVIDO usa endpoint dedicado /status (não vem
      // por aqui).
      const currentStatus = inventory.status ?? (inventory.isDraft ? "RASCUNHO" : "APROVADO");
      if (data.isDraft) {
        update.status = INVENTORY_STATUS.RASCUNHO;
      } else if (
        currentStatus === INVENTORY_STATUS.DEVOLVIDO &&
        !isDPO(user.role)
      ) {
        // Contribuidor editando processo devolvido — re-submete
        update.status = INVENTORY_STATUS.SUBMETIDO;
        update.reviewComment = null;
        update.reviewedById = null;
        update.reviewedAt = null;
      } else {
        update.status = isDPO(user.role)
          ? INVENTORY_STATUS.APROVADO
          : INVENTORY_STATUS.SUBMETIDO;
      }
    }

    const updated = await prisma.dataInventory.update({
      where: { id },
      data: update,
    });

    // CP27 Fatia 3 — registra "Continue de onde parou"
    await trackLastAction({
      userId: user.id,
      refType: "INVENTARIO",
      refId: updated.id,
      route: `/dashboard/inventario/${updated.id}`,
      label: `Inventário "${updated.serviceName}"`,
      completeness: statusToCompleteness(updated.status, "INVENTARIO"),
      closedCleanly: statusIsClosedCleanly(updated.status, "INVENTARIO"),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar inventário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar inventário" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir inventário
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params as any);
    const result = await loadAccessibleInventory(id);
    if ("error" in result) return result.error;
    const { user, inventory } = result;

    if (!canModifyInventory(user, inventory)) {
      return NextResponse.json(
        { error: "Sem permissão pra excluir este inventário" },
        { status: 403 }
      );
    }

    await prisma.dataInventory.delete({ where: { id } });
    return NextResponse.json({ message: "Inventário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir inventário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir inventário" },
      { status: 500 }
    );
  }
}
