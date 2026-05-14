export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_MARKER_COLORS } from "@/lib/tarefas-types";

/**
 * Endpoints de Marcadores (tags) personalizados de cada usuário.
 *
 * GET  /api/marcadores       → lista os marcadores do user
 * POST /api/marcadores       → cria um novo (body: { name, color? })
 */

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true },
  });
  if (!user || !user.companyId) {
    return { error: NextResponse.json({ error: "Usuário sem organização" }, { status: 404 }) };
  }
  return { user };
}

export async function GET(_req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  const markers = await prisma.taskMarker.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ markers });
}

export async function POST(req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Nome do marcador é obrigatório (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }
  const color = VALID_MARKER_COLORS.has(body.color) ? body.color : "slate";

  try {
    const marker = await prisma.taskMarker.create({
      data: {
        userId: user.id,
        companyId: user.companyId!,
        name,
        color,
      },
    });
    return NextResponse.json({ marker }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Você já tem um marcador com esse nome" },
        { status: 409 }
      );
    }
    throw err;
  }
}
