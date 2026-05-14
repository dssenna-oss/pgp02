import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSuperAdminAccess } from "@/lib/auth-helpers";

/**
 * Super admin endpoint — recusa um cadastro pendente.
 *
 * DELETE: hard-delete do user. Se a empresa tinha só esse user (cenário típico
 * do auto-cadastro), a empresa também é apagada pra não deixar lixo no banco.
 * Se a empresa tinha outros users, ela é preservada.
 *
 * Aprovar é feito via PATCH /api/users/[id]/toggle-active (existente).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!hasSuperAdminAccess(session.user as any)) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const userId = params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      company: {
        select: {
          id: true,
          companyName: true,
          _count: { select: { users: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (user.isActive) {
    return NextResponse.json(
      {
        error:
          "Conta já está ativa — recusar é apenas para cadastros pendentes. Use o fluxo de desativação para contas ativas.",
      },
      { status: 400 },
    );
  }

  // Snapshot antes do delete pra retornar
  const wasOnlyUser =
    user.company !== null && user.company._count.users === 1;
  const companyName = user.company?.companyName ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: userId } });
    if (wasOnlyUser && user.company) {
      await tx.company.delete({ where: { id: user.company.id } });
    }
  });

  return NextResponse.json({
    success: true,
    deletedUser: { id: user.id, email: user.email },
    deletedCompany: wasOnlyUser ? companyName : null,
  });
}
