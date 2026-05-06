export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchPhases } from "@/lib/phase-search";

/**
 * GET /api/phase-search?q=<termo>
 *
 * Busca textual nos conteúdos didáticos das 9 fases (Descrição,
 * Considerações, Checklist HTML e Documentação). Retorna hits
 * agrupados por fase, com snippet e posição do match.
 *
 * Acesso: qualquer usuário autenticado (conteúdo é institucional).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { companyId: true },
  });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await searchPhases(prisma, q, user?.companyId ?? null);
  return NextResponse.json(results);
}
