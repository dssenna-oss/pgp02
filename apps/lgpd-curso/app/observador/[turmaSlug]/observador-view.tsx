"use client";

// Visão consolidada da turma pro Observador acompanhar do celular.
// Polling 5s — mesmo padrão do Painel do Facilitador. Sem detalhes
// pedagógicos sensíveis (SOS, erros plantados, phaseSkips).
//
// Pensado pra ser lido enquanto o observador CIRCULA pela sala — leitura
// rápida, layout vertical mobile-first, tipografia generosa.

import { useEffect, useState } from "react";
import {
  Eye, Loader2, AlertTriangle, RefreshCw, Award, Clock,
  Building2, CheckCircle2, Circle, AlertCircle,
} from "lucide-react";

type BolinhaMissao = {
  id: string;
  label: string;
  nomeCurto: string;
  status: "DONE" | "DOING" | "IDLE";
  contador?: string;
  duracaoEsperadaSeg: number;
  inicioEm?: string;
  ultimaAtividadeEm?: string;
};

type Grupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  companyName: string;
  score: number;
  ultimaAtividade: string | null;
  timeline: BolinhaMissao[];
  resumo: {
    inventario: string;
    riscos: string;
    gapScore: number;
    gapRespondidos: number;
    ripds: number;
    terceiros: number;
    dsr: number;
    avisoStatus: string | null;
    incidentes: number;
  };
};

type Dados = {
  turma: { nome: string; cidade: string };
  grupos: Grupo[];
  geradoEm: string;
};

function tempoRelativo(iso: string | null): string {
  if (!iso) return "—";
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "agora";
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  return `há ${Math.floor(seg / 3600)}h`;
}

export function ObservadorView({ turmaSlug }: { turmaSlug: string }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function load() {
      try {
        const res = await fetch(`/api/observador/painel?turmaSlug=${turmaSlug}`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Erro ${res.status}`);
        }
        const data = await res.json();
        if (!cancelado) {
          setDados(data);
          setErro(null);
        }
      } catch (e: any) {
        if (!cancelado) setErro(e.message || "Erro ao carregar");
      } finally {
        if (!cancelado) setCarregandoInicial(false);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [turmaSlug]);

  if (carregandoInicial) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Carregando painel da turma…</p>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Erro</div>
            <div className="text-sm">{erro}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!dados) return null;

  return (
    <div className="space-y-5">
      {/* Hero do Observador */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 px-5 py-6 text-white shadow-lg">
        <svg
          className="absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern id="obs-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#obs-grid)" />
        </svg>
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40 backdrop-blur">
            <Eye className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-200">
              Painel do Observador
            </div>
            <h1 className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">
              {dados.turma.nome}
            </h1>
            <div className="text-sm text-slate-200/90">{dados.turma.cidade}</div>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
            🔍 {dados.grupos.length} grupos ativos
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
            👁 Modo leitura — você acompanha sem interferir
          </span>
        </div>
      </div>

      {/* Resumo institucional */}
      <div className="rounded-lg border-l-4 border-l-slate-400 bg-white p-4">
        <p className="text-xs leading-relaxed text-gray-600">
          Você é um(a) <strong className="text-gray-800">Observador(a) da turma</strong>: circula
          pelos grupos, anota dúvidas recorrentes na Folha do Observador (papel) e devolve ao
          facilitador na Reflexão Final. Esta página atualiza sozinha a cada 5 segundos —
          consulte quando quiser saber onde a turma está, sem precisar perguntar.
        </p>
      </div>

      {/* Cards dos grupos */}
      <div className="space-y-3">
        {dados.grupos.map((g) => (
          <CardGrupo key={g.grupoId} grupo={g} />
        ))}
      </div>

      {/* Rodapé com tempo */}
      <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Atualiza a cada 5s · {new Date(dados.geradoEm).toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}

function CardGrupo({ grupo }: { grupo: Grupo }) {
  const orgaoEmoji = grupo.orgao === "PM" ? "🛕" : "🏛";
  const orgaoCor = grupo.orgao === "PM" ? "from-emerald-500 to-emerald-600" : "from-blue-500 to-blue-600";

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Header do grupo */}
      <div className={`bg-gradient-to-r ${orgaoCor} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{orgaoEmoji}</span>
            <div className="min-w-0">
              <div className="font-bold text-base leading-tight truncate">
                Grupo {grupo.numero} · {grupo.orgao === "PM" ? "Prefeitura" : "Câmara"}
              </div>
              <div className="text-[11px] text-white/80 truncate">{grupo.companyName}</div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wide text-white/75 font-semibold">Score</div>
            <div className="text-xl font-bold tabular-nums leading-none">{grupo.score}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/85">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Última atividade: {tempoRelativo(grupo.ultimaAtividade)}</span>
        </div>
      </div>

      {/* Timeline das missões */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <TimelineMissoes bolinhas={grupo.timeline} />
      </div>

      {/* Resumo de progresso */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <ItemResumo rotulo="Inventário"  valor={grupo.resumo.inventario} />
        <ItemResumo rotulo="Riscos"      valor={grupo.resumo.riscos} />
        <ItemResumo rotulo="GAP score"   valor={grupo.resumo.gapRespondidos > 0 ? `${grupo.resumo.gapScore}%` : "—"} />
        <ItemResumo rotulo="Plano"       valor={grupo.resumo.gapRespondidos > 0 ? `${grupo.resumo.gapRespondidos} respond.` : "—"} />
        <ItemResumo rotulo="RIPDs"       valor={String(grupo.resumo.ripds)} />
        <ItemResumo rotulo="Terceiros"   valor={`${grupo.resumo.terceiros} c/ cláusula`} />
        <ItemResumo rotulo="Aviso"       valor={grupo.resumo.avisoStatus || "—"} />
        <ItemResumo rotulo="Incidentes"  valor={String(grupo.resumo.incidentes)} />
      </div>
    </div>
  );
}

function ItemResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-dashed border-gray-100">
      <span className="text-gray-500 truncate">{rotulo}</span>
      <span className="font-semibold text-gray-800 text-right shrink-0">{valor}</span>
    </div>
  );
}

function TimelineMissoes({ bolinhas }: { bolinhas: BolinhaMissao[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex items-start gap-0 px-1 min-w-max">
        {bolinhas.map((b, i) => {
          const proxima = bolinhas[i + 1];
          const conectorAtivo = b.status === "DONE";
          const corBolinha =
            b.status === "DONE" ? "bg-emerald-500 text-white" :
            b.status === "DOING" ? "bg-amber-400 text-amber-900 animate-pulse" :
                                   "bg-gray-200 text-gray-500";
          const Icone =
            b.status === "DONE" ? CheckCircle2 :
            b.status === "DOING" ? AlertCircle :
                                   Circle;
          return (
            <div key={b.id} className="flex items-start min-w-0">
              <div className="flex flex-col items-center w-14 shrink-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shadow-sm ${corBolinha}`}>
                  <Icone className="h-4 w-4" />
                </div>
                <div className="mt-1 text-[10px] font-semibold text-gray-700 leading-tight text-center">
                  {b.label}
                </div>
                <div className="text-[9px] text-gray-500 leading-tight text-center max-w-[3.5rem] truncate">
                  {b.nomeCurto}
                </div>
                {b.contador && (
                  <div className="text-[9px] text-gray-400 tabular-nums">{b.contador}</div>
                )}
              </div>
              {proxima && (
                <div
                  className={`h-0.5 mt-[18px] flex-1 min-w-[14px] transition-colors ${
                    conectorAtivo ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
