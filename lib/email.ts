/**
 * Cliente mínimo de e-mail transacional via API Brevo (Sendinblue).
 *
 * Por que não usar `nodemailer`/SMTP:
 *   - Brevo SMTP em Vercel exige connection pool persistente, instável em
 *     functions serverless (cold-start abre TCP a cada invocação).
 *   - A API REST `/v3/smtp/email` é stateless, autenticada por header
 *     `api-key`, suporta HTML + texto plano + reply-to e devolve `messageId`
 *     pra rastreabilidade.
 *
 * Variáveis de ambiente esperadas:
 *   BREVO_API_KEY        — começa com `xkeysib-` (NÃO usar `xsmtpsib-`)
 *   BREVO_SENDER_EMAIL   — e-mail remetente (precisa ser um sender validado na Brevo)
 *   BREVO_SENDER_NAME    — nome remetente exibido ao destinatário
 *
 * Em ausência de credencial, a função fica em modo "dry-run": loga o que
 * teria enviado e retorna `{ ok: false, mode: "dry-run" }`. Isso evita
 * derrubar fluxos durante desenvolvimento local sem credencial.
 */

export type EmailAddress = { email: string; name?: string };

export type SendTransactionalParams = {
  to: EmailAddress | EmailAddress[];
  subject: string;
  /** Conteúdo HTML do email. Obrigatório. */
  html: string;
  /** Conteúdo texto plano (fallback). Recomendado pra deliverability. */
  text?: string;
  /** Reply-to (default: sender). */
  replyTo?: EmailAddress;
  /** Cabeçalhos opcionais (X-Custom etc). */
  headers?: Record<string, string>;
  /** Tag para agrupar emails relacionados na dashboard da Brevo. */
  tags?: string[];
};

export type SendTransactionalResult =
  | { ok: true; messageId: string }
  | { ok: false; mode: "dry-run"; reason: string; preview: { subject: string; to: string } }
  | { ok: false; error: string; status?: number };

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function asArray(to: EmailAddress | EmailAddress[]): EmailAddress[] {
  return Array.isArray(to) ? to : [to];
}

/**
 * Envia um e-mail transacional via Brevo.
 *
 * Não joga exceção — sempre devolve um resultado discriminado. Cabe ao
 * caller decidir se loga erro ou volta a tentar.
 */
export async function sendTransactionalEmail(
  params: SendTransactionalParams,
): Promise<SendTransactionalResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "PGP";

  if (!apiKey || !senderEmail) {
    const reason = !apiKey
      ? "BREVO_API_KEY não configurada"
      : "BREVO_SENDER_EMAIL não configurada";
    const recipients = asArray(params.to)
      .map((r) => r.email)
      .join(", ");
    console.log(
      `[email:dry-run] ${reason}. Email NÃO enviado.`,
      `\n  to: ${recipients}`,
      `\n  subject: ${params.subject}`,
    );
    return {
      ok: false,
      mode: "dry-run",
      reason,
      preview: { subject: params.subject, to: recipients },
    };
  }

  try {
    const payload: Record<string, unknown> = {
      sender: { email: senderEmail, name: senderName },
      to: asArray(params.to),
      subject: params.subject,
      htmlContent: params.html,
    };
    if (params.text) payload.textContent = params.text;
    if (params.replyTo) payload.replyTo = params.replyTo;
    if (params.headers) payload.headers = params.headers;
    if (params.tags && params.tags.length > 0) payload.tags = params.tags;

    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        `[email] Brevo respondeu ${res.status}: ${errText.slice(0, 500)}`,
      );
      return { ok: false, error: `Brevo HTTP ${res.status}`, status: res.status };
    }

    const json = (await res.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, messageId: json.messageId || "unknown" };
  } catch (e) {
    console.error("[email] Falha ao enviar via Brevo:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

/**
 * Helper pra escapar HTML em strings vindas do usuário (anti-XSS em
 * templates de email).
 */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
