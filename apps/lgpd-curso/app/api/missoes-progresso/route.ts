// GET /api/missoes-progresso
// Retorna o status booleano de cada missão pra desenhar ticks na sidebar.
// Sidebar faz polling leve a cada 10s.

import { NextResponse } from "next/server";
import { getMissoesProgresso } from "@/lib/missoes-progresso";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const progresso = await getMissoesProgresso();
    return NextResponse.json(progresso);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro" }, { status: 500 });
  }
}
