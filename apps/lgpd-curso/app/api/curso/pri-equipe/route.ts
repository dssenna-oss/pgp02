// GET /api/curso/pri-equipe
// Retorna a equipe ETIR/CSIRT do grupo atual pra renderizar chips de
// acionamento na lista de incidentes. Leve, cacheável no client.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    const companyId = session?.user?.companyId;
    if (!companyId) return NextResponse.json({ membros: [] });

    const membros = await prisma.priMembroEquipe.findMany({
      where: { companyId },
      select: {
        id: true,
        nome: true,
        papel: true,
        contato24h: true,
        email: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ membros });
  } catch (e: any) {
    // Se as tabelas PRI não foram migradas ainda, retorna vazio sem quebrar
    return NextResponse.json({ membros: [], error: e?.message });
  }
}
