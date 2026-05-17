"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Award, Printer, Pause, Play, RotateCcw, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Cronometro } from "./cronometro";

type Turma = { id: string; nome: string; cidade: string };
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
};

export function PainelFacilitador({ turmas }: { turmas: Turma[] }) {
  const [turmaId, setTurmaId] = useState<string>(turmas[0]?.id || "");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [dispatchingPM, setDispatchingPM] = useState(false);
  const [dispatchingCM, setDispatchingCM] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const lastFetchRef = useRef<Date | null>(null);

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
      lastFetchRef.current = new Date();
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

  return (
    <div>
      {/* Header: seletor de turma + status do polling */}
      <div className="flex flex-col sm:flex-row gap-2 items-center mb-4 p-3 bg-white border rounded-lg">
        <label className="text-xs text-gray-500">Turma:</label>
        <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="max-w-xs">
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome} · {t.cidade}</option>)}
        </Select>
        <div className="flex-1" />
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${pollingActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
          {pollingActive ? "Ao vivo · atualiza a cada 3s" : "Polling pausado"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gruposPM.map((g) => <GrupoCard key={g.grupoId} grupo={g} />)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {gruposCM.map((g) => <GrupoCard key={g.grupoId} grupo={g} />)}
          </div>
        </section>
      )}

      {grupos.length === 0 && !carregando && (
        <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          Esta turma ainda não tem grupos.
        </div>
      )}
    </div>
  );
}

function GrupoCard({ grupo }: { grupo: Grupo }) {
  const isPM = grupo.orgao === "PM";
  const k = grupo.kpis;
  const orgaoCor = isPM ? "border-emerald-300" : "border-blue-300";
  const orgaoFundo = isPM ? "bg-emerald-50" : "bg-blue-50";

  // Cor do score
  const scoreCor =
    grupo.score >= 80 ? "bg-emerald-100 text-emerald-700" :
    grupo.score >= 60 ? "bg-blue-100 text-blue-700" :
    grupo.score >= 40 ? "bg-amber-100 text-amber-700" :
    grupo.score >= 20 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700";

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

  // Detecta "Pronto pra etapa DPO" — M1 completa (≥2 aprovados) + M2 com algum
  // progresso (submetido ou aprovado) + M3 ainda não começou.
  // Sinaliza que é hora do facilitador convidar o grupo a se reunir com o DPO.
  const prontoParaEtapaDPO =
    k.inventario.aprovados >= 2 &&
    (k.riscos.aprovados >= 1 || k.riscos.submetidos >= 1) &&
    k.gap.respondidos === 0 && // ainda não começou M3
    !k.aviso.status;

  // Conteúdo interno do card (KPIs + score + botões) — sem o alerta de transição
  const cardConteudo = (
    <div className={`border-2 ${orgaoCor} ${orgaoFundo} rounded-lg p-3 bg-white ${prontoParaEtapaDPO ? "rounded-r-none border-r-0" : ""}`}>
      <header className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">G{grupo.numero} · {grupo.orgao}</h4>
        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded`}>
          <span className={`h-2 w-2 rounded-full ${statusAtividade.cor}`} />
          {statusAtividade.txt}
        </span>
      </header>

      {/* Score em destaque */}
      <div className={`${scoreCor} rounded p-2 mb-2 text-center`}>
        <div className="text-[10px] uppercase tracking-wide opacity-75">Maturidade PGP</div>
        <div className="text-2xl font-bold">{grupo.score}/100</div>
      </div>

      {/* KPIs em grid 2x4 */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
        <Kpi label="M1 · Inv" value={`${k.inventario.aprovados}/${k.inventario.total}`} hint={k.inventario.devolvidos > 0 ? `${k.inventario.devolvidos} dev` : null} />
        <Kpi label="M2 · Riscos" value={k.riscos.total.toString()} />
        <Kpi label="M3 · GAP" value={`${k.gap.respondidos}/10`} hint={k.gap.respondidos > 0 ? `${k.gap.score}%` : null} />
        <Kpi label="M4a · RIPD" value={`${k.ripds.aprovados}/${k.ripds.total}`} />
        <Kpi label="M4a · Terc" value={k.terceiros.total > 0 ? `${k.terceiros.comClausula}/${k.terceiros.total}` : "—"} />
        <Kpi label="M4a · DSR" value={k.dsr.total.toString()} />
        <Kpi
          label="M4b · Aviso"
          value={
            k.aviso.status === "PUBLICADO" ? "✓" :
            k.aviso.status === "RASCUNHO" ? "↻" : "—"
          }
          hint={k.aviso.publicSlug}
        />
        <Kpi label="M5 · Inc" value={k.incidentes.total > 0 ? `${k.incidentes.comunicadosAnpd}/${k.incidentes.total}` : "—"} />
      </div>

      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="flex-1" onClick={downloadCertificado}>
          <Award className="h-3.5 w-3.5" /> Certificado
        </Button>
        {k.aviso.publicSlug && (
          <Button size="sm" variant="ghost" asChild>
            <a href={`/p/${k.aviso.publicSlug}`} target="_blank" rel="noreferrer">
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  // Modo normal — só o card
  if (!prontoParaEtapaDPO) return cardConteudo;

  // Modo "Pronto pra etapa DPO" — card ocupa 2 colunas no grid, painel gigante à direita
  return (
    <div className="sm:col-span-2 flex">
      <div className="flex-1 min-w-0">{cardConteudo}</div>
      <div className="flex-1 bg-amber-400 border-2 border-l-0 border-amber-500 rounded-r-lg p-4 flex flex-col items-center justify-center text-amber-950 animate-pulse-strong shadow-lg">
        <div className="text-2xl sm:text-3xl mb-2">⚡🎯⚡</div>
        <div className="text-2xl sm:text-3xl font-extrabold leading-tight text-center mb-2">
          G{grupo.numero} · {grupo.orgao}<br/>PRONTO!
        </div>
        <div className="text-base sm:text-lg font-bold text-center leading-tight mb-2">
          REÚNAM<br/>O GRUPO<br/>COM O DPO
        </div>
        <div className="text-[11px] sm:text-xs text-center opacity-80 leading-snug">
          M1 + M2 fechadas · próximas missões<br/>(GAP, RIPD, Aviso, Incidentes) são<br/>DPO-led
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string | null }) {
  return (
    <div className="bg-white border rounded p-1.5">
      <div className="text-[9px] uppercase text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
      {hint && <div className="text-[9px] text-gray-400 truncate">{hint}</div>}
    </div>
  );
}
