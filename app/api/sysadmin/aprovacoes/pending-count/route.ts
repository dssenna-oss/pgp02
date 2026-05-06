import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSuperAdmin } from "@/lib/auth-helpers";

/**
 * Endpoint leve só pra contagem de pendentes — usado pelo badge da sidebar
 * com polling de 60s. Reaproveita o filtro de `isActive=false`.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ count: 0 });
  }
  if (!isSuperAdmin(session.user.email)) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.user.count({ where: { isActive: false } });
  return NextResponse.json({ count });
}
