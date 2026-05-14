/**
 * Notificações por email pra eventos de Termo de Consentimento (Etapa 31).
 *
 * Disparado dos endpoints públicos:
 *   - POST /api/p/consent/.../accept   → notifyConsentAccepted
 *   - POST /api/p/consent/.../revoke   → notifyConsentRevoked
 *
 * Filtros:
 *   - Só DPOs da mesma org do termo (admin, DPO_PRINCIPAL, DPO_SUBSTITUTO, DPO_AUXILIAR).
 *   - Só users com `emailNotifyConsent = true` (default true).
 *   - Só users ativos (isActive = true).
 *
 * Fire-and-forget: sendEmailAsync — não bloqueia o fluxo público.
 * Erros são silenciados (logados via lib/email-sender).
 */

import { prisma } from "@/lib/db";
import { sendEmailAsync } from "@/lib/email-sender";
import {
  tplConsentAccepted,
  tplConsentRevoked,
} from "@/lib/email-templates";
import { maskCpf, maskEmail } from "@/lib/consent-utils";

const DPO_ROLES = ["admin", "DPO_PRINCIPAL", "DPO_SUBSTITUTO", "DPO_AUXILIAR"];

/**
 * Resolve display amigável do titular (preferindo nome, depois email
 * mascarado, depois CPF mascarado). Nunca devolve vazio.
 */
function titularDisplay(args: {
  name: string | null;
  email: string | null;
  cpf: string | null;
}): string {
  if (args.name) return args.name;
  if (args.email) return maskEmail(args.email);
  if (args.cpf) return maskCpf(args.cpf);
  return "(titular anônimo)";
}

async function listDpoRecipients(companyId: string) {
  return prisma.user.findMany({
    where: {
      companyId,
      isActive: true,
      role: { in: DPO_ROLES },
      emailNotifyConsent: true,
    },
    select: { name: true, email: true },
  });
}

export async function notifyConsentAccepted(args: {
  companyId: string;
  termId: string;
  termTitle: string;
  termSlug: string;
  version: number;
  titular: { name: string | null; email: string | null; cpf: string | null };
  ip: string;
  acceptedAtIso: string;
}): Promise<void> {
  try {
    const recipients = await listDpoRecipients(args.companyId);
    if (recipients.length === 0) return;
    const display = titularDisplay(args.titular);
    for (const r of recipients) {
      const { subject, html, text } = tplConsentAccepted({
        recipientName: r.name,
        recipientEmail: r.email,
        termTitle: args.termTitle,
        termSlug: args.termSlug,
        termId: args.termId,
        version: args.version,
        titularDisplay: display,
        acceptedAtIso: args.acceptedAtIso,
        ip: args.ip,
      });
      sendEmailAsync({
        to: { email: r.email, name: r.name ?? undefined },
        subject,
        html,
        text,
        tag: "consent-accepted",
      });
    }
  } catch (err) {
    console.error("[consent-notify] notifyConsentAccepted falhou:", err);
  }
}

export async function notifyConsentRevoked(args: {
  companyId: string;
  termId: string;
  termTitle: string;
  titular: { name: string | null; email: string | null; cpf: string | null };
  revokedAtIso: string;
  acceptedAtIso: string | null;
  reason: string | null;
}): Promise<void> {
  try {
    const recipients = await listDpoRecipients(args.companyId);
    if (recipients.length === 0) return;
    const display = titularDisplay(args.titular);
    for (const r of recipients) {
      const { subject, html, text } = tplConsentRevoked({
        recipientName: r.name,
        recipientEmail: r.email,
        termTitle: args.termTitle,
        termId: args.termId,
        titularDisplay: display,
        revokedAtIso: args.revokedAtIso,
        acceptedAtIso: args.acceptedAtIso,
        reason: args.reason,
      });
      sendEmailAsync({
        to: { email: r.email, name: r.name ?? undefined },
        subject,
        html,
        text,
        tag: "consent-revoked",
      });
    }
  } catch (err) {
    console.error("[consent-notify] notifyConsentRevoked falhou:", err);
  }
}
