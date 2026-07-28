// E-mail transacional via Brevo (API REST, chave `xkeysib-` — NUNCA a smtp).
// Remetente: contato@clubedoservidor.com.br (validado na Brevo, DMARC ok —
// o mesmo usado nos e-mails do curso). Falha de e-mail NUNCA derruba a
// operação que o disparou: devolvemos { ok:false } e a tela avisa o admin.

const REMETENTE = { name: "Jornada LGPD · Clube do Servidor", email: "contato@clubedoservidor.com.br" };
const URL_APP = "https://jornada-lgpd.vercel.app";

async function enviarBrevo(opts: { para: { email: string; name?: string }; assunto: string; html: string }): Promise<{ ok: boolean; erro?: string }> {
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
  senhaInicial: string;
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
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:14px 18px;margin:18px 0">
        <p style="margin:0 0 6px;font-size:13px;color:#134e4a"><strong>Seu acesso:</strong></p>
        <p style="margin:0;font-size:14px">E-mail: <strong>${opts.paraEmail}</strong></p>
        <p style="margin:4px 0 0;font-size:14px">Senha inicial: <strong>${opts.senhaInicial}</strong></p>
      </div>
      <p style="margin:0 0 18px">
        <a href="${URL_APP}/entrar" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:10px">Entrar na Jornada →</a>
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">
        🔒 No primeiro acesso, troque sua senha no menu <strong>Senha</strong>, no topo da tela.
        Dúvidas? É só responder este e-mail.
      </p>
    </div>
    <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:14px">
      Jornada LGPD · Clube do Servidor · ${URL_APP.replace("https://", "")}
    </p>
  </div>`;
  return enviarBrevo({
    para: { email: opts.paraEmail, name: opts.nomeGestor },
    assunto: `Seu acesso à Jornada LGPD — ${opts.nomeInstituicao}`,
    html,
  });
}
