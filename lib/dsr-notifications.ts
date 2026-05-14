/**
 * Notificações por e-mail do mini-app de Requisições de Direitos do Titular.
 *
 * Dois fluxos no recebimento:
 *   1. Confirmação ao titular   — protocolo + link de consulta.
 *   2. Alerta ao DPO            — alta prioridade, com link pro painel.
 *
 * Ambos os emails são best-effort: falha não interrompe a criação do
 * registro DSR. Erros são logados no servidor.
 */

import { sendTransactionalEmail, escapeHtml } from "@/lib/email";
import { DSR_RIGHTS, type DsrRightCode } from "@/lib/data-subject-requests";

type Org = {
  companyName: string;
  tradeName?: string | null;
  dpoName?: string | null;
  dpoEmail?: string | null;
};

type DsrSummary = {
  protocolNumber: string;
  titularName: string;
  titularEmail: string;
  titularPhone: string;
  titularCategory: string;
  requestedRights: string[];
  detailedRequest: string;
  responseChannel: string;
  dueDate: Date;
  companyId: string;
  // ID interno do DSR — usado pra link direto no painel DPO
  dsrId: string;
};

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

function rightsListHtml(codes: string[]): string {
  return codes
    .map((code) => {
      const r = DSR_RIGHTS[code as DsrRightCode];
      if (!r) return `<li><strong>${escapeHtml(code)}</strong></li>`;
      return `<li><strong>${escapeHtml(code)}</strong> — ${escapeHtml(r.label)} <em style="color:#64748b">(${escapeHtml(r.legal)})</em></li>`;
    })
    .join("");
}

function emailShell(content: string, footerNote?: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;">
        <tr><td style="padding:32px 32px 24px 32px;">
          ${content}
        </td></tr>
        ${footerNote ? `<tr><td style="padding:0 32px 24px 32px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:16px;">${footerNote}</td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// =====================================================================
// 1. Confirmação ao titular
// =====================================================================
export async function sendDsrConfirmationToTitular(
  dsr: DsrSummary,
  org: Org,
): Promise<void> {
  const orgName = org.tradeName || org.companyName;
  const lookupUrl = `${appBaseUrl()}/direitos-titulares/${dsr.companyId}/protocolo?protocolo=${encodeURIComponent(dsr.protocolNumber)}&email=${encodeURIComponent(dsr.titularEmail)}`;

  const html = emailShell(
    `
    <p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">
      Confirmação de recebimento
    </p>
    <h1 style="margin:0 0 16px 0;font-size:22px;color:#0f172a;">
      Sua requisição foi recebida pela ${escapeHtml(orgName)}.
    </h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
      Olá, <strong>${escapeHtml(dsr.titularName)}</strong>. Confirmamos o recebimento
      da sua requisição de direitos do titular, fundamentada nos arts. 18, 19
      e/ou 20 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
    </p>

    <div style="margin:24px 0;padding:16px;background:#f0fdf4;border:2px dashed #16a34a;border-radius:8px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#15803d;text-transform:uppercase;letter-spacing:0.05em;">Número do protocolo</p>
      <p style="margin:6px 0 0 0;font-family:'Courier New',monospace;font-size:22px;font-weight:bold;color:#0f172a;">
        ${escapeHtml(dsr.protocolNumber)}
      </p>
    </div>

    <p style="margin:0 0 8px 0;font-size:14px;"><strong>Prazo legal de resposta:</strong> até ${fmtDate(dsr.dueDate)} (15 dias corridos do recebimento, art. 19, §1º da LGPD).</p>

    <p style="margin:16px 0 8px 0;font-size:14px;"><strong>Direitos solicitados:</strong></p>
    <ul style="margin:0 0 16px 16px;padding-left:8px;font-size:13px;line-height:1.7;">
      ${rightsListHtml(dsr.requestedRights)}
    </ul>

    <p style="margin:24px 0 16px 0;font-size:14px;">
      Você pode acompanhar o andamento a qualquer momento usando o número do
      protocolo e este e-mail:
    </p>
    <p style="margin:0 0 24px 0;text-align:center;">
      <a href="${lookupUrl}" style="display:inline-block;background:#1e40af;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
        Consultar andamento →
      </a>
    </p>

    ${org.dpoName || org.dpoEmail ? `
    <div style="margin-top:24px;padding:12px 16px;background:#f1f5f9;border-radius:6px;font-size:13px;">
      <p style="margin:0;color:#475569;"><strong>Encarregado (DPO)</strong></p>
      ${org.dpoName ? `<p style="margin:4px 0 0 0;">${escapeHtml(org.dpoName)}</p>` : ""}
      ${org.dpoEmail ? `<p style="margin:2px 0 0 0;"><a href="mailto:${escapeHtml(org.dpoEmail)}" style="color:#1e40af;">${escapeHtml(org.dpoEmail)}</a></p>` : ""}
    </div>` : ""}
    `,
    `Caso entenda que a resposta foi insuficiente ou contrária à LGPD, você pode encaminhar reclamação à <a href="https://www.gov.br/anpd" style="color:#1e40af;">ANPD</a> (art. 18, §1º LGPD). Este e-mail é automático — para esclarecimentos, responda diretamente ao DPO.`,
  );

  const text = `Sua requisição foi recebida pela ${orgName}.

Protocolo: ${dsr.protocolNumber}
Prazo legal de resposta: ${fmtDate(dsr.dueDate)} (15 dias corridos)

Direitos solicitados:
${dsr.requestedRights.map((c) => {
  const r = DSR_RIGHTS[c as DsrRightCode];
  return r ? `- ${c}: ${r.label} (${r.legal})` : `- ${c}`;
}).join("\n")}

Consultar andamento: ${lookupUrl}

${org.dpoName ? `DPO: ${org.dpoName}` : ""}
${org.dpoEmail ? `E-mail: ${org.dpoEmail}` : ""}
`;

  await sendTransactionalEmail({
    to: { email: dsr.titularEmail, name: dsr.titularName },
    subject: `[${orgName}] Requisição de direitos LGPD recebida — protocolo ${dsr.protocolNumber}`,
    html,
    text,
    replyTo: org.dpoEmail
      ? { email: org.dpoEmail, name: org.dpoName || "Encarregado de Dados" }
      : undefined,
    tags: ["dsr", "confirmation"],
  });
}

// =====================================================================
// 2. Alerta ao DPO
// =====================================================================
export async function sendDsrAlertToDpo(
  dsr: DsrSummary,
  org: Org,
): Promise<void> {
  if (!org.dpoEmail) {
    console.log(
      `[dsr-notifications] Sem dpoEmail cadastrado em company. Alerta DPO de ${dsr.protocolNumber} não enviado.`,
    );
    return;
  }

  const adminUrl = `${appBaseUrl()}/dashboard/requisicoes-titulares`;

  const html = emailShell(
    `
    <p style="margin:0 0 8px 0;font-size:12px;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
      ⚠ Nova requisição recebida — atenção ao prazo de 15 dias
    </p>
    <h1 style="margin:0 0 16px 0;font-size:20px;color:#0f172a;">
      Protocolo ${escapeHtml(dsr.protocolNumber)}
    </h1>

    <table cellpadding="6" cellspacing="0" style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:16px;">
      <tr><td style="color:#64748b;width:140px;">Titular</td><td><strong>${escapeHtml(dsr.titularName)}</strong></td></tr>
      <tr><td style="color:#64748b;">E-mail</td><td>${escapeHtml(dsr.titularEmail)}</td></tr>
      <tr><td style="color:#64748b;">Telefone</td><td>${escapeHtml(dsr.titularPhone)}</td></tr>
      <tr><td style="color:#64748b;">Categoria</td><td>${escapeHtml(dsr.titularCategory)}</td></tr>
      <tr><td style="color:#64748b;">Canal preferido</td><td>${escapeHtml(dsr.responseChannel)}</td></tr>
      <tr><td style="color:#64748b;">Prazo legal</td><td><strong style="color:#dc2626;">${fmtDate(dsr.dueDate)}</strong></td></tr>
    </table>

    <p style="margin:8px 0 4px 0;font-size:13px;font-weight:600;">Direitos solicitados:</p>
    <ul style="margin:0 0 16px 16px;padding-left:8px;font-size:12px;line-height:1.7;">
      ${rightsListHtml(dsr.requestedRights)}
    </ul>

    <p style="margin:16px 0 4px 0;font-size:13px;font-weight:600;">Detalhamento:</p>
    <p style="margin:0 0 16px 0;font-size:13px;padding:12px;background:#f8fafc;border-left:3px solid #94a3b8;white-space:pre-wrap;">${escapeHtml(dsr.detailedRequest)}</p>

    <p style="margin:24px 0;text-align:center;">
      <a href="${adminUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
        Abrir no painel DPO →
      </a>
    </p>

    <p style="margin:16px 0 0 0;font-size:12px;color:#64748b;">
      Uma tarefa foi criada automaticamente em <strong>Minhas Tarefas</strong> com o prazo de 15 dias.
    </p>
    `,
    `Notificação automática do mini-app de Requisições de Direitos do Titular — ${escapeHtml(org.tradeName || org.companyName)}.`,
  );

  await sendTransactionalEmail({
    to: { email: org.dpoEmail, name: org.dpoName || "Encarregado de Dados" },
    subject: `[DSR] Nova requisição de direitos — ${dsr.protocolNumber} (prazo ${fmtDate(dsr.dueDate)})`,
    html,
    tags: ["dsr", "dpo-alert"],
  });
}
