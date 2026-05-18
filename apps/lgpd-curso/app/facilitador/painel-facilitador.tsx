"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap, Award, Pause, Play, RotateCcw, ChevronRight,
  Bell, BellOff, Volume2, VolumeX, LifeBuoy, Check, X,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Cronometro } from "./cronometro";
import { TimelineGrupo, type BolinhaMissao } from "./timeline-grupo";
import { CentralSos, type SosItem } from "./central-sos";
import { ResumoTurmaDialog } from "./resumo-turma";

type Turma = { id: string; nome: string; cidade: string };
type TurmaDetalhe = Turma & { pacoteGapCustomizado?: boolean; pacoteGapTamanho?: number };
type PhaseSkipItem = {
  id: string;
  faseTentada: string;
  acaoTentada: string | null;
  requestedByName: string | null;
  createdAt: string;
};
type Grupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  companyName: string;
  score: number;
  ultimaAtividade: string | null;
  kpis: {
    inventario: { total: number; aprovados: number; submetidos: number; devolvidos: number };
    riscos: { total: number; aprovados: number; submetidos: number };
    gap: { respondidos: number; score: number };
    ripds: { total: number; aprovados: number };
    terceiros: { total: number; comClausula: number };
    dsr: { total: number };
    aviso: { status: string | null; publicSlug: string | null };
    incidentes: { total: number; comunicadosAnpd: number };
  };
  timeline: BolinhaMissao[];
  sos: SosItem[];
  phaseSkips: PhaseSkipItem[];
};

// Bip sintético via Web Audio (sem arquivo MP3).
function tocarBip(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
    // 2º bip rápido pra ficar "tritom"
    setTimeout(() => {
      try {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.frequency.value = 1320;
        osc2.type = "sine";
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        const t = audioCtx.currentTime;
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.18, t + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc2.start(t);
        osc2.stop(t + 0.4);
      } catch {}
    }, 150);
  } catch {}
}

// Alerta pedagógico — 3 tons descendentes (660 → 440 → 220Hz) mais grave que o
// SOS, sinaliza "atenção, problema de processo, não emergência operacional".
function tocarAlertaPuloFase(audioCtx: AudioContext | null) {
  if (!audioCtx) return;
  const tons = [660, 440, 220];
  tons.forEach((freq, i) => {
    setTimeout(() => {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = "square";
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
      } catch {}
    }, i * 200);
  });
}

export function PainelFacilitador({ turmas }: { turmas: Turma[] }) {
  const [turmaId, setTurmaId] = useState<string>(turmas[0]?.id || "");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [turmaDetalhe, setTurmaDetalhe] = useState<TurmaDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [dispatchingPM, setDispatchingPM] = useState(false);
  const [dispatchingCM, setDispatchingCM] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [somAtivo, setSomAtivo] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [resumoOpen, setResumoOpen] = useState(false);
  const lastFetchRef = useRef<Date | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sosIdsConhecidosRef = useRef<Set<string>>(new Set());
  const skipIdsConhecidosRef = useRef<Set<string>>(new Set());

  async function fetchState(silencioso = false) {
    if (!turmaId) return;
    if (!silencioso) setCarregando(true);
    try {
      const res = await fetch(`/api/curso/painel-facilitador?turmaId=${turmaId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        if (!silencioso) toast.error(data.error || "Erro ao buscar estado");
        return;
      }
      setGrupos(data.grupos);
      setTurmaDetalhe(data.turma);
      lastFetchRef.current = new Date();

      // Detecta SOS novos (PENDING que não estava na lista anterior) — bip + toast
      const idsNovos = new Set<string>();
      for (const g of data.grupos as Grupo[]) {
        for (const s of g.sos || []) {
          if (s.status === "PENDING") idsNovos.add(s.id);
        }
      }
      const eraConhecido = sosIdsConhecidosRef.current;
      const recemChegados = [...idsNovos].filter((id) => !eraConhecido.has(id));
      if (recemChegados.length > 0 && eraConhecido.size > 0) {
        // só toca/avisa depois do 1º load — evita bip ao abrir a página com SOS pré-existentes
        tocarBip(audioCtxRef.current);
        const grupoNomes = (data.grupos as Grupo[])
          .filter((g) => g.sos.some((s) => recemChegados.includes(s.id)))
          .map((g) => `G${g.numero}·${g.orgao}`)
          .join(", ");
        toast(`🆘 ${grupoNomes} precisa de você!`, { duration: 8000, icon: "🆘" });
      }
      sosIdsConhecidosRef.current = idsNovos;

      // Detecta tentativas de pular fase novas — bip diferente + toast vermelho
      const skipIdsNovos = new Set<string>();
      for (const g of data.grupos as Grupo[]) {
        for (const s of g.phaseSkips || []) skipIdsNovos.add(s.id);
      }
      const skipEraConhecido = skipIdsConhecidosRef.current;
      const skipRecemChegados = [...skipIdsNovos].filter((id) => !skipEraConhecido.has(id));
      if (skipRecemChegados.length > 0 && skipEraConhecido.size > 0) {
        tocarAlertaPuloFase(audioCtxRef.current);
        const grupoNomes = (data.grupos as Grupo[])
          .filter((g) => g.phaseSkips.some((s) => skipRecemChegados.includes(s.id)))
          .map((g) => `G${g.numero}·${g.orgao}`)
          .join(", ");
        toast(
          `🚨 ${grupoNomes} ESTÁ TENTANDO PULAR DE FASE!`,
          { duration: 10000, icon: "🚨", style: { background: "#fee2e2", color: "#991b1b", fontWeight: "bold" } },
        );
      }
      skipIdsConhecidosRef.current = skipIdsNovos;
    } catch (e: any) {
      if (!silencioso) toast.error(e.message);
    }
    if (!silencioso) setCarregando(false);
  }

  // Polling 3s
  useEffect(() => {
    fetchState();
    if (!pollingActive) return;
    const id = setInterval(() => fetchState(true), 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, pollingActive]);

  function ativarSom() {
    if (somAtivo) {
      setSomAtivo(false);
      try { audioCtxRef.current?.close(); } catch {}
      audioCtxRef.current = null;
      return;
    }
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new Ctx();
      setSomAtivo(true);
      tocarBip(audioCtxRef.current); // bip-teste pra confirmar
      toast.success("Som de alerta ativado");
    } catch {
      toast.error("Navegador bloqueou o som — tente em Chrome/Edge");
    }
  }

  async function reconhecerPuloFase(id: string) {
    try {
      const res = await fetch(`/api/curso/phase-skip/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro");
        return;
      }
      toast.success("Alerta reconhecido");
      fetchState(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function atualizarSos(id: string, novoStatus: "ATTENDED" | "RESOLVED") {
    try {
      const res = await fetch(`/api/curso/sos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro");
        return;
      }
      toast.success(novoStatus === "ATTENDED" ? "Marcado como atendendo" : "Chamado encerrado");
      fetchState(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function dispararIncidente(orgao: "PM" | "CM") {
    const cenarioNome = orgao === "PM" ? "Pendrive do Posto" : "Vazamento WhatsApp Tribuna";
    if (!confirm(`🚨 Disparar Incidente "${cenarioNome}" em todos os grupos do órgão ${orgao}? Eles vão ver o incidente RASCUNHO no app na hora.`)) return;

    if (orgao === "PM") setDispatchingPM(true); else setDispatchingCM(true);
    try {
      const res = await fetch("/api/curso/disparar-incidente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, orgao }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro"); return; }
      toast.success(`Incidente disparado em ${data.incidentesCriados.length} grupo(s) ${orgao}`);
      fetchState();
    } catch (e: any) {
      toast.error(e.message);
    }
    if (orgao === "PM") setDispatchingPM(false); else setDispatchingCM(false);
  }

  const gruposPM = grupos.filter((g) => g.orgao === "PM");
  const gruposCM = grupos.filter((g) => g.orgao === "CM");

  // Total de SOS ativos da turma
  const totalSosPending = useMemo(
    () => grupos.reduce((acc, g) => acc + g.sos.filter((s) => s.status === "PENDING").length, 0),
    [grupos],
  );
  const totalSosAttended = useMemo(
    () => grupos.reduce((acc, g) => acc + g.sos.filter((s) => s.status === "ATTENDED").length, 0),
    [grupos],
  );

  return (
    <div>
      {/* Header: seletor de turma + sino SOS + som + polling + resumo */}
      <div className="flex flex-col sm:flex-row gap-2 items-center mb-4 p-3 bg-white border rounded-lg">
        <label className="text-xs text-gray-500">Turma:</label>
        <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="max-w-xs">
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome} · {t.cidade}</option>)}
        </Select>
        <div className="flex-1" />

        {/* Sino de SOS */}
        <button
          type="button"
          onClick={() => setSosOpen(true)}
          className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium border transition-colors ${
            totalSosPending > 0
              ? "bg-red-600 text-white border-red-700 animate-pulse"
              : totalSosAttended > 0
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
          }`}
          title="Central de chamados SOS"
        >
          <Bell className="h-4 w-4" />
          {totalSosPending + totalSosAttended > 0 ? (
            <span className="text-[11px] font-bold">{totalSosPending + totalSosAttended}</span>
          ) : (
            <span className="text-[11px]">SOS</span>
          )}
        </button>

        {/* Som on/off */}
        <Button size="sm" variant="outline" onClick={ativarSom}
          title={somAtivo ? "Desativar som de alerta" : "Ativar bip quando um grupo chamar (Chrome/Edge bloqueia até 1ª interação)"}>
          {somAtivo ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {somAtivo ? "Som ON" : "Ativar som"}
        </Button>

        {/* Resumo da turma */}
        <Button size="sm" variant="outline" onClick={() => setResumoOpen(true)}>
          <BarChart3 className="h-3.5 w-3.5" /> Resumo
        </Button>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${pollingActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
          {pollingActive ? "Ao vivo · 3s" : "Pausado"}
        </div>
        <Button size="sm" variant="outline" onClick={() => setPollingActive((v) => !v)}>
          {pollingActive ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Retomar</>}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => fetchState()}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cronômetro de missão */}
      <Cronometro />

      {/* Status do Pacote GAP da turma */}
      {turmaDetalhe && (
        <div className={`mb-4 text-xs px-3 py-2 rounded border flex items-center justify-between gap-2 ${
          turmaDetalhe.pacoteGapCustomizado
            ? "bg-purple-50 border-purple-200 text-purple-900"
            : "bg-gray-50 border-gray-200 text-gray-700"
        }`}>
          <span>
            📋 <strong>Pacote GAP</strong> da turma:{" "}
            {turmaDetalhe.pacoteGapCustomizado
              ? <>Customizado ({turmaDetalhe.pacoteGapTamanho} controles selecionados)</>
              : <>Padrão (10 controles cobrindo as 7 Fases do PGP)</>}
          </span>
          <a
            href={`/admin/pacote-gap?turmaId=${turmaDetalhe.id}`}
            className="underline hover:no-underline text-[11px]"
          >
            Editar pacote →
          </a>
        </div>
      )}

      {/* Grids por órgão */}
      {gruposPM.length > 0 && (
        <section className="mb-6">
          <header className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-emerald-700">
              🛕 Grupos PM ({gruposPM.length})
            </h3>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => dispararIncidente("PM")}
              disabled={dispatchingPM}
            >
              <Zap className="h-4 w-4" /> 🚨 Disparar Incidente PM
            </Button>
          </header>
          <div className="space-y-3">
            {gruposPM.map((g) => <GrupoTimelineCard key={g.grupoId} grupo={g} onAtenderSos={atualizarSos} onReconhecerSkip={reconhecerPuloFase} />)}
          </div>
        </section>
      )}

      {gruposCM.length > 0 && (
        <section className="mb-6">
          <header className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-blue-700">
              🏛 Grupos CM ({gruposCM.length})
            </h3>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => dispararIncidente("CM")}
              disabled={dispatchingCM}
            >
              <Zap className="h-4 w-4" /> 🚨 Disparar Incidente CM
            </Button>
          </header>
          <div className="space-y-3">
            {gruposCM.map((g) => <GrupoTimelineCard key={g.grupoId} grupo={g} onAtenderSos={atualizarSos} onReconhecerSkip={reconhecerPuloFase} />)}
          </div>
        </section>
      )}

      {grupos.length === 0 && !carregando && (
        <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          Esta turma ainda não tem grupos.
        </div>
      )}

      {/* Central de chamados SOS — drawer */}
      <CentralSos
        open={sosOpen}
        onClose={() => setSosOpen(false)}
        grupos={grupos.map((g) => ({ grupoId: g.grupoId, numero: g.numero, orgao: g.orgao, sos: g.sos }))}
        onAtender={atualizarSos}
      />

      {/* Resumo da turma — modal */}
      <ResumoTurmaDialog
        open={resumoOpen}
        onClose={() => setResumoOpen(false)}
        grupos={grupos}
      />
    </div>
  );
}

function GrupoTimelineCard({
  grupo,
  onAtenderSos,
  onReconhecerSkip,
}: {
  grupo: Grupo;
  onAtenderSos: (id: string, status: "ATTENDED" | "RESOLVED") => void;
  onReconhecerSkip: (id: string) => void;
}) {
  const isPM = grupo.orgao === "PM";
  const orgaoCor = isPM ? "border-emerald-300 bg-emerald-50/30" : "border-blue-300 bg-blue-50/30";

  // Cor do score
  const scoreCor =
    grupo.score >= 80 ? "bg-emerald-100 text-emerald-800" :
    grupo.score >= 60 ? "bg-blue-100 text-blue-800" :
    grupo.score >= 40 ? "bg-amber-100 text-amber-800" :
    grupo.score >= 20 ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-700";

  // Última atividade
  const ultimaSec = grupo.ultimaAtividade
    ? Math.floor((Date.now() - new Date(grupo.ultimaAtividade).getTime()) / 1000)
    : null;
  const statusAtividade =
    ultimaSec === null ? { txt: "Sem atividade", cor: "bg-gray-300" } :
    ultimaSec < 60 ? { txt: "Ativo agora", cor: "bg-emerald-500 animate-pulse" } :
    ultimaSec < 300 ? { txt: `Há ${Math.floor(ultimaSec / 60)} min`, cor: "bg-amber-400" } :
    { txt: `Há ${Math.floor(ultimaSec / 60)} min`, cor: "bg-red-400" };

  function downloadCertificado() {
    window.open(`/api/curso/certificado?grupoId=${grupo.grupoId}`, "_blank");
  }

  const sosPending = grupo.sos.find((s) => s.status === "PENDING");
  const sosAttended = grupo.sos.find((s) => s.status === "ATTENDED");
  const sosAtivo = sosPending || sosAttended;
  const sosMin = sosAtivo
    ? Math.max(0, Math.floor((Date.now() - new Date(sosAtivo.createdAt).getTime()) / 60000))
    : 0;

  const skipPendentes = grupo.phaseSkips || [];
  const temSkip = skipPendentes.length > 0;

  // Borda: skip de fase é mais grave que SOS — predomina visualmente
  const bordaSos = temSkip
    ? "border-red-600 ring-4 ring-red-300 animate-pulse"
    : sosPending
    ? "border-red-500 ring-2 ring-red-300 animate-pulse"
    : sosAttended
    ? "border-amber-400 ring-2 ring-amber-200"
    : "";

  return (
    <div className={`border-2 ${orgaoCor} ${bordaSos} rounded-lg p-3 bg-white transition-all`}>
      {/* Linha superior: identificação + score + atividade + ações */}
      <header className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-base">G{grupo.numero} · {grupo.orgao}</h4>
          <span className={`${scoreCor} text-xs font-bold px-2 py-0.5 rounded`}>
            {grupo.score}/100
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
            <span className={`h-2 w-2 rounded-full ${statusAtividade.cor}`} />
            {statusAtividade.txt}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Faixa de "PULO DE FASE" — só aparece se há tentativa pendente */}
          {temSkip && skipPendentes.map((skip) => {
            const min = Math.max(0, Math.floor((Date.now() - new Date(skip.createdAt).getTime()) / 60000));
            return (
              <div key={skip.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-700 text-white text-xs font-bold animate-pulse" title={skip.acaoTentada || ""}>
                <span>🚨 PULANDO FASE!</span>
                <span className="font-normal opacity-90">{skip.faseTentada.replace("FASE_", "Fase ")} · há {min}min</span>
                <button
                  onClick={() => onReconhecerSkip(skip.id)}
                  className="ml-1 bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-[11px]"
                  title="Já reforcei a sequência com o grupo"
                >
                  <Check className="h-3 w-3 inline" /> Reconheci
                </button>
              </div>
            );
          })}

          {/* Faixa de SOS — só aparece se houver chamado */}
          {sosPending && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold animate-pulse">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>🆘 Pediu sua presença · há {sosMin}min</span>
              <button
                onClick={() => onAtenderSos(sosPending.id, "ATTENDED")}
                className="ml-1 bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-[11px]"
                title="Eu vou agora"
              >
                <Check className="h-3 w-3 inline" /> Atendendo
              </button>
              <button
                onClick={() => onAtenderSos(sosPending.id, "RESOLVED")}
                className="bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded text-[11px]"
                title="Já resolvi sem ir"
              >
                <X className="h-3 w-3 inline" /> Encerrar
              </button>
            </div>
          )}
          {sosAttended && !sosPending && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 text-amber-900 text-xs font-medium border border-amber-300">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>A caminho · {sosMin}min</span>
              <button
                onClick={() => onAtenderSos(sosAttended.id, "RESOLVED")}
                className="ml-1 bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded text-[11px]"
              >
                <Check className="h-3 w-3 inline" /> Resolvido
              </button>
            </div>
          )}

          <Button size="sm" variant="outline" onClick={downloadCertificado}>
            <Award className="h-3.5 w-3.5" /> Certificado
          </Button>
          {grupo.kpis.aviso.publicSlug && (
            <Button size="sm" variant="ghost" asChild>
              <a href={`/p/${grupo.kpis.aviso.publicSlug}`} target="_blank" rel="noreferrer">
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </header>

      {/* Timeline horizontal */}
      <TimelineGrupo bolinhas={grupo.timeline} />
    </div>
  );
}
