"use client";

// Banner pedagógico no topo da Missão 3 mostrando que os 10 controles
// do curso são uma AMOSTRA dos 119 controles da matriz completa de adequação.
// Colapsável — começa fechado pra não poluir, mas convida a expandir.

import { useState } from "react";
import { Info, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { DOMINIOS_GAP_COMPLETO, GAP_CONTEXTO_RESUMO } from "@/lib/gap-contexto";

export function GapContextoBanner() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="border border-brand-300 bg-brand-50 rounded-lg mb-6">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-brand-100/50 transition-colors rounded-lg"
      >
        <Info className="h-5 w-5 text-brand-700 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-brand-900 text-sm">
            Por que só 10 controles aqui?
          </div>
          <p className="text-xs text-brand-900 mt-0.5 leading-relaxed">
            O trabalho real de adequação LGPD envolve <strong>{GAP_CONTEXTO_RESUMO.totalControles} controles em {GAP_CONTEXTO_RESUMO.totalDominios} domínios</strong> da matriz oficial. Esses 10 que você vai responder agora são uma <strong>amostra curada</strong> de 5 áreas críticas — pra você sentir o ritmo da análise em 10 minutos. {aberto ? "Veja abaixo o panorama completo." : "Clique pra ver o panorama completo."}
          </p>
        </div>
        {aberto
          ? <ChevronUp className="h-5 w-5 text-brand-700 shrink-0" />
          : <ChevronDown className="h-5 w-5 text-brand-700 shrink-0" />}
      </button>

      {aberto && (
        <div className="border-t border-brand-300 px-4 py-4 bg-white rounded-b-lg">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
            Os {GAP_CONTEXTO_RESUMO.totalDominios} domínios da Matriz de Controles oficial
          </div>
          <div className="text-xs text-gray-600 mb-3">
            <span className="inline-flex items-center gap-1 mr-3">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Coberto (parcialmente) no curso
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-gray-300 inline-block" /> Não coberto no curso
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DOMINIOS_GAP_COMPLETO.map((d, i) => (
              <div
                key={i}
                className={`border rounded p-2 text-xs ${d.cobertoNoCurso ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-start gap-2">
                  {d.cobertoNoCurso
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    : <span className="h-3.5 w-3.5 rounded-full bg-gray-300 shrink-0 mt-0.5 inline-block" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 leading-snug">
                      {d.nome}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {d.qtdControles} controle{d.qtdControles > 1 ? "s" : ""}
                    </div>
                    <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                      {d.resumo}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-2 rounded text-xs text-amber-900">
            <strong>Pedagogicamente:</strong> dos {GAP_CONTEXTO_RESUMO.totalDominios} domínios, {GAP_CONTEXTO_RESUMO.cobertosNoCurso} são tocados (parcialmente) pelos 10 controles do curso. Os outros {GAP_CONTEXTO_RESUMO.totalDominios - GAP_CONTEXTO_RESUMO.cobertosNoCurso} ficam pro trabalho real de adequação — ou pra cursos avançados. Resista à tentação de responder "ADERENTE" só porque parece bonito: GAP serve pra REVELAR o que falta.
          </div>
        </div>
      )}
    </div>
  );
}
