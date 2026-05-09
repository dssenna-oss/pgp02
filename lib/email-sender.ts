/**
 * Email sender — abstração genérica pra envio de emails transacionais.
 *
 * Provider atual: Brevo (ex-Sendinblue) via API REST `/v3/smtp/email`.
 *
 * Setup (configurado em 2026-05-10):
 *   - Conta gratuita criada pelo user (Clube do Servidor)
 *   - Free tier: 300 emails/dia, suficiente pra notificações do PGP
 *   - Sem verificação de domínio próprio inicialmente; usa
 *     `noreply@brevomail.com` (FROM padrão da Brevo). Pra trocar pra
 *     domínio próprio, basta verificar DNS na Brevo e atualizar a env
 *     `BREVO_SENDER_EMAIL` no .env e Vercel.
 *
 * Variáveis necessárias no `.env`:
 *   BREVO_API_KEY=xkeysib-... (90 chars, secret)
 *   BREVO_SENDER_EMAIL=noreply@brevomail.com
 *   BREVO_SENDER_NAME=LGPD - PGP (Clube do Servidor)
 *
 * Padrão de uso:
 *   import { sendEmail } from "@/lib/email-sender";
 *   await sendEmail({
 *     to: { email: "user@org.com", name: "Maria Silva" },
 *     subject: "Você recebeu uma mensagem direta",
 *     html: "<p>Olá Maria, ...</p>",
 *     text: "Olá Maria, ..."
 *   });
 *
 * Erros são *silenciados* propositalmente (log + return false). Email
 * é melhoria — não deve quebrar o fluxo principal se falhar. O caller
 * pode checar o boolean retornado se quiser tratar.
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
  /** Tag pra rastreamento na Brevo (ex: "forum-dm", "task-due"). */
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
  const senderName = process.env.BREVO_SENDER_NAME ?? "Sistema";

  if (!apiKey || !senderEmail) {
    console.warn(
      "[email-sender] Brevo não configurado (BREVO_API_KEY ou BREVO_SENDER_EMAIL ausentes em .env). Email não enviado.",
    );
    return false;
  }

  const recipients = Array.isArray(args.to) ? args.to : [args.to];
  if (recipients.length === 0) {
    console.warn("[email-sender] Nenhum destinatário — abortando.");
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
      console.error(
        `[email-sender] Brevo retornou ${response.status}:`,
        errorText.slice(0, 500),
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email-sender] Erro de rede ao enviar email:", err);
    return false;
  }
}

/**
 * Variante "fire and forget": não bloqueia o caller esperando resposta.
 * Útil em handlers de API onde o email é melhoria não-essencial — o
 * fluxo principal (criar post, salvar tarefa) não deve esperar pela
 * Brevo responder.
 *
 * Uso típico:
 *   await prisma.thing.create(...);
 *   sendEmailAsync({ to, subject, html });
 *   return NextResponse.json({ ok: true });
 */
export function sendEmailAsync(args: SendEmailArgs): void {
  // Promise sem await, com catch interno pra não vazar UnhandledRejection
  void sendEmail(args).catch((err) => {
    console.error("[email-sender] Erro async não capturado:", err);
  });
}
