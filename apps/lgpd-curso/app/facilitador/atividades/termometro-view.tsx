"use client";

// Visão coletiva do Termômetro Institucional — exibe score de início e fim
// de cada grupo lado a lado. Usada no painel do facilitador (compacta) e no
// cartaz de projeção (prop `grande=true` aumenta as fontes).

import { Thermometer } from "lucide-react";

export type FaixaInfo = { label: string; cor: string; descricao: string };
export type GrupoTermometro = {
  grupoId: string;
  numero: number;
  orgao: string;
  nomeGrupo: string;
  inicio: { score: number; faixa: FaixaInfo } | null;
  fim: { score: number; faixa: FaixaInfo } | null;
};

function corFaixa(cor: string): { bg: string; border: string; text: string; num: string } {
  switch (cor) {
    case "emerald": return { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", num: "text-emerald-800" };
    case "blue":    return { bg: "bg-blue-50",    border: "border-blue-300",    text: "text-blue-700",    num: "text-blue-800"    };
    case "amber":   return { bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-700",   num: "text-amber-800"   };
    case "orange":  return { bg: "bg-orange-50",  border: "border-orange-300",  text: "text-orange-700",  num: "text-orange-800"  };
    default:        return { bg: "bg-gray-50",    border: "border-gray-200",    text: "text-gray-500",    num: "text-gray-700"    };
  }
}

function emojiOrgao(orgao: string) { return orgao === "PM" ? "🛕" : "🏛"; }
function nomeOrgao(orgao: string)  { return orgao === "PM" ? "Prefeitura" : "Câmara"; }

export function TermometroView({
  grupos,
  grande = false,
}: {
  grupos: GrupoTermometro[];
  grande?: boolean;
}) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        Nenhum grupo encontrado nesta turma.
      </div>
    );
  }

  const algumPreenchido = grupos.some((g) => g.inicio);
  if (!algumPreenchido) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <Thermometer className="mx-auto h-10 w-10 text-gray-300 mb-3" />
        <p className={grande ? "text-xl" : "text-base"}>Nenhum grupo preencheu o Termômetro ainda.</p>
        <p className={`mt-1 ${grande ? "text-lg" : "text-sm"} text-gray-400`}>
          Os grupos acessam em <strong>Fase Preliminar → Termômetro Institucional</strong>.
        </p>
      </div>
    );
  }

  // Colunas: até 3 → 3 colunas; 4 → 2; 5-6 → 3
  const cols =
    grupos.length <= 3 ? "grid-cols-1 sm:grid-cols-3"
    : grupos.length === 4 ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`grid gap-4 ${cols}`}>
      {grupos.map((g) => {
        const evolucao = g.inicio && g.fim ? g.fim.score - g.inicio.score : null;
        const ic = g.inicio ? corFaixa(g.inicio.faixa.cor) : null;
        const fc = g.fim    ? corFaixa(g.fim.faixa.cor)    : null;

        return (
          <div key={g.grupoId} className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* cabeçalho do grupo */}
            <div className="bg-indigo-700 text-white px-4 py-2.5 text-center">
              <p className={`font-bold ${grande ? "text-2xl" : "text-base"}`}>
                {emojiOrgao(g.orgao)} G{g.numero} · {nomeOrgao(g.orgao)}
              </p>
            </div>

            <div className={`${grande ? "p-5" : "p-3"} space-y-2`}>
              {/* INÍCIO */}
              {g.inicio && ic ? (
                <div className={`rounded-lg border ${ic.border} ${ic.bg} ${grande ? "p-4" : "p-2.5"} text-center`}>
                  <p className={`font-semibold uppercase tracking-wide ${ic.text} ${grande ? "text-sm" : "text-[10px]"} mb-1`}>
                    Início do curso
                  </p>
                  <p className={`font-extrabold ${grande ? "text-5xl" : "text-3xl"} ${ic.num} leading-none`}>
                    {g.inicio.score}
                    <span className={`${grande ? "text-2xl" : "text-base"} font-normal`}>/100</span>
                  </p>
                  <p className={`${grande ? "text-base" : "text-xs"} ${ic.text} mt-1`}>
                    {g.inicio.faixa.label}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-2.5 text-center">
                  <p className="text-xs text-gray-400">Início não preenchido</p>
                </div>
              )}

              {/* seta */}
              <div className={`text-center text-gray-400 ${grande ? "text-2xl" : "text-base"}`}>↓</div>

              {/* FIM */}
              {g.fim && fc ? (
                <div className={`rounded-lg border ${fc.border} ${fc.bg} ${grande ? "p-4" : "p-2.5"} text-center`}>
                  <p className={`font-semibold uppercase tracking-wide ${fc.text} ${grande ? "text-sm" : "text-[10px]"} mb-1`}>
                    Final do curso
                  </p>
                  <p className={`font-extrabold ${grande ? "text-5xl" : "text-3xl"} ${fc.num} leading-none`}>
                    {g.fim.score}
                    <span className={`${grande ? "text-2xl" : "text-base"} font-normal`}>/100</span>
                  </p>
                  <p className={`${grande ? "text-base" : "text-xs"} ${fc.text} mt-1`}>
                    {g.fim.faixa.label}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-2.5 text-center">
                  <p className="text-xs text-gray-400">Final não preenchido ainda</p>
                </div>
              )}

              {/* EVOLUÇÃO — só aparece quando ambos preenchidos */}
              {evolucao !== null && (
                <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-center">
                  <p className={`font-bold uppercase tracking-wide text-amber-800 ${grande ? "text-sm" : "text-[10px]"} mb-1`}>
                    Evolução
                  </p>
                  <p className={`font-extrabold ${grande ? "text-4xl" : "text-2xl"} text-amber-900 leading-none`}>
                    {g.inicio!.score} → {g.fim!.score}
                  </p>
                  <p className={`font-bold text-amber-700 ${grande ? "text-xl" : "text-sm"} mt-0.5`}>
                    {evolucao > 0 ? "+" : ""}{evolucao} pontos
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
