// /api/curso/sos
//   POST  → participante chama o facilitador (cria PENDING; idempotente — se já tem
//           PENDING/ATTENDED do mesmo grupo, retorna o existente)
//   GET   → facilitador lista chamados ativos de uma turma (PENDING + ATTENDED)
//   GET (sem turmaId, c/ session de participante) → status do próprio grupo

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin, requireCompany } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { session, companyId } = await requireCompany();
    // Admin não tem grupo — não faz sentido chamar a si mesmo
    if (session.user.role === "ADMIN") {
      return NextResponse.json({ error: "Facilitador não pode chamar a si mesmo" }, { status: 400 });
    }

    const grupo = await prisma.cursoGrupo.findUnique({ where: { companyId } });
    if (!grupo) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });

    // Se já tem chamado em aberto (PENDING ou ATTENDED), retorna ele (idempotente)
    const aberto = await prisma.assistanceRequest.findFirst({
      where: { grupoId: grupo.id, status: { in: ["PENDING", "ATTENDED"] } },
      orderBy: { createdAt: "desc" },
    });
    if (aberto) {
      return NextResponse.json({ ok: true, request: aberto, novo: false });
    }

    const novo = await prisma.assistanceRequest.create({
      data: {
        grupoId: grupo.id,
        requestedById: session.user.id,
        requestedByName: session.user.name || session.user.email,
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true, request: novo, novo: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const turmaId = req.nextUrl.searchParams.get("turmaId");

  // Modo facilitador: lista todos chamados ativos da turma
  if (turmaId) {
    try {
      await requireAdmin();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    const grupos = await prisma.cursoGrupo.findMany({
      where: { turmaId },
      select: { id: true },
    });
    const grupoIds = grupos.map((g) => g.id);

    const ativos = await prisma.assistanceRequest.findMany({
      where: { grupoId: { in: grupoIds }, status: { in: ["PENDING", "ATTENDED"] } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ requests: ativos });
  }

  // Modo participante: estado do próprio grupo
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return NextResponse.json({ request: null });

  const grupo = await prisma.cursoGrupo.findUnique({ where: { companyId } });
  if (!grupo) return NextResponse.json({ request: null });

  const aberto = await prisma.assistanceRequest.findFirst({
    where: { grupoId: grupo.id, status: { in: ["PENDING", "ATTENDED"] } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ request: aberto });
}
