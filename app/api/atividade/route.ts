/**
 * GET /api/atividade
 *
 * Retorna a timeline dos últimos 30 dias do user logado.
 * Cada user vê só o próprio (decisão 7A).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserActivity } from "@/lib/atividade-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getUserActivity(session.user.id);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[/api/atividade] erro:", err);
    return NextResponse.json(
      { error: "Falha ao carregar atividade" },
      { status: 500 }
    );
  }
}
