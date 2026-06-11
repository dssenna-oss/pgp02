"use client";

// Panorama da turma no Termômetro Institucional (INDIVIDUAL). Mostra a
// maturidade MÉDIA da turma (início → fim), o salto médio e a DISTRIBUIÇÃO por
// faixa — é anônimo de propósito: cada participante avaliou o próprio órgão
// real, então o valor pedagógico é o panorama coletivo ("por que algumas
// instituições estão mais maduras?"), nunca o nome de cada um. Usada no painel
// do facilitador (compacta) e no cartaz de projeção (`grande=true`).

import { Thermometer, ArrowRight } from "lucide-react";
import {
  faixaQualitativa,
  type TurmaTermometro,
  type DistribuicaoFaixa,
} from "@/lib/termometro-perguntas";

function corFaixa(cor: string): { bg: string; border: string; text: string; num: string; bar: string } {
  switch (cor) {
    case "emerald": return { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", num: "text-emerald-800", bar: "bg-emerald-500" };
    case "blue":    return { bg: "bg-blue-50",    border: "border-blue-300",    text: "text-blue-700",    num: "text-blue-800",    bar: "bg-blue-500"    };
    case "amber":   return { bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-700",   num: "text-amber-800",   bar: "bg-amber-500"   };
    case "orange":  return { bg: "bg-orange-50",  border: "border-orange-300",  text: "text-orange-700",  num: "text-orange-800",  bar: "bg-orange-500"  };
    default:        return { bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-500",    num: "text-gray-700",    bar: "bg-gray-400"    };
  }
}

// Rótulo curto da faixa pra caber na barra do histograma.
const ROTULO_CURTO: Record<string, string> = {
  avancada: "Avançada",
  estabelecida: "Estabelecida",
  desenvolvimento: "Em desenvolv.",
  inicial: "Inicial",
  partida: "Partida",
};

// Um medidor de média (número grande + faixa qualitativa).
function Medidor({ titulo, score, grande }: { titulo: string; score: number | null; grande: boolean }) {
  if (score === null) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center flex-1">
        <p className={`font-semibold uppercase tracking-wide text-gray-400 ${grande ? "text-sm" : "text-[10px]"} mb-1`}>{titulo}</p>
        <p className={`text-gray-300 font-bold ${grande ? "text-4xl" : "text-2xl"}`}>—</p>
        <p className={`${grande ? "text-sm" : "text-xs"} text-gray-400 mt-1`}>aguardando</p>
      </div>
    );
  }
  const faixa = faixaQualitativa(score);
  const c = corFaixa(faixa.cor);
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} ${grande ? "p-4" : "p-3"} text-center flex-1`}>
      <p className={`font-semibold uppercase tracking-wide ${c.text} ${grande ? "text-sm" : "text-[10px]"} mb-1`}>{titulo}</p>
      <p className={`font-extrabold ${c.num} leading-none ${grande ? "text-5xl" : "text-3xl"}`}>
        {score}<span className={`font-normal ${grande ? "text-2xl" : "text-base"}`}>/100</span>
      </p>
      <p className={`${c.text} mt-1 ${grande ? "text-base" : "text-xs"}`}>{faixa.label}</p>
    </div>
  );
}

// Histograma da distribuição por faixa (da mais alta pra mais baixa).
function Distribuicao({ titulo, dist, grande }: { titulo: string; dist: DistribuicaoFaixa[]; grande: boolean }) {
  const total = dist.reduce((s, d) => s + d.n, 0);
  const max = Math.max(1, ...dist.map((d) => d.n));
  const linhas = [...dist].reverse(); // Avançada no topo, Partida embaixo
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className={`font-bold text-gray-700 text-center mb-2 ${grande ? "text-lg" : "text-sm"}`}>{titulo}</p>
      {total === 0 ? (
        <p className={`text-center text-gray-400 py-4 ${grande ? "text-base" : "text-xs"}`}>ninguém ainda</p>
      ) : (
        <div className={`space-y-1.5 ${grande ? "space-y-2.5" : ""}`}>
          {linhas.map((d) => {
            const c = corFaixa(d.cor);
            const pct = Math.round((d.n / max) * 100);
            return (
              <div key={d.faixaId} className="flex items-center gap-2">
                <span className={`shrink-0 text-right text-gray-600 ${grande ? "text-sm w-28" : "text-[10px] w-20"}`}>
                  {ROTULO_CURTO[d.faixaId] ?? d.label}
                </span>
                <div className={`flex-1 rounded bg-gray-100 overflow-hidden ${grande ? "h-6" : "h-4"}`}>
                  <div
                    className={`h-full ${c.bar} ${d.n > 0 ? "" : "opacity-0"} transition-all`}
                    style={{ width: `${d.n > 0 ? Math.max(pct, 8) : 0}%` }}
                  />
                </div>
                <span className={`shrink-0 text-right font-bold ${c.num} ${grande ? "text-base w-6" : "text-xs w-4"}`}>
                  {d.n}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TermometroView({ turma, grande = false }: { turma: TurmaTermometro; grande?: boolean }) {
  const nada = turma.preenchidosInicio === 0 && turma.preenchidosFim === 0;
  if (nada) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <Thermometer className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className={grande ? "text-xl" : "text-base"}>Nenhum participante preencheu o Termômetro ainda.</p>
        <p className={`mt-1 ${grande ? "text-lg" : "text-sm"} text-gray-400`}>
          Cada um acessa em <strong>Fase Preliminar → Termômetro Institucional</strong> e avalia o próprio órgão.
        </p>
      </div>
    );
  }

  const temFim = turma.preenchidosFim > 0;

  return (
    <div className={grande ? "space-y-6" : "space-y-4"}>
      {/* Médias + salto */}
      <div className="rounded-xl border-2 border-indigo-100 bg-white p-4">
        <p className={`text-center font-bold text-indigo-900 mb-3 ${grande ? "text-2xl" : "text-base"}`}>
          🌡️ Maturidade média da turma
        </p>
        <div className="flex items-stretch gap-2 sm:gap-3">
          <Medidor titulo="Início do curso" score={turma.mediaInicio} grande={grande} />
          <div className="flex items-center text-indigo-300 shrink-0">
            <ArrowRight className={grande ? "h-8 w-8" : "h-5 w-5"} />
          </div>
          <Medidor titulo="Final do curso" score={turma.mediaFim} grande={grande} />
        </div>

        {temFim && turma.saltoMedio !== null && (
          <div className="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-center">
            <p className={`font-bold uppercase tracking-wide text-amber-800 ${grande ? "text-sm" : "text-[10px]"}`}>
              Salto médio de consciência
            </p>
            <p className={`font-extrabold text-amber-900 leading-none mt-0.5 ${grande ? "text-4xl" : "text-2xl"}`}>
              {turma.saltoMedio > 0 ? "+" : ""}{turma.saltoMedio} pontos
            </p>
            <p className={`text-amber-700 mt-1 ${grande ? "text-base" : "text-xs"}`}>
              entre os {turma.comAmbos} que responderam início e fim
            </p>
          </div>
        )}
      </div>

      {/* Distribuição — o panorama: cada instituição num estágio */}
      <div>
        <p className={`text-center text-gray-500 mb-2 ${grande ? "text-base" : "text-xs"}`}>
          Cada participante avaliou o <strong>próprio órgão</strong> — veja como a turma se distribui:
        </p>
        <div className={`grid gap-3 ${temFim ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          <Distribuicao titulo="No início" dist={turma.distInicio} grande={grande} />
          {temFim && <Distribuicao titulo="No final" dist={turma.distFim} grande={grande} />}
        </div>
      </div>

      {/* Rodapé: cobertura */}
      <p className={`text-center text-gray-400 ${grande ? "text-base" : "text-xs"}`}>
        {turma.preenchidosInicio} de {turma.totalParticipantes} preencheram o início
        {temFim ? ` · ${turma.preenchidosFim} com o final` : ""}
      </p>
    </div>
  );
}
