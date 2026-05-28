"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap, Award, Pause, Play, RotateCcw, ChevronRight,
  Bell, BellOff, Volume2, VolumeX, LifeBuoy, Check, X,
  BarChart3, HandHelping, Mail, Bug, UserCircle2, BookOpen, FileText, Search,
} from "lucide-react";
import Link from "next/link";
import { SETORES_APOIO } from "@/lib/setores-apoio";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Cronometro } from "./cronometro";
import { TimelineGrupo, type BolinhaMissao } from "./timeline-grupo";
import { CentralSos, type SosItem } from "./central-sos";
import { ResumoTurmaDialog } from "./resumo-turma";

type Turma = { id: string; nome: string; cidade: string; slug: string };
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
    gap: {
      respondidos: number;
      score: number;
      acoesPlanejadas?: number;
      apoiosPendentes?: number;
      setoresApoio?: Record<string, number>;
    };
    ripds: { total: number; aprovados: number };
    terceiros: { total: number; comClausula: number };
    dsr: { total: number };
    dsrGame?: {
      score: number;
      respondeu: number;
      postergou: number;
      outros: number;
      pediuId: number;
      conservadores: number;
      semAcao: number;
    };
    aviso: { status: string | null; publicSlug: string | null; conteudoChars: number };
    incidentes: { total: number; comunicadosAnpd: number };
  };
  timeline: BolinhaMissao[];
  sos: SosItem[];
  phaseSkips: PhaseSkipItem[];
  dsrGameOutros?: Array<{ titularNome: string; pedido: string; resposta: string }>;
  avisoErrosPlantados?: string[];
  avisoErrosReportados?: Array<{ userName: string; descricao: string; criadoEm: string }>;
  // Usuários do grupo com lastSeenAt nos últimos 2min (heartbeat).
  // Vazio = ninguém logou ou todos saíram. API garante que vem só com sessão ativa.
  papeisAtivos?: Array<{ email: string; name: string; lastSeenAt: string | null }>;
};

// Catálogo de papéis esperados por órgão (5 cada). Pra renderizar pílulas mesmo
// quem AINDA não logou — facilitador vê "DPO ✓ · Saúde ✓ · TI · RH · Com." e
// sabe quem falta. Match por prefixo do email (saude.g1.<slug>@... → "saude").
type PapelEsperado = { prefixo: string; label: string };

const PAPEIS_PM: PapelEsperado[] = [
  { prefixo: "dpo",         label: "DPO" },
  { prefixo: "saude",       label: "Saúde" },
  { prefixo: "rh",          label: "RH" },
  { prefixo: "ti",          label: "TI" },
  { prefixo: "comunicacao", label: "Com." },
];

const PAPEIS_CM: PapelEsperado[] = [
  { prefixo: "dpo",          label: "DPO" },
  { prefixo: "cerimonial",   label: "Cerim." },
  { prefixo: "ouvidoria",    label: "Ouv." },
  { prefixo: "ti",           label: "TI" },
  { prefixo: "procuradoria", label: "Proc." },
];

function prefixoDoEmail(email: string): string {
  return (email.split("@")[0] || "").split(".")[0] || "";
}

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
  const [dispatchingDsrPM, setDispatchingDsrPM] = useState(false);
  const [dispatchingDsrCM, setDispatchingDsrCM] = useState(false);
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

  // Quando grupoAlvo é passado, dispara só naquele grupo. Sem, dispara em
  // todos os grupos do órgão.
  async function dispararDsrSurpresa(
    orgao: "PM" | "CM",
    grupoAlvo?: { id: string; numero: number },
  ) {
    const escopo = grupoAlvo ? `no Grupo ${grupoAlvo.numero} (${orgao})` : `em TODOS os grupos do órgão ${orgao}`;
    if (!confirm(`📨 Disparar DSR Surpresa (2 pedidos falsos) ${escopo}? Os DPOs vão receber as solicitações como se chegassem por e-mail.`)) return;
    if (!grupoAlvo) {
      if (orgao === "PM") setDispatchingDsrPM(true); else setDispatchingDsrCM(true);
    }
    try {
      const res = await fetch("/api/curso/disparar-dsr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, orgao, ...(grupoAlvo ? { grupoId: grupoAlvo.id } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro"); return; }
      const novos = data.dsrsCriados.filter((d: any) => !d.jaExistia).length;
      const reusados = data.dsrsCriados.filter((d: any) => d.jaExistia).length;
      const alvoTxt = grupoAlvo ? `G${grupoAlvo.numero}` : `${data.totalGrupos} grupo(s) ${orgao}`;
      toast.success(
        novos > 0
          ? `DSR Surpresa disparado em ${alvoTxt}: ${novos} novos`
          : `DSRs já tinham sido disparados em ${alvoTxt} (${reusados} reaproveitados)`,
      );
      fetchState();
    } catch (e: any) {
      toast.error(e.message);
    }
    if (!grupoAlvo) {
      if (orgao === "PM") setDispatchingDsrPM(false); else setDispatchingDsrCM(false);
    }
  }

  async function dispararIncidente(
    orgao: "PM" | "CM",
    grupoAlvo?: { id: string; numero: number },
  ) {
    const cenarioNome = orgao === "PM" ? "Pendrive do Posto" : "Vazamento WhatsApp Tribuna";
    const escopo = grupoAlvo ? `no Grupo ${grupoAlvo.numero} (${orgao})` : `em TODOS os grupos do órgão ${orgao}`;
    if (!confirm(`🚨 Disparar Incidente "${cenarioNome}" ${escopo}? O grupo vai ver o incidente RASCUNHO no app na hora.`)) return;

    if (!grupoAlvo) {
      if (orgao === "PM") setDispatchingPM(true); else setDispatchingCM(true);
    }
    try {
      const res = await fetch("/api/curso/disparar-incidente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, orgao, ...(grupoAlvo ? { grupoId: grupoAlvo.id } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro"); return; }
      const alvoTxt = grupoAlvo ? `G${grupoAlvo.numero}` : `${data.incidentesCriados.length} grupo(s) ${orgao}`;
      toast.success(`Incidente disparado em ${alvoTxt}`);
      fetchState();
    } catch (e: any) {
      toast.error(e.message);
    }
    if (!grupoAlvo) {
      if (orgao === "PM") setDispatchingPM(false); else setDispatchingCM(false);
    }
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

        {/* Painel Multi-Perfil — facilitador escolhe um papel da turma e
            abre login automático em janela anônima (sessão isolada).
            Útil pra demonstração ao vivo do app. */}
        {(() => {
          const turmaSelecionada = turmas.find((t) => t.id === turmaId);
          if (!turmaSelecionada?.slug) return null;
          return (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/facilitador/demo/${turmaSelecionada.slug}`} target="_blank">
                  <UserCircle2 className="h-3.5 w-3.5" /> Demo Perfis
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                title="Baixar Gabarito do Debrief — DOCX com as 10 pegadinhas + quais grupos detectaram"
              >
                <a
                  href={`/api/curso/gabarito-pegadinhas/docx?turmaSlug=${turmaSelecionada.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Search className="h-3.5 w-3.5" /> Gabarito Debrief
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                title="Baixar Cartilha do PGP — Guia institucional ~120pg, não depende de grupo (pra distribuir aos participantes ou usar de referência)"
              >
                <a
                  href="/api/curso/caderno/docx?modo=cartilha"
                  target="_blank"
                  rel="noreferrer"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Cartilha PGP
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                title="Baixar Pacote de Modelos — 20 templates editáveis em DOCX único pra a Instituição preencher (placeholders em vermelho + exemplos)"
              >
                <a
                  href="/api/curso/pacote-modelos/docx"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText className="h-3.5 w-3.5" /> Pacote Modelos
                </a>
              </Button>
            </>
          );
        })()}

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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispararDsrSurpresa("PM")}
                disabled={dispatchingDsrPM}
                className="border-amber-400 text-amber-800 hover:bg-amber-50"
              >
                <Mail className="h-4 w-4" /> 📨 Disparar DSRs PM
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => dispararIncidente("PM")}
                disabled={dispatchingPM}
              >
                <Zap className="h-4 w-4" /> 🚨 Disparar Incidente PM
              </Button>
            </div>
          </header>
          <div className="space-y-3">
            {gruposPM.map((g) => (
              <GrupoTimelineCard
                key={g.grupoId}
                grupo={g}
                onAtenderSos={atualizarSos}
                onReconhecerSkip={reconhecerPuloFase}
                onDispararDsr={() => dispararDsrSurpresa("PM", { id: g.grupoId, numero: g.numero })}
                onDispararIncidente={() => dispararIncidente("PM", { id: g.grupoId, numero: g.numero })}
              />
            ))}
          </div>
        </section>
      )}

      {gruposCM.length > 0 && (
        <section className="mb-6">
          <header className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-blue-700">
              🏛 Grupos CM ({gruposCM.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispararDsrSurpresa("CM")}
                disabled={dispatchingDsrCM}
                className="border-amber-400 text-amber-800 hover:bg-amber-50"
              >
                <Mail className="h-4 w-4" /> 📨 Disparar DSRs CM
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => dispararIncidente("CM")}
                disabled={dispatchingCM}
              >
                <Zap className="h-4 w-4" /> 🚨 Disparar Incidente CM
              </Button>
            </div>
          </header>
          <div className="space-y-3">
            {gruposCM.map((g) => (
              <GrupoTimelineCard
                key={g.grupoId}
                grupo={g}
                onAtenderSos={atualizarSos}
                onReconhecerSkip={reconhecerPuloFase}
                onDispararDsr={() => dispararDsrSurpresa("CM", { id: g.grupoId, numero: g.numero })}
                onDispararIncidente={() => dispararIncidente("CM", { id: g.grupoId, numero: g.numero })}
              />
            ))}
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
  onDispararDsr,
  onDispararIncidente,
}: {
  grupo: Grupo;
  onAtenderSos: (id: string, status: "ATTENDED" | "RESOLVED") => void;
  onReconhecerSkip: (id: string) => void;
  onDispararDsr: () => void;
  onDispararIncidente: () => void;
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

  function downloadCaderno(modo: "completo" | "executivo") {
    window.open(`/api/curso/caderno/docx?grupoId=${grupo.grupoId}&modo=${modo}`, "_blank");
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

          {/* Mini-botões de disparo INDIVIDUAL pra este grupo. Use quando os
              grupos andam em ritmos diferentes -- dispara só no que está pronto.
              Os botões de disparo em massa por órgão continuam no header da
              seção (PM/CM). */}
          <Button
            size="sm"
            variant="outline"
            onClick={onDispararDsr}
            className="border-amber-300 text-amber-800 hover:bg-amber-50 text-[11px]"
            title="Disparar DSR Surpresa SÓ neste grupo (use quando ele já fechou M4a)"
          >
            <Mail className="h-3.5 w-3.5" /> DSR
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDispararIncidente}
            className="border-red-300 text-red-700 hover:bg-red-50 text-[11px]"
            title="Disparar Incidente SÓ neste grupo (use quando ele publicou o Aviso M4b)"
          >
            <Zap className="h-3.5 w-3.5" /> Incidente
          </Button>

          <Button size="sm" variant="outline" onClick={downloadCertificado}>
            <Award className="h-3.5 w-3.5" /> Certificado
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCaderno("completo")}
            title="Caderno Completo (~60-80 páginas) — kit institucional pessoal do DPO"
          >
            <BookOpen className="h-3.5 w-3.5" /> Caderno
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadCaderno("executivo")}
            title="Relatório Executivo (~12 páginas) — síntese pra Alta Gestão/chefia"
          >
            <FileText className="h-3.5 w-3.5" /> Resumo
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

      {/* Papéis ativos (heartbeat) — pílulas mostrando quais dos 5 papéis
          esperados do grupo estão com sessão ativa. Útil pra confirmar
          ANTES da Missão 1 que todos logaram. Verde claro = ativo nos
          últimos 2min; cinza = sem heartbeat (não logado, deslogado,
          ou sem conexão). */}
      {(() => {
        const esperados = grupo.orgao === "PM" ? PAPEIS_PM : PAPEIS_CM;
        const prefixosAtivos = new Set(
          (grupo.papeisAtivos || []).map((p) => prefixoDoEmail(p.email))
        );
        const qtdAtivos = esperados.filter((e) => prefixosAtivos.has(e.prefixo)).length;
        return (
          <div className="mb-2 flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-gray-500 font-medium">
              👥 {qtdAtivos}/{esperados.length} logados:
            </span>
            {esperados.map((e) => {
              const ativo = prefixosAtivos.has(e.prefixo);
              return (
                <span
                  key={e.prefixo}
                  className={`px-1.5 py-0.5 rounded border ${
                    ativo
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}
                  title={ativo ? `${e.label} — ativo nos últimos 2min` : `${e.label} — sem heartbeat`}
                >
                  {ativo ? "●" : "○"} {e.label}
                </span>
              );
            })}
          </div>
        );
      })()}

      {/* Timeline horizontal */}
      <TimelineGrupo bolinhas={grupo.timeline} />

      {/* DSR Surpresa — só aparece se algum DSR foi disparado pelo facilitador */}
      {grupo.kpis.dsrGame && (grupo.kpis.dsrGame.respondeu + grupo.kpis.dsrGame.postergou + grupo.kpis.dsrGame.outros + grupo.kpis.dsrGame.pediuId + grupo.kpis.dsrGame.conservadores + grupo.kpis.dsrGame.semAcao) > 0 && (
        <div className={`mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs flex-wrap ${
          grupo.kpis.dsrGame.score > 0
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : grupo.kpis.dsrGame.score < 0
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-gray-50 border-gray-200 text-gray-700"
        }`}>
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold">🎮 DSR Surpresa:</span>
          <span className={`font-bold px-1.5 py-0.5 rounded ${
            grupo.kpis.dsrGame.score > 0 ? "bg-emerald-200" : grupo.kpis.dsrGame.score < 0 ? "bg-red-200" : "bg-gray-200"
          }`}>
            {grupo.kpis.dsrGame.score > 0 ? "+" : ""}{grupo.kpis.dsrGame.score}
          </span>
          {grupo.kpis.dsrGame.respondeu > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
              ✗ Respondeu sem checar ({grupo.kpis.dsrGame.respondeu})
            </span>
          )}
          {grupo.kpis.dsrGame.postergou > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
              ⏳ Postergou ({grupo.kpis.dsrGame.postergou})
            </span>
          )}
          {grupo.kpis.dsrGame.outros > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-sky-200 px-1.5 py-0.5 rounded text-[10px]">
              💬 Outros — ler no debrief ({grupo.kpis.dsrGame.outros})
            </span>
          )}
          {grupo.kpis.dsrGame.pediuId > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
              ✓ Pediu identidade ({grupo.kpis.dsrGame.pediuId})
            </span>
          )}
          {grupo.kpis.dsrGame.conservadores > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
              ⛔ Negou direto ({grupo.kpis.dsrGame.conservadores})
            </span>
          )}
          {grupo.kpis.dsrGame.semAcao > 0 && (
            <span className="inline-flex items-center gap-1 bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] text-gray-500">
              ⌛ Sem ação ({grupo.kpis.dsrGame.semAcao})
            </span>
          )}
        </div>
      )}

      {/* Aviso — Caça aos Erros (Missão 4b) */}
      {((grupo.avisoErrosPlantados?.length || 0) > 0 || (grupo.avisoErrosReportados?.length || 0) > 0) && (
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs flex-wrap bg-orange-50 border-orange-200 text-orange-900">
          <Bug className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold">📜 Aviso · caça aos erros:</span>
          <span className="inline-flex items-center gap-1 bg-white border border-orange-200 px-1.5 py-0.5 rounded text-[10px]">
            🪤 Plantados: {grupo.avisoErrosPlantados?.length || 0}
          </span>
          <span className={`inline-flex items-center gap-1 bg-white border px-1.5 py-0.5 rounded text-[10px] ${
            (grupo.avisoErrosReportados?.length || 0) > 0 ? "border-emerald-300 text-emerald-800" : "border-gray-200 text-gray-500"
          }`}>
            🔍 Detectados pelo grupo: {grupo.avisoErrosReportados?.length || 0}
          </span>
          <span className="text-orange-700 text-[10px] italic">Veja os textos no Resumo da Turma</span>
        </div>
      )}

      {/* Apoios pendentes no GAP — sinaliza onde o grupo travou pedindo ajuda. */}
      {(grupo.kpis.gap.apoiosPendentes || 0) > 0 && (
        <div className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded bg-sky-50 border border-sky-200 text-xs text-sky-900 flex-wrap">
          <HandHelping className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">
            {grupo.kpis.gap.apoiosPendentes} apoio{(grupo.kpis.gap.apoiosPendentes || 0) > 1 ? "s" : ""} pendente{(grupo.kpis.gap.apoiosPendentes || 0) > 1 ? "s" : ""} no GAP:
          </span>
          {Object.entries(grupo.kpis.gap.setoresApoio || {}).map(([setorId, qtd]) => {
            const setor = SETORES_APOIO.find((s) => s.id === setorId);
            return (
              <span key={setorId} className="inline-flex items-center gap-1 bg-white border border-sky-200 px-1.5 py-0.5 rounded text-[10px]">
                {setor?.emoji} {setor?.nome || setorId} ({qtd})
              </span>
            );
          })}
        </div>
      )}

      {/* Ações planejadas no GAP — sinaliza maturidade de roadmap (não-aderente CONSCIENTE) */}
      {(grupo.kpis.gap.acoesPlanejadas || 0) > 0 && (
        <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
          📅 <span className="font-medium">
            {grupo.kpis.gap.acoesPlanejadas} controle{(grupo.kpis.gap.acoesPlanejadas || 0) > 1 ? "s" : ""} marcado{(grupo.kpis.gap.acoesPlanejadas || 0) > 1 ? "s" : ""} como "Ação planejada"
          </span>
          <span className="text-slate-500">(sinaliza maturidade de roadmap, não lacuna não-detectada)</span>
        </div>
      )}
    </div>
  );
}
