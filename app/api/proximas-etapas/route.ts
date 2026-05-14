/**
 * GET /api/proximas-etapas
 *
 * Retorna a lista priorizada de "próximos passos" do user logado.
 * DPO recebe regras de workflow + recomendações do Diagnóstico.
 * Contribuidor recebe só regras de workflow (devolvidos, rascunhos,
 * tarefas pendentes).
 */
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProximasEtapas } from "@/lib/proximas-etapas-helpers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });
  if (!user?.companyId) {
    return NextResponse.json({ etapas: [] });
  }

  try {
    const etapas = await getProximasEtapas({
      id: user.id,
      role: user.role,
      companyId: user.companyId,
    });
    return NextResponse.json({ etapas });
  } catch (err) {
    console.error("[/api/proximas-etapas] erro:", err);
    return NextResponse.json(
      { error: "Falha ao computar próximas etapas" },
      { status: 500 },
    );
  }
}
