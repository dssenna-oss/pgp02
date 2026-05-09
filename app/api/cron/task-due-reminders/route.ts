/**
 * Cron — Digest diário de Tarefas vencendo (Etapa 26 / Item 3).
 *
 * Disparado pelo Vercel Cron via vercel.json:
 *   schedule: "0 12 * * *" (UTC) → 9h horário Brasília (GMT-3)
 *
 * Lógica:
 *   - Busca todos os users com emailNotifyTaskDue=true
 *   - Pra cada user: agrega tarefas (próprias) que estão atrasadas,
 *     vencem hoje, ou vencem amanhã
 *   - Se há ao menos 1 tarefa, envia digest. Se 0, pula (sem spam).
 *
 * Auth: Vercel manda header `Authorization: Bearer ${CRON_SECRET}`.
 *   Em prod, exige match com env var CRON_SECRET (deve ser definida
 *   no Vercel). Em dev local (sem CRON_SECRET) aceita qualquer chamada
 *   pra facilitar teste manual.
 *
 * Segurança: endpoint não retorna info sensível em caso de falha de
 * auth (só 401). Volume de envio limitado pelo número de users com
 * opt-in — bem dentro do free tier Brevo.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60; // até 60s pra processar lote de users

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-sender";
import { tplTaskDueDigest } from "@/lib/email-templates";

interface TaskLite {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  status: string;
}

export async function GET(request: NextRequest) {
  // Auth via Bearer token (Vercel Cron padrão)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization") ?? "";
    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const dayAfterTomorrow = new Date(today.getTime() + 2 * 86_400_000);

  // Users opt-in
  const users = await prisma.user.findMany({
    where: { emailNotifyTaskDue: true, isActive: true },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    // Tarefas próprias (privacidade total — só dono vê) ainda não concluídas
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["A_FAZER", "EM_ANDAMENTO"] },
        dueDate: { not: null, lt: dayAfterTomorrow },
      },
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true,
      },
    });

    if (tasks.length === 0) {
      skipped += 1;
      continue;
    }

    // Categoriza por prazo
    const overdue: Array<{
      id: string;
      title: string;
      priority: string;
      daysOverdue: number;
    }> = [];
    const dueToday: Array<{ id: string; title: string; priority: string }> = [];
    const dueTomorrow: Array<{ id: string; title: string; priority: string }> = [];

    for (const t of tasks as TaskLite[]) {
      if (!t.dueDate) continue;
      const due = new Date(
        t.dueDate.getFullYear(),
        t.dueDate.getMonth(),
        t.dueDate.getDate(),
      );
      if (due < today) {
        const daysOverdue = Math.floor(
          (today.getTime() - due.getTime()) / 86_400_000,
        );
        overdue.push({
          id: t.id,
          title: t.title,
          priority: t.priority,
          daysOverdue,
        });
      } else if (due.getTime() === today.getTime()) {
        dueToday.push({ id: t.id, title: t.title, priority: t.priority });
      } else if (due.getTime() === tomorrow.getTime()) {
        dueTomorrow.push({ id: t.id, title: t.title, priority: t.priority });
      }
    }

    if (
      overdue.length === 0 &&
      dueToday.length === 0 &&
      dueTomorrow.length === 0
    ) {
      skipped += 1;
      continue;
    }

    const ok = await sendEmail({
      to: { email: user.email, name: user.name ?? undefined },
      tag: "task-due-digest",
      ...tplTaskDueDigest({
        recipientName: user.name,
        recipientEmail: user.email,
        overdue,
        dueToday,
        dueTomorrow,
      }),
    });
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    ok: true,
    usersConsidered: users.length,
    sent,
    skipped,
  });
}
