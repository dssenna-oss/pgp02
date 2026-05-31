import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-server";

export async function POST() {
  try {
    await requireSession();
    await prisma.notificacao.updateMany({ where: { lida: false }, data: { lida: true } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro" }, { status: 401 });
  }
}
