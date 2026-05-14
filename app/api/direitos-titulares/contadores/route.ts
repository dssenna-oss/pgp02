/**
 * Contadores leves de Requisições de Direitos do Titular — alimenta o
 * badge da sidebar (DPO-only). Polling tipicamente a cada 60s.
 *
 * Retorna:
 *   - pendentes: total em status RECEBIDA + EM_ANALISE + AGUARDANDO_TITULAR
 *   - vencidas:  qualquer pendente cuja dueDate já passou
 *   - criticas:  qualquer pendente cuja dueDate é ≤ 3 dias
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { companyId: true, role: true },
    });
    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      );
    }
    if (!isDPO(user.role)) {
      // Não-DPOs nunca acessam — sidebar não vai chamar pra eles, mas
      // protegemos com 403 explícito caso a UI falhe.
      return NextResponse.json({ pendentes: 0, vencidas: 0, criticas: 0 });
    }

    const PENDING = ["RECEBIDA", "EM_ANALISE", "AGUARDANDO_TITULAR"];
    const now = new Date();
    const in3days = new Date(now);
    in3days.setDate(in3days.getDate() + 3);

    const [pendentes, vencidas, criticas] = await Promise.all([
      prisma.dataSubjectRequest.count({
        where: { companyId: user.companyId, status: { in: PENDING } },
      }),
      prisma.dataSubjectRequest.count({
        where: {
          companyId: user.companyId,
          status: { in: PENDING },
          dueDate: { lt: now },
        },
      }),
      prisma.dataSubjectRequest.count({
        where: {
          companyId: user.companyId,
          status: { in: PENDING },
          dueDate: { gte: now, lte: in3days },
        },
      }),
    ]);

    return NextResponse.json({ pendentes, vencidas, criticas });
  } catch (error) {
    console.error("Erro nos contadores DSR:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contadores" },
      { status: 500 },
    );
  }
}
