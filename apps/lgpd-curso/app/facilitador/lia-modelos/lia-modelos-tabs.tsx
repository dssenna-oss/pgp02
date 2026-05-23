"use client";

// Tabs PM/CM pra alternar entre os 2 modelos de LIA durante o debrief.
// Cada modelo é renderizado pelo LiaModeloView, que já tem Modo Projeção.

import { useState } from "react";
import { Scale, ExternalLink } from "lucide-react";
import { LIA_MODELOS } from "@/lib/lia-modelos";
import { LiaModeloView } from "@/components/lia-modelo-view";

export function LiaModelosTabs() {
  const [tabId, setTabId] = useState<string>(LIA_MODELOS[0]?.id ?? "");
  const modelo = LIA_MODELOS.find((m) => m.id === tabId) || LIA_MODELOS[0];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho institucional */}
      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Facilitador · Apoio pedagógico
      </div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Scale className="h-6 w-6 text-violet-600" />
        LIA — Modelos (Reflexão Final)
      </h1>
      <p className="text-sm text-gray-600 mt-1 mb-4 leading-relaxed">
        Dois modelos preenchidos de <strong>Avaliação de Legítimo Interesse</strong>{" "}
        (Art. 10 §3º LGPD) — um pra cada incidente do curso. Use na Reflexão
        Final ao revelar as Pegadinhas #1 (PM/Posto) e #4 (CM/Ouvidoria):
        mostre como a LIA <strong>teria bloqueado/reprovado</strong> o tratamento
        que originou a falha. Cada modelo tem 3 etapas (Finalidade · Necessidade ·
        Balanceamento) com Modo Projeção.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-5">
        {LIA_MODELOS.map((m) => {
          const ativo = m.id === tabId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setTabId(m.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                ativo
                  ? m.orgao === "PM"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              {m.orgao === "PM" ? "Prefeitura · Marketing do Posto" : "Câmara · Newsletter da Ouvidoria"}
            </button>
          );
        })}
      </div>

      {/* View do modelo selecionado */}
      <LiaModeloView modelo={modelo} />

      {/* Nota de rodapé */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-4 text-xs text-gray-600 flex items-start gap-2">
        <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
        <div>
          <strong className="text-gray-800">No app principal de produção</strong>{" "}
          (<code className="font-mono">lgpd-pgp.vercel.app/dashboard/lia</code>) você pode CRIAR e EDITAR LIAs reais com workflow Contribuidor→DPO + export DOCX/PDF.
          Aqui no curso são apenas modelos demonstrativos pra debrief.
        </div>
      </div>
    </div>
  );
}
