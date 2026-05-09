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
