"use client";

// Telão — placar ao vivo + conquistas. Faz polling da mesma API do Painel do
// Facilitador (/api/curso/painel-facilitador) e roda o motor de conquistas
// (lib/telao-conquistas) no cliente. Conquistas ganhas são persistidas em
// localStorage por turma — sobrevivem a um refresh da tela de projeção.

import { useState, useEffect, useRef } from "react";
import { Trophy, Sparkles, Radio, RotateCcw } from "lucide-react";
import { missaoAtual, type BolinhaMissao } from "@/lib/timeline";
import {
  CONQUISTAS,
  avaliarConquistas,
  type ConquistaGanha,
  type GrupoEstadoConquista,
} from "@/lib/telao-conquistas";

type Turma = { id: string; nome: string; cidade: string };

type ApiGrupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  companyName: string;
  score: number;
  timeline: BolinhaMissao[];
  avisoErrosReportados: unknown[];
  kpis: {
    incidentes: { comunicadosAnpd: number };
    gap: { apoiosPendentes: number };
  };
  olhoClinico?: {
    finalizado: boolean;
    score: number;
    total: number;
    finalizadoEm: string | null;
  };
};

const MEDALHA = ["🥇", "🥈", "🥉"];
const ACENTO = [
  "border-amber-300 bg-gradient-to-r from-amber-50 to-white",
  "border-slate-300 bg-gradient-to-r from-slate-50 to-white",
  "border-orange-300 bg-gradient-to-r from-orange-50 to-white",
];
const BARRA = ["bg-amber-400", "bg-slate-400", "bg-orange-400"];

const NOVO_MS = 12000; // janela do destaque "AGORA!"

function emojiOrgao(orgao: string) {
  return orgao === "PM" ? "🛕" : "🏛";
}
function nomeOrgao(orgao: string) {
  return orgao === "PM" ? "Prefeitura" : "Câmara";
}
function rotuloGrupo(g: { numero: number; orgao: string }) {
  return `G${g.numero} · ${nomeOrgao(g.orgao)}`;
}

function quando(ts: number): string {
  if (ts <= 1) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  return `há ${Math.floor(m / 60)}h`;
}

function lerConquistas(turmaId: string): ConquistaGanha[] {
  try {
    const raw = localStorage.getItem(`curso-telao-conquistas-${turmaId}`);
    return raw ? (JSON.parse(raw) as ConquistaGanha[]) : [];
  } catch {
    return [];
  }
}
function salvarConquistas(turmaId: string, c: ConquistaGanha[]) {
  try {
    localStorage.setItem(`curso-telao-conquistas-${turmaId}`, JSON.stringify(c));
  } catch {
    /* localStorage cheio/indisponível — ignora */
  }
}

export function TelaoView({ turmas }: { turmas: Turma[] }) {
  const [turmaId, setTurmaId] = useState(turmas[0]?.id || "");
  const [grupos, setGrupos] = useState<ApiGrupo[]>([]);
  const [conquistas, setConquistas] = useState<ConquistaGanha[]>([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const conquistasRef = useRef<ConquistaGanha[]>([]);

  useEffect(() => {
    if (!turmaId) return;
    const salvas = lerConquistas(turmaId);
    conquistasRef.current = salvas;
    setConquistas(salvas);

    let primeira = true;
    let cancelado = false;

    async function tick() {
      if (cancelado) return;
      if (primeira) setCarregando(true);
      try {
        const res = await fetch(`/api/curso/painel-facilitador?turmaId=${turmaId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setErro(true);
          return;
        }
        const data = await res.json();
        if (cancelado) return;
        const gs: ApiGrupo[] = data.grupos || [];
        setGrupos(gs);

        const estados: GrupoEstadoConquista[] = gs.map((g) => ({
          grupoId: g.grupoId,
          numero: g.numero,
          rotulo: rotuloGrupo(g),
          timeline: g.timeline || [],
          avisoErrosReportados: g.avisoErrosReportados || [],
          kpis: {
            incidentes: { comunicadosAnpd: g.kpis?.incidentes?.comunicadosAnpd || 0 },
            gap: { apoiosPendentes: g.kpis?.gap?.apoiosPendentes || 0 },
          },
          olhoClinico: g.olhoClinico,
        }));
        const r = avaliarConquistas(estados, conquistasRef.current, primeira);
        conquistasRef.current = r.ganhas;
        setConquistas(r.ganhas);
        salvarConquistas(turmaId, r.ganhas);
        setErro(false);
      } catch {
        setErro(true);
      } finally {
        if (primeira) setCarregando(false);
        primeira = false;
      }
    }

    tick();
    const iv = setInterval(tick, 4000);
    return () => {
      cancelado = true;
      clearInterval(iv);
    };
  }, [turmaId]);

  // O Telão é tela de projeção: ocupa a viewport inteira. Enquanto montado,
  // transforma o <body> em coluna flex de altura total, esconde o rodapé
  // global e tira o scroll. Tudo é restaurado ao sair da tela.
  useEffect(() => {
    const body = document.body;
    const footer = document.querySelector("body > footer") as HTMLElement | null;
    const anterior = {
      display: body.style.display,
      flexDirection: body.style.flexDirection,
      height: body.style.height,
      overflow: body.style.overflow,
      footer: footer?.style.display ?? "",
    };
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.height = "100vh";
    body.style.overflow = "hidden";
    if (footer) footer.style.display = "none";
    return () => {
      body.style.display = anterior.display;
      body.style.flexDirection = anterior.flexDirection;
      body.style.height = anterior.height;
      body.style.overflow = anterior.overflow;
      if (footer) footer.style.display = anterior.footer;
    };
  }, []);

  const turma = turmas.find((t) => t.id === turmaId);
  const ranking = [...grupos].sort((a, b) => b.score - a.score || a.numero - b.numero);

  // Pódio do Olho Clínico — só aparece quando ao menos 1 grupo finalizou o quiz.
  // Ranking por score do quiz "Caça às Pegadinhas" (desempate: nº do grupo).
  const podioOlho = [...grupos]
    .filter((g) => g.olhoClinico?.finalizado)
    .sort((a, b) => {
      const sb = b.olhoClinico?.score ?? 0;
      const sa = a.olhoClinico?.score ?? 0;
      return sb - sa || a.numero - b.numero;
    })
    .slice(0, 5);

  // Conquistas por grupo (pra contagem de selinhos)
  const porGrupo = new Map<string, ConquistaGanha[]>();
  for (const c of conquistas) {
    const arr = porGrupo.get(c.grupoId) || [];
    arr.push(c);
    porGrupo.set(c.grupoId, arr);
  }
  const feed = [...conquistas].sort((a, b) => b.ts - a.ts).slice(0, 6);

  if (turmas.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-10 text-center">
        <div>
          <Trophy className="mx-auto h-14 w-14 text-gray-300" />
          <p className="mt-3 text-lg text-gray-500">
            Nenhuma turma ativa. Crie uma turma para usar o Telão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 p-5">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Trophy className="h-10 w-10 shrink-0 text-amber-300" />
          <div>
            <h1 className="text-3xl font-extrabold leading-none tracking-tight">Placar da Turma</h1>
            <p className="mt-1 text-sm text-brand-100">
              {turma ? `${turma.nome} · ${turma.cidade}` : "—"}
              {grupos.length > 0 && ` — ${grupos.length} grupos em campo`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {turmas.length > 1 && (
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="rounded-md border border-white/30 bg-white/15 px-2 py-1.5 text-sm font-medium text-white [&>option]:text-gray-900"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} · {t.cidade}
                </option>
              ))}
            </select>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            {erro ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin text-amber-200" /> Reconectando
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 animate-pulse text-emerald-300" /> AO VIVO
              </>
            )}
          </span>
        </div>
      </header>

      {/* Pódio do Olho Clínico — só aparece quando ao menos 1 grupo terminou o quiz */}
      {podioOlho.length > 0 && (
        <section className="mt-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-5 py-3 shadow-md">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base font-bold uppercase tracking-wide text-amber-900 flex items-center gap-2">
                🔍 Pódio do Olho Clínico
              </h3>
              <p className="text-xs text-amber-800 italic">Detecção das 8 pegadinhas plantadas (2 processos + 6 erros do Aviso)</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {podioOlho.map((g, i) => {
                const medalha = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
                const sc = g.olhoClinico!.score;
                const tot = g.olhoClinico!.total;
                return (
                  <div
                    key={g.grupoId}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                      i === 0 ? "bg-amber-200 border-2 border-amber-400" : "bg-white border border-amber-200"
                    }`}
                  >
                    <span className="text-xl">{medalha}</span>
                    <div className="text-sm">
                      <div className="font-bold text-gray-900 leading-tight">{rotuloGrupo(g)}</div>
                      <div className="text-amber-700 font-semibold leading-tight">
                        {sc}/{tot} {sc === tot ? "🏆 Olho Total" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Corpo: ranking + conquistas */}
      <div className="mt-4 grid flex-1 grid-cols-[1.55fr_1fr] grid-rows-1 gap-5 overflow-hidden">
        {/* ───────── RANKING ───────── */}
        <section className="flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide text-gray-500">
            Ranking dos grupos
          </h2>
          {ranking.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              {carregando ? "Carregando…" : "Esta turma ainda não tem grupos."}
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2 overflow-hidden">
              {ranking.map((g, i) => {
                const topo = i < 3;
                const concluiu = g.timeline?.some((b) => b.id === "m6" && b.status === "DONE");
                const m = missaoAtual(g.timeline || []);
                return (
                  <div
                    key={g.grupoId}
                    className={`flex min-h-0 flex-1 items-center gap-4 rounded-xl border-2 px-4 py-2 ${
                      topo ? ACENTO[i] : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="w-12 shrink-0 text-center">
                      {topo ? (
                        <span className="text-3xl">{MEDALHA[i]}</span>
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">{i + 1}º</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-xl font-extrabold text-gray-900">
                          {emojiOrgao(g.orgao)} {rotuloGrupo(g)}
                        </span>
                        <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                          {concluiu
                            ? "🎉 Concluiu as 5 missões"
                            : m
                            ? `${m.label} · ${m.nomeCurto}`
                            : "Aguardando início"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            topo ? BARRA[i] : "bg-brand-400"
                          }`}
                          style={{ width: `${Math.max(2, Math.min(100, g.score))}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-4xl font-extrabold leading-none text-gray-900">
                        {g.score}
                      </div>
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">pontos</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 shrink-0 text-center text-sm italic text-gray-400">
            Todos os grupos chegam ao fim — o placar é só pra dar ritmo. 🚀
          </p>
        </section>

        {/* ───────── CONQUISTAS ───────── */}
        <section className="flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-gray-500">
            <Sparkles className="h-5 w-5 text-amber-500" /> Conquistas ao vivo
          </h2>

          {feed.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-gray-400">
              Os selinhos aparecem aqui assim que os grupos forem cumprindo as missões.
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2 overflow-hidden">
              {feed.map((c) => {
                const def = CONQUISTAS.find((d) => d.id === c.conquistaId);
                if (!def) return null;
                const novo = c.ts > 1 && Date.now() - c.ts < NOVO_MS;
                return (
                  <div
                    key={`${c.conquistaId}-${c.grupoId}`}
                    className={`flex min-h-0 flex-1 items-center gap-3 rounded-xl border px-3.5 py-2 ${
                      novo
                        ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span className="text-3xl">{def.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-gray-900">{def.nome}</div>
                      <div className="truncate text-sm text-gray-500">
                        G{c.numero} · {c.rotulo.split(" · ")[1] || ""}
                      </div>
                    </div>
                    {novo ? (
                      <span className="shrink-0 animate-pulse rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-900">
                        AGORA!
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-gray-400">{quando(c.ts)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Coleção por grupo */}
          {grupos.length > 0 && (
            <div className="mt-3 shrink-0 border-t pt-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Selinhos por grupo
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...grupos]
                  .sort((a, b) => a.numero - b.numero)
                  .map((g) => {
                    const ganhas = (porGrupo.get(g.grupoId) || [])
                      .map((c) => CONQUISTAS.find((d) => d.id === c.conquistaId)?.emoji)
                      .filter(Boolean);
                    return (
                      <div
                        key={g.grupoId}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5"
                      >
                        <span className="shrink-0 text-sm font-bold text-gray-700">G{g.numero}</span>
                        <span className="min-w-0 flex-1 truncate text-lg leading-none">
                          {ganhas.length > 0 ? ganhas.join(" ") : "—"}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {ganhas.length}/{CONQUISTAS.length}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
