"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const MISSOES = [
  { id: 0,  nome: "M0 · Quem somos nós?",                  duracaoSeg:  5 * 60 },
  { id: 1,  nome: "M1 · Inventário",                       duracaoSeg: 25 * 60 },
  { id: 2,  nome: "M2 · Análise de Riscos",                duracaoSeg: 15 * 60 },
  { id: 3,  nome: "M3 · GAP Analysis",                     duracaoSeg: 10 * 60 },
  { id: 4,  nome: "M4a · RIPD + Terceiros + DSR",          duracaoSeg:  8 * 60 },
  { id: 5,  nome: "M4b · Aviso de Privacidade",            duracaoSeg: 12 * 60 },
  { id: 6,  nome: "🚨 M5 · Incidente Surpresa",            duracaoSeg: 25 * 60 },
  { id: 7,  nome: "Reflexão Final",                         duracaoSeg: 15 * 60 },
];

const STORAGE_KEY = "curso-cronometro-missao-idx";

function formatTime(seg: number): string {
  const abs = Math.abs(seg);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const s = (abs % 60).toString().padStart(2, "0");
  return (seg < 0 ? "-" : "") + `${m}:${s}`;
}

export function Cronometro() {
  const [missaoIdx, setMissaoIdx] = useState(0);
  const [restanteSeg, setRestanteSeg] = useState(MISSOES[0].duracaoSeg);
  const [rodando, setRodando] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const missao = MISSOES[missaoIdx];

  // Carrega missão do localStorage no mount — sobrevive a logout/login do facilitador
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < MISSOES.length) {
        setMissaoIdx(idx);
        setRestanteSeg(MISSOES[idx].duracaoSeg);
      }
    }
    setHidratado(true);
  }, []);

  // Salva missão no localStorage sempre que mudar (depois da hidratação inicial)
  useEffect(() => {
    if (hidratado && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(missaoIdx));
    }
  }, [missaoIdx, hidratado]);

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setRestanteSeg((s) => s - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [rodando]);

  function play() { setRodando(true); }
  function pause() { setRodando(false); }
  function reset() { setRestanteSeg(missao.duracaoSeg); setRodando(false); }

  function irPara(novoIdx: number) {
    if (novoIdx >= 0 && novoIdx < MISSOES.length && novoIdx !== missaoIdx) {
      setMissaoIdx(novoIdx);
      setRestanteSeg(MISSOES[novoIdx].duracaoSeg);
      setRodando(false);
    }
  }

  function proxima() { irPara(missaoIdx + 1); }
  function anterior() { irPara(missaoIdx - 1); }

  // Cor do cronômetro baseada no tempo restante
  const minTotal = missao.duracaoSeg;
  const fracaoRest = restanteSeg / minTotal;
  const bgColor =
    restanteSeg < 0 ? "bg-red-700" :
    fracaoRest < 0.15 ? "bg-red-600" :
    fracaoRest < 0.3 ? "bg-amber-600" :
    "bg-gray-900";

  return (
    <div className={`${bgColor} rounded-lg p-4 mb-6 text-white transition-colors`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 text-center sm:text-left">
          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">Missão atual</div>
          <div className="text-lg sm:text-xl font-bold">{missao.nome}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">Tempo restante</div>
          <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums">{formatTime(restanteSeg)}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-center">
          <Button size="sm" variant="ghost" onClick={anterior} disabled={missaoIdx === 0}
            title="Missão anterior (sem ativar cronômetro)"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}
            title="Resetar tempo desta missão"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {rodando
            ? <Button size="sm" variant="ghost" onClick={pause}
                className="bg-amber-500 hover:bg-amber-600 text-white"><Pause className="h-4 w-4" /> Pausar</Button>
            : <Button size="sm" variant="ghost" onClick={play}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"><Play className="h-4 w-4" /> Iniciar</Button>}
          <Button size="sm" variant="ghost" onClick={proxima} disabled={missaoIdx === MISSOES.length - 1}
            title="Próxima missão (sem ativar cronômetro)"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Salto direto pra qualquer missão (sem precisar clicar várias vezes ◀/▶) */}
      <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
        <span className="opacity-70">Pular pra:</span>
        <Select
          value={String(missaoIdx)}
          onChange={(e) => irPara(parseInt(e.target.value, 10))}
          className="text-gray-900 max-w-xs bg-white"
        >
          {MISSOES.map((m, i) => (
            <option key={i} value={i}>
              {m.nome} ({Math.round(m.duracaoSeg / 60)}min)
            </option>
          ))}
        </Select>
        <span className="opacity-60 text-[10px]">
          ↻ Estado é salvo no navegador — sobrevive a logout/login
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${Math.max(0, Math.min(100, fracaoRest * 100))}%` }}
        />
      </div>
    </div>
  );
}
