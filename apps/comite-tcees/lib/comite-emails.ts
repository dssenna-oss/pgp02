/**
 * Disparo de e-mail aos membros do Comitê para eventos do Plano de Trabalho.
 *
 * Cada função busca os membros com e-mail cadastrado e dispara em
 * fire-and-forget (não bloqueia a server action). Em ausência de credencial
 * Brevo, `sendEmailAsync` apenas loga (dry-run) — a notificação in-app já
 * cobriu quem está logado; o e-mail alcança quem não está.
 */

import { prisma } from "@/lib/prisma";
import { sendEmailAsync, escapeHtml } from "@/lib/email";

const APP_URL = process.env.NEXTAUTH_URL || "https://comite-tcees.vercel.app";

/** Busca destinatários: membros com e-mail válido cadastrado. */
async function membrosComEmail(): Promise<Array<{ email: string; name: string }>> {
  const membros = await prisma.membro.findMany({
    where: { email: { not: null } },
    select: { nome: true, email: true },
  });
  return membros
    .filter((m) => m.email && m.email.includes("@"))
    .map((m) => ({ email: m.email as string, name: m.nome }));
}

/** Layout HTML mínimo compartilhado (navy do Comitê). */
function wrap(titulo: string, corpoHtml: string, href: string, cta: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
    <div style="background:#1e3a5f;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
      <div style="font-size:13px;opacity:.8;letter-spacing:.5px">COMITÊ LGPD · TCE-ES</div>
      <div style="font-size:18px;font-weight:600;margin-top:4px">${escapeHtml(titulo)}</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
      ${corpoHtml}
      <div style="margin-top:24px">
        <a href="${href}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500">${escapeHtml(cta)}</a>
      </div>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px">
        Você recebe este aviso por integrar o Comitê Executivo de Proteção de Dados do TCE-ES.
        Acompanhe tudo no painel do Comitê.
      </p>
    </div>
  </div>`;
}

/** E-mail: nova reunião agendada. */
export async function emailNovaReuniao(params: {
  titulo: string;
  dataBR: string;
  hora?: string | null;
  local?: string | null;
  pauta?: string | null;
}): Promise<void> {
  const to = await membrosComEmail();
  if (to.length === 0) return;

  const quando = `${params.dataBR}${params.hora ? ` às ${escapeHtml(params.hora)}` : ""}`;
  const href = `${APP_URL}/dashboard/reunioes`;
  const corpo = `
    <p style="font-size:15px;line-height:1.6">Uma nova reunião do Comitê foi agendada.</p>
    <table style="font-size:14px;line-height:1.8;border-collapse:collapse">
      <tr><td style="color:#64748b;padding-right:12px">Reunião</td><td style="font-weight:600">${escapeHtml(params.titulo)}</td></tr>
      <tr><td style="color:#64748b;padding-right:12px">Quando</td><td>${quando}</td></tr>
      ${params.local ? `<tr><td style="color:#64748b;padding-right:12px">Local</td><td>${escapeHtml(params.local)}</td></tr>` : ""}
      ${params.pauta ? `<tr><td style="color:#64748b;padding-right:12px;vertical-align:top">Pauta</td><td>${escapeHtml(params.pauta.slice(0, 300))}</td></tr>` : ""}
    </table>`;

  sendEmailAsync({
    to,
    subject: `Nova reunião do Comitê: ${params.titulo} — ${quando}`,
    html: wrap("Nova reunião agendada", corpo, href, "Confirmar presença"),
    text: `Nova reunião do Comitê: ${params.titulo} em ${quando}. Acesse ${href}`,
    tag: "comite-reuniao",
  });
}

/** E-mail: pauta aprovada. */
export async function emailPautaAprovada(params: {
  titulo: string;
  dataBR: string;
  pauta?: string | null;
}): Promise<void> {
  const to = await membrosComEmail();
  if (to.length === 0) return;

  const href = `${APP_URL}/dashboard/reunioes`;
  const corpo = `
    <p style="font-size:15px;line-height:1.6">A pauta da reunião <strong>${escapeHtml(params.titulo)}</strong> (${escapeHtml(params.dataBR)}) foi aprovada.</p>
    ${params.pauta ? `<div style="background:#f8fafc;border-left:3px solid #1e3a5f;padding:12px 16px;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(params.pauta.slice(0, 600))}</div>` : ""}`;

  sendEmailAsync({
    to,
    subject: `Pauta aprovada: ${params.titulo}`,
    html: wrap("Pauta aprovada", corpo, href, "Ver pauta completa"),
    text: `A pauta da reunião ${params.titulo} (${params.dataBR}) foi aprovada. Acesse ${href}`,
    tag: "comite-pauta",
  });
}
