// E-mail transacional via Brevo (API REST, chave `xkeysib-` — NUNCA a smtp).
// Remetente: contato@clubedoservidor.com.br (validado na Brevo, DMARC ok —
// o mesmo usado nos e-mails do curso). Falha de e-mail NUNCA derruba a
// operação que o disparou: devolvemos { ok:false } e a tela avisa o admin.
//
// ⚠️ O convite NÃO carrega senha (senha em e-mail = gatilho clássico de
// spam/phishing — aprendido no primeiro teste): vai um link único e
// temporário de DEFINIR a senha. Enviamos também a versão texto-plano
// (textContent) — melhora a pontuação anti-spam.

const REMETENTE = { name: "Jornada LGPD · Clube do Servidor", email: "contato@clubedoservidor.com.br" };
const URL_APP = "https://jornada-lgpd.vercel.app";

async function enviarBrevo(opts: {
  para: { email: string; name?: string };
  assunto: string;
  html: string;
  texto: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const chave = process.env.BREVO_API_KEY;
  if (!chave) return { ok: false, erro: "BREVO_API_KEY ausente" };
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": chave, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: REMETENTE,
        replyTo: REMETENTE,
        to: [opts.para],
        subject: opts.assunto,
        htmlContent: opts.html,
        textContent: opts.texto,
      }),
    });
    if (!r.ok) {
      const corpo = await r.text().catch(() => "");
      return { ok: false, erro: `Brevo ${r.status}: ${corpo.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, erro: e?.message ?? "erro de rede" };
  }
}

export async function enviarConvite(opts: {
  paraEmail: string;
  nomeGestor: string;
  nomeInstituicao: string;
  linkDefinirSenha: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
    <div style="background:#115e59;border-radius:12px 12px 0 0;padding:22px 26px">
      <div style="color:#ffffff;font-size:22px;font-weight:800;line-height:1.2">Jornada LGPD</div>
      <div style="color:#99f6e4;font-size:11px;letter-spacing:2px;font-weight:600">CLUBE DO SERVIDOR</div>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:26px">
      <p style="margin:0 0 12px">Olá, <strong>${opts.nomeGestor}</strong>!</p>
      <p style="margin:0 0 12px;line-height:1.55">
        A instituição <strong>${opts.nomeInstituicao}</strong> foi habilitada na
        <strong>Jornada LGPD</strong> — o app onde você preenche o perfil da instituição
        <strong>uma única vez</strong> e gera os <strong>21 documentos da implementação da
        LGPD prontos em Word</strong>, na ordem das 7 Fases.
      </p>
      <p style="margin:0 0 6px;line-height:1.55">
        Pra começar, crie sua senha de acesso (leva menos de um minuto):
      </p>
      <p style="margin:14px 0 18px">
        <a href="${opts.linkDefinirSenha}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:10px">Definir minha senha e entrar →</a>
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">
        Seu usuário é este e-mail (${opts.paraEmail}). O link vale por <strong>7 dias</strong> —
        se expirar, é só pedir um novo ao Clube do Servidor. Dúvidas? Responda este e-mail.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:14px">
      Jornada LGPD · Clube do Servidor · ${URL_APP.replace("https://", "")}
    </p>
  </div>`;
  const texto = [
    `Olá, ${opts.nomeGestor}!`,
    ``,
    `A instituição ${opts.nomeInstituicao} foi habilitada na Jornada LGPD — o app onde você preenche o perfil da instituição uma única vez e gera os 21 documentos da implementação da LGPD prontos em Word, na ordem das 7 Fases.`,
    ``,
    `Pra começar, crie sua senha de acesso pelo link (vale por 7 dias):`,
    opts.linkDefinirSenha,
    ``,
    `Seu usuário é este e-mail (${opts.paraEmail}). Se o link expirar, peça um novo ao Clube do Servidor.`,
    ``,
    `Jornada LGPD · Clube do Servidor · ${URL_APP.replace("https://", "")}`,
  ].join("\n");
  return enviarBrevo({
    para: { email: opts.paraEmail, name: opts.nomeGestor },
    assunto: `Seu acesso à Jornada LGPD — ${opts.nomeInstituicao}`,
    html,
    texto,
  });
}
