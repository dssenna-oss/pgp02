// PATCH /api/curso/phase-skip/:id — facilitador marca tentativa como ACKNOWLEDGED
// (já conversei com o grupo, pode encerrar o alerta).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  const atualizado = await prisma.phaseSkipAttempt.update({
    where: { id: params.id },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });
  return NextResponse.json({ ok: true, attempt: atualizado });
}
