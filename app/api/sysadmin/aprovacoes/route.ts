import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSuperAdminAccess } from "@/lib/auth-helpers";

/**
 * Super admin endpoint — lista cadastros pendentes de aprovação.
 *
 * Cadastros via /signup nascem com `isActive=false` por design (segurança —
 * evita que qualquer um se cadastre e use o sistema sem ser conhecido).
 * Esta rota lista esses pendentes pro super admin aprovar manualmente.
 *
 * Acesso: apenas o email definido em SUPER_ADMIN_EMAIL (env).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!hasSuperAdminAccess(session.user as any)) {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const pending = await prisma.user.findMany({
    where: { isActive: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          companyName: true,
          createdAt: true,
          _count: {
            select: { users: true, dataInventories: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ pending });
}
