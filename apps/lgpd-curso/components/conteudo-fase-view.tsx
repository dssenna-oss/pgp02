"use client";

// Visualização do conteúdo de uma Fase do PGP — pensada pro facilitador
// PROJETAR na sala antes da missão correspondente. Espelha (com tom didático
// do curso) o que cada órgão vê na fase do app principal lgpd-pgp.vercel.app.
//
// Padrão herdado do `guia-view.tsx`: toggle "Modo projeção" que amplia tudo
// pra leitura à distância; cores brand/emerald/amber consistentes com o app.

import { useState } from "react";
import {
  Projector,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { BibliotecaFlipbook } from "@/components/biblioteca-flipbook";
import type {
  ConteudoFase,
  DescricaoBloco,
  ChecklistSecao,
  PraticaCard,
  CalloutBlock,
} from "@/lib/conteudo-fases";

export function ConteudoFaseView({ fase }: { fase: ConteudoFase }) {
  const [projecao, setProjecao] = useState(false);

  const sz = projecao
    ? {
        wrap: "max-w-6xl",
        h1: "text-5xl",
        h2: "text-3xl",
        h3: "text-2xl",
        sub: "text-lg",
        meta: "text-sm",
        body: "text-xl",
        small: "text-base",
        cardPad: "p-7",
        gap: "space-y-8",
      }
    : {
        wrap: "max-w-4xl",
        h1: "text-3xl sm:text-4xl",
        h2: "text-xl",
        h3: "text-lg",
        sub: "text-sm",
        meta: "text-xs",
        body: "text-sm sm:text-base",
        small: "text-xs",
        cardPad: "p-5",
        gap: "space-y-5",
      };

  // Tem conteúdo de verdade? Stubs caem aqui.
  const temConteudoReal = fase.descricao.length > 1 || fase.checklist.length > 0;

  if (!temConteudoReal) {
    return (
      <div className={`${sz.wrap} mx-auto`}>
        <Header fase={fase} projecao={projecao} setProjecao={setProjecao} sz={sz} />
        <div className={`rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${sz.cardPad} text-center`}>
          <div className="text-4xl mb-2">🚧</div>
          <h2 className={`${sz.h2} font-bold text-gray-700`}>Conteúdo em construção</h2>
          <p className={`${sz.body} text-gray-500 mt-2`}>
            Esta fase será preenchida na próxima fatia do trabalho de adaptação.
            Por enquanto, projete os Slides das Fases ou o e-book da Trilha LGPD Descomplicada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sz.wrap} mx-auto`}>
      <Header fase={fase} projecao={projecao} setProjecao={setProjecao} sz={sz} />

      {/* E-books interativos — lista numerada (estilo prod) */}
      {fase.ebooks.length > 0 && (
        <section className="mb-6">
          <h2 className={`${sz.h2} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <span>📚</span> E-books Interativos
          </h2>
          <div className="space-y-3">
            {fase.ebooks.map((eb, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`shrink-0 mt-1 inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold ${
                    projecao ? "h-9 w-9 text-base" : "h-7 w-7 text-sm"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <BibliotecaFlipbook
                    titulo={eb.titulo}
                    descricao={eb.descricao}
                    url={eb.url}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Descrição da Fase */}
      <section className="mb-6">
        <h2 className={`${sz.h2} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
          <span>📄</span> Descrição da Fase
        </h2>
        <div className={`rounded-lg border bg-white ${sz.cardPad} ${sz.gap}`}>
          {fase.descricao.map((b, i) => (
            <BlocoDescricao key={i} bloco={b} sz={sz} />
          ))}
        </div>
      </section>

      {/* Como Proceder */}
      {fase.comoProc.length > 0 && (
        <section className="mb-6">
          <h2 className={`${sz.h2} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <span>🗺️</span> Como Proceder
          </h2>
          <div className={`rounded-lg border-l-4 border-l-blue-400 border bg-white ${sz.cardPad} ${sz.gap}`}>
            {fase.comoProc.map((b, i) => (
              <BlocoDescricao key={i} bloco={b} sz={sz} />
            ))}
          </div>
        </section>
      )}

      {/* Checklist */}
      {fase.checklist.length > 0 && (
        <section className="mb-6">
          <h2 className={`${sz.h2} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <span>✅</span> Checklist de Implementação
          </h2>
          <div className="space-y-3">
            {fase.checklist.map((s) => (
              <ChecklistBlock key={s.id} secao={s} sz={sz} />
            ))}
          </div>
        </section>
      )}

      {/* Coloque em Prática */}
      {fase.pratica.length > 0 && (
        <section className="mb-6">
          <h2 className={`${sz.h2} font-bold text-gray-900 mb-3 flex items-center gap-2`}>
            <span>🎯</span> Coloque em Prática
          </h2>
          <div className="space-y-3">
            {fase.pratica.map((c, i) => (
              <PraticaBlock key={i} card={c} sz={sz} />
            ))}
          </div>
        </section>
      )}

      <div className={`mt-8 pt-6 border-t ${sz.meta} text-gray-400 italic text-center`}>
        Conteúdo institucional adaptado do app principal LGPD-PGP. Use como apoio
        pra projetar antes das missões — não substitui o jogo prático.
      </div>
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────

function Header({
  fase,
  projecao,
  setProjecao,
  sz,
}: {
  fase: ConteudoFase;
  projecao: boolean;
  setProjecao: (v: boolean | ((p: boolean) => boolean)) => void;
  sz: any;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b">
      <div className="min-w-0">
        <div className={`${sz.meta} uppercase tracking-wide text-brand-600 font-semibold mb-1`}>
          🚩 Fase {fase.numero} · {fase.missao}
        </div>
        <h1 className={`${sz.h1} font-bold text-gray-900 leading-tight`}>{fase.titulo}</h1>
        <p className={`${sz.body} text-gray-600 mt-1`}>{fase.subtitulo}</p>
      </div>
      <button
        type="button"
        onClick={() => setProjecao((v: boolean) => !v)}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
          projecao
            ? "bg-brand-600 text-white border-brand-700 hover:bg-brand-700"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
        title="Amplia o texto pra projetar na sala"
      >
        <Projector className="h-4 w-4" />
        {projecao ? "Sair da projeção" : "Modo projeção"}
      </button>
    </div>
  );
}

// ─── BLOCO DE DESCRIÇÃO ─────────────────────────────────────────────────

function BlocoDescricao({ bloco, sz }: { bloco: DescricaoBloco; sz: any }) {
  if (bloco.tipo === "paragrafo") {
    return <p className={`${sz.body} text-gray-700 leading-relaxed`}>{bloco.texto}</p>;
  }
  if (bloco.tipo === "subtitulo") {
    return <h3 className={`${sz.h3} font-bold text-gray-900 mt-2`}>{bloco.texto}</h3>;
  }
  if (bloco.tipo === "lista") {
    return (
      <ul className={`list-disc pl-6 space-y-1.5 ${sz.body} text-gray-700`}>
        {bloco.itens.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  if (bloco.tipo === "callout") {
    return <CalloutView callout={bloco.callout} sz={sz} />;
  }
  return null;
}

// ─── CALLOUT (aviso / info / sucesso / dica) ────────────────────────────

function CalloutView({ callout, sz }: { callout: CalloutBlock; sz: any }) {
  const config = {
    aviso: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      iconColor: "text-amber-700",
      titleColor: "text-amber-900",
      textColor: "text-amber-900",
      Icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      iconColor: "text-blue-700",
      titleColor: "text-blue-900",
      textColor: "text-blue-900",
      Icon: Info,
    },
    sucesso: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      iconColor: "text-emerald-700",
      titleColor: "text-emerald-900",
      textColor: "text-emerald-900",
      Icon: CheckCircle2,
    },
    dica: {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      iconColor: "text-yellow-700",
      titleColor: "text-yellow-900",
      textColor: "text-yellow-900",
      Icon: Lightbulb,
    },
  }[callout.tom];
  const { Icon } = config;
  return (
    <div className={`flex gap-3 rounded-lg border-l-4 ${config.border} ${config.bg} ${sz.cardPad}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.iconColor} mt-0.5`} />
      <div className="flex-1">
        {callout.titulo && (
          <div className={`font-bold ${config.titleColor} mb-1 ${sz.body}`}>{callout.titulo}</div>
        )}
        <p className={`${sz.body} ${config.textColor} leading-relaxed`}>{callout.texto}</p>
      </div>
    </div>
  );
}

// ─── CHECKLIST ──────────────────────────────────────────────────────────

function ChecklistBlock({ secao, sz }: { secao: ChecklistSecao; sz: any }) {
  return (
    <div className={`rounded-lg border bg-white ${sz.cardPad}`}>
      <h3 className={`${sz.h3} font-bold text-gray-900 mb-3`}>{secao.titulo}</h3>
      <ul className="space-y-2">
        {secao.itens.map((item) => (
          <li key={item.id} className={`flex items-start gap-2 ${sz.body} text-gray-700`}>
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 text-transparent">
              ✓
            </span>
            <span>{item.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── CARD DE PRÁTICA ────────────────────────────────────────────────────

function PraticaBlock({ card, sz }: { card: PraticaCard; sz: any }) {
  const [aberto, setAberto] = useState(false);
  const destaque = card.destaque;

  return (
    <div
      className={`rounded-lg border-l-4 ${
        destaque
          ? "border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 ring-2 ring-yellow-200"
          : "border-l-brand-400 bg-white"
      } border ${sz.cardPad}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
            destaque ? "bg-yellow-100" : "bg-brand-50"
          } text-3xl`}
        >
          {card.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h3 className={`${sz.h3} font-bold ${destaque ? "text-yellow-900" : "text-gray-900"}`}>
              {card.titulo}
            </h3>
            {card.badge && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                  destaque
                    ? "bg-yellow-500 text-white"
                    : "bg-brand-100 text-brand-700"
                }`}
              >
                {card.badge}
              </span>
            )}
          </div>
          <p className={`${sz.body} ${destaque ? "text-yellow-900" : "text-gray-700"} leading-relaxed`}>
            {card.descricao}
          </p>
          {card.detalhe && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                className={`${sz.small} font-semibold ${
                  destaque ? "text-yellow-700 hover:text-yellow-900" : "text-brand-600 hover:text-brand-800"
                }`}
              >
                {aberto ? "Recolher detalhes" : "Ler o método prático →"}
              </button>
              {aberto && (
                <div
                  className={`mt-2 rounded-md ${
                    destaque ? "bg-yellow-100" : "bg-gray-50"
                  } ${sz.cardPad}`}
                >
                  <p
                    className={`${sz.body} ${
                      destaque ? "text-yellow-900" : "text-gray-700"
                    } leading-relaxed`}
                  >
                    {card.detalhe}
                  </p>
                </div>
              )}
            </div>
          )}
          {card.href && (
            <a
              href={card.href}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-md ${
                destaque
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-brand-600 hover:bg-brand-700"
              } text-white text-sm font-medium px-3 py-2`}
            >
              Abrir página <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
