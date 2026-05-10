export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  VALID_STATUSES,
  VALID_PRIORITIES,
  TASK_STATUS,
  TASK_PRIORITY,
} from "@/lib/tarefas-types";

/**
 * Endpoints CRUD das Tarefas pessoais (caderno individual de cada usuário).
 *
 * Visibilidade: PRIVADA — só o dono vê e edita as próprias tarefas.
 * Não há "DPO vê tarefa de Contribuidor" (decidido em 2026-05-03).
 *
 * GET /api/tarefas?status=&priority=&marker=&overdue=1&dueToday=1&processId=
 *   → lista as tarefas do usuário com filtros opcionais.
 * POST /api/tarefas
 *   → cria uma nova tarefa.
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
  if (!user) {
    return { error: NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 }) };
  }
  if (!user.companyId) {
    return { error: NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 }) };
  }
  return { user };
}

export async function GET(req: NextRequest) {
  const r = await getCurrentUser();
  if ("error" in r) return r.error;
  const { user } = r;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const priority = sp.get("priority");
  const marker = sp.get("marker");
  const overdue = sp.get("overdue") === "1";
  const dueToday = sp.get("dueToday") === "1";
  const processId = sp.get("processId");

  const where: any = { userId: user.id };
  if (status && VALID_STATUSES.has(status)) where.status = status;
  if (priority && VALID_PRIORITIES.has(priority)) where.priority = priority;
  if (processId) where.dataInventoryId = processId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (overdue) {
    where.status = { not: TASK_STATUS.CONCLUIDA };
    where.dueDate = { lt: today };
  } else if (dueToday) {
    where.status = { not: TASK_STATUS.CONCLUIDA };
    where.dueDate = { gte: today, lt: tomorrow };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { status: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, setor: true },
      },
    },
  });

  // Filtro por marcador (em memória — quantidade pequena por user)
  const filtered = marker
    ? tasks.filter((t) => {
        if (!t.markers) return false;
        try {
          const arr = JSON.parse(t.markers);
          return Array.isArray(arr) && arr.includes(marker);
        } catch {
          return false;
        }
      })
    : tasks;

  return NextResponse.json({ tasks: filtered });
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

  const title = String(body.title ?? "").trim();
  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "Título é obrigatório (mínimo 2 caracteres)" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json(
      { error: "Título muito longo (máximo 200 caracteres)" },
      { status: 400 }
    );
  }

  const description = body.description
    ? String(body.description).slice(0, 5000)
    : null;
  const priority = VALID_PRIORITIES.has(body.priority)
    ? body.priority
    : TASK_PRIORITY.MEDIA;

  const markersArr = Array.isArray(body.markers)
    ? body.markers.filter((m: any) => typeof m === "string").slice(0, 10)
    : [];

  // Vínculo com processo do inventário: valida que pertence à mesma org
  let dataInventoryId: string | null = null;
  if (body.dataInventoryId) {
    const inv = await prisma.dataInventory.findFirst({
      where: {
        id: String(body.dataInventoryId),
        companyId: user.companyId!,
      },
      select: { id: true },
    });
    if (!inv) {
      return NextResponse.json(
        { error: "Processo do inventário não encontrado nesta organização" },
        { status: 400 }
      );
    }
    dataInventoryId = inv.id;
  }

  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      companyId: user.companyId!,
      title,
      description,
      priority,
      status: TASK_STATUS.A_FAZER,
      dueDate,
      markers: markersArr.length > 0 ? JSON.stringify(markersArr) : null,
      dataInventoryId,
    },
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, setor: true },
      },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
