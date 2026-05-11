/**
 * Templates de email transacional do PGP.
 *
 * Cada função retorna `{ subject, html, text }` pronto pra passar pro
 * `sendEmail()` em lib/email-sender.ts. Templates são funções puras
 * (sem side effects, sem fetch) — chamar é barato.
 *
 * Princípios:
 *  - HTML simples e responsivo (não usa frameworks de email — table-based)
 *  - Versão `text` sempre presente (ajuda deliverability + clientes
 *    que não renderizam HTML)
 *  - Cores/fonte herdam do branding LGPD - PGP (azul #3B7FDB)
 *  - Botão CTA único por email — link absoluto pra prod
 *  - Footer institucional curto com link "gerenciar notificações"
 *    (TODO: criar página de preferências quando implementar)
 */

const PROD_URL = "https://lgpd-pgp.vercel.app";

interface TemplateOutput {
  subject: string;
  html: string;
  text: string;
}

// ============================================================
// Template base (compartilhado por todos)
// ============================================================

/**
 * Embrulha o conteúdo HTML num esqueleto institucional consistente.
 * Tabela em vez de div pra compatibilidade com clientes de email
 * antigos (Outlook etc.).
 */
function wrapEmail(args: {
  preheader: string;
  bodyHtml: string;
  ctaText?: string;
  ctaHref?: string;
}): string {
  const cta =
    args.ctaText && args.ctaHref
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
          <tr>
            <td style="background:#3B7FDB; border-radius: 6px;">
              <a href="${args.ctaHref}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px; font-weight: 600;">
                ${args.ctaText}
              </a>
            </td>
          </tr>
        </table>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LGPD - PGP</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1f2937;">
<!-- Preheader oculto (texto que aparece no preview do inbox) -->
<div style="display: none; font-size: 1px; color: #f5f7fa; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
  ${args.preheader}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f5f7fa;">
<tr>
<td align="center" style="padding: 24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden;">

<!-- Header -->
<tr>
<td style="background: #3B7FDB; padding: 20px 24px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td>
        <div style="font-family: Arial, sans-serif; font-size: 18px; font-weight: 700; color: #ffffff; line-height: 1.2;">
          LGPD - PGP
        </div>
        <div style="font-family: Arial, sans-serif; font-size: 11px; color: #d8e6f9; letter-spacing: 0.5px; text-transform: uppercase;">
          Programa de Governança em Privacidade
        </div>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding: 28px 24px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.55; color: #1f2937;">
${args.bodyHtml}
${cta}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding: 16px 24px 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-family: Arial, sans-serif; font-size: 11px; color: #6b7280; line-height: 1.5;">
  Este é um email automático do Sistema PGP.
  Não responda diretamente — para suporte, contate seu Encarregado (DPO).
  <br>
  <a href="${PROD_URL}/dashboard" style="color: #3B7FDB; text-decoration: none;">Acesse o painel</a>
  &nbsp;·&nbsp;
  <a href="${PROD_URL}/dashboard/configuracoes" style="color: #3B7FDB; text-decoration: none;">Gerenciar notificações</a>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

// ============================================================
// 1. Mensagem direta no Fórum (DM)
// ============================================================

export interface ForumDmArgs {
  recipientName: string | null;
  recipientEmail: string;
  authorName: string;
  postTitle: string;
  postContentPreview: string;
  postId: string;
}

export function tplForumDm(args: ForumDmArgs): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const subject = `Nova mensagem de ${args.authorName}: "${args.postTitle}"`;

  const preview = args.postContentPreview.slice(0, 200).trim();
  const previewSafe = escapeHtml(preview);

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      Você recebeu uma mensagem direta de
      <strong>${escapeHtml(args.authorName)}</strong> no Sistema PGP.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0; background: #f9fafb; border-left: 4px solid #3B7FDB; border-radius: 4px;">
      <tr><td style="padding: 14px 16px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 6px;">
          ${escapeHtml(args.postTitle)}
        </div>
        <div style="font-size: 13px; color: #4b5563; white-space: pre-wrap;">${previewSafe}${preview.length >= 200 ? "..." : ""}</div>
      </td></tr>
    </table>
    <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">
      Acesse o Sistema PGP para ler na íntegra e responder.
    </p>
  `;

  const html = wrapEmail({
    preheader: `${args.authorName} te enviou uma mensagem: ${args.postTitle}`,
    bodyHtml,
    ctaText: "Ler mensagem",
    ctaHref: `${PROD_URL}/dashboard/forum`,
  });

  const text = [
    `${greeting},`,
    "",
    `Você recebeu uma mensagem direta de ${args.authorName} no Sistema PGP.`,
    "",
    `Título: ${args.postTitle}`,
    "",
    preview + (preview.length >= 200 ? "..." : ""),
    "",
    `Acesse: ${PROD_URL}/dashboard/forum`,
    "",
    "—",
    "Sistema PGP - Programa de Governança em Privacidade",
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// 2. Comunicado/Anúncio público no Fórum
// ============================================================

export interface ForumAnnouncementArgs {
  recipientName: string | null;
  recipientEmail: string;
  authorName: string;
  postTitle: string;
  postContentPreview: string;
  postId: string;
  category: string;
}

export function tplForumAnnouncement(
  args: ForumAnnouncementArgs,
): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const subject = `[Comunicado LGPD] ${args.postTitle}`;
  const preview = args.postContentPreview.slice(0, 280).trim();
  const previewSafe = escapeHtml(preview);

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      O Encarregado <strong>${escapeHtml(args.authorName)}</strong> publicou
      um comunicado oficial no Fórum do PGP.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <tr><td style="padding: 14px 16px;">
        <div style="font-size: 11px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          📢 Comunicado · ${escapeHtml(args.category)}
        </div>
        <div style="font-weight: 600; color: #111827; margin-bottom: 6px;">
          ${escapeHtml(args.postTitle)}
        </div>
        <div style="font-size: 13px; color: #4b5563; white-space: pre-wrap;">${previewSafe}${preview.length >= 280 ? "..." : ""}</div>
      </td></tr>
    </table>
  `;

  const html = wrapEmail({
    preheader: `Comunicado oficial do DPO: ${args.postTitle}`,
    bodyHtml,
    ctaText: "Ler no Fórum",
    ctaHref: `${PROD_URL}/dashboard/forum`,
  });

  const text = [
    `${greeting},`,
    "",
    `O Encarregado ${args.authorName} publicou um comunicado oficial no Fórum do PGP.`,
    "",
    `📢 ${args.postTitle}`,
    `Categoria: ${args.category}`,
    "",
    preview + (preview.length >= 280 ? "..." : ""),
    "",
    `Acesse: ${PROD_URL}/dashboard/forum`,
    "",
    "—",
    "Sistema PGP - Programa de Governança em Privacidade",
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// 3. Digest diário de Tarefas vencendo (cron 9h)
// ============================================================

export interface TaskDueArgs {
  recipientName: string | null;
  recipientEmail: string;
  /** Tarefas que vencem HOJE. */
  dueToday: Array<{ id: string; title: string; priority: string }>;
  /** Tarefas que vencem AMANHÃ. */
  dueTomorrow: Array<{ id: string; title: string; priority: string }>;
  /** Tarefas JÁ VENCIDAS (atrasadas). */
  overdue: Array<{ id: string; title: string; priority: string; daysOverdue: number }>;
}

export function tplTaskDueDigest(args: TaskDueArgs): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const totalToday = args.dueToday.length;
  const totalTomorrow = args.dueTomorrow.length;
  const totalOverdue = args.overdue.length;

  // Decide o tom do assunto
  let subject: string;
  if (totalOverdue > 0) {
    subject = `🔴 Você tem ${totalOverdue} tarefa(s) atrasada(s) — confira o resumo`;
  } else if (totalToday > 0) {
    subject = `📌 Você tem ${totalToday} tarefa(s) vencendo hoje`;
  } else {
    subject = `📅 Tarefas vencendo amanhã (${totalTomorrow})`;
  }

  const renderTaskList = (
    list: Array<{ title: string; priority: string; daysOverdue?: number }>,
    color: string,
  ) =>
    list
      .map((t) => {
        const prioBadge =
          t.priority === "ALTA"
            ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;margin-left:8px;">ALTA</span>`
            : t.priority === "MEDIA"
              ? `<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;margin-left:8px;">MÉDIA</span>`
              : "";
        const overdueLabel =
          t.daysOverdue !== undefined && t.daysOverdue > 0
            ? `<span style="color:#dc2626;font-size:11px;margin-left:8px;">há ${t.daysOverdue}d</span>`
            : "";
        return `<li style="margin-bottom:6px;color:${color};">${escapeHtml(t.title)}${prioBadge}${overdueLabel}</li>`;
      })
      .join("");

  const sections: string[] = [];

  if (totalOverdue > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#991b1b;">🔴 Atrasadas (${totalOverdue})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${renderTaskList(args.overdue, "#1f2937")}</ul>
      </div>
    `);
  }

  if (totalToday > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#92400e;">📌 Vence hoje (${totalToday})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${renderTaskList(args.dueToday, "#1f2937")}</ul>
      </div>
    `);
  }

  if (totalTomorrow > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#1e40af;">📅 Vence amanhã (${totalTomorrow})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${renderTaskList(args.dueTomorrow, "#1f2937")}</ul>
      </div>
    `);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      Resumo das suas tarefas pessoais com prazos próximos no Sistema PGP:
    </p>
    ${sections.join("")}
    <p style="margin: 16px 0 4px 0; font-size: 13px; color: #6b7280;">
      Acesse o Sistema PGP para atualizar status, adicionar marcadores ou criar novas tarefas.
    </p>
  `;

  const html = wrapEmail({
    preheader: `${totalOverdue > 0 ? totalOverdue + " atrasada(s) · " : ""}${totalToday} hoje · ${totalTomorrow} amanhã`,
    bodyHtml,
    ctaText: "Abrir minhas tarefas",
    ctaHref: `${PROD_URL}/dashboard/tarefas`,
  });

  // Versão texto plain
  const textParts: string[] = [`${greeting},`, ""];
  textParts.push("Resumo das suas tarefas pessoais com prazos próximos:");
  textParts.push("");
  if (totalOverdue > 0) {
    textParts.push(`🔴 ATRASADAS (${totalOverdue}):`);
    args.overdue.forEach((t) =>
      textParts.push(`  - ${t.title} [${t.priority}] (${t.daysOverdue}d atrasada)`),
    );
    textParts.push("");
  }
  if (totalToday > 0) {
    textParts.push(`📌 VENCE HOJE (${totalToday}):`);
    args.dueToday.forEach((t) => textParts.push(`  - ${t.title} [${t.priority}]`));
    textParts.push("");
  }
  if (totalTomorrow > 0) {
    textParts.push(`📅 VENCE AMANHÃ (${totalTomorrow}):`);
    args.dueTomorrow.forEach((t) =>
      textParts.push(`  - ${t.title} [${t.priority}]`),
    );
    textParts.push("");
  }
  textParts.push(`Acesse: ${PROD_URL}/dashboard/tarefas`);
  textParts.push("");
  textParts.push("—");
  textParts.push("Sistema PGP - Programa de Governança em Privacidade");

  return { subject, html, text: textParts.join("\n") };
}

// ============================================================
// 4. Digest diário de Plano de Ação atrasado (DPO-only, cron 9h)
// ============================================================

export interface ActionPlanItem {
  id: string;
  title: string;
  priority: string;
  origin: string;
  assigneeName: string | null;
  daysOverdue?: number;
}

export interface ActionPlanDigestArgs {
  recipientName: string | null;
  recipientEmail: string;
  companyName: string | null;
  /** Ações já vencidas. */
  overdue: ActionPlanItem[];
  /** Ações que vencem HOJE. */
  dueToday: ActionPlanItem[];
  /** Ações que vencem AMANHÃ. */
  dueTomorrow: ActionPlanItem[];
}

const ORIGIN_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  GAP: "GAP",
  RISCO: "Risco",
  BASES: "Bases legais",
  OPERADOR: "Operador",
  INCIDENTE: "Incidente",
  LIA: "LIA",
  CYBER: "Cyber",
};

export function tplActionPlanOverdueDigest(
  args: ActionPlanDigestArgs,
): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const totalOverdue = args.overdue.length;
  const totalToday = args.dueToday.length;
  const totalTomorrow = args.dueTomorrow.length;

  let subject: string;
  if (totalOverdue > 0) {
    subject = `🔴 Plano de Ação: ${totalOverdue} ação(ões) atrasada(s) — atenção do DPO`;
  } else if (totalToday > 0) {
    subject = `📌 Plano de Ação: ${totalToday} ação(ões) vencem hoje`;
  } else {
    subject = `📅 Plano de Ação: ${totalTomorrow} ação(ões) vencem amanhã`;
  }

  const renderItem = (it: ActionPlanItem, color: string) => {
    const prioBadge =
      it.priority === "ALTA"
        ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;margin-left:8px;">ALTA</span>`
        : it.priority === "MEDIA"
          ? `<span style="background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;margin-left:8px;">MÉDIA</span>`
          : "";
    const originBadge = `<span style="background:#e0e7ff;color:#3730a3;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:500;margin-left:6px;">${escapeHtml(
      ORIGIN_LABEL[it.origin] ?? it.origin,
    )}</span>`;
    const overdueLabel =
      it.daysOverdue !== undefined && it.daysOverdue > 0
        ? `<span style="color:#dc2626;font-size:11px;margin-left:8px;">há ${it.daysOverdue}d</span>`
        : "";
    const assignee = it.assigneeName
      ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">Responsável: ${escapeHtml(it.assigneeName)}</div>`
      : `<div style="font-size:11px;color:#9ca3af;margin-top:2px;font-style:italic;">Sem responsável definido</div>`;
    return `<li style="margin-bottom:10px;color:${color};">
      <div>${escapeHtml(it.title)}${prioBadge}${originBadge}${overdueLabel}</div>
      ${assignee}
    </li>`;
  };

  const sections: string[] = [];

  if (totalOverdue > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#991b1b;">🔴 Atrasadas (${totalOverdue})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${args.overdue.map((it) => renderItem(it, "#1f2937")).join("")}</ul>
      </div>
    `);
  }

  if (totalToday > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#92400e;">📌 Vencem hoje (${totalToday})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${args.dueToday.map((it) => renderItem(it, "#1f2937")).join("")}</ul>
      </div>
    `);
  }

  if (totalTomorrow > 0) {
    sections.push(`
      <div style="margin-bottom:16px;padding:12px 14px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px;">
        <h3 style="margin:0 0 8px 0;font-size:14px;color:#1e40af;">📅 Vencem amanhã (${totalTomorrow})</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;">${args.dueTomorrow.map((it) => renderItem(it, "#1f2937")).join("")}</ul>
      </div>
    `);
  }

  const orgLine = args.companyName
    ? `<p style="margin: 0 0 16px 0;">Resumo do Plano de Ação institucional de <strong>${escapeHtml(args.companyName)}</strong>:</p>`
    : `<p style="margin: 0 0 16px 0;">Resumo do Plano de Ação institucional da sua organização:</p>`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    ${orgLine}
    ${sections.join("")}
    <p style="margin: 16px 0 4px 0; font-size: 13px; color: #6b7280;">
      Como Encarregado, você é o responsável formal por destravar e
      acompanhar essas ações. Acesse o Plano para ajustar prazo, mudar
      responsável ou marcar como concluída.
    </p>
  `;

  const html = wrapEmail({
    preheader: `${totalOverdue > 0 ? totalOverdue + " atrasada(s) · " : ""}${totalToday} hoje · ${totalTomorrow} amanhã`,
    bodyHtml,
    ctaText: "Abrir Plano de Ação",
    ctaHref: `${PROD_URL}/dashboard/plano-acao`,
  });

  const textParts: string[] = [`${greeting},`, ""];
  textParts.push(
    args.companyName
      ? `Resumo do Plano de Ação institucional de ${args.companyName}:`
      : `Resumo do Plano de Ação institucional da sua organização:`,
  );
  textParts.push("");
  const renderTextItem = (it: ActionPlanItem) => {
    const responsavel = it.assigneeName ?? "sem responsável";
    const overdue =
      it.daysOverdue !== undefined && it.daysOverdue > 0
        ? ` (${it.daysOverdue}d atrasada)`
        : "";
    return `  - ${it.title} [${it.priority} · ${ORIGIN_LABEL[it.origin] ?? it.origin}] — ${responsavel}${overdue}`;
  };
  if (totalOverdue > 0) {
    textParts.push(`🔴 ATRASADAS (${totalOverdue}):`);
    args.overdue.forEach((it) => textParts.push(renderTextItem(it)));
    textParts.push("");
  }
  if (totalToday > 0) {
    textParts.push(`📌 VENCEM HOJE (${totalToday}):`);
    args.dueToday.forEach((it) => textParts.push(renderTextItem(it)));
    textParts.push("");
  }
  if (totalTomorrow > 0) {
    textParts.push(`📅 VENCEM AMANHÃ (${totalTomorrow}):`);
    args.dueTomorrow.forEach((it) => textParts.push(renderTextItem(it)));
    textParts.push("");
  }
  textParts.push(`Acesse: ${PROD_URL}/dashboard/plano-acao`);
  textParts.push("");
  textParts.push("—");
  textParts.push("Sistema PGP - Programa de Governança em Privacidade");

  return { subject, html, text: textParts.join("\n") };
}

// ============================================================
// 5. Alerta IMEDIATO de ação criada/editada já atrasada (DPO-only)
// ============================================================

export interface ActionPlanOverdueAlertArgs {
  recipientName: string | null;
  recipientEmail: string;
  companyName: string | null;
  /** Trigger humano-legível: "criada" ou "editada". */
  trigger: "criada" | "editada";
  /** Ação que disparou o alerta. */
  action: {
    id: string;
    title: string;
    priority: string;
    origin: string;
    assigneeName: string | null;
    dueDate: Date | string;
    daysOverdue: number;
  };
}

/**
 * Email enviado IMEDIATAMENTE quando uma ação do Plano é criada já
 * com `dueDate` no passado, ou quando uma edição faz uma ação que
 * estava em dia ficar atrasada. Complementa (não substitui) o digest
 * diário do cron `/api/cron/action-plan-reminders`.
 *
 * Justificativa: indica oversight humano e merece atenção fora da
 * janela de 9h do digest.
 */
export function tplActionPlanOverdueAlert(
  args: ActionPlanOverdueAlertArgs,
): TemplateOutput {
  const { action } = args;
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const subject = `🔴 Ação atrasada no Plano: "${action.title.slice(0, 60)}${
    action.title.length > 60 ? "…" : ""
  }"`;

  const dueDateStr =
    typeof action.dueDate === "string"
      ? action.dueDate
      : action.dueDate.toLocaleDateString("pt-BR");

  const prioBadge =
    action.priority === "ALTA"
      ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">ALTA</span>`
      : action.priority === "MEDIA"
        ? `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">MÉDIA</span>`
        : `<span style="background:#e5e7eb;color:#374151;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">BAIXA</span>`;

  const originLabel =
    {
      MANUAL: "Manual",
      GAP: "GAP",
      RISCO: "Risco",
      BASES: "Bases legais",
      OPERADOR: "Operador",
      INCIDENTE: "Incidente",
      LIA: "LIA",
      CYBER: "Cyber",
    }[action.origin] ?? action.origin;

  const triggerSentence =
    args.trigger === "criada"
      ? "Uma nova ação foi <strong>criada já com prazo no passado</strong>"
      : "Uma ação foi <strong>editada e o novo prazo está no passado</strong>";

  const orgLine = args.companyName
    ? ` no Plano de Ação de <strong>${escapeHtml(args.companyName)}</strong>`
    : " no Plano de Ação da sua organização";

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">${triggerSentence}${orgLine}.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
      <tr><td style="padding: 14px 16px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 15px;">
          ${escapeHtml(action.title)}
        </div>
        <div style="font-size: 13px; color: #4b5563; line-height: 1.7;">
          ${prioBadge}
          <span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;margin-left:6px;">${escapeHtml(originLabel)}</span>
          <br>
          <strong>Prazo:</strong> ${escapeHtml(dueDateStr)}
          <span style="color:#dc2626;font-weight:600;margin-left:6px;">(há ${action.daysOverdue} dia${action.daysOverdue === 1 ? "" : "s"})</span><br>
          <strong>Responsável:</strong> ${
            action.assigneeName
              ? escapeHtml(action.assigneeName)
              : '<em style="color:#9ca3af;">Sem responsável definido</em>'
          }
        </div>
      </td></tr>
    </table>
    <p style="margin: 16px 0 4px 0; font-size: 13px; color: #6b7280;">
      Como Encarregado, considere: confirmar que o prazo está correto,
      ajustar a data, reatribuir o responsável ou marcar a ação como
      concluída/cancelada se não fizer mais sentido.
    </p>
  `;

  const html = wrapEmail({
    preheader: `Ação atrasada há ${action.daysOverdue}d — ${action.title.slice(0, 80)}`,
    bodyHtml,
    ctaText: "Abrir ação no Plano",
    ctaHref: `${PROD_URL}/dashboard/plano-acao`,
  });

  const text = [
    `${greeting},`,
    "",
    args.trigger === "criada"
      ? `Uma nova ação foi criada já com prazo no passado${args.companyName ? ` em ${args.companyName}` : ""}:`
      : `Uma ação foi editada e o novo prazo está no passado${args.companyName ? ` em ${args.companyName}` : ""}:`,
    "",
    `🔴 ${action.title}`,
    `   Prioridade: ${action.priority}`,
    `   Origem: ${originLabel}`,
    `   Prazo: ${dueDateStr} (há ${action.daysOverdue} dia${action.daysOverdue === 1 ? "" : "s"})`,
    `   Responsável: ${action.assigneeName ?? "sem responsável"}`,
    "",
    `Acesse: ${PROD_URL}/dashboard/plano-acao`,
    "",
    "—",
    "Sistema PGP - Programa de Governança em Privacidade",
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// 6. Processos atribuídos por DPO ao Contribuidor (Carta de Serviços)
// ============================================================

export interface ProcessosAtribuidosArgs {
  recipientName: string | null;
  recipientEmail: string;
  /** Nome do DPO que fez a atribuição (vai na frase de abertura). */
  dpoName: string;
  /** Nome da org (opcional — não bloqueia o template se não for passado). */
  companyName: string | null;
  /** Rascunhos criados pra este Contribuidor — `id` vira link direto. */
  processes: Array<{ id: string; name: string }>;
}

/**
 * Notifica o Contribuidor que o DPO atribuiu N rascunhos de processos
 * pra ele revisar/completar. Disparado pelo endpoint
 * `/api/inventario/sugerir-da-carta/materialize` quando o DPO marca
 * "Notificar por email" no modal de atribuição.
 *
 * Respeita `User.emailNotifyAnnouncements` (mesmo toggle dos Comunicados —
 * tem a mesma natureza institucional, vinda do Encarregado).
 */
export function tplProcessosAtribuidos(
  args: ProcessosAtribuidosArgs,
): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";
  const n = args.processes.length;
  const orgLine = args.companyName ? ` em ${escapeHtml(args.companyName)}` : "";

  const subject =
    n === 1
      ? `O DPO atribuiu 1 processo pra você revisar`
      : `O DPO atribuiu ${n} processos pra você revisar`;

  const itemsHtml = args.processes
    .map(
      (p) =>
        `<li style="margin-bottom:6px;">
           <a href="${PROD_URL}/dashboard/inventario/${encodeURIComponent(p.id)}/editar" style="color:#3B7FDB;text-decoration:none;font-weight:500;">${escapeHtml(p.name)}</a>
         </li>`,
    )
    .join("");

  const itemsText = args.processes
    .map((p, i) => `  ${i + 1}. ${p.name}\n     ${PROD_URL}/dashboard/inventario/${p.id}/editar`)
    .join("\n");

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      O Encarregado <strong>${escapeHtml(args.dpoName)}</strong>${orgLine}
      atribuiu <strong>${n} processo${n === 1 ? "" : "s"}</strong> pra você
      revisar no Inventário de Dados Pessoais.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
      <tr><td style="padding: 14px 16px;">
        <div style="font-size: 11px; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          📋 Processos atribuídos a você
        </div>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#1f2937;">
          ${itemsHtml}
        </ul>
      </td></tr>
    </table>
    <p style="margin: 16px 0 4px 0; font-size: 13px; color: #6b7280;">
      Os campos já vêm <strong>pré-preenchidos pela IA</strong> com base na
      Carta de Serviços da organização. <strong>Revise cada um antes de submeter</strong>
      pro DPO — confirme se os dados batem com a realidade do seu setor,
      complete o que ficou em branco e ajuste o que estiver impreciso.
    </p>
  `;

  const html = wrapEmail({
    preheader: `${args.dpoName} atribuiu ${n} processo${n === 1 ? "" : "s"} pra você revisar`,
    bodyHtml,
    ctaText: "Abrir meu Inventário",
    ctaHref: `${PROD_URL}/dashboard/inventario`,
  });

  const text = [
    `${greeting},`,
    "",
    `O Encarregado ${args.dpoName}${args.companyName ? ` em ${args.companyName}` : ""} atribuiu ${n} processo${n === 1 ? "" : "s"} pra você revisar no Inventário:`,
    "",
    itemsText,
    "",
    "Os campos já vêm pré-preenchidos pela IA com base na Carta de Serviços. Revise cada um antes de submeter pro DPO — confirme se os dados batem com a realidade do seu setor, complete o que ficou em branco e ajuste o que estiver impreciso.",
    "",
    `Acesse: ${PROD_URL}/dashboard/inventario`,
    "",
    "—",
    "Sistema PGP - Programa de Governança em Privacidade",
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// 7. Menção @user no Fórum (post ou reply)
// ============================================================

export interface ForumMentionArgs {
  recipientName: string | null;
  recipientEmail: string;
  /** Nome do autor que mencionou. */
  authorName: string;
  /** "post" se mencionou na criação do post, "reply" se foi numa resposta. */
  source: "post" | "reply";
  /** Título do post (sempre presente — replies referenciam o post pai). */
  postTitle: string;
  /** Preview do conteúdo onde a menção apareceu (com @Nome em texto puro). */
  contentPreview: string;
  /** Pra deep-link no email. */
  postId: string;
}

/**
 * Notifica usuário mencionado num post/reply do Fórum. Disparado quando
 * detectamos `@[Nome](mention:userId)` no content. Respeita o toggle
 * `User.emailNotifyDm` (mesma natureza institucional de DM/menção
 * direta — alguém te chamou pelo nome).
 */
export function tplForumMention(args: ForumMentionArgs): TemplateOutput {
  const recipientFirstName = (args.recipientName ?? "")
    .split(" ")[0]
    .trim();
  const greeting = recipientFirstName ? `Olá, ${recipientFirstName}` : "Olá";

  const action =
    args.source === "post"
      ? "mencionou você num post"
      : "mencionou você numa resposta";

  const subject = `${args.authorName} ${action} no Fórum`;
  const preview = args.contentPreview.slice(0, 280).trim();
  const previewSafe = escapeHtml(preview);

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;"><strong>${greeting}</strong>,</p>
    <p style="margin: 0 0 16px 0;">
      <strong>${escapeHtml(args.authorName)}</strong> ${action} do Fórum do PGP.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 4px;">
      <tr><td style="padding: 14px 16px;">
        <div style="font-size: 11px; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          ${args.source === "post" ? "💬 Post no Fórum" : "↩️ Resposta no Fórum"}
        </div>
        <div style="font-weight: 600; color: #111827; margin-bottom: 6px;">
          ${escapeHtml(args.postTitle)}
        </div>
        <div style="font-size: 13px; color: #4b5563; white-space: pre-wrap;">${previewSafe}${preview.length >= 280 ? "..." : ""}</div>
      </td></tr>
    </table>
    <p style="margin: 16px 0 4px 0; font-size: 13px; color: #6b7280;">
      Abra o Fórum pra responder ou marcar como visto.
    </p>
  `;

  const html = wrapEmail({
    preheader: `${args.authorName} ${action}: ${args.postTitle}`,
    bodyHtml,
    ctaText: "Abrir no Fórum",
    ctaHref: `${PROD_URL}/dashboard/forum`,
  });

  const text = [
    `${greeting},`,
    "",
    `${args.authorName} ${action} no Fórum do PGP.`,
    "",
    `📌 ${args.postTitle}`,
    "",
    preview + (preview.length >= 280 ? "..." : ""),
    "",
    `Acesse: ${PROD_URL}/dashboard/forum`,
    "",
    "—",
    "Sistema PGP - Programa de Governança em Privacidade",
  ].join("\n");

  return { subject, html, text };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Escape básico de HTML pra evitar injection em conteúdo dinâmico
 * vindo de input do user (título do post, conteúdo, etc.).
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
