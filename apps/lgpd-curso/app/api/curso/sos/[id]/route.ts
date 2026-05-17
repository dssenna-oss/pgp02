// PATCH /api/curso/sos/:id  — facilitador atualiza status: ATTENDED ou RESOLVED
// DELETE  /api/curso/sos/:id  — facilitador cancela (raro; usa pra teste)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const novoStatus = body.status as string | undefined;
  if (!novoStatus || !["ATTENDED", "RESOLVED"].includes(novoStatus)) {
    return NextResponse.json({ error: "status inválido (ATTENDED | RESOLVED)" }, { status: 400 });
  }

  const atualizado = await prisma.assistanceRequest.update({
    where: { id: params.id },
    data: {
      status: novoStatus,
      ...(novoStatus === "ATTENDED" ? { attendedAt: new Date() } : {}),
      ...(novoStatus === "RESOLVED" ? { resolvedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ ok: true, request: atualizado });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 403 });
  }
  await prisma.assistanceRequest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
