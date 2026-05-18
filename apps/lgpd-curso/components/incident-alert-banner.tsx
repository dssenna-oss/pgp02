"use client";

// Banner sticky de alerta — aparece em qualquer página do dashboard quando
// há incidente de segurança aberto (status != ENCERRADO). Inclui os
// disparados pelo facilitador na Missão 5.
//
// Vermelho intenso pra criar pressão visual + ALARME SONORO opcional
// (Web Audio API — sirene tipo polícia). Comportamento:
//   1. Toca IMEDIATAMENTE quando chega incidente novo (count sobe)
//      — efeito surpresa pro DPO reagir. Latência: até 10s (polling).
//   2. Toca PERIODICAMENTE a cada 30s enquanto houver incidente em aberto
//      — pressão constante pra forçar o DPO a agir, não procrastinar.
// Som requer ativação manual por causa do autoplay block do Chrome/Edge.

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertTriangle, ChevronRight, Volume2, VolumeX } from "lucide-react";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

// Sirene de incidente — 2 tons alternando 4× (tipo polícia)
function tocarSirene(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  const sequencia = [880, 660, 880, 660, 880, 660]; // 6 tons × 250ms = 1.5s
  sequencia.forEach((freq, i) => {
    setTimeout(() => {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = "sawtooth"; // mais estridente que sine
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
      } catch {}
    }, i * 240);
  });
}

const STORAGE_SOM = "curso-incident-alarme-ativo";
const INTERVALO_REPETICAO_MS = 30000; // sirene repete a cada 30s enquanto há incidente

export function IncidentAlertBanner() {
  const { data: session } = useSession();
  const [emAberto, setEmAberto] = useState(0);
  const [somAtivo, setSomAtivo] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const emAbertoPrevRef = useRef<number | null>(null);
  const somAtivoRef = useRef<boolean>(false);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isDpo = role === "DPO";

  // Mantém ref sincronizada com o estado (pra usar no callback do polling)
  useEffect(() => { somAtivoRef.current = somAtivo; }, [somAtivo]);

  // Hidrata preferência de som do localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_SOM) === "1") setSomAtivo(true);
    } catch {}
  }, []);

  // Polling de progresso — DETECTA SUBIDA do count e dispara sirene
  // (efeito surpresa quando facilitador acabou de disparar incidente).
  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/missoes-progresso", { cache: "no-store" });
        if (!res.ok) return;
        const data: MissoesProgresso = await res.json();
        if (cancelled) return;
        const novo = Number(data.incidentesEmAberto || 0);
        const anterior = emAbertoPrevRef.current;
        // Toca sirene se: count SUBIU (chegou incidente novo) E não é o
        // primeiro load (evita tocar ao recarregar página com incidente
        // já existente). Som tem que estar ativo + AudioContext criado.
        if (
          anterior !== null &&
          novo > anterior &&
          somAtivoRef.current &&
          audioCtxRef.current
        ) {
          tocarSirene(audioCtxRef.current);
        }
        emAbertoPrevRef.current = novo;
        setEmAberto(novo);
      } catch {}
    }
    load();
    const id = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, session?.user?.id]);

  // Sirene periódica — toca a cada 30s ENQUANTO houver incidente em aberto
  // E som ativo. Pressão constante pra forçar o DPO a agir. Para
  // automaticamente quando incidente vai pra ENCERRADO ou som desligado.
  useEffect(() => {
    if (!somAtivo || emAberto === 0 || !audioCtxRef.current) return;
    const id = setInterval(() => {
      if (audioCtxRef.current) tocarSirene(audioCtxRef.current);
    }, INTERVALO_REPETICAO_MS);
    return () => clearInterval(id);
  }, [somAtivo, emAberto]);

  function toggleSom(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (somAtivo) {
      setSomAtivo(false);
      try { audioCtxRef.current?.close(); } catch {}
      audioCtxRef.current = null;
      try { localStorage.setItem(STORAGE_SOM, "0"); } catch {}
      return;
    }
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      setSomAtivo(true);
      tocarSirene(audioCtxRef.current); // bip-teste pra confirmar ativação
      try { localStorage.setItem(STORAGE_SOM, "1"); } catch {}
    } catch {}
  }

  if (isAdmin) return null;
  if (!session?.user?.companyId) return null;
  if (emAberto === 0) return null;

  const verbo = isDpo ? "Aja AGORA" : "Avise o DPO";

  return (
    <div className="bg-red-600 border-b-2 border-red-800 animate-pulse">
      <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 py-2.5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-white" />
        <Link
          href="/dashboard/incidentes"
          className="flex-1 text-sm text-white hover:underline"
        >
          <strong>🚨 {emAberto} INCIDENTE{emAberto > 1 ? "S" : ""} DE SEGURANÇA EM ABERTO!</strong>
          {" "}{verbo}. Prazo da ANPD começa contando agora (Res. CD/ANPD nº 15/2024 · Art. 48 LGPD).
        </Link>
        <button
          type="button"
          onClick={toggleSom}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
            somAtivo
              ? "bg-red-800 border-red-900 text-white hover:bg-red-900"
              : "bg-white border-red-300 text-red-700 hover:bg-red-50"
          }`}
          title={somAtivo ? "Desligar alarme sonoro" : "Ativar alarme sonoro (sirene a cada 30s)"}
        >
          {somAtivo ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {somAtivo ? "Alarme ON" : "Ativar alarme"}
        </button>
        <Link href="/dashboard/incidentes" className="shrink-0 text-white">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
