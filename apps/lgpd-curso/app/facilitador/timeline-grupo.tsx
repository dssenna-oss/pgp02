"use client";

// Timeline horizontal de 7 missões (M1 → Fim).
// Cada bolinha mostra: status (✅/🟡/⬜), label, contador opcional, e cronômetro
// "há Xmin" se a missão tá em andamento ou foi concluída.
//
// Cor da bolinha:
//   DONE   → verde
//   DOING  → amarelo (laranja se passou do tempo esperado)
//   IDLE   → cinza
// Conectores entre bolinhas vão verdes quando a missão antes está DONE.

import { CheckCircle2, Circle, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export type BolinhaMissao = {
  id: string;
  label: string;
  nomeCurto: string;
  status: "DONE" | "DOING" | "IDLE";
  contador?: string;
  duracaoEsperadaSeg: number;
  inicioEm?: string;
  ultimaAtividadeEm?: string;
};

function formatMin(seg: number): string {
  if (seg < 60) return `${seg}s`;
  const m = Math.floor(seg / 60);
  return `${m}min`;
}

export function TimelineGrupo({ bolinhas }: { bolinhas: BolinhaMissao[] }) {
  // Re-renderiza a cada 30s pra atualizar "há Xmin"
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {bolinhas.map((b, i) => {
        const proxima = bolinhas[i + 1];
        const conectorAtivo = b.status === "DONE";

        return (
          <div key={b.id} className="flex items-start min-w-0">
            <Bolinha bolinha={b} />
            {proxima && (
              <div
                className={`h-0.5 mt-5 flex-1 min-w-[18px] sm:min-w-[28px] transition-colors ${
                  conectorAtivo ? "bg-emerald-400" : "bg-gray-200"
                }`}
                style={{ marginLeft: "-2px", marginRight: "-2px" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Bolinha({ bolinha: b }: { bolinha: BolinhaMissao }) {
  const segDecorridos = b.inicioEm
    ? Math.floor((Date.now() - new Date(b.inicioEm).getTime()) / 1000)
    : 0;

  const passouTempo = b.status === "DOING" && segDecorridos > b.duracaoEsperadaSeg;

  const cor =
    b.status === "DONE" ? "bg-emerald-500 text-white border-emerald-600" :
    passouTempo ? "bg-orange-500 text-white border-orange-600 animate-pulse" :
    b.status === "DOING" ? "bg-amber-300 text-amber-900 border-amber-400" :
    "bg-gray-100 text-gray-400 border-gray-300";

  const Icone =
    b.status === "DONE" ? CheckCircle2 :
    passouTempo ? AlertTriangle :
    b.status === "DOING" ? Clock :
    Circle;

  return (
    <div className="flex flex-col items-center w-[60px] sm:w-[72px] shrink-0">
      {/* Bolinha */}
      <div
        className={`w-10 h-10 rounded-full border-2 ${cor} flex items-center justify-center shadow-sm`}
        title={`${b.label} · ${b.nomeCurto}${b.contador ? ` (${b.contador})` : ""}${
          segDecorridos > 0 ? ` · ${formatMin(segDecorridos)} desde início` : ""
        }`}
      >
        <Icone className="h-5 w-5" />
      </div>

      {/* Label */}
      <div className="mt-1 text-[10px] font-semibold text-gray-700">{b.label}</div>
      <div className="text-[9px] text-gray-500 leading-tight text-center max-w-full truncate" title={b.nomeCurto}>
        {b.nomeCurto}
      </div>

      {/* Contador */}
      {b.contador && (
        <div className="text-[9px] font-mono text-gray-600">{b.contador}</div>
      )}

      {/* Tempo */}
      {b.status === "DOING" && b.inicioEm && (
        <div className={`text-[9px] font-mono mt-0.5 ${passouTempo ? "text-orange-700 font-bold" : "text-gray-500"}`}>
          ⏱ {formatMin(segDecorridos)}
        </div>
      )}
      {b.status === "DONE" && b.inicioEm && b.ultimaAtividadeEm && (
        <div className="text-[9px] font-mono text-emerald-700 mt-0.5">
          {formatMin(
            Math.floor((new Date(b.ultimaAtividadeEm).getTime() - new Date(b.inicioEm).getTime()) / 1000),
          )}
        </div>
      )}
    </div>
  );
}
