"use client";

// Termômetro Institucional — Fase Preliminar (PA).
// 5 dimensões × 4 opções fechadas → score 0-100. Aplicado no INÍCIO do curso
// e repetido no FIM pra mostrar a evolução percebida pela equipe.

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Check, RotateCcw, Thermometer, Award } from "lucide-react";
import {
  DIMENSOES_TERMOMETRO,
  faixaQualitativa,
  SCORE_MAXIMO,
  type NivelTermometro,
  type TermometroSalvo,
} from "@/lib/termometro-perguntas";
import { salvarTermometro } from "./actions";

type Momento = "INICIO" | "FIM";

export function TermometroRunner({
  inicioSalvo,
  fimSalvo,
}: {
  inicioSalvo: TermometroSalvo | null;
  fimSalvo: TermometroSalvo | null;
}) {
  // Decide qual termômetro estamos preenchendo. Padrão: INICIO se vazio.
  // Se INICIO já feito, abre o FIM. Toggle pra reabrir o INICIO se quiser
  // (ex: refazer antes de submeter).
  const [momento, setMomento] = useState<Momento>(
    inicioSalvo && !fimSalvo ? "FIM" : "INICIO",
  );
  const atualSalvo = momento === "INICIO" ? inicioSalvo : fimSalvo;

  const [respostas, setRespostas] = useState<Record<string, NivelTermometro>>(
    () => {
      // Pré-preenche com o salvo (se houver) pra permitir revisão
      const r: Record<string, NivelTermometro> = {};
      atualSalvo?.dimensoes.forEach((d) => {
        r[d.id] = d.opcaoEscolhida;
      });
      return r;
    },
  );
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ score: number; momento: Momento } | null>(
    atualSalvo ? { score: atualSalvo.score, momento } : null,
  );

  function escolher(dimId: string, nivel: NivelTermometro) {
    setRespostas((prev) => ({ ...prev, [dimId]: nivel }));
  }

  function trocarMomento(novo: Momento) {
    setMomento(novo);
    const s = novo === "INICIO" ? inicioSalvo : fimSalvo;
    const r: Record<string, NivelTermometro> = {};
    s?.dimensoes.forEach((d) => {
      r[d.id] = d.opcaoEscolhida;
    });
    setRespostas(r);
    setResultado(s ? { score: s.score, momento: novo } : null);
  }

  function limpar() {
    setRespostas({});
    setResultado(null);
  }

  async function submeter() {
    const faltando = DIMENSOES_TERMOMETRO.filter((d) => !respostas[d.id]);
    if (faltando.length > 0) {
      toast.error(`Responda todas as ${DIMENSOES_TERMOMETRO.length} dimensões antes de finalizar.`);
      return;
    }
    setSalvando(true);
    try {
      const r = await salvarTermometro(momento, respostas);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`✅ Termômetro salvo. Score: ${r.score}/${SCORE_MAXIMO}`);
      setResultado({ score: r.score, momento });
    } finally {
      setSalvando(false);
    }
  }

  const respondidas = Object.keys(respostas).length;
  const total = DIMENSOES_TERMOMETRO.length;
  const faixa = resultado ? faixaQualitativa(resultado.score) : null;

  // Evolução: só faz sentido quando os 2 momentos estão preenchidos.
  const evolucao =
    inicioSalvo && fimSalvo
      ? { delta: fimSalvo.score - inicioSalvo.score, inicio: inicioSalvo.score, fim: fimSalvo.score }
      : null;

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/fase-preliminar"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase Preliminar
      </Link>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Fase Preliminar · Prática PA
      </div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Thermometer className="h-6 w-6 text-emerald-600" />
        Termômetro Institucional
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Auto-diagnóstico do quanto a Instituição está madura em LGPD hoje, em 5 dimensões.
        Cada um marca a opção que melhor descreve a realidade do órgão — não há resposta certa,
        só auto-percepção sincera.
      </p>

      {/* Toggle Início / Fim */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => trocarMomento("INICIO")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            momento === "INICIO"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Início do curso {inicioSalvo ? "✓" : ""}
        </button>
        <button
          type="button"
          onClick={() => trocarMomento("FIM")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            momento === "FIM"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
          title={!inicioSalvo ? "Faça o termômetro inicial primeiro" : undefined}
          disabled={!inicioSalvo}
        >
          Final do curso {fimSalvo ? "✓" : ""}
        </button>
      </div>

      {/* Card de evolução — só aparece quando ambos preenchidos */}
      {evolucao && (
        <div className="mt-4 rounded-lg border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-amber-700" />
            <span className="text-xs uppercase font-bold tracking-wider text-amber-800">
              Sua evolução durante o curso
            </span>
          </div>
          <div className="text-amber-900">
            <span className="text-lg font-bold">{evolucao.inicio}</span>
            <span className="mx-2 text-amber-600">→</span>
            <span className="text-2xl font-bold">{evolucao.fim}</span>
            <span className="ml-3 text-sm font-medium">
              ({evolucao.delta >= 0 ? "+" : ""}{evolucao.delta} pontos)
            </span>
          </div>
        </div>
      )}

      {/* Resultado parcial — quando o momento atual já foi salvo */}
      {resultado && faixa && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            faixa.cor === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-900" :
            faixa.cor === "blue" ? "border-blue-200 bg-blue-50 text-blue-900" :
            faixa.cor === "amber" ? "border-amber-200 bg-amber-50 text-amber-900" :
            faixa.cor === "orange" ? "border-orange-200 bg-orange-50 text-orange-900" :
            "border-gray-200 bg-gray-50 text-gray-900"
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                Resultado salvo ({momento === "INICIO" ? "início" : "final"})
              </div>
              <div className="text-2xl font-bold mt-1">
                {resultado.score}<span className="text-base font-normal opacity-70">/{SCORE_MAXIMO}</span>
              </div>
              <div className="text-sm font-medium mt-0.5">{faixa.label}</div>
              <div className="text-xs mt-1 opacity-80">{faixa.descricao}</div>
            </div>
          </div>
        </div>
      )}

      {/* Dimensões */}
      <div className="mt-6 space-y-4">
        {DIMENSOES_TERMOMETRO.map((dim, idx) => {
          const escolhida = respostas[dim.id];
          return (
            <div key={dim.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start gap-3 mb-2">
                <span className="shrink-0 h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {dim.emoji} {dim.titulo}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">{dim.hint}</p>
                </div>
              </div>
              <div className="space-y-1.5 ml-10">
                {dim.opcoes.map((op) => {
                  const ativa = escolhida === op.id;
                  return (
                    <label
                      key={op.id}
                      className={`flex items-start gap-2 p-2.5 rounded-md cursor-pointer transition-colors border ${
                        ativa
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`dim-${dim.id}`}
                        checked={ativa}
                        onChange={() => escolher(dim.id, op.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${ativa ? "text-emerald-800" : "text-gray-700"}`}>
                            {op.rotulo}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">+{op.pontos} pts</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-0.5">{op.descricao}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer com ações */}
      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap sticky bottom-0 bg-white/95 backdrop-blur border-t pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="text-xs text-gray-600">
          {respondidas}/{total} respondida(s)
          {respondidas === total && (
            <span className="ml-2 font-semibold text-emerald-700">
              · Pontuação prévia: {DIMENSOES_TERMOMETRO.reduce((s, d) => {
                const op = d.opcoes.find((o) => o.id === respostas[d.id]);
                return s + (op?.pontos || 0);
              }, 0)}/{SCORE_MAXIMO}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={limpar}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </button>
          <button
            type="button"
            onClick={submeter}
            disabled={salvando || respondidas !== total}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {salvando ? "Salvando..." : atualSalvo ? "Atualizar resultado" : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
