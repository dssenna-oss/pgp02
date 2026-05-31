"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { eixoTag, MESES_PT } from "@/lib/comite-ui";

export type EventoDTO = {
  iso: string; // YYYY-MM-DD
  tipo: "MARCO" | "REUNIAO" | "PRAZO";
  titulo: string;
  eixo?: string | null;
  detalhe?: string | null;
};

const TIPO_DIA: Record<EventoDTO["tipo"], string> = {
  MARCO: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  REUNIAO: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300",
  PRAZO: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
};

const TIPO_BADGE: Record<EventoDTO["tipo"], { label: string; cls: string }> = {
  MARCO: { label: "marco", cls: "bg-amber-100 text-amber-800" },
  REUNIAO: { label: "reunião", cls: "bg-indigo-100 text-indigo-800" },
  PRAZO: { label: "prazo", cls: "bg-brand-50 text-brand-700" },
};

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioView({ eventos }: { eventos: EventoDTO[] }) {
  // Mês inicial: junho/2026 (início da execução do Plano).
  const [ano, setAno] = useState(2026);
  const [mes, setMes] = useState(5); // 0-indexado → junho

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  function eventosDoDia(dia: number): EventoDTO[] {
    const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    return eventos.filter((e) => e.iso === iso);
  }

  function navega(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 0) { m = 11; a -= 1; }
    if (m > 11) { m = 0; a += 1; }
    setMes(m);
    setAno(a);
  }

  // Agenda: próximos eventos a partir de hoje, ordenados.
  const hojeIso = new Date().toISOString().slice(0, 10);
  const agenda = [...eventos]
    .filter((e) => e.iso >= "2026-06-01")
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .slice(0, 8);

  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2 items-start">
      {/* Calendário */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <b className="text-[15px] capitalize">
            {new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </b>
          <div className="flex gap-1.5">
            <button onClick={() => navega(-1)} aria-label="Mês anterior" className="w-7 h-7 border rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navega(1)} aria-label="Próximo mês" className="w-7 h-7 border rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div key={d} className="text-[10px] uppercase text-gray-400 text-center font-bold py-1">{d}</div>
          ))}
          {celulas.map((dia, idx) => {
            if (dia === null) return <div key={`e${idx}`} />;
            const evs = eventosDoDia(dia);
            const ev = evs[0];
            const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            return (
              <div
                key={idx}
                title={evs.map((e) => e.titulo).join(" · ") || undefined}
                className={`aspect-square rounded-lg flex items-start justify-center pt-1.5 text-[12.5px] ${
                  ev ? `font-extrabold ${TIPO_DIA[ev.tipo]}` : "bg-slate-50 text-gray-700"
                } ${iso === hojeIso ? "outline outline-2 outline-brand-400" : ""}`}
              >
                {dia}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3.5 text-[11.5px] text-gray-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-amber-200 ring-1 ring-amber-300 inline-block" /> Marco crítico</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-indigo-200 ring-1 ring-indigo-300 inline-block" /> Reunião</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-brand-50 ring-1 ring-brand-100 inline-block" /> Prazo de entrega</span>
        </div>
      </div>

      {/* Agenda */}
      <div className="bg-white border rounded-xl p-4">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-1.5">🔜 Próximos eventos</div>
        <div className="divide-y">
          {agenda.map((e, i) => {
            const dt = new Date(e.iso + "T00:00:00");
            const badge = TIPO_BADGE[e.tipo];
            return (
              <div key={i} className="flex gap-3 py-2.5">
                <div className="w-[54px] shrink-0 text-center bg-slate-100 rounded-lg py-1.5 h-fit">
                  <div className="text-lg font-extrabold text-gray-900 leading-none">{dt.getDate()}</div>
                  <div className="text-[10px] uppercase text-gray-500 font-bold mt-0.5">{MESES_PT[dt.getMonth()]}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-gray-900">{e.titulo}</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5 flex gap-2 items-center flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${badge.cls}`}>{badge.label}</span>
                    {e.eixo && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${eixoTag(e.eixo)}`}>Eixo {e.eixo}</span>}
                    {e.detalhe && <span>{e.detalhe}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {agenda.length === 0 && <div className="text-sm text-gray-500 py-4">Sem eventos futuros cadastrados.</div>}
        </div>
      </div>
    </div>
  );
}
