/**
 * Email transacional via API Brevo (Sendinblue) — versão mono-instituição
 * do Comitê TCEES. Copiado do app principal (lib/email-sender.ts), sem
 * mudanças de assinatura: provider stateless via `/v3/smtp/email`.
 *
 * Variáveis necessárias no `.env` / Vercel:
 *   BREVO_API_KEY=xkeysib-...        (secret — NÃO usar xsmtpsib-)
 *   BREVO_SENDER_EMAIL=noreply@...   (sender validado na Brevo)
 *   BREVO_SENDER_NAME=Comitê LGPD TCEES
 *
 * Em ausência de credencial, fica em "dry-run": loga e retorna false sem
 * derrubar o fluxo (e-mail é melhoria, não pode quebrar a server action).
 */

interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailArgs {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  /** Versão texto plano (recomendado pra deliverability). */
  text?: string;
  /** Email de resposta se diferente do sender padrão. */
  replyTo?: EmailRecipient;
  /** Tag pra rastreamento na Brevo (ex: "reuniao", "pauta"). */
  tag?: string;
}

interface BrevoApiPayload {
  sender: { email: string; name: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  tags?: string[];
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Envia um email transacional via Brevo. Silencioso em erro.
 * Retorna true se enviou (200/201), false em qualquer outro caso.
 */
export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "Comitê LGPD TCEES";

  if (!apiKey || !senderEmail) {
    console.warn(
      "[email] Brevo não configurado (BREVO_API_KEY ou BREVO_SENDER_EMAIL ausentes). Email não enviado.",
    );
    return false;
  }

  const recipients = Array.isArray(args.to) ? args.to : [args.to];
  if (recipients.length === 0) {
    console.warn("[email] Nenhum destinatário — abortando.");
    return false;
  }

  const payload: BrevoApiPayload = {
    sender: { email: senderEmail, name: senderName },
    to: recipients.map((r) => ({
      email: r.email,
      ...(r.name ? { name: r.name } : {}),
    })),
    subject: args.subject,
    htmlContent: args.html,
    ...(args.text ? { textContent: args.text } : {}),
    ...(args.replyTo
      ? {
          replyTo: {
            email: args.replyTo.email,
            ...(args.replyTo.name ? { name: args.replyTo.name } : {}),
          },
        }
      : {}),
    ...(args.tag ? { tags: [args.tag] } : {}),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(sem corpo)");
      console.error(`[email] Brevo retornou ${response.status}:`, errorText.slice(0, 500));
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Erro de rede ao enviar email:", err);
    return false;
  }
}

/**
 * Variante "fire and forget": não bloqueia o caller. E-mail é melhoria
 * não-essencial — a server action (criar reunião, aprovar pauta) não deve
 * esperar a Brevo responder nem falhar se ela falhar.
 */
export function sendEmailAsync(args: SendEmailArgs): void {
  void sendEmail(args).catch((err) => {
    console.error("[email] Erro async não capturado:", err);
  });
}

/** Escapa HTML em strings de usuário (anti-XSS em templates de email). */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
