/**
 * Preferências de notificação por email do user logado (Etapa 26 + 27).
 *
 * GET    /api/me/email-prefs   → retorna { dm, announcements, taskDue, actionPlan }
 * PATCH  /api/me/email-prefs   → atualiza qualquer subset
 *                                 body: { dm?, announcements?, taskDue?, actionPlan? }
 *
 * Acesso: qualquer user autenticado (mexe só nas próprias prefs).
 * O toggle `actionPlan` só faz efeito pra DPOs — Contribuidor não
 * recebe esse digest mesmo com a flag true.
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function loadUserCtx() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return {
      error: NextResponse.json({ error: "User não existe" }, { status: 404 }),
    };
  }
  return { user };
}

export async function GET() {
  const r = await loadUserCtx();
  if ("error" in r) return r.error;
  const { user } = r;
  const prefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      emailNotifyDm: true,
      emailNotifyAnnouncements: true,
      emailNotifyTaskDue: true,
      emailNotifyActionPlan: true,
      role: true,
    },
  });
  return NextResponse.json({
    dm: prefs?.emailNotifyDm ?? true,
    announcements: prefs?.emailNotifyAnnouncements ?? true,
    taskDue: prefs?.emailNotifyTaskDue ?? false,
    actionPlan: prefs?.emailNotifyActionPlan ?? true,
    role: prefs?.role ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const r = await loadUserCtx();
  if ("error" in r) return r.error;
  const { user } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Aceita só os 4 campos conhecidos. Ignora qualquer outro.
  const data: {
    emailNotifyDm?: boolean;
    emailNotifyAnnouncements?: boolean;
    emailNotifyTaskDue?: boolean;
    emailNotifyActionPlan?: boolean;
  } = {};
  if (typeof body.dm === "boolean") data.emailNotifyDm = body.dm;
  if (typeof body.announcements === "boolean") {
    data.emailNotifyAnnouncements = body.announcements;
  }
  if (typeof body.taskDue === "boolean") {
    data.emailNotifyTaskDue = body.taskDue;
  }
  if (typeof body.actionPlan === "boolean") {
    data.emailNotifyActionPlan = body.actionPlan;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo válido pra atualizar" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
