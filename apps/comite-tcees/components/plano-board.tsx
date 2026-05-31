"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { statusEntrega, eixoTag, TRIMESTRES } from "@/lib/comite-ui";

export type EntregaDTO = {
  id: string;
  titulo: string;
  eixoCodigo: string;
  trimestre: string;
  responsavel: string | null;
  prazoTexto: string | null;
  status: string;
};

const EIXOS_FILTRO = [
  { f: "all", label: "Todos os eixos" },
  { f: "A", label: "Eixo A · Governança" },
  { f: "B", label: "Eixo B · Inventário/RIPD" },
  { f: "C", label: "Eixo C · Docs externos" },
  { f: "D", label: "Eixo D · Cultura" },
  { f: "E", label: "Eixo E · Monitoramento" },
];

export function PlanoBoard({ entregas }: { entregas: EntregaDTO[] }) {
  const [filtro, setFiltro] = useState("all");

  const visiveis = entregas.filter((e) => filtro === "all" || e.eixoCodigo === filtro);
  const concluidas = entregas.filter((e) => e.status === "CONCLUIDO").length;
  const atrasadas = entregas.filter((e) => e.status === "ATRASADO").length;

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-4">
        {EIXOS_FILTRO.map((c) => (
          <button
            key={c.f}
            onClick={() => setFiltro(c.f)}
            className={`text-xs font-semibold border rounded-full px-3 py-1.5 transition-colors ${
              filtro === c.f
                ? "bg-navy text-white border-navy"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        📋 {entregas.length} entregas · {concluidas} concluídas · {atrasadas} atrasadas
      </div>

      {TRIMESTRES.map((q) => {
        const doQ = visiveis.filter((e) => e.trimestre === q.id);
        if (doQ.length === 0) return null;
        return (
          <div key={q.id} className="mb-6">
            <h3 className="text-[13px] font-extrabold text-brand-700 flex items-center gap-2 mb-2.5">
              <span className="bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded text-xs">{q.label}</span>
              {q.sub}
            </h3>
            <div className="space-y-2">
              {doQ.map((e) => {
                const st = statusEntrega(e.status);
                return (
                  <div key={e.id} className="bg-white border rounded-xl px-3.5 py-3 flex items-center gap-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-gray-900">{e.titulo}</div>
                      <div className="text-[11.5px] text-gray-500 mt-1 flex gap-3.5 flex-wrap items-center">
                        {e.responsavel && (
                          <span>
                            <b className="text-gray-700 font-semibold">Resp.:</b> {e.responsavel}
                          </span>
                        )}
                        {e.prazoTexto && (
                          <span>
                            <b className="text-gray-700 font-semibold">Prazo:</b> {e.prazoTexto}
                          </span>
                        )}
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(e.eixoCodigo)}`}>
                          Eixo {e.eixoCodigo}
                        </span>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-2">
        💡 Em etapas futuras, clicar numa entrega abrirá o detalhe (checklist, anexos, comentários do colegiado),
        permitirá mudar o status e ligará a entrega à ferramenta que a executa (Inventário, RIPD, Aviso…),
        alimentando os indicadores e o Relatório automaticamente.
      </div>
    </>
  );
}
