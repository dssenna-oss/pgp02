/**
 * GET /api/painel-retomada/since-last-visit
 *
 * Retorna os 3 baldes de novidades do card "Desde sua última visita"
 * (CP27 Fatia 2). Engine pura em lib/painel-retomada-helpers.ts.
 *
 * Auth: qualquer user autenticado da org. DPOs veem itens extras
 * (RIPDs/LIAs em fila pra aprovação, contagem de contribuidores).
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPainelRetomada } from "@/lib/painel-retomada-helpers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      role: true,
      companyId: true,
      lastLoginAt: true,
      previousLoginAt: true,
    },
  });

  if (!user || !user.companyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
  }

  const result = await buildPainelRetomada({
    id: user.id,
    role: user.role,
    companyId: user.companyId,
    lastLoginAt: user.lastLoginAt,
    previousLoginAt: user.previousLoginAt,
  });

  return NextResponse.json(result);
}
