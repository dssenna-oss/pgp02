// POST /api/curso/heartbeat
// Atualiza `lastSeenAt` do usuário autenticado pra agora. Chamado pelo
// componente <Heartbeat /> client-side a cada 30s nas rotas autenticadas.
//
// Usado pelo Painel do Facilitador (componente PapeisAtivos) pra mostrar
// quais papéis de cada grupo estão com sessão ativa em tempo real —
// útil pra confirmar antes da Missão 1 que todos os 5 papéis logaram.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaLastSeenAt } from "@/lib/coluna-user-last-seen";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    // Não retorna erro alto — heartbeat de sessão expirada simplesmente vira no-op.
    return NextResponse.json({ ok: false, reason: "no-session" }, { status: 200 });
  }

  try {
    await ensureColunaLastSeenAt();
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Heartbeat NUNCA deve quebrar a UX — se falhar (ex: user deletado),
    // retorna 200 silencioso e o cliente segue chamando até a próxima.
    console.error("[heartbeat] erro:", e);
    return NextResponse.json({ ok: false, reason: e?.message || "erro" }, { status: 200 });
  }
}
