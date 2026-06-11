"use client";

// Telão ao vivo — faz polling do comando da turma (~3s) e renderiza o conteúdo
// certo REUSANDO os componentes de telão que já existem:
//   placar          → TelaoView (placar + conquistas)
//   quiz            → CartazQuiz (QR do Quiz Diagnóstico)
//   atividade:<id>  → CartazAtividade (agregado; id "termometro" = Termômetro)
//   null            → tela de espera
// Sem websocket (padrão Vercel): o celular do facilitador grava o comando via
// POST /api/curso/telao-comando e este telão o lê no próximo tick.
//
// REDE DE SEGURANÇA — "Controle local no notebook": se o celular ficar sem
// sinal, o facilitador abre o painelzinho aqui (engrenagem no canto OU tecla C)
// e escolhe a tela direto no notebook. Enquanto o controle local está ativo, o
// telão IGNORA o que vem do celular (a escolha local vence) até clicar em
// "Voltar a seguir o celular". A escolha local também tenta gravar no servidor
// (best-effort, pra manter o Painel em sincronia), mas NÃO depende disso — o
// telão troca na hora pela escolha local mesmo que a gravação falhe.

import { useEffect, useRef, useState } from "react";
import { Radio, RotateCcw, Settings, X, Smartphone, MonitorCog } from "lucide-react";
import { getAtividadeC, ATIVIDADES_C } from "@/lib/atividades-c";
import { CONTEUDOS_TELAO, getConteudoTelao } from "@/lib/conteudos-telao";
import { Select } from "@/components/ui/select";
import { TelaoView } from "@/app/telao/telao-view";
import { CartazQuiz } from "@/app/facilitador/quiz/cartaz/[turmaSlug]/cartaz-quiz";
import { CartazQuizResultado } from "@/app/facilitador/quiz/cartaz/[turmaSlug]/cartaz-quiz-resultado";
import { CartazAtividade } from "@/app/facilitador/atividades/cartaz/[turmaSlug]/cartaz-atividade";

type Turma = {
  id: string;
  nome: string;
  cidade: string;
  slug: string;
  status: string;
};

// Monta a prop `atividade` do CartazAtividade a partir do id, espelhando o que
// a página /facilitador/atividades/cartaz faz no servidor.
function montarAtividade(id: string) {
  if (id === "termometro") {
    // Rótulo NEUTRO de propósito: o Termômetro vai ao telão em DOIS momentos
    // (início, M3 · final/evolução, M14) — nada de número de momento fixo.
    return {
      id: "termometro",
      titulo: "Termômetro — Evolução dos Grupos",
      fase: "Termômetro Institucional · início × final",
      emoji: "🌡️",
    };
  }
  const at = getAtividadeC(id);
  if (!at) return null;
  return { id: at.id, titulo: at.titulo, fase: at.fase, emoji: at.emoji, contexto: at.contexto };
}

function rotuloComando(c: string | null): string {
  if (!c) return "Tela de espera";
  if (c === "placar") return "🏆 Placar / pódio";
  if (c === "quiz") return "📱 Quiz (QR)";
  if (c === "quiz-resultado") return "📊 Resultado do Quiz";
  if (c.startsWith("atividade:")) {
    const id = c.slice("atividade:".length);
    if (id === "termometro") return "🌡️ Termômetro";
    const at = ATIVIDADES_C.find((a) => a.id === id);
    return at ? `${at.emoji} ${at.titulo}` : id;
  }
  if (c.startsWith("conteudo:")) {
    const m = getConteudoTelao(c.slice("conteudo:".length));
    return m ? `${m.emoji} ${m.titulo}` : c;
  }
  return c;
}

export function TelaoVivoView({
  turma,
  comandoInicial,
}: {
  turma: Turma;
  comandoInicial: string | null;
}) {
  const [comando, setComando] = useState<string | null>(comandoInicial);
  const [erro, setErro] = useState(false);
  const comandoRef = useRef<string | null>(comandoInicial);

  // Controle local (notebook). modoManual=true → renderiza comandoManual e
  // ignora o `comando` vindo do celular. painelAberto = overlay de controle.
  const [modoManual, setModoManual] = useState(false);
  const [comandoManual, setComandoManual] = useState<string | null>(comandoInicial);
  const [painelAberto, setPainelAberto] = useState(false);

  // polling do comando remoto (sempre roda; o render é que decide se usa)
  useEffect(() => {
    let cancelado = false;
    async function tick() {
      try {
        const res = await fetch(`/api/curso/telao-comando?turmaId=${turma.id}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelado) setErro(true);
          return;
        }
        const data = await res.json();
        if (cancelado) return;
        setErro(false);
        const novo: string | null = data?.comando ?? null;
        if (novo !== comandoRef.current) {
          comandoRef.current = novo;
          setComando(novo);
        }
      } catch {
        if (!cancelado) setErro(true);
      }
    }
    tick();
    const iv = setInterval(tick, 3000);
    return () => {
      cancelado = true;
      clearInterval(iv);
    };
  }, [turma.id]);

  // tecla C abre/fecha o controle local; Esc fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      // não dispara se o foco está num campo de formulário
      if (alvo && /^(INPUT|SELECT|TEXTAREA)$/.test(alvo.tagName)) return;
      if (e.key === "c" || e.key === "C") setPainelAberto((v) => !v);
      else if (e.key === "Escape") setPainelAberto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // assume o controle local: a escolha vence na hora; grava no servidor em
  // best-effort (não bloqueia, não quebra se falhar).
  function aplicarLocal(valor: string | null) {
    setModoManual(true);
    setComandoManual(valor);
    fetch("/api/curso/telao-comando", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turmaId: turma.id, comando: valor }),
    }).catch(() => {
      /* sem rede: tudo bem, a escolha local já está valendo na tela */
    });
  }

  function voltarAoCelular() {
    setModoManual(false);
    setPainelAberto(false);
  }

  // comando que efetivamente vai pra tela
  const comandoEfetivo = modoManual ? comandoManual : comando;

  // ---- roteamento do comando → componente ----
  // `key` força remontagem ao trocar de comando (cada cartaz tem efeitos de
  // layout próprios no mount/unmount — a remontagem garante limpeza correta).
  let conteudo: React.ReactNode;
  if (comandoEfetivo === "placar") {
    conteudo = <TelaoView key="placar" turmas={[turma]} />;
  } else if (comandoEfetivo === "quiz") {
    conteudo = <CartazQuiz key="quiz" turma={turma} />;
  } else if (comandoEfetivo === "quiz-resultado") {
    conteudo = <CartazQuizResultado key="quiz-resultado" turma={turma} />;
  } else if (comandoEfetivo?.startsWith("atividade:")) {
    const id = comandoEfetivo.slice("atividade:".length);
    const atividade = montarAtividade(id);
    conteudo = atividade ? (
      <CartazAtividade key={comandoEfetivo} turma={turma} atividade={atividade} />
    ) : (
      <TelaEspera turma={turma} aviso={`Atividade "${id}" não encontrada.`} />
    );
  } else if (comandoEfetivo?.startsWith("conteudo:")) {
    // Material de Apoio — renderiza a própria página do app num iframe
    // fullscreen (mesma origem; este navegador está logado como facilitador).
    // ?projecao=1 ativa o Modo Projeção silencioso lá dentro (sem sidebar,
    // fontes ampliadas, sem banner).
    const id = comandoEfetivo.slice("conteudo:".length);
    const material = getConteudoTelao(id);
    conteudo = material ? (
      <iframe
        key={comandoEfetivo}
        src={`${material.hrefTelao}?projecao=1`}
        title={material.titulo}
        className="fixed inset-0 h-full w-full border-0 bg-white"
      />
    ) : (
      <TelaEspera turma={turma} aviso={`Conteúdo "${id}" não encontrado.`} />
    );
  } else {
    conteudo = <TelaEspera key="espera" turma={turma} />;
  }

  return (
    <>
      {/* Selo de status — canto superior direito. Mostra QUEM comanda. */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 print:hidden">
        {modoManual ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow">
            <MonitorCog className="h-3.5 w-3.5" /> Controle local (notebook)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {erro ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-amber-300" /> Reconectando
              </>
            ) : (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" /> Comandado pelo celular
              </>
            )}
          </span>
        )}
      </div>

      {/* Engrenagem discreta — abre o controle local (canto superior esquerdo). */}
      <button
        onClick={() => setPainelAberto(true)}
        title="Controle local do telão (tecla C)"
        className="fixed top-3 left-3 z-50 inline-flex items-center justify-center rounded-full bg-black/30 p-2 text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white print:hidden"
      >
        <Settings className="h-4 w-4" />
      </button>

      {conteudo}

      {/* Overlay de controle local */}
      {painelAberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <MonitorCog className="h-5 w-5 text-amber-600" /> Controle local do telão
              </h2>
              <button
                onClick={() => setPainelAberto(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Fechar (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-500">
              Plano B se o <strong>celular ficar sem sinal</strong>: escolha a tela aqui, direto no
              notebook. O telão troca na hora e passa a <strong>ignorar o celular</strong> até você
              devolver o comando.
            </p>

            {/* Estado atual */}
            <div
              className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                modoManual
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {modoManual ? (
                <MonitorCog className="h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <Smartphone className="h-4 w-4 shrink-0 text-gray-500" />
              )}
              <span>
                Quem comanda agora: <strong>{modoManual ? "este notebook" : "o celular"}</strong> ·
                na tela: <strong>{rotuloComando(comandoEfetivo)}</strong>
              </span>
            </div>

            {/* Botões de escolha rápida */}
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Mostrar nesta tela
            </p>
            <div className="grid grid-cols-2 gap-2">
              <BotaoLocal ativo={comandoEfetivo === null} onClick={() => aplicarLocal(null)}>
                ⏳ Tela de espera
              </BotaoLocal>
              <BotaoLocal ativo={comandoEfetivo === "placar"} onClick={() => aplicarLocal("placar")}>
                🏆 Placar / pódio
              </BotaoLocal>
              <BotaoLocal ativo={comandoEfetivo === "quiz"} onClick={() => aplicarLocal("quiz")}>
                📱 Quiz (QR)
              </BotaoLocal>
              <BotaoLocal ativo={comandoEfetivo === "quiz-resultado"} onClick={() => aplicarLocal("quiz-resultado")}>
                📊 Resultado do Quiz
              </BotaoLocal>
              <BotaoLocal
                ativo={comandoEfetivo === "atividade:termometro"}
                onClick={() => aplicarLocal("atividade:termometro")}
              >
                🌡️ Termômetro
              </BotaoLocal>
            </div>

            {/* Atividades (lista grande → select) */}
            <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Atividades ao vivo
            </p>
            <Select
              value={comandoEfetivo?.startsWith("atividade:") && comandoEfetivo !== "atividade:termometro" ? comandoEfetivo : ""}
              onChange={(e) => { if (e.target.value) aplicarLocal(e.target.value); }}
            >
              <option value="">Escolher uma atividade…</option>
              {ATIVIDADES_C.map((a) => (
                <option key={a.id} value={`atividade:${a.id}`}>
                  {a.emoji} {a.titulo}
                </option>
              ))}
            </Select>

            {/* Materiais de Apoio (conteúdos projetáveis) */}
            <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Materiais de apoio
            </p>
            <Select
              value={comandoEfetivo?.startsWith("conteudo:") ? comandoEfetivo : ""}
              onChange={(e) => { if (e.target.value) aplicarLocal(e.target.value); }}
            >
              <option value="">Escolher um material…</option>
              {CONTEUDOS_TELAO.map((c) => (
                <option key={c.id} value={`conteudo:${c.id}`}>
                  {c.emoji} {c.titulo}
                </option>
              ))}
            </Select>

            {/* Voltar a seguir o celular */}
            {modoManual && (
              <button
                onClick={voltarAoCelular}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Smartphone className="h-4 w-4" /> Voltar a seguir o celular
              </button>
            )}
            <p className="mt-3 text-center text-xs text-gray-400">
              Atalho: tecla <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-[11px]">C</kbd> abre/fecha · <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-[11px]">Esc</kbd> fecha
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function BotaoLocal({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
        ativo
          ? "border-amber-400 bg-amber-100 text-amber-900"
          : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50"
      }`}
    >
      {children}
    </button>
  );
}

// Tela de espera (comando null) — mostra a turma e instrui a aguardar.
function TelaEspera({ turma, aviso }: { turma: Turma; aviso?: string }) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900 bg-cover bg-center p-10 text-center"
      style={{ backgroundImage: "url('/telao-espera-fundo.webp')" }}
    >
      {/* scrim pra legibilidade do texto sobre a ilustração clara */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/30" />
      <div className="relative z-10 max-w-2xl rounded-[22px] bg-slate-900/50 px-12 py-8 text-white backdrop-blur-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lgpd-badge-transparente.png" alt="LGPD" className="mx-auto mb-2.5 h-24 w-auto drop-shadow-lg" />
        <p className="text-lg font-medium text-white/80">{turma.nome} · {turma.cidade}</p>
        <p className="mt-3.5 text-[2.5rem] font-bold leading-[1.22] [text-shadow:0_2px_14px_rgba(0,0,0,0.4)]">
          Adequação à LGPD é uma <span className="text-[#F0997B]">jornada</span>, não um destino.
        </p>
        <p className="mt-5 text-2xl font-medium text-white/90">Aguardando o facilitador…</p>
        {aviso && <p className="mt-4 text-sm text-amber-200">{aviso}</p>}
      </div>
    </div>
  );
}
