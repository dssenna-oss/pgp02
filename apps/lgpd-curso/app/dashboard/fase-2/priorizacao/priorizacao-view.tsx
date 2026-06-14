"use client";

// Matriz de Priorização — prática 2B da Fase 2.
// Aplica os critérios da Resolução CD/ANPD nº 2/2022 a cada processo, na
// estrutura oficial: 1 critério GERAL (3 fatores, larga escala) + 1 critério
// ESPECÍFICO (4 hipóteses). O participante MARCA o que se aplica (presença); o
// veredito de alto risco sai da regra "1+1" (≥1 geral E ≥1 específico).

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Save, ExternalLink, TrendingUp, AlertTriangle } from "lucide-react";
import {
  CRITERIOS_GERAIS,
  CRITERIOS_ESPECIFICOS,
  PONTOS_MAXIMO_POR_PROCESSO,
  vereditoPriorizacao,
  type NivelCriterio,
  type CriterioPriorizacao,
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

  function marcar(processoId: string, criterioId: string, valor: NivelCriterio) {
    setEstado((p) => ({
      ...p,
      [processoId]: {
        ...p[processoId],
        criterios: { ...p[processoId].criterios, [criterioId]: valor },
      },
    }));
  }
  function setJustificativa(processoId: string, v: string) {
    setEstado((p) => ({ ...p, [processoId]: { ...p[processoId], justificativa: v } }));
  }

  async function salvar() {
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

  // Ranking: alto risco no topo; depois, mais critérios marcados = mais prioritário.
  const ranking = processos
    .map((p) => ({ processo: p, v: vereditoPriorizacao(estado[p.id].criterios) }))
    .sort((a, b) => (b.v.altoRisco ? 1 : 0) - (a.v.altoRisco ? 1 : 0) || b.v.marcados - a.v.marcados);

  function GrupoCriterios({
    processoId,
    titulo,
    sub,
    criterios,
  }: {
    processoId: string;
    titulo: string;
    sub: string;
    criterios: CriterioPriorizacao[];
  }) {
    const st = estado[processoId];
    return (
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{titulo}</div>
        <div className="text-[11px] text-gray-500 mb-2">{sub}</div>
        <div className="space-y-2">
          {criterios.map((c) => {
            const escolhido = st.criterios[c.id];
            return (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                <div className="text-xs font-semibold text-gray-800">{c.emoji} {c.titulo}</div>
                <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{c.hint}</div>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => marcar(processoId, c.id, "sim")}
                    className={`px-2 py-1.5 rounded border text-xs font-semibold transition-colors ${
                      escolhido === "sim"
                        ? "bg-amber-100 border-amber-400 text-amber-900"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    ✓ Aplica
                  </button>
                  <button
                    type="button"
                    onClick={() => marcar(processoId, c.id, "nao")}
                    className={`px-2 py-1.5 rounded border text-xs font-semibold transition-colors ${
                      escolhido === "nao"
                        ? "bg-gray-200 border-gray-400 text-gray-800"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Não aplica
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
        Apliquem os critérios da Resolução CD/ANPD nº 2/2022 a cada processo. A <strong>regra “1+1”</strong>{" "}
        define o alto risco: pelo menos <strong>1 critério geral</strong> + pelo menos{" "}
        <strong>1 específico</strong>. Os de alto risco vão pro topo do Inventário (Fase 3).
      </p>

      {/* Fundamento normativo */}
      <div className="mt-4 rounded-md border-l-4 border-l-blue-500 border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
        <div className="font-semibold mb-1">📖 Fundamento normativo</div>
        <p>
          Os critérios são os da{" "}
          <a
            href="https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022"
            target="_blank"
            rel="noreferrer"
            className="underline inline-flex items-center gap-0.5"
          >
            Resolução CD/ANPD nº 2/2022 <ExternalLink className="h-3 w-3" />
          </a>
          . Entenda cada critério no guia{" "}
          <Link href="/dashboard/fase-2/alto-risco" className="underline font-medium">
            “É de Alto Risco?”
          </Link>
          . No curso focamos nos {processos.length} processos críticos pré-selecionados; na vida
          real, vocês cruzariam com a Carta de Serviços pra identificar TODOS.
        </p>
      </div>

      {/* Ranking ao vivo */}
      <div className="mt-4 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
          <TrendingUp className="h-4 w-4" /> Ranking ao vivo
        </h2>
        <div className="space-y-1.5">
          {ranking.map((r, i) => (
            <div
              key={r.processo.id}
              className={`flex items-center gap-2 border-l-4 ${
                r.v.altoRisco ? "border-l-red-500" : "border-l-gray-300"
              } bg-gray-50 px-3 py-2 rounded`}
            >
              <span className="font-bold text-sm text-gray-600">{i + 1}º</span>
              <span className="flex-1 text-sm font-medium text-gray-900 truncate">{r.processo.nome}</span>
              <span className="font-mono text-xs text-gray-500">
                {r.v.marcados}/{PONTOS_MAXIMO_POR_PROCESSO}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${
                  r.v.altoRisco ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"
                }`}
              >
                {r.v.altoRisco && <AlertTriangle className="h-3 w-3" />}
                {r.v.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Processos com os 2 critérios */}
      <div className="mt-6 space-y-6">
        {processos.map((p) => {
          const v = vereditoPriorizacao(estado[p.id].criterios);
          return (
            <div key={p.id} className="rounded-lg border bg-white">
              <div className="border-b bg-gray-50 px-4 py-3 rounded-t-lg flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">{p.nome}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">{p.setor}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={`text-sm font-bold inline-flex items-center gap-1 ${
                      v.altoRisco ? "text-red-700" : "text-gray-500"
                    }`}
                  >
                    {v.altoRisco && <AlertTriangle className="h-4 w-4" />}
                    {v.label}
                  </div>
                  <div className="text-[10px] text-gray-400">{v.marcados} de {PONTOS_MAXIMO_POR_PROCESSO} critérios</div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <GrupoCriterios
                  processoId={p.id}
                  titulo="1️⃣ Critério Geral — larga escala"
                  sub="Atendido se marcar pelo menos UM dos 3 fatores."
                  criterios={CRITERIOS_GERAIS}
                />
                <GrupoCriterios
                  processoId={p.id}
                  titulo="2️⃣ Critério Específico"
                  sub="Atendido se marcar pelo menos UMA das 4 hipóteses."
                  criterios={CRITERIOS_ESPECIFICOS}
                />

                <div className="pt-2 border-t">
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Justificativa do grupo (opcional)
                  </label>
                  <textarea
                    value={estado[p.id].justificativa}
                    onChange={(e) => setJustificativa(p.id, e.target.value)}
                    rows={2}
                    placeholder={v.altoRisco ? "Por que este processo é de alto risco?" : "Observações do grupo…"}
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
