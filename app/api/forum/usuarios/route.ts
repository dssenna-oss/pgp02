export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/forum/usuarios
 *
 * Lista usuários da mesma organização (excluindo o próprio user) pra ser
 * usado no select de destinatário ao mandar uma DM. Decisão 9a: todos
 * podem mandar pra todos.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true },
  });
  if (!user || !user.companyId) {
    return NextResponse.json(
      { error: "Usuário sem organização" },
      { status: 404 }
    );
  }

  const users = await prisma.user.findMany({
    where: {
      companyId: user.companyId,
      isActive: true,
      NOT: { id: user.id },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      setor: true,
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return NextResponse.json({ users });
}
