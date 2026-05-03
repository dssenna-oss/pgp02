import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageContributors, ROLES } from "@/lib/auth-helpers";

/**
 * Excluir contribuidor da organização. Apenas DPO Principal ou Substituto.
 *
 * NOTA: a exclusão do User dispara `onDelete: SetNull` em
 * `DataInventory.createdById` (definido no schema), então os processos
 * que ele criou ficam órfãos mas não são apagados — preserva histórico.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dpo = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!dpo?.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }
  if (!canManageContributors(dpo.role)) {
    return NextResponse.json(
      { error: "Apenas DPO Principal ou Substituto podem excluir contribuidores" },
      { status: 403 }
    );
  }

  const { id } = await Promise.resolve(params as any);

  // Garante que o contribuidor é da mesma org (não dá pra apagar de outra)
  const target = await prisma.user.findFirst({
    where: {
      id,
      companyId: dpo.companyId,
      role: { in: [ROLES.CONTRIBUIDOR, ROLES.USER_LEGACY] },
    },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Contribuidor não encontrado nesta organização" },
      { status: 404 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "Contribuidor excluído" });
}
