"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusEntrega, eixoTag, EIXO_BAR } from "@/lib/comite-ui";

export type EntregaDTO = {
  id: string;
  titulo: string;
  descricao: string | null;
  eixoCodigo: string;
  trimestre: string;
  responsavel: string | null;
  prazoTexto: string | null;
  status: string;
  ferramentaHref: string | null;
};

export type EixoResumo = {
  id: string;
  codigo: string;
  nome: string;
  pct: number;
  total: number;
  concluidas: number;
};

type Drawer =
  | { tipo: "EXECUCAO" }
  | { tipo: "ATRASADAS" }
  | { tipo: "EIXO"; codigo: string; nome: string };

// Ordem de exibição dos status dentro do drawer de execução.
const ORDEM_STATUS = ["ATRASADO", "EM_ANDAMENTO", "A_INICIAR", "CONCLUIDO"];

export function VisaoGeralCards({
  execPct,
  concluidas,
  total,
  atrasadas,
  eixos,
  entregas,
  marcoMae,
  marcoMaePrazo,
  proximoData,
  proximoDesc,
  marcosSlot,
}: {
  execPct: number;
  concluidas: number;
  total: number;
  atrasadas: number;
  eixos: EixoResumo[];
  entregas: EntregaDTO[];
  marcoMae: string;
  marcoMaePrazo: string;
  proximoData: string;
  proximoDesc: string;
  marcosSlot: ReactNode;
}) {
  const [drawer, setDrawer] = useState<Drawer | null>(null);

  // Conjunto de entregas + título do painel conforme o card clicado.
  let lista: EntregaDTO[] = [];
  let titulo = "";
  let subtitulo = "";
  if (drawer?.tipo === "EXECUCAO") {
    lista = entregas;
    titulo = "Execução do Plano de Trabalho";
    subtitulo = `${concluidas} de ${total} entregas concluídas · ${execPct}%`;
  } else if (drawer?.tipo === "ATRASADAS") {
    lista = entregas.filter((e) => e.status === "ATRASADO");
    titulo = "Entregas atrasadas";
    subtitulo = `${lista.length} ${lista.length === 1 ? "entrega exige" : "entregas exigem"} atenção`;
  } else if (drawer?.tipo === "EIXO") {
    lista = entregas.filter((e) => e.eixoCodigo === drawer.codigo);
    const r = eixos.find((x) => x.codigo === drawer.codigo);
    titulo = `Eixo ${drawer.codigo} · ${drawer.nome}`;
    subtitulo = r ? `${r.concluidas} de ${r.total} concluídas · ${r.pct}%` : "";
  }

  const cardBtn =
    "text-left w-full bg-white border rounded-xl p-4 transition-shadow hover:shadow-md hover:border-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40";

  return (
    <>
      {/* KPIs */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <button onClick={() => setDrawer({ tipo: "EXECUCAO" })} className={`${cardBtn} border-l-4 border-l-brand-500`}>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-semibold">Execução do Plano</div>
            <span className="text-[10px] text-brand-600 font-semibold">ver detalhes →</span>
          </div>
          <div className="text-3xl font-extrabold text-brand-700 mt-1">{execPct}%</div>
          <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <span className="block h-full bg-brand-500 rounded-full" style={{ width: `${execPct}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1.5">{concluidas} de {total} entregas concluídas</div>
        </button>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500 font-semibold">Marco-mãe</div>
          <div className="text-lg font-extrabold text-gray-900 mt-2">{marcoMae}</div>
          <div className="text-[11px] text-gray-500 mt-1">prazo {marcoMaePrazo}</div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500 font-semibold">Próximo marco crítico</div>
          <div className="text-lg font-extrabold text-gray-900 mt-2">{proximoData}</div>
          <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">{proximoDesc}</div>
        </div>

        <button
          onClick={() => atrasadas > 0 && setDrawer({ tipo: "ATRASADAS" })}
          className={`${cardBtn} ${atrasadas === 0 ? "cursor-default hover:shadow-none hover:border-gray-200" : ""}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-semibold">Entregas atrasadas</div>
            {atrasadas > 0 && <span className="text-[10px] text-red-600 font-semibold">ver detalhes →</span>}
          </div>
          <div className="text-3xl font-extrabold mt-1" style={{ color: atrasadas ? "#dc2626" : "#111827" }}>
            {atrasadas}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{atrasadas > 0 ? "exigem atenção" : "nenhuma atrasada 🎉"}</div>
        </button>
      </div>

      <div className="mt-7">{marcosSlot}</div>

      {/* Progresso por eixo (clicável) */}
      <h2 className="text-sm font-extrabold text-gray-900 mt-7 mb-3 flex items-center gap-2">🧭 Progresso por eixo</h2>
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {eixos.map((e) => (
          <button key={e.id} onClick={() => setDrawer({ tipo: "EIXO", codigo: e.codigo, nome: e.nome })} className={cardBtn}>
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(e.codigo)}`}>
                Eixo {e.codigo} · {e.nome}
              </span>
              <b className="text-sm">{e.pct}%</b>
            </div>
            <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
              <span className={`block h-full rounded-full ${EIXO_BAR[e.codigo] ?? "bg-brand-500"}`} style={{ width: `${e.pct}%` }} />
            </div>
            <div className="text-[11px] text-gray-500 mt-1.5">{e.concluidas} de {e.total} concluídas · ver entregas →</div>
          </button>
        ))}
      </div>

      {/* Drawer lateral */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(null)} />
          <aside className="relative w-full max-w-md bg-slate-50 h-full shadow-xl flex flex-col">
            <div className="bg-white border-b px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">{titulo}</h3>
                {subtitulo && <p className="text-[12px] text-gray-500 mt-0.5">{subtitulo}</p>}
              </div>
              <button onClick={() => setDrawer(null)} aria-label="Fechar" className="text-gray-400 hover:text-gray-700 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2.5">
              {lista.length === 0 && (
                <p className="text-[13px] text-gray-500 text-center mt-8">Nenhuma entrega nesta lista.</p>
              )}
              {drawer.tipo === "EXECUCAO"
                ? ORDEM_STATUS.map((st) => {
                    const grupo = lista.filter((e) => e.status === st);
                    if (grupo.length === 0) return null;
                    const meta = statusEntrega(st);
                    return (
                      <div key={st}>
                        <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <span className="text-[11px] text-gray-400">{grupo.length}</span>
                        </div>
                        {grupo.map((e) => <EntregaRow key={e.id} e={e} showStatus={false} />)}
                      </div>
                    );
                  })
                : lista.map((e) => <EntregaRow key={e.id} e={e} showStatus />)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function EntregaRow({ e, showStatus }: { e: EntregaDTO; showStatus: boolean }) {
  const meta = statusEntrega(e.status);
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-gray-900 leading-snug">{e.titulo}</span>
        {showStatus && <Badge variant={meta.variant} className="shrink-0">{meta.label}</Badge>}
      </div>
      {e.descricao && <p className="text-[11.5px] text-gray-500 mt-1 line-clamp-2">{e.descricao}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500">
        <span className={`font-bold px-1.5 py-0.5 rounded ${eixoTag(e.eixoCodigo)}`}>Eixo {e.eixoCodigo}</span>
        {e.responsavel && <span>👤 {e.responsavel}</span>}
        {e.prazoTexto && <span>📅 {e.prazoTexto}</span>}
        <span className="text-gray-400">{e.trimestre}</span>
      </div>
      {e.ferramentaHref && (
        <Link
          href={e.ferramentaHref}
          className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-brand-600 hover:text-brand-700"
        >
          Executar <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
