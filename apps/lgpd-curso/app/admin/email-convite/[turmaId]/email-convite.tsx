"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Mail, Users, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Props = {
  turmaId: string;
  turmaNome: string;
  cidade: string;
  acessoInicio: string | null;
  acessoFim: string | null;
  emails: string[];
  baseUrl: string;
};

function dataLonga(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

// ---------------------------------------------------------------------------
// Conteúdo do e-mail (HTML com estilos inline — exigência dos clientes de
// e-mail, que ignoram <style> e classes CSS).
// ---------------------------------------------------------------------------

const ETAPAS: { titulo: string; desc: string }[] = [
  {
    titulo: "Inventário de dados",
    desc: "descobrir e listar todos os dados pessoais que a organização coleta e usa.",
  },
  {
    titulo: "Análise de Riscos",
    desc: "identificar o que pode dar errado com esses dados e o impacto na vida do cidadão.",
  },
  {
    titulo: "Diagnóstico de maturidade (GAP)",
    desc: "medir, com honestidade, o quanto a organização já está adequada à lei.",
  },
  {
    titulo: "Plano de Ação",
    desc: "transformar cada lacuna encontrada em tarefas concretas, com responsável e prazo.",
  },
  {
    titulo: "Documentos da adequação",
    desc: "elaborar o RIPD, organizar os contratos com terceiros, abrir o canal de direitos do titular e publicar o Aviso de Privacidade.",
  },
  {
    titulo: "Resposta a Incidentes",
    desc: "agir rápido e dentro do prazo legal quando um vazamento acontece — com uma simulação surpresa no curso!",
  },
];

function dinamicaBullets(cidade: string): string[] {
  return [
    `Você entra no cenário fictício do <b>município de ${cidade}</b> e assume um papel real numa equipe: Encarregado (DPO), dono de um processo, TI, Comunicação...`,
    "Em grupo, vocês cumprem missões cronometradas usando um app de verdade — as mesmas ferramentas de uma adequação real.",
    "<b>Errar faz parte.</b> O ambiente é fictício e seguro: foi feito para você descobrir as armadilhas da LGPD na prática, sem nenhum risco.",
    "No fim, o seu “município” recebe um selo de maturidade — e há premiação para os grupos que se destacarem.",
  ];
}

const TELAS: { arquivo: string; legenda: string }[] = [
  {
    arquivo: "inventario.png",
    legenda: "Inventário de Dados — você mapeia os dados pessoais que a organização trata.",
  },
  {
    arquivo: "riscos.png",
    legenda: "Análise de Riscos — você vê o que pode dar errado e o impacto para o cidadão.",
  },
  {
    arquivo: "aviso.png",
    legenda: "Aviso de Privacidade — você publica uma página de transparência para o cidadão.",
  },
  {
    arquivo: "painel.png",
    legenda: "Painel do Facilitador — o instrutor acompanha o avanço de todos os grupos ao vivo.",
  },
];

function botaoConfirmar(confirmUrl: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${confirmUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:8px;">Confirmar minha presença</a>
      <div style="font-size:12px;color:#6b7280;margin-top:8px;">Leva 10 segundos — é só informar o e-mail desta inscrição.</div>
    </div>`;
}

function buildEmailHtml(opts: {
  turmaNome: string;
  cidade: string;
  confirmUrl: string;
  acessoTexto: string;
  baseUrl: string;
}): string {
  const { turmaNome, cidade, confirmUrl, acessoTexto, baseUrl } = opts;

  const etapasHtml = ETAPAS.map(
    (e, i) => `
      <div style="margin-bottom:12px;">
        <span style="display:inline-block;width:26px;height:26px;background:#2563EB;color:#ffffff;border-radius:13px;text-align:center;line-height:26px;font-size:13px;font-weight:700;vertical-align:top;">${i + 1}</span>
        <span style="display:inline-block;width:90%;font-size:14px;line-height:1.5;color:#1f2937;padding-left:8px;"><b>${e.titulo}</b> — ${e.desc}</span>
      </div>`,
  ).join("");

  const dinamicaHtml = dinamicaBullets(cidade).map(
    (b) => `
      <div style="margin-bottom:10px;font-size:14px;line-height:1.5;color:#1f2937;">
        <span style="color:#2563EB;font-weight:700;">&#9656;</span>&nbsp; ${b}
      </div>`,
  ).join("");

  const telasHtml = TELAS.map(
    (t) => `
      <div style="margin-bottom:18px;">
        <img src="${baseUrl}/email-assets/${t.arquivo}" alt="${t.legenda}" width="516" style="width:100%;max-width:516px;border:1px solid #e5e7eb;border-radius:8px;display:block;margin:0 auto;" />
        <div style="font-size:12px;color:#6b7280;text-align:center;margin-top:6px;">${t.legenda}</div>
      </div>`,
  ).join("");

  return `
  <div style="background:#1e3a8a;padding:34px 28px;text-align:center;">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">Curso Prático de LGPD</div>
    <div style="font-size:23px;font-weight:700;color:#ffffff;line-height:1.35;">A sua vaga está reservada.<br />Falta só você confirmar presença!</div>
  </div>

  <div style="padding:28px;">
    <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 14px;">Olá!</p>
    <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 14px;">
      Estamos muito perto de começar o <b>Curso Prático de LGPD</b> — turma <b>${turmaNome}</b> — e o seu nome está na lista de inscritos. Antes da aula, precisamos de um passo rápido seu: <b>confirmar a sua presença</b>. Isso ajuda a organizar os grupos e garante o seu lugar.
    </p>

    ${botaoConfirmar(confirmUrl)}

    <div style="background:#eff6ff;border-radius:10px;padding:20px;margin:24px 0;">
      <div style="font-size:16px;font-weight:700;color:#1e3a8a;margin:0 0 12px;">Não é uma palestra. É prática.</div>
      ${dinamicaHtml}
    </div>

    <div style="margin:24px 0;">
      <div style="font-size:16px;font-weight:700;color:#1e3a8a;margin:0 0 4px;">As etapas da LGPD que você vai praticar</div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Em cerca de 3 horas, o seu grupo percorre o caminho completo de adequação à lei:</p>
      ${etapasHtml}
    </div>

    <div style="margin:24px 0;">
      <div style="font-size:16px;font-weight:700;color:#1e3a8a;margin:0 0 4px;">O app que você vai usar</div>
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Cada etapa acontece numa tela simples e guiada. Veja alguns exemplos:</p>
      ${telasHtml}
    </div>

    <div style="background:#fef3c7;border-left:4px solid #d97706;border-radius:6px;padding:16px;margin:24px 0;">
      <div style="font-size:14px;font-weight:700;color:#78350f;margin:0 0 4px;">Acesso estendido para revisão</div>
      <p style="margin:0;font-size:14px;line-height:1.55;color:#78350f;">${acessoTexto}</p>
    </div>

    <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 4px;">
      Conte com a gente nessa. Confirme a sua presença agora e garanta o seu lugar:
    </p>

    ${botaoConfirmar(confirmUrl)}

    <p style="font-size:14px;line-height:1.6;color:#1f2937;margin:18px 0 4px;">Qualquer dúvida, é só responder este e-mail.</p>
    <p style="font-size:14px;line-height:1.6;color:#1f2937;margin:0;">Até breve!<br /><b>Equipe do Curso Prático de LGPD</b></p>
  </div>

  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
    <div style="font-size:11px;line-height:1.5;color:#9ca3af;">
      Curso Prático de LGPD &middot; Ambiente de treinamento — toda a prática acontece num cenário fictício, sem dados reais.
    </div>
  </div>`;
}

// Estilo do "envelope" branco do e-mail — aplicado tanto na pré-visualização
// quanto no HTML copiado.
const CARD_STYLE: React.CSSProperties = {
  maxWidth: 600,
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  fontFamily: "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  color: "#1f2937",
};

export function EmailConvite({
  turmaId,
  turmaNome,
  cidade,
  acessoInicio,
  acessoFim,
  emails,
  baseUrl,
}: Props) {
  const emailRef = useRef<HTMLDivElement>(null);

  const [assunto, setAssunto] = useState(
    `Confirme sua presença — Curso Prático de LGPD (turma ${turmaNome})`,
  );

  const confirmUrl = `${baseUrl}/confirmar/${turmaId}`;

  const acessoTexto = useMemo(() => {
    if (acessoInicio && acessoFim) {
      return `Além da aula prática, você terá o app liberado de <b>${dataLonga(acessoInicio)}</b> a <b>${dataLonga(acessoFim)}</b> para rever todo o conteúdo no seu ritmo, quantas vezes quiser.`;
    }
    if (acessoInicio) {
      return `Além da aula prática, o app fica liberado a partir de <b>${dataLonga(acessoInicio)}</b> para você rever todo o conteúdo no seu ritmo.`;
    }
    if (acessoFim) {
      return `Além da aula prática, o app fica liberado até <b>${dataLonga(acessoFim)}</b> para você rever todo o conteúdo no seu ritmo.`;
    }
    return "Além da aula prática, o app fica liberado por um período extra para você rever todo o conteúdo no seu ritmo — as datas serão informadas em breve.";
  }, [acessoInicio, acessoFim]);

  const emailHtml = useMemo(
    () => buildEmailHtml({ turmaNome, cidade, confirmUrl, acessoTexto, baseUrl }),
    [turmaNome, cidade, confirmUrl, acessoTexto, baseUrl],
  );

  function copiar(tipo: "email" | "destinatarios" | "assunto") {
    if (tipo === "assunto") {
      navigator.clipboard.writeText(assunto).then(
        () => toast.success("Assunto copiado."),
        () => toast.error("Não foi possível copiar."),
      );
      return;
    }
    if (tipo === "destinatarios") {
      if (emails.length === 0) {
        toast.error("Nenhum e-mail cadastrado nesta turma ainda.");
        return;
      }
      navigator.clipboard.writeText(emails.join(", ")).then(
        () => toast.success(`${emails.length} destinatário(s) copiado(s).`),
        () => toast.error("Não foi possível copiar."),
      );
      return;
    }
    // tipo === "email"
    const div = emailRef.current;
    if (!div) return;
    const clone = div.cloneNode(true) as HTMLElement;
    clone.removeAttribute("contenteditable");
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    const html = clone.outerHTML;
    const texto = div.innerText;
    copiarRico(html, texto, div);
  }

  function copiarRico(html: string, texto: string, node: HTMLElement) {
    const okMsg = "E-mail copiado! Cole no corpo da mensagem (Ctrl+V).";
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([texto], { type: "text/plain" }),
          }),
        ])
        .then(
          () => toast.success(okMsg),
          () => copiarPorSelecao(node, okMsg),
        );
    } else {
      copiarPorSelecao(node, okMsg);
    }
  }

  // Fallback: seleciona o nó renderizado e usa execCommand (copia formatado).
  function copiarPorSelecao(node: HTMLElement, okMsg: string) {
    try {
      const range = document.createRange();
      range.selectNode(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      const ok = document.execCommand("copy");
      sel?.removeAllRanges();
      if (ok) toast.success(okMsg);
      else toast.error("Não foi possível copiar — selecione o e-mail manualmente.");
    } catch {
      toast.error("Não foi possível copiar — selecione o e-mail manualmente.");
    }
  }

  function restaurar() {
    if (emailRef.current) emailRef.current.innerHTML = emailHtml;
    toast.success("Modelo restaurado.");
  }

  return (
    <div className="space-y-5">
      {/* Como usar */}
      <div className="border rounded-lg bg-blue-50 border-blue-200 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900 mb-2">
          <Info className="h-4 w-4" /> Como enviar este convite
        </div>
        <ol className="text-[13px] text-blue-900 space-y-1 list-decimal pl-5">
          <li>Copie os <b>destinatários</b> e cole no campo <b>Cco</b> (cópia oculta) do seu e-mail — assim um inscrito não vê o e-mail do outro.</li>
          <li>Copie o <b>assunto</b> e cole no campo de assunto.</li>
          <li>Clique em <b>Copiar e-mail</b> e cole no corpo da mensagem (Ctrl+V) — a formatação vai junto.</li>
          <li>Ajuste o que quiser direto no texto abaixo antes de copiar, revise e envie.</li>
        </ol>
      </div>

      {/* Destinatários */}
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4 text-brand-600" />
            Destinatários ({emails.length})
          </div>
          <Button size="sm" variant="outline" onClick={() => copiar("destinatarios")}>
            <Copy className="h-4 w-4" /> Copiar destinatários
          </Button>
        </div>
        {emails.length > 0 ? (
          <div className="bg-gray-50 border rounded p-2 text-[11px] font-mono text-gray-700 max-h-24 overflow-y-auto break-all">
            {emails.join(", ")}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Nenhum e-mail cadastrado nesta turma. Volte ao <b>Controle de turma</b>, clique em
            <b> Gerenciar</b> na turma e cole a lista de e-mails dos inscritos.
          </p>
        )}
      </div>

      {/* Assunto */}
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Mail className="h-4 w-4 text-brand-600" />
            Assunto
          </div>
          <Button size="sm" variant="outline" onClick={() => copiar("assunto")}>
            <Copy className="h-4 w-4" /> Copiar assunto
          </Button>
        </div>
        <input
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>

      {/* Corpo do e-mail */}
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Mail className="h-4 w-4 text-brand-600" />
            Corpo do e-mail
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={restaurar} title="Desfazer as edições e voltar ao modelo original">
              <RotateCcw className="h-4 w-4" /> Restaurar modelo
            </Button>
            <Button size="sm" onClick={() => copiar("email")}>
              <Copy className="h-4 w-4" /> Copiar e-mail
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          Clique em qualquer texto abaixo para editar. As telas do app aparecem no e-mail quando ele
          é aberto pelo destinatário.
        </p>

        {/* Pré-visualização — o quadro cinza imita a caixa de entrada */}
        <div className="bg-gray-100 rounded-lg p-3 sm:p-6 overflow-x-auto">
          <div
            ref={emailRef}
            contentEditable
            suppressContentEditableWarning
            style={CARD_STYLE}
            dangerouslySetInnerHTML={{ __html: emailHtml }}
          />
        </div>
      </div>
    </div>
  );
}
