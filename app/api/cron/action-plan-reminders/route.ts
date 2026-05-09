/**
 * Cron — Digest diário de Ações atrasadas no Plano (Etapa 27 / DPO-only).
 *
 * Disparado pelo Vercel Cron via vercel.json:
 *   schedule: "0 12 * * *" (UTC) → 9h horário Brasília (GMT-3)
 *
 * Lógica:
 *   - Pra cada DPO ativo com emailNotifyActionPlan=true:
 *     - Busca ações do PRÓPRIO companyId em status A_FAZER/EM_ANDAMENTO
 *       e dueDate < depois de amanhã (ou seja: já vencidas, vencendo
 *       hoje, ou vencendo amanhã).
 *     - Categoriza em 3 baldes (atrasadas / hoje / amanhã).
 *     - Se há ao menos 1, envia digest. Se 0, pula.
 *
 * Diferenças do cron de tarefas:
 *   - Tarefas são pessoais (filtra por userId); ações do Plano são da
 *     organização (filtra por companyId).
 *   - Várias DPOs da mesma org podem receber o MESMO conteúdo — é OK,
 *     responsabilidade compartilhada. Não tentamos deduplicar pra
 *     simplificar (e cada DPO controla via toggle se quer ou não).
 *   - Default do toggle é true (opt-out) — DPO geralmente quer saber.
 *
 * Auth: Vercel manda header `Authorization: Bearer ${CRON_SECRET}`.
 *   Em prod, exige match com env var CRON_SECRET. Em dev local sem
 *   CRON_SECRET aceita qualquer chamada pra facilitar teste.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-sender";
import {
  tplActionPlanOverdueDigest,
  type ActionPlanItem,
} from "@/lib/email-templates";

const DPO_ROLES = [
  "admin",
  "DPO_PRINCIPAL",
  "DPO_SUBSTITUTO",
  "DPO_AUXILIAR",
];

export async function GET(request: NextRequest) {
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

  // DPOs opt-in (default true), ativos, com companyId (sem company não há plano).
  const dpos = await prisma.user.findMany({
    where: {
      emailNotifyActionPlan: true,
      isActive: true,
      role: { in: DPO_ROLES },
      companyId: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      company: { select: { companyName: true } },
    },
  });

  // Pra evitar refazer query do plano por DPO da mesma org, cacheia
  // por companyId.
  const planByCompany = new Map<
    string,
    {
      overdue: ActionPlanItem[];
      dueToday: ActionPlanItem[];
      dueTomorrow: ActionPlanItem[];
    }
  >();

  let sent = 0;
  let skipped = 0;

  for (const dpo of dpos) {
    if (!dpo.companyId) {
      skipped += 1;
      continue;
    }

    let buckets = planByCompany.get(dpo.companyId);
    if (!buckets) {
      const actions = await prisma.actionPlan.findMany({
        where: {
          companyId: dpo.companyId,
          status: { in: ["A_FAZER", "EM_ANDAMENTO"] },
          dueDate: { not: null, lt: dayAfterTomorrow },
        },
        select: {
          id: true,
          title: true,
          priority: true,
          origin: true,
          dueDate: true,
          assignee: { select: { name: true } },
        },
      });

      const overdue: ActionPlanItem[] = [];
      const dueToday: ActionPlanItem[] = [];
      const dueTomorrow: ActionPlanItem[] = [];

      for (const a of actions) {
        if (!a.dueDate) continue;
        const due = new Date(
          a.dueDate.getFullYear(),
          a.dueDate.getMonth(),
          a.dueDate.getDate(),
        );
        const item: ActionPlanItem = {
          id: a.id,
          title: a.title,
          priority: a.priority,
          origin: a.origin,
          assigneeName: a.assignee?.name ?? null,
        };
        if (due < today) {
          item.daysOverdue = Math.floor(
            (today.getTime() - due.getTime()) / 86_400_000,
          );
          overdue.push(item);
        } else if (due.getTime() === today.getTime()) {
          dueToday.push(item);
        } else if (due.getTime() === tomorrow.getTime()) {
          dueTomorrow.push(item);
        }
      }

      buckets = { overdue, dueToday, dueTomorrow };
      planByCompany.set(dpo.companyId, buckets);
    }

    if (
      buckets.overdue.length === 0 &&
      buckets.dueToday.length === 0 &&
      buckets.dueTomorrow.length === 0
    ) {
      skipped += 1;
      continue;
    }

    const ok = await sendEmail({
      to: { email: dpo.email, name: dpo.name ?? undefined },
      tag: "action-plan-digest",
      ...tplActionPlanOverdueDigest({
        recipientName: dpo.name,
        recipientEmail: dpo.email,
        companyName: dpo.company?.companyName ?? null,
        overdue: buckets.overdue,
        dueToday: buckets.dueToday,
        dueTomorrow: buckets.dueTomorrow,
      }),
    });
    if (ok) sent += 1;
    else skipped += 1;
  }

  return NextResponse.json({
    ok: true,
    dpoConsidered: dpos.length,
    companiesWithPlan: planByCompany.size,
    sent,
    skipped,
  });
}
