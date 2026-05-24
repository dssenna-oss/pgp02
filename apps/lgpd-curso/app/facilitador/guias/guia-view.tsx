"use client";

// Visualização de um Guia de apoio — pensada pra o facilitador PROJETAR.
// Conteúdo campo a campo vem de HELP_POR_CAMPO (lib/lgpd-refs.ts), a mesma
// fonte dos tooltips "?" dos mini-apps. "Modo projeção" amplia tudo pra
// leitura à distância.

import { useState } from "react";
import { Projector, Lightbulb, AlertTriangle, ExternalLink } from "lucide-react";
import { HELP_POR_CAMPO } from "@/lib/lgpd-refs";
import { PROCESSOS_CONTEXTO, ROTULO_CAMPO, type Guia } from "@/lib/guias-apoio";

export function GuiaView({ guia }: { guia: Guia }) {
  const [projecao, setProjecao] = useState(false);
  const processos = PROCESSOS_CONTEXTO;
  const [processoId, setProcessoId] = useState(processos[0]?.id ?? "");
  const processoSel = processos.find((p) => p.id === processoId);

  const sz = projecao
    ? {
        wrap: "max-w-6xl", titulo: "text-4xl", fase: "text-sm", intro: "text-xl",
        bloco: "text-2xl", campoTitulo: "text-2xl", corpo: "text-lg", rotulo: "text-sm",
        num: "h-10 w-10 text-xl", card: "p-6", gap: "space-y-6",
      }
    : {
        wrap: "max-w-4xl", titulo: "text-2xl", fase: "text-xs", intro: "text-sm",
        bloco: "text-lg", campoTitulo: "text-base", corpo: "text-sm", rotulo: "text-[11px]",
        num: "h-7 w-7 text-sm", card: "p-4", gap: "space-y-4",
      };

  function renderCampo(key: string, idx: number) {
    const h = HELP_POR_CAMPO[key];
    if (!h) return null;
    // Cabeçalho = nome do campo no formulário (diz ONDE entra a informação).
    // O título da ajuda ("O que listar aqui" etc.) vira subtítulo.
    const rotulo = ROTULO_CAMPO[key];
    const cabecalho = rotulo ?? h.titulo;
    const subtitulo = rotulo && h.titulo !== rotulo ? h.titulo : null;
    return (
      <div key={key} className={`rounded-lg border bg-white ${sz.card}`}>
        <div className="flex items-start gap-3">
          <span
            className={`${sz.num} shrink-0 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center`}
          >
            {idx}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className={`${sz.campoTitulo} font-bold text-gray-900 leading-tight`}>{cabecalho}</h3>
            {subtitulo && (
              <div className={`${sz.corpo} text-gray-600`}>{subtitulo}</div>
            )}
            {h.artigo && (
              <div className={`${sz.rotulo} mt-0.5 font-medium text-brand-700`}>{h.artigo}</div>
            )}

            <p className={`${sz.corpo} text-gray-700 mt-2`}>{h.oQueDiz}</p>

            <div className={`mt-3 rounded-md bg-brand-50 border border-brand-200 px-3 py-2`}>
              <div className={`${sz.rotulo} uppercase tracking-wide font-semibold text-brand-700`}>
                Pergunta-chave
              </div>
              <div className={`${sz.corpo} font-medium text-brand-900`}>{h.perguntaChave}</div>
            </div>

            {h.pegadinha && (
              <div className="mt-2 flex gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <div className={`${sz.rotulo} uppercase tracking-wide font-semibold text-amber-700`}>
                    Atenção
                  </div>
                  <div className={`${sz.corpo} text-amber-900`}>{h.pegadinha}</div>
                </div>
              </div>
            )}

            {h.exemplos && h.exemplos.length > 0 && (
              <div className="mt-2">
                <div className={`${sz.rotulo} uppercase tracking-wide font-semibold text-gray-500 mb-1`}>
                  Exemplos
                </div>
                <ul className={`${sz.corpo} text-gray-700 space-y-0.5`}>
                  {h.exemplos.map((ex, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-400 shrink-0">·</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {h.linkAnpd && (
              <a
                href={h.linkAnpd.url}
                target="_blank"
                rel="noreferrer"
                className={`${sz.corpo} mt-2 inline-flex items-center gap-1 text-brand-600 hover:underline`}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {h.linkAnpd.texto}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sz.wrap} mx-auto`}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className={`${sz.fase} uppercase tracking-wide text-gray-500 font-semibold`}>
            {guia.missao} · {guia.fase}
          </div>
          <h1 className={`${sz.titulo} font-bold text-gray-900 leading-tight`}>{guia.titulo}</h1>
        </div>
        <button
          type="button"
          onClick={() => setProjecao((v) => !v)}
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

      <p className={`${sz.intro} text-gray-700 mb-4`}>{guia.intro}</p>

      {guia.ordem && (
        <div className={`mb-5 rounded-lg border border-emerald-200 bg-emerald-50 ${sz.card}`}>
          <div className={`${sz.rotulo} uppercase tracking-wide font-semibold text-emerald-700 mb-0.5`}>
            Ordem de preenchimento
          </div>
          <div className={`${sz.corpo} font-semibold text-emerald-900`}>{guia.ordem}</div>
        </div>
      )}

      {/* Destaques especiais — conceitos pedagógicos que não cabem no
          preenchimento campo-a-campo (ex.: 3 caminhos de colaboração no
          Inventário). Renderizado em amarelo-claro pra diferenciar visualmente
          do verde da "Ordem de preenchimento" e do branco dos campos. */}
      {guia.destaquesEspeciais?.map((destaque, i) => (
        <div
          key={i}
          className={`mb-5 rounded-lg border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 ${sz.card}`}
        >
          <h2 className={`${sz.bloco} font-bold text-amber-900 leading-tight mb-1`}>
            {destaque.titulo}
          </h2>
          {destaque.nota && (
            <p className={`${sz.corpo} text-amber-800 italic mb-3`}>{destaque.nota}</p>
          )}
          <ul className={`space-y-2 ${sz.corpo}`}>
            {destaque.itens.map((item, j) => (
              <li key={j} className="flex gap-2">
                <span className="text-amber-600 font-bold shrink-0">•</span>
                <div>
                  <strong className="text-amber-900">{item.rotulo}</strong>
                  <span className="text-amber-900"> — {item.texto}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Seletor de processo — só no Inventário */}
      {guia.comProcessos && processos.length > 0 && (
        <div className="mb-5">
          <div className={`${sz.rotulo} uppercase tracking-wide font-semibold text-gray-500 mb-1.5`}>
            Escolha o processo pra projetar o contexto
          </div>
          <div className="flex flex-wrap gap-1.5">
            {processos.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProcessoId(p.id)}
                className={`rounded-md border px-3 py-1.5 ${sz.corpo} font-medium transition-colors ${
                  p.id === processoId
                    ? "bg-brand-600 text-white border-brand-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p.orgao === "PM" ? "🛕" : "🏛"} {p.nome}
              </button>
            ))}
          </div>

          {processoSel && (
            <div className={`mt-3 rounded-lg border-l-4 border-l-brand-500 border bg-white ${sz.card}`}>
              <h2 className={`${sz.bloco} font-bold text-gray-900`}>{processoSel.nome}</h2>
              <div className={`${sz.rotulo} font-medium text-gray-500 mb-2`}>
                {processoSel.orgao === "PM" ? "🛕 Prefeitura" : "🏛 Câmara"} · Setor: {processoSel.setor}
              </div>
              <p className={`${sz.corpo} text-gray-700`}>{processoSel.finalidade}</p>
              <div className={`${sz.rotulo} text-gray-400 italic mt-2`}>
                Este texto já vem preenchido no app. O grupo completa os campos abaixo.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocos de campos */}
      <div className="space-y-6">
        {guia.blocos.map((bloco, bi) => (
          <section key={bi}>
            {bloco.titulo && (
              <div className="mb-2">
                <h2 className={`${sz.bloco} font-bold text-gray-900`}>{bloco.titulo}</h2>
                {bloco.nota && <p className={`${sz.corpo} text-gray-500`}>{bloco.nota}</p>}
              </div>
            )}
            <div className={sz.gap}>
              {bloco.campoKeys.map((key, i) => renderCampo(key, i + 1))}
            </div>
          </section>
        ))}
      </div>

      <div className={`mt-6 ${sz.rotulo} text-gray-400 italic`}>
        Esta é uma tela de apoio do facilitador. O conteúdo é o mesmo da ajuda "?" de cada campo —
        orienta o raciocínio, sem entregar a resposta pronta.
      </div>
    </div>
  );
}
