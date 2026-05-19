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
// Som vem LIGADO por padrão. AudioContext é criado no primeiro gesto
// do user na página (limitação Chrome/Edge). DPO pode desligar pelo botão.
//
// Refresh extra: quando aba ganha foco OU pathname muda, recarrega o count
// imediatamente — evita incoerência "banner diz 1 mas lista mostra 0" após
// deletar/encerrar incidente em outra página.

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, ChevronRight, Volume2, VolumeX } from "lucide-react";
import type { MissoesProgresso } from "@/lib/missoes-progresso";

// Sirene de incidente — 6 tons alternando (tipo polícia)
function tocarSirene(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  const sequencia = [880, 660, 880, 660, 880, 660];
  sequencia.forEach((freq, i) => {
    setTimeout(() => {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = "sawtooth";
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

// Storage: guardamos "OFF" se o DPO desligou explicitamente. Vazio/missing = LIGADO.
// Versão 2: chave nova pra invalidar valores antigos da versão anterior (onde
// "1"/"0" tinha semântica invertida — antes o ALARME ERA OFF por padrão, "0" no
// localStorage SEMPRE significava OFF nos 2 casos, mas estava "salvo" pra DPOs
// que clicaram em "Desligar" e ficavam presos em OFF mesmo querendo ON agora).
const STORAGE_SOM = "curso-incident-alarme-v2";
const STORAGE_SOM_LEGADO = "curso-incident-alarme-ativo";
const INTERVALO_REPETICAO_MS = 30000;

export function IncidentAlertBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [emAberto, setEmAberto] = useState(0);
  // Default LIGADO. Só fica false se localStorage tem "0" (DPO desligou).
  const [somAtivo, setSomAtivo] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const emAbertoPrevRef = useRef<number | null>(null);
  const somAtivoRef = useRef<boolean>(true);

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const isDpo = role === "DPO";

  useEffect(() => { somAtivoRef.current = somAtivo; }, [somAtivo]);

  // Hidrata preferência — DESLIGA apenas se o user explicitamente desligou
  // nessa versão do banner (chave v2). Limpa chave legada pra evitar herdar
  // estado da versão anterior.
  useEffect(() => {
    try {
      // Cleanup da chave antiga (semântica do componente mudou nessa versão)
      localStorage.removeItem(STORAGE_SOM_LEGADO);
      if (localStorage.getItem(STORAGE_SOM) === "OFF") setSomAtivo(false);
    } catch {}
  }, []);

  // Cria AudioContext no PRIMEIRO GESTO do user na página (Chrome/Edge
  // exigem). Listener é removido após primeiro acionamento. Se DPO já
  // desligou o som, não cria.
  useEffect(() => {
    if (isAdmin) return;
    function inicializarAudioContext() {
      if (audioCtxRef.current) return;
      if (!somAtivoRef.current) return;
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      } catch {}
    }
    const eventos: Array<keyof DocumentEventMap> = ["click", "keydown", "touchstart"];
    eventos.forEach((ev) => document.addEventListener(ev, inicializarAudioContext, { once: true, passive: true }));
    return () => {
      eventos.forEach((ev) => document.removeEventListener(ev, inicializarAudioContext));
    };
  }, [isAdmin]);

  // Função de load extraída — pra reuso em polling, focus e mudança de rota
  async function carregar(disparoSirene: boolean) {
    try {
      const res = await fetch("/api/missoes-progresso", { cache: "no-store" });
      if (!res.ok) return;
      const data: MissoesProgresso = await res.json();
      const novo = Number(data.incidentesEmAberto || 0);
      const anterior = emAbertoPrevRef.current;
      if (
        disparoSirene &&
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

  // Polling a cada 10s + load inicial
  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    let cancelled = false;
    function loadIfNotCancelled() {
      if (cancelled) return;
      carregar(true);
    }
    loadIfNotCancelled();
    const id = setInterval(loadIfNotCancelled, 10000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, session?.user?.id]);

  // Refresh imediato quando aba ganha foco (resolve "deletei em outra
  // aba" e quando muda de rota (resolve "deletei agora na lista")
  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    function onFocus() { carregar(false); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, session?.user?.id]);

  // Reage à mudança de pathname (navegação interna) — refresh imediato
  useEffect(() => {
    if (isAdmin || !session?.user?.id) return;
    carregar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Sirene periódica — toca a cada 30s ENQUANTO houver incidente em aberto
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
      try { localStorage.setItem(STORAGE_SOM, "OFF"); } catch {}
      return;
    }
    // Religando — tenta criar AudioContext na hora (clique é gesto válido)
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      setSomAtivo(true);
      tocarSirene(audioCtxRef.current);
      try { localStorage.removeItem(STORAGE_SOM); } catch {}
    } catch {}
  }

  if (isAdmin) return null;
  if (!session?.user?.companyId) return null;
  if (emAberto === 0) return null;

  const verbo = isDpo ? "Aja AGORA" : "Avise o DPO";

  // Banner inteiro é um Link clicável. Botão de som usa stopPropagation
  // pra não disparar a navegação ao alternar.
  return (
    <Link
      href="/dashboard/incidentes"
      className="block bg-red-600 hover:bg-red-700 border-b-2 border-red-800 animate-pulse transition-colors"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 py-2.5">
        <AlertTriangle className="h-5 w-5 shrink-0 text-white" />
        <div className="flex-1 text-sm text-white">
          <strong>🚨 {emAberto} INCIDENTE{emAberto > 1 ? "S" : ""} DE SEGURANÇA EM ABERTO!</strong>
          {" "}{verbo}. Prazo da ANPD começa contando agora (Res. CD/ANPD nº 15/2024 · Art. 48 LGPD).
        </div>
        <button
          type="button"
          onClick={toggleSom}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
            somAtivo
              ? "bg-red-800 border-red-900 text-white hover:bg-red-900"
              : "bg-white border-red-300 text-red-700 hover:bg-red-50"
          }`}
          title={somAtivo ? "Desligar alarme sonoro" : "Religar alarme sonoro"}
        >
          {somAtivo ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {somAtivo ? "Alarme ON" : "Alarme OFF"}
        </button>
        <ChevronRight className="h-5 w-5 shrink-0 text-white" />
      </div>
    </Link>
  );
}
