"use client";

// Matriz de Priorização — prática 2B da Fase 2.
// Aplica 6 critérios da Res. CD/ANPD nº 2/2022 a cada um dos 2 processos
// do órgão. Score automático + ranking + justificativa por processo.

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Save, ExternalLink, TrendingUp } from "lucide-react";
import {
  CRITERIOS_PRIORIZACAO,
  PONTOS_MAXIMO_POR_PROCESSO,
  calcularScorePriorizacao,
  faixaPriorizacao,
  type NivelCriterio,
  type PriorizacaoSalva,
} from "@/lib/criterios-priorizacao";
import { salvarPriorizacao, type ProcessoContexto } from "./actions";

type EstadoProcesso = {
  criterios: Record<string, NivelCriterio>;
  justificativa: string;
};

export function PriorizacaoView({
  processos,
  salva,
}: {
  processos: ProcessoContexto[];
  salva: PriorizacaoSalva | null;
}) {
  const [estado, setEstado] = useState<Record<string, EstadoProcesso>>(() => {
    const m: Record<string, EstadoProcesso> = {};
    processos.forEach((p) => {
      const s = salva?.processos.find((x) => x.processoId === p.id);
      m[p.id] = {
        criterios: (s?.criterios as Record<string, NivelCriterio>) || {},
        justificativa: s?.justificativa || "",
      };
    });
    return m;
  });
  const [salvando, setSalvando] = useState(false);

  function escolher(processoId: string, criterioId: string, nivel: NivelCriterio) {
    setEstado((p) => ({
      ...p,
      [processoId]: {
        ...p[processoId],
        criterios: { ...p[processoId].criterios, [criterioId]: nivel },
      },
    }));
  }
  function setJustificativa(processoId: string, v: string) {
    setEstado((p) => ({
      ...p,
      [processoId]: { ...p[processoId], justificativa: v },
    }));
  }

  async function salvar() {
    // Valida: cada processo precisa de todos os 6 critérios respondidos
    for (const p of processos) {
      const respondidos = Object.keys(estado[p.id].criterios).length;
      if (respondidos < CRITERIOS_PRIORIZACAO.length) {
        toast.error(`Responda os ${CRITERIOS_PRIORIZACAO.length} critérios para "${p.nome}".`);
        return;
      }
    }
    setSalvando(true);
    try {
      const r = await salvarPriorizacao({
        processos: processos.map((p) => ({
          processoId: p.id,
          criterios: estado[p.id].criterios,
          justificativa: estado[p.id].justificativa,
        })),
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("✅ Priorização salva.");
    } finally {
      setSalvando(false);
    }
  }

  // Ranking visual (calculado em tempo real)
  const ranking = processos
    .map((p) => ({
      processo: p,
      score: calcularScorePriorizacao(estado[p.id].criterios),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/dashboard/fase-2"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase 2
      </Link>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Fase 2 · Prática 2B
      </div>
      <h1 className="text-2xl font-bold text-gray-900">🎯 Matriz de Priorização</h1>
      <p className="text-sm text-gray-600 mt-1">
        Apliquem os 6 critérios a cada processo. Score automático = soma dos pontos
        (0-{PONTOS_MAXIMO_POR_PROCESSO}). Ranking sugere por onde começar o Inventário (Fase 3).
      </p>

      {/* Box com fundamento normativo */}
      <div className="mt-4 rounded-md border-l-4 border-l-blue-500 border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
        <div className="font-semibold mb-1">📖 Fundamento normativo</div>
        <p>
          Os critérios usados aqui derivam da{" "}
          <a
            href="https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022"
            target="_blank"
            rel="noreferrer"
            className="underline inline-flex items-center gap-0.5"
          >
            Resolução CD/ANPD nº 2/2022 <ExternalLink className="h-3 w-3" />
          </a>{" "}
          (alto risco × agentes de pequeno porte) combinada com boas práticas de
          privacy-by-design. Em uma instituição real, vocês cruzariam com a{" "}
          <strong>Carta de Serviços</strong> da Instituição pra identificar TODOS os
          processos. No curso, focamos nos {processos.length} processos críticos já
          pré-selecionados.
        </p>
      </div>

      {/* Ranking ao vivo */}
      <div className="mt-4 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
          <TrendingUp className="h-4 w-4" /> Ranking ao vivo
        </h2>
        <div className="space-y-1.5">
          {ranking.map((r, i) => {
            const faixa = faixaPriorizacao(r.score);
            const corBorder =
              faixa.cor === "red" ? "border-l-red-500" :
              faixa.cor === "amber" ? "border-l-amber-500" :
              "border-l-emerald-500";
            const corBadge =
              faixa.cor === "red" ? "bg-red-100 text-red-800" :
              faixa.cor === "amber" ? "bg-amber-100 text-amber-800" :
              "bg-emerald-100 text-emerald-800";
            return (
              <div key={r.processo.id} className={`flex items-center gap-2 border-l-4 ${corBorder} bg-gray-50 px-3 py-2 rounded`}>
                <span className="font-bold text-sm text-gray-600">{i + 1}º</span>
                <span className="flex-1 text-sm font-medium text-gray-900 truncate">{r.processo.nome}</span>
                <span className="font-mono text-sm font-bold">{r.score}/{PONTOS_MAXIMO_POR_PROCESSO}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${corBadge}`}>
                  {faixa.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processos com matriz de critérios */}
      <div className="mt-6 space-y-6">
        {processos.map((p) => {
          const st = estado[p.id];
          const score = calcularScorePriorizacao(st.criterios);
          const faixa = faixaPriorizacao(score);
          return (
            <div key={p.id} className="rounded-lg border bg-white">
              <div className="border-b bg-gray-50 px-4 py-3 rounded-t-lg flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">{p.nome}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">{p.setor}</div>
                </div>
                <div className={`shrink-0 text-right ${
                  faixa.cor === "red" ? "text-red-700" :
                  faixa.cor === "amber" ? "text-amber-700" :
                  "text-emerald-700"
                }`}>
                  <div className="text-xl font-bold font-mono">{score}/{PONTOS_MAXIMO_POR_PROCESSO}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide">{faixa.label}</div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {CRITERIOS_PRIORIZACAO.map((c) => {
                  const escolhido = st.criterios[c.id];
                  return (
                    <div key={c.id}>
                      <div className="text-xs font-semibold text-gray-800 mb-1.5">
                        {c.emoji} {c.titulo}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {c.opcoes.map((op) => {
                          const ativa = escolhido === op.id;
                          const cor =
                            op.id === "alto" ? "red" : op.id === "medio" ? "amber" : "emerald";
                          return (
                            <button
                              key={op.id}
                              type="button"
                              onClick={() => escolher(p.id, c.id, op.id)}
                              className={`p-2 rounded border text-left transition-colors ${
                                ativa
                                  ? cor === "red"
                                    ? "bg-red-50 border-red-300 text-red-900"
                                    : cor === "amber"
                                    ? "bg-amber-50 border-amber-300 text-amber-900"
                                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wide">{op.rotulo}</span>
                                <span className="text-[9px] font-mono opacity-60">+{op.pontos}</span>
                              </div>
                              <div className="text-[10px] leading-tight">{op.descricao}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t mt-3">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Justificativa do grupo (opcional)
                  </label>
                  <textarea
                    value={st.justificativa}
                    onChange={(e) => setJustificativa(p.id, e.target.value)}
                    rows={2}
                    placeholder={`Por que ${p.nome.split(" ").slice(0, 4).join(" ")}... ${score >= 13 ? "merece prioridade alta?" : score >= 7 ? "fica em prioridade média?" : "tem baixa prioridade?"}`}
                    className="mt-1 w-full px-2.5 py-1.5 border rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur border-t pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar priorização"}
        </button>
      </div>
    </div>
  );
}
