export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  VALID_STATUSES,
  VALID_PRIORITIES,
  TASK_STATUS,
} from "@/lib/tarefas-types";

/**
 * PATCH /api/tarefas/[id] — atualiza campos mutáveis. Só o dono pode.
 * DELETE /api/tarefas/[id] — remove. Só o dono pode.
 */

async function loadTaskAndCheckOwnership(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user || !user.companyId) {
    return { error: NextResponse.json({ error: "Usuário sem organização" }, { status: 404 }) };
  }
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return { error: NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 }) };
  }
  if (task.userId !== user.id) {
    return {
      error: NextResponse.json(
        { error: "Você não é o dono desta tarefa" },
        { status: 403 }
      ),
    };
  }
  return { user, task };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadTaskAndCheckOwnership(id);
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: any = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 2 || t.length > 200) {
      return NextResponse.json(
        { error: "Título inválido (entre 2 e 200 caracteres)" },
        { status: 400 }
      );
    }
    data.title = t;
  }
  if (typeof body.description === "string" || body.description === null) {
    data.description = body.description
      ? String(body.description).slice(0, 5000)
      : null;
  }
  if (body.priority && VALID_PRIORITIES.has(body.priority)) {
    data.priority = body.priority;
  }
  if (body.status && VALID_STATUSES.has(body.status)) {
    data.status = body.status;
    data.completedAt = body.status === TASK_STATUS.CONCLUIDA ? new Date() : null;
  }
  if (body.dueDate === null) {
    data.dueDate = null;
  } else if (typeof body.dueDate === "string") {
    data.dueDate = new Date(body.dueDate);
  }
  if (Array.isArray(body.markers)) {
    const arr = body.markers
      .filter((m: any) => typeof m === "string")
      .slice(0, 10);
    data.markers = arr.length > 0 ? JSON.stringify(arr) : null;
  }
  if (body.dataInventoryId === null) {
    data.dataInventoryId = null;
  } else if (typeof body.dataInventoryId === "string") {
    const inv = await prisma.dataInventory.findFirst({
      where: { id: body.dataInventoryId, companyId: user.companyId! },
      select: { id: true },
    });
    if (!inv) {
      return NextResponse.json(
        { error: "Processo do inventário não encontrado nesta organização" },
        { status: 400 }
      );
    }
    data.dataInventoryId = inv.id;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      dataInventory: {
        select: { id: true, serviceName: true, setor: true },
      },
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { id } = await Promise.resolve(params as any);
  const r = await loadTaskAndCheckOwnership(id);
  if ("error" in r) return r.error;

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
