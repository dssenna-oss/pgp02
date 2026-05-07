/**
 * GET /api/painel-retomada/continue
 *
 * Retorna até 3 itens "inacabados" que o user editou nos últimos 14 dias
 * (CP27 Fatia 4). Alimenta o card "Continue de onde parou" no Dashboard.
 *
 * Filtro:
 *   - Mesmo usuário logado
 *   - closedCleanly = false (não finalizou ainda)
 *   - openedAt > NOW() - 14 dias
 *   - Ordem: mais recente primeiro
 *
 * Auth: qualquer user autenticado.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_ITEMS = 3;
const WINDOW_DAYS = 14;

/**
 * Humaniza diferença de tempo em pt-BR (mesma engine do "Desde sua última
 * visita"). Inline pra não acoplar este endpoint ao outro helper.
 */
function humanizeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias atrás`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return "1 semana atrás";
  if (weeks < 4) return `${weeks} semanas atrás`;
  return "mais de 1 mês";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User não encontrado" }, { status: 404 });
  }

  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const actions = await prisma.userLastAction.findMany({
    where: {
      userId: user.id,
      closedCleanly: false,
      openedAt: { gt: cutoff },
    },
    orderBy: { openedAt: "desc" },
    take: MAX_ITEMS,
  });

  return NextResponse.json({
    items: actions.map((a) => ({
      id: a.id,
      refType: a.refType,
      refId: a.refId,
      route: a.route,
      label: a.label,
      completeness: a.completeness,
      openedAt: a.openedAt.toISOString(),
      whenLabel: humanizeAgo(a.openedAt),
    })),
  });
}
