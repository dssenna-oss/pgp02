"use client";

// Painel de Condução — o "GPS" do facilitador durante o curso ao vivo.
// Núcleo: (1) roteiro guiado, (2) ações na hora certa, (3) status "posso
// avançar?", (4) alertas SOS/pulo de fase, (7) fechamento. Reaproveita os
// endpoints já existentes (painel-facilitador, atividade-c, termometro, modo-cards,
// disparar-dsr/incidente, sos, phase-skip). Polling 4s.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Users,
  AlertTriangle, LifeBuoy, Layers3, FileText, Award, CheckSquare, Clock, Zap,
  Tv2, ExternalLink, Copy, Check,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { ROTEIRO_CONDUCAO, minutosDoMomento, type MomentoConducao } from "@/lib/conducao-mapa";
import { ATIVIDADES_C } from "@/lib/atividades-c";

type Turma = { id: string; nome: string; cidade: string; slug: string };

type Grupo = {
  numero: number;
  orgao: string;
  papeisAtivos?: { email: string; name?: string }[];
  sos?: { id: string; status: string; requestedByName?: string; createdAt?: string }[];
  phaseSkips?: { id: string; faseTentada?: string; acaoTentada?: string; requestedByName?: string }[];
};
type PainelData = { turma?: { modoCards?: boolean }; grupos?: Grupo[] };

export function PainelConducao({ turmas }: { turmas: Turma[] }) {
  const [turmaId, setTurmaId] = useState(turmas[0]?.id ?? "");
  const turma = turmas.find((t) => t.id === turmaId);
  const [idx, setIdx] = useState(0);
  const momento = ROTEIRO_CONDUCAO[idx];

  const [painel, setPainel] = useState<PainelData | null>(null);
  const [statusAtiv, setStatusAtiv] = useState<any>(null);
  const [statusTermo, setStatusTermo] = useState<any>(null);
  const [modoCards, setModoCards] = useState<boolean>(false);
  const [alterandoMC, setAlterandoMC] = useState(false);
  const [comandoTelao, setComandoTelao] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copiado, setCopiado] = useState(false);

  // origin só no cliente (evita mismatch de hidratação)
  useEffect(() => { setOrigin(window.location.origin); }, []);

  // ---- polling ao vivo ----
  const carregar = useCallback(async () => {
    if (!turmaId) return;
    try {
      const p = await fetch(`/api/curso/painel-facilitador?turmaId=${turmaId}`, { cache: "no-store" });
      if (p.ok) {
        const data = await p.json();
        setPainel(data);
        if (typeof data?.turma?.modoCards === "boolean") setModoCards(data.turma.modoCards);
      }
      const c = await fetch(`/api/curso/telao-comando?turmaId=${turmaId}`, { cache: "no-store" });
      if (c.ok) { const cd = await c.json(); setComandoTelao(cd?.comando ?? null); }
      const stAtiv = momento.status.find((s) => s.kind === "atividade") as any;
      if (stAtiv) {
        const r = await fetch(`/api/curso/atividade-c/painel?turmaId=${turmaId}&atividadeId=${stAtiv.atividadeId}`, { cache: "no-store" });
        setStatusAtiv(r.ok ? await r.json() : null);
      } else setStatusAtiv(null);
      const stTermo = momento.status.find((s) => s.kind === "termometro");
      if (stTermo) {
        const r = await fetch(`/api/curso/termometro/painel?turmaId=${turmaId}`, { cache: "no-store" });
        setStatusTermo(r.ok ? await r.json() : null);
      } else setStatusTermo(null);
    } catch {
      /* silencioso */
    }
  }, [turmaId, momento]);

  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 4000);
    return () => clearInterval(t);
  }, [carregar]);

  // ---- ações ----
  async function toggleModoCards() {
    setAlterandoMC(true);
    try {
      const res = await fetch("/api/curso/modo-cards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, ativo: !modoCards }),
      });
      if (!res.ok) { toast.error("Erro ao alterar Modo Cards"); return; }
      setModoCards(!modoCards);
      toast.success(!modoCards ? "🃏 Modo Cards LIGADO" : "Modo Cards desligado");
    } finally { setAlterandoMC(false); }
  }

  function abrirTelao(href: string) {
    window.open(href, "_blank", "noopener");
  }
  function cartaz(atividadeId: string) {
    return `/facilitador/atividades/cartaz/${turma?.slug}?a=${atividadeId}`;
  }

  // ---- Telão Comandado: o celular grava o comando; o /telao-vivo do notebook
  // lê no próximo tick (~3s) e troca sozinho. ----
  const telaoVivoUrl = origin && turma?.slug ? `${origin}/telao-vivo/${turma.slug}` : "";

  async function mostrarNoTelao(comando: string | null, label: string) {
    setComandoTelao(comando); // otimista
    const res = await fetch("/api/curso/telao-comando", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turmaId, comando }),
    });
    if (res.ok) toast.success(`📺 No telão: ${label}`);
    else { toast.error("Erro ao comandar o telão"); carregar(); }
  }

  function rotuloComando(c: string | null): string {
    if (!c) return "Tela de espera";
    if (c === "placar") return "🏆 Placar / pódio";
    if (c === "quiz") return "📱 Quiz (QR)";
    if (c.startsWith("atividade:")) {
      const id = c.slice("atividade:".length);
      if (id === "termometro") return "🌡️ Termômetro";
      const at = ATIVIDADES_C.find((a) => a.id === id);
      return at ? `${at.emoji} ${at.titulo}` : id;
    }
    return c;
  }

  async function copiarTelaoUrl() {
    if (!telaoVivoUrl) return;
    try {
      await navigator.clipboard.writeText(telaoVivoUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { toast.error("Não consegui copiar"); }
  }

  async function disparar(tipo: "dsr" | "incidente", orgao: "PM" | "CM") {
    const nome = tipo === "dsr" ? "DSR Surpresa" : "Incidente Surpresa (72h)";
    if (!window.confirm(`Disparar ${nome} para TODOS os grupos do órgão ${orgao}?`)) return;
    const url = tipo === "dsr" ? "/api/curso/disparar-dsr" : "/api/curso/disparar-incidente";
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turmaId, orgao }),
    });
    if (res.ok) toast.success(`${nome} disparado (${orgao})`);
    else toast.error(`Erro ao disparar (${orgao})`);
  }

  async function patchAlerta(url: string, body?: any) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) { toast.success("Feito"); carregar(); }
    else toast.error("Erro");
  }

  // ---- derivados ----
  const online = useMemo(() => {
    const gs = painel?.grupos ?? [];
    return gs.reduce((acc, g) => acc + (g.papeisAtivos?.length ?? 0), 0);
  }, [painel]);

  const alertas = useMemo(() => {
    const gs = painel?.grupos ?? [];
    const sos: { grupo: number; orgao: string; id: string; status: string; quem?: string }[] = [];
    const skips: { grupo: number; orgao: string; id: string; fase?: string; quem?: string }[] = [];
    for (const g of gs) {
      for (const s of g.sos ?? []) if (s.status !== "RESOLVED") sos.push({ grupo: g.numero, orgao: g.orgao, id: s.id, status: s.status, quem: s.requestedByName });
      for (const k of g.phaseSkips ?? []) skips.push({ grupo: g.numero, orgao: g.orgao, id: k.id, fase: k.faseTentada, quem: k.requestedByName });
    }
    return { sos, skips };
  }, [painel]);

  return (
    <div className="space-y-4">
      {/* ====== TOPO: turma + atalhos ====== */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-wrap items-center gap-2">
        <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="max-w-xs">
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>{t.nome} · {t.cidade}</option>
          ))}
        </Select>

        <button
          onClick={toggleModoCards}
          disabled={alterandoMC}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${
            modoCards ? "border-indigo-500 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
          }`}
        >
          <Layers3 className="h-4 w-4" /> {modoCards ? "Modo Cards: LIGADO" : "Modo Cards: desligado"}
        </button>

        {/* fallback: abrir telão de qualquer atividade numa NOVA ABA (no dispositivo do clique) */}
        <Select
          value=""
          onChange={(e) => { if (e.target.value) { abrirTelao(cartaz(e.target.value)); e.target.value = ""; } }}
          className="max-w-[17rem]"
          title="Abre numa nova aba, neste dispositivo (fallback)"
        >
          <option value="">↗ Abrir atividade em nova aba…</option>
          <option value="termometro">🌡️ Termômetro (evolução)</option>
          {ATIVIDADES_C.map((a) => (
            <option key={a.id} value={a.id}>{a.emoji} {a.titulo}</option>
          ))}
        </Select>

        <span className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="h-4 w-4 text-green-600" /> <strong>{online}</strong> online
        </span>
      </div>

      {/* ====== TELÃO COMANDADO ====== */}
      {/* O notebook abre /telao-vivo/<slug> UMA vez (+ Modo Projeção). Daqui, do
          celular, o facilitador comanda o que aparece lá — os botões "Mostrar no
          telão" deste painel gravam o comando e o telão troca sozinho (~3s). */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-800">
            <Tv2 className="h-4 w-4" /> Telão do notebook
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm font-medium text-indigo-900 border border-indigo-200">
            mostrando: <strong>{rotuloComando(comandoTelao)}</strong>
          </span>
          {comandoTelao && (
            <button
              onClick={() => mostrarNoTelao(null, "Tela de espera")}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              limpar
            </button>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <code className="hidden sm:inline rounded bg-white px-2 py-1 text-xs text-gray-600 border border-gray-200">
              /telao-vivo/{turma?.slug}
            </code>
            <button
              onClick={copiarTelaoUrl}
              disabled={!telaoVivoUrl}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
              title="Copiar o link pra abrir no notebook"
            >
              {copiado ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? "Copiado" : "Copiar link"}
            </button>
            <button
              onClick={() => telaoVivoUrl && abrirTelao(telaoVivoUrl)}
              disabled={!telaoVivoUrl}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
              title="Abrir o telão ao vivo numa nova aba"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-indigo-700/80">
          No notebook: abra esse link uma vez e ligue o <strong>Modo Projeção</strong>. Daqui do celular, use os botões <strong>“Mostrar no telão”</strong> abaixo.
        </p>
      </div>

      {/* ====== ALERTAS (bloco 4) ====== */}
      {(alertas.sos.length > 0 || alertas.skips.length > 0) && (
        <div className="space-y-2">
          {alertas.sos.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.status === "PENDING" ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
              <LifeBuoy className={`h-5 w-5 ${s.status === "PENDING" ? "text-red-600 animate-pulse" : "text-amber-600"}`} />
              <span className="text-sm font-medium text-gray-800 flex-1">
                🆘 SOS · Grupo {s.grupo} ({s.orgao}){s.quem ? ` · ${s.quem}` : ""} {s.status === "ATTENDED" ? "· a caminho" : ""}
              </span>
              {s.status === "PENDING" && (
                <button onClick={() => patchAlerta(`/api/curso/sos/${s.id}`, { status: "ATTENDED" })} className="px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-semibold">Atendendo</button>
              )}
              <button onClick={() => patchAlerta(`/api/curso/sos/${s.id}`, { status: "RESOLVED" })} className="px-2.5 py-1 rounded-md bg-green-600 text-white text-xs font-semibold">Resolver</button>
            </div>
          ))}
          {alertas.skips.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              <span className="text-sm font-medium text-gray-800 flex-1">
                ⚠️ Pulo de fase · Grupo {k.grupo} ({k.orgao}){k.fase ? ` · tentou ${k.fase}` : ""}
              </span>
              <button onClick={() => patchAlerta(`/api/curso/phase-skip/${k.id}`)} className="px-2.5 py-1 rounded-md bg-gray-700 text-white text-xs font-semibold">Reconheci</button>
            </div>
          ))}
        </div>
      )}

      {/* ====== PROGRESSO ====== */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>Dia {momento.dia} · Momento {momento.numero} de {ROTEIRO_CONDUCAO.length}</span>
          <span className="text-gray-400">{momento.meio}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${((idx + 1) / ROTEIRO_CONDUCAO.length) * 100}%` }} />
        </div>
      </div>

      {/* ====== MOMENTO ATUAL (bloco 1) ====== */}
      <MomentoCard
        momento={momento}
        podeVoltar={idx > 0}
        podeAvancar={idx < ROTEIRO_CONDUCAO.length - 1}
        onVoltar={() => setIdx((i) => Math.max(0, i - 1))}
        onAvancar={() => setIdx((i) => Math.min(ROTEIRO_CONDUCAO.length - 1, i + 1))}
      />

      {/* ====== AÇÕES DO MOMENTO (bloco 2) ====== */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3"><Zap className="h-4 w-4 text-indigo-500" /> Ações deste momento</p>
        {momento.acoes.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhuma ação no app neste momento — conduza pelos slides/cards.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {momento.acoes.map((a, i) => {
              if (a.kind === "telao-atividade")
                return <BotaoAcao key={i} onClick={() => mostrarNoTelao(`atividade:${a.atividadeId}`, a.label)} icon={<Tv2 className="h-4 w-4" />}>{a.label}</BotaoAcao>;
              if (a.kind === "telao-termometro")
                return <BotaoAcao key={i} onClick={() => mostrarNoTelao("atividade:termometro", a.label)} icon={<Tv2 className="h-4 w-4" />}>{a.label}</BotaoAcao>;
              if (a.kind === "telao-quiz")
                return <BotaoAcao key={i} onClick={() => mostrarNoTelao("quiz", a.label)} icon={<Tv2 className="h-4 w-4" />}>{a.label}</BotaoAcao>;
              if (a.kind === "telao-placar")
                return <BotaoAcao key={i} onClick={() => mostrarNoTelao("placar", a.label)} icon={<Tv2 className="h-4 w-4" />}>{a.label}</BotaoAcao>;
              if (a.kind === "disparar-dsr")
                return (
                  <div key={i} className="inline-flex items-center gap-1">
                    <BotaoAcao danger onClick={() => disparar("dsr", "PM")} icon={<Zap className="h-4 w-4" />}>DSR → PM</BotaoAcao>
                    <BotaoAcao danger onClick={() => disparar("dsr", "CM")} icon={<Zap className="h-4 w-4" />}>DSR → CM</BotaoAcao>
                  </div>
                );
              if (a.kind === "disparar-incidente")
                return (
                  <div key={i} className="inline-flex items-center gap-1">
                    <BotaoAcao danger onClick={() => disparar("incidente", "PM")} icon={<AlertTriangle className="h-4 w-4" />}>Incidente → PM</BotaoAcao>
                    <BotaoAcao danger onClick={() => disparar("incidente", "CM")} icon={<AlertTriangle className="h-4 w-4" />}>Incidente → CM</BotaoAcao>
                  </div>
                );
              if (a.kind === "fechamento")
                return <span key={i} className="text-sm text-gray-500">Veja o bloco de encerramento abaixo ↓</span>;
              return null;
            })}
          </div>
        )}
      </div>

      {/* ====== STATUS "POSSO AVANÇAR?" (bloco 3) ====== */}
      {momento.status.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-indigo-800 mb-2"><CheckSquare className="h-4 w-4" /> Posso avançar?</p>
          <div className="space-y-1.5 text-sm text-indigo-900">
            {momento.status.map((s, i) => {
              if (s.kind === "online")
                return <p key={i}>👥 <strong>{online}</strong> participante(s) online agora.</p>;
              if (s.kind === "atividade") {
                const resp = statusAtiv?.agregado?.respondentes ?? 0;
                const grupos = statusAtiv?.porGrupo ?? [];
                const comResp = grupos.filter((g: any) => g.respondentes > 0).length;
                return <p key={i}>📱 <strong>{s.label}</strong>: {resp} resposta(s){grupos.length ? ` · ${comResp} de ${grupos.length} grupos responderam` : ""}.</p>;
              }
              if (s.kind === "termometro") {
                const t = statusTermo ?? {};
                const v = s.fase === "inicio" ? (t.preenchidos ?? 0) : (t.concluidos ?? 0);
                return <p key={i}>🌡️ <strong>{s.label}</strong>: {v} de {t.total ?? 0} grupos.</p>;
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* ====== FECHAMENTO (bloco 7) — só no último momento ====== */}
      {momento.numero === ROTEIRO_CONDUCAO.length && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800 mb-3"><Award className="h-4 w-4" /> Encerramento em 1 clique</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <a href={`/api/curso/modalidade-c/consolidacao/docx?turmaId=${turmaId}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-green-300 bg-white text-green-800 hover:bg-green-100">
              <FileText className="h-4 w-4" /> Relatório de consolidação (DOCX)
            </a>
            <a href="/facilitador" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-green-300">
              <Award className="h-4 w-4" /> Certificados (no Painel do Facilitador, por grupo)
            </a>
          </div>
          <p className="text-xs font-semibold text-green-900 mb-1">Checklist de entrega:</p>
          <ul className="text-sm text-green-900 space-y-0.5">
            <li>☐ Caderno · ☐ Resumo · ☐ Cartilha · ☐ Pacote de Modelos · ☐ Planilha do PGP</li>
            <li>☐ Certificados distribuídos · ☐ Termômetro final projetado · ☐ Próximos passos de cada grupo anotados</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// ---- Card do momento com cronômetro ----
function MomentoCard({
  momento, podeVoltar, podeAvancar, onVoltar, onAvancar,
}: {
  momento: MomentoConducao; podeVoltar: boolean; podeAvancar: boolean; onVoltar: () => void; onAvancar: () => void;
}) {
  const totalSeg = minutosDoMomento(momento.duracao) * 60;
  const [seg, setSeg] = useState(totalSeg);
  const [rodando, setRodando] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  // reseta o cronômetro ao trocar de momento
  useEffect(() => { setSeg(totalSeg); setRodando(false); }, [momento.numero, totalSeg]);

  useEffect(() => {
    if (rodando) {
      ref.current = setInterval(() => setSeg((s) => Math.max(0, s - 1)), 1000);
      return () => { if (ref.current) clearInterval(ref.current); };
    }
  }, [rodando]);

  const mm = String(Math.floor(seg / 60)).padStart(2, "0");
  const ss = String(seg % 60).padStart(2, "0");
  const esgotou = seg === 0 && totalSeg > 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold">
          {momento.numero}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{momento.titulo}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{momento.duracao} · {momento.meio}</p>
        </div>
        {/* cronômetro */}
        <div className="text-right">
          <div className={`tabular-nums text-2xl font-bold ${esgotou ? "text-red-600" : "text-gray-800"}`}>
            <Clock className="inline h-5 w-5 mr-1 align-text-bottom text-gray-400" />{mm}:{ss}
          </div>
          <div className="flex items-center justify-end gap-1 mt-1">
            <IconBtn onClick={() => setRodando((r) => !r)} title={rodando ? "Pausar" : "Iniciar"}>
              {rodando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </IconBtn>
            <IconBtn onClick={() => { setSeg(totalSeg); setRodando(false); }} title="Reiniciar"><RotateCcw className="h-4 w-4" /></IconBtn>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Bloco titulo="✋ Você (facilitador) faz" texto={momento.oQueFacilitadorFaz} />
        <Bloco titulo="👥 Os participantes fazem" texto={momento.oQueParticipantesFazem} />
      </div>
      <div className="mt-3 text-sm text-gray-600"><span className="font-semibold text-gray-700">Material:</span> {momento.material}</div>
      {momento.dica && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">💡 {momento.dica}</div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button onClick={onVoltar} disabled={!podeVoltar} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button onClick={onAvancar} disabled={!podeAvancar} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed">
          Próximo momento <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{titulo}</p>
      <p className="text-sm text-gray-800 leading-relaxed">{texto}</p>
    </div>
  );
}

function BotaoAcao({ children, onClick, icon, danger }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${
      danger ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
    }`}>
      {icon}{children}
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
      {children}
    </button>
  );
}
