"use client";

import { useMemo, useRef, useState } from "react";
import {
  Copy,
  Mail,
  Users,
  User,
  RotateCcw,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Participante = { nome: string; email: string };

type Props = {
  turmaId: string;
  turmaNome: string;
  cidade: string;
  acessoInicio: string | null;
  acessoFim: string | null;
  participantes: Participante[];
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

// Substitui o marcador [nome] do modelo pelo nome do participante. Quando o
// participante não tem nome cadastrado, remove o vocativo para o texto não
// ficar "Olá, !". No modelo genérico, [nome] é mantido (para mala direta).
function personalizar(texto: string, nome: string): string {
  if (nome) return texto.split("[nome]").join(nome);
  return texto.split("Olá, [nome]!").join("Olá!").split("[nome], ").join("");
}

// ---------------------------------------------------------------------------
// Conteúdo do e-mail (HTML com estilos inline — exigência dos clientes de
// e-mail, que ignoram <style> e classes CSS). O marcador [nome] é trocado
// na hora de copiar.
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

// Destaque "Nossas Recomendações" — orientações de preparação para o curso.
const RECOMENDACOES: string[] = [
  "É altamente recomendável que você possa utilizar seu celular ao longo de todo o curso. Geralmente a Instituição patrocinadora oferece a possibilidade de acesso Wi-Fi. Se puder levar um Notebook, seria ideal.",
  `Estude a Lei 13.709/2018 (LGPD) e leve uma cópia para consulta. Mas, para facilitar seu aprendizado, preparamos uma sugestão especial: no link a seguir você pode acessar resumos interativos de quase todos os artigos da LGPD. Basta clicar em <a href="https://heyzine.com/shelf/b96e0786a2.html" style="color:#2563eb;font-weight:600;">https://heyzine.com/shelf/b96e0786a2.html</a>.`,
];

// Bloco "Informações do curso" — exibido no final do e-mail. Valores
// editáveis direto no texto da pré-visualização antes de copiar.
const INFO_CURSO: { label: string; valor: string }[] = [
  { label: "Local", valor: "IFES Campus Venda Nova do Imigrante" },
  { label: "Data", valor: "25 e 26 de Maio" },
  { label: "Carga Horária", valor: "12 h/a" },
  { label: "Horário 25 de Maio", valor: "08h30 às 17h30" },
  { label: "Horário 26 de Maio", valor: "08h30 às 12h30" },
];

const INSTRUTOR_NOME = "Durval Senna da Silva";
const INSTRUTOR_BIO =
  "Servidor Público desde 1984, ocupante do cargo de Auditor de Controle Externo do TCEES, com atuação em diversos setores do Tribunal, como Gerência de RH, Coordenação do Núcleo de Controle de Documentos, Secretaria de Tecnologia da Informação, e atualmente um dos Coordenadores da Ouvidoria do Tribunal. Formação em Economia e pós-graduação em Gestão de RH e Gestão Pública. Pós-graduado em Lei Geral de Proteção de Dados – LGPD pela PUC Campinas. Certificado em curso de Proteção de Dados Pessoais pela DataPrivacy Brasil, parceira oficial da IAPP – International Association of Privacy Professionals. Certificado como Profissional de Privacidade de Dados – LGPD – e Certificação como Gestor de Privacidade pela empresa TIExames. CDPA - Certified Data Privacy Auditor. Cursos Google Generative AI Fundamentals. Pós-graduando em inteligência artificial e tecnologia na gestão pública - lato sensu. Treinamento EXIN Privacy and Data Protection Levels Essentials, Foundation &amp; Professional. Possui Certificação em Ouvidorias Públicas, Certificação em NPS – Net Promoter Score 2.0 – pela Track.Co. Atualmente coordena a Ouvidoria do TCE-ES e o Comitê Executivo de Proteção de Dados Pessoais do TCE-ES.";

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

  const dinamicaHtml = dinamicaBullets(cidade)
    .map(
      (b) => `
      <div style="margin-bottom:10px;font-size:14px;line-height:1.5;color:#1f2937;">
        <span style="color:#2563EB;font-weight:700;">&#9656;</span>&nbsp; ${b}
      </div>`,
    )
    .join("");

  const telasHtml = TELAS.map(
    (t) => `
      <div style="margin-bottom:18px;">
        <img src="${baseUrl}/email-assets/${t.arquivo}" alt="${t.legenda}" width="516" style="width:100%;max-width:516px;border:1px solid #e5e7eb;border-radius:8px;display:block;margin:0 auto;" />
        <div style="font-size:12px;color:#6b7280;text-align:center;margin-top:6px;">${t.legenda}</div>
      </div>`,
  ).join("");

  const infoCursoHtml = INFO_CURSO.map(
    (i) => `<div style="padding:2px 0;"><b>${i.label}:</b> ${i.valor}</div>`,
  ).join("");

  const recomendacoesHtml = RECOMENDACOES.map(
    (r, i) => `
      <div style="margin-bottom:${i < RECOMENDACOES.length - 1 ? "12px" : "0"};">
        <span style="display:inline-block;width:24px;height:24px;background:#2563eb;color:#ffffff;border-radius:12px;text-align:center;line-height:24px;font-size:12px;font-weight:700;vertical-align:top;">${i + 1}</span>
        <span style="display:inline-block;width:88%;font-size:14px;line-height:1.55;color:#1f2937;padding-left:8px;">${r}</span>
      </div>`,
  ).join("");

  return `
  <div style="background:#1e3a8a;padding:34px 28px;text-align:center;">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">Curso Prático de LGPD</div>
    <div style="font-size:23px;font-weight:700;color:#ffffff;line-height:1.35;">A sua vaga está reservada.<br />Falta só você confirmar presença!</div>
  </div>

  <div style="padding:28px;">
    <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 14px;">Olá, [nome]!</p>
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
      [nome], Conte com a gente nessa. Confirme a sua presença agora e garanta o seu lugar:
    </p>

    ${botaoConfirmar(confirmUrl)}

    <p style="font-size:14px;line-height:1.6;color:#1f2937;margin:18px 0 4px;">Qualquer dúvida, é só responder este e-mail.</p>
    <p style="font-size:14px;line-height:1.6;color:#1f2937;margin:0;">Até breve!<br /><b>Equipe do Curso Prático de LGPD</b></p>

    <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;padding:18px 20px;margin:24px 0 0;">
      <div style="font-size:16px;font-weight:700;color:#1e3a8a;margin:0 0 12px;">Nossas Recomendações</div>
      ${recomendacoesHtml}
    </div>

    <div style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;padding:20px;margin:24px 0 0;">
      <div style="font-size:16px;font-weight:700;color:#1e3a8a;margin:0 0 12px;">Informações do curso</div>
      <div style="font-size:14px;line-height:1.7;color:#1f2937;">${infoCursoHtml}</div>
      <div style="margin-top:14px;border-top:1px solid #e5e7eb;padding-top:14px;">
        <div style="font-size:14px;color:#1f2937;"><b>Instrutor:</b> ${INSTRUTOR_NOME}</div>
        <p style="font-size:12.5px;line-height:1.6;color:#4b5563;margin:6px 0 0;">${INSTRUTOR_BIO}</p>
      </div>
    </div>
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
  participantes,
  baseUrl,
}: Props) {
  const emailRef = useRef<HTMLDivElement>(null);

  const [assunto, setAssunto] = useState(
    `Confirme sua presença — Curso Prático de LGPD (turma ${turmaNome})`,
  );

  // -1 = modelo genérico (mantém [nome]); 0..n-1 = participante selecionado.
  const [selecionado, setSelecionado] = useState(-1);

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

  // Modelo do e-mail — constante (com [nome]). Não muda ao trocar de
  // participante, então as edições do facilitador no texto são preservadas.
  const emailHtml = useMemo(
    () => buildEmailHtml({ turmaNome, cidade, confirmUrl, acessoTexto, baseUrl }),
    [turmaNome, cidade, confirmUrl, acessoTexto, baseUrl],
  );

  const atual = selecionado >= 0 ? participantes[selecionado] : null;
  const destinatarios = atual ? [atual.email] : participantes.map((p) => p.email);

  function copiarTexto(texto: string, msg: string) {
    navigator.clipboard.writeText(texto).then(
      () => toast.success(msg),
      () => toast.error("Não foi possível copiar."),
    );
  }

  function copiarDestinatarios() {
    if (destinatarios.length === 0) {
      toast.error("Nenhum participante cadastrado nesta turma ainda.");
      return;
    }
    copiarTexto(
      destinatarios.join(", "),
      atual ? "Destinatário copiado." : `${destinatarios.length} destinatário(s) copiado(s).`,
    );
  }

  function copiarEmail() {
    const div = emailRef.current;
    if (!div) return;
    const clone = div.cloneNode(true) as HTMLElement;
    clone.removeAttribute("contenteditable");
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    let html = clone.outerHTML;
    let texto = div.innerText;
    // Genérico mantém [nome]; participante tem o nome aplicado.
    if (atual) {
      html = personalizar(html, atual.nome);
      texto = personalizar(texto, atual.nome);
    }
    const msg = atual
      ? `E-mail de ${atual.nome || atual.email} copiado! Cole no corpo da mensagem (Ctrl+V).`
      : "E-mail copiado! Cole no corpo da mensagem (Ctrl+V).";
    copiarRico(html, texto, div, msg);
  }

  function copiarRico(html: string, texto: string, node: HTMLElement, msg: string) {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([texto], { type: "text/plain" }),
          }),
        ])
        .then(
          () => toast.success(msg),
          () => copiarPorSelecao(node, msg),
        );
    } else {
      copiarPorSelecao(node, msg);
    }
  }

  // Fallback: seleciona o nó renderizado e usa execCommand (copia formatado).
  function copiarPorSelecao(node: HTMLElement, msg: string) {
    try {
      const range = document.createRange();
      range.selectNode(node);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      const ok = document.execCommand("copy");
      sel?.removeAllRanges();
      if (ok) toast.success(msg);
      else toast.error("Não foi possível copiar — selecione o e-mail manualmente.");
    } catch {
      toast.error("Não foi possível copiar — selecione o e-mail manualmente.");
    }
  }

  function restaurar() {
    if (emailRef.current) emailRef.current.innerHTML = emailHtml;
    toast.success("Modelo restaurado.");
  }

  // Gera o convite como PDF (via janela de impressão do navegador). Útil
  // para anexar no e-mail. O PDF nunca mostra o marcador [nome]: personaliza
  // se houver participante selecionado, senão usa a versão sem vocativo.
  function baixarPdf() {
    const div = emailRef.current;
    if (!div) return;
    const clone = div.cloneNode(true) as HTMLElement;
    clone.removeAttribute("contenteditable");
    clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
    const html = personalizar(clone.outerHTML, atual ? atual.nome : "");
    const titulo = `Convite - Curso Prático de LGPD${atual ? " - " + (atual.nome || atual.email) : ""}`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("O navegador bloqueou a janela. Libere os pop-ups e tente de novo.");
      return;
    }
    win.document.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />` +
        `<title>${titulo}</title>` +
        `<style>@page{margin:14mm;}body{margin:0;background:#ffffff;}</style>` +
        `</head><body>${html}` +
        `<script>window.onload=function(){window.print()};window.onafterprint=function(){window.close()};</script>` +
        `</body></html>`,
    );
    win.document.close();
    toast.success('Abrindo a impressão — escolha "Salvar como PDF" no destino.');
  }

  const totalPart = participantes.length;

  return (
    <div className="space-y-5">
      {/* Como usar */}
      <div className="border rounded-lg bg-blue-50 border-blue-200 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-900 mb-2">
          <Info className="h-4 w-4" /> Como enviar este convite
        </div>
        <p className="text-[13px] text-blue-900 mb-1">
          <b>Para enviar com o nome de cada pessoa:</b>
        </p>
        <ol className="text-[13px] text-blue-900 space-y-1 list-decimal pl-5 mb-2">
          <li>Em <b>"Para quem enviar"</b>, escolha um participante — o e-mail passa a falar com ele pelo nome.</li>
          <li>Copie o <b>destinatário</b>, o <b>assunto</b> e o <b>e-mail</b>, cole no seu Gmail/Outlook e envie.</li>
          <li>Clique em <b>"Próximo"</b> e repita para a próxima pessoa.</li>
        </ol>
        <p className="text-[13px] text-blue-900">
          <b>Para enviar de uma vez para todos:</b> escolha <b>"Modelo genérico"</b>. O texto mantém
          a marca <code className="bg-blue-100 px-1 rounded">[nome]</code> — use a mala direta
          (mail merge) do seu e-mail, ou envie assim mesmo.
        </p>
      </div>

      {/* Para quem enviar */}
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
          <Users className="h-4 w-4 text-brand-600" />
          Para quem enviar
        </div>

        {totalPart === 0 ? (
          <p className="text-xs text-gray-500">
            Nenhum participante cadastrado nesta turma. Volte ao <b>Controle de turma</b>, clique
            em <b>Gerenciar</b> na turma e cole a lista de nomes e e-mails dos inscritos.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selecionado}
                onChange={(e) => setSelecionado(Number(e.target.value))}
                className="flex-1 min-w-[200px] px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value={-1}>— Modelo genérico (todos, com [nome]) —</option>
                {participantes.map((p, i) => (
                  <option key={p.email} value={i}>
                    {p.nome || "(sem nome)"} — {p.email}
                  </option>
                ))}
              </select>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelecionado((s) => Math.max(-1, s - 1))}
                  disabled={selecionado <= -1}
                  title="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelecionado((s) => Math.min(totalPart - 1, s + 1))}
                  disabled={selecionado >= totalPart - 1}
                  title="Próximo"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
              {atual ? (
                <>
                  <User className="h-3.5 w-3.5 text-brand-600" />
                  <span>
                    Enviando para <b>{atual.nome || atual.email}</b> — participante{" "}
                    {selecionado + 1} de {totalPart}.
                  </span>
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5 text-brand-600" />
                  <span>
                    Modelo genérico para todos os <b>{totalPart}</b> inscritos (texto mantém [nome]).
                  </span>
                </>
              )}
            </div>

            {/* Destinatário(s) */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {atual ? "Destinatário" : `Destinatários (${destinatarios.length})`}
                </span>
                <div className="flex gap-2">
                  {atual && (
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={`mailto:${atual.email}?subject=${encodeURIComponent(assunto)}`}
                        title="Abre seu programa de e-mail com destinatário e assunto preenchidos"
                      >
                        <ExternalLink className="h-4 w-4" /> Abrir no e-mail
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={copiarDestinatarios}>
                    <Copy className="h-4 w-4" /> Copiar
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 border rounded p-2 text-[11px] font-mono text-gray-700 max-h-24 overflow-y-auto break-all">
                {destinatarios.join(", ")}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Assunto */}
      <div className="border rounded-lg bg-white p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Mail className="h-4 w-4 text-brand-600" />
            Assunto
          </div>
          <Button size="sm" variant="outline" onClick={() => copiarTexto(assunto, "Assunto copiado.")}>
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
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={restaurar}
              title="Desfazer as edições e voltar ao modelo original"
            >
              <RotateCcw className="h-4 w-4" /> Restaurar modelo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={baixarPdf}
              title="Gera o convite como arquivo PDF para anexar no e-mail"
            >
              <FileDown className="h-4 w-4" /> Baixar PDF
            </Button>
            <Button size="sm" onClick={copiarEmail}>
              <Copy className="h-4 w-4" />
              {atual ? `Copiar e-mail de ${atual.nome || "destinatário"}` : "Copiar e-mail"}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">
          Clique em qualquer texto abaixo para editar. Onde aparece{" "}
          <code className="bg-gray-100 px-1 rounded">[nome]</code>, entra o nome do participante
          escolhido na hora de copiar. As telas do app aparecem no e-mail quando ele é aberto pelo
          destinatário.
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
