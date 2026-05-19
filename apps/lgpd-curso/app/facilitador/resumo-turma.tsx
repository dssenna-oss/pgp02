"use client";

// Resumo da Turma (Reflexão Final) — modal grande com:
//   - Grupo mais maduro (maior score)
//   - Tabela por grupo: maturidade, tempo total ativo, missão mais demorada, qtd SOS
//   - Highlights pedagógicos pra usar no debrief
//
// Celebração: quando TODOS os grupos terminaram as 7 missões (timeline 100%
// DONE), dispara confete dos 2 cantos + palmas sintetizadas via Web Audio
// — momento "UAU" do encerramento.

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Award, Trophy, Clock, LifeBuoy, Mail, Bug } from "lucide-react";
import confetti from "canvas-confetti";
import type { BolinhaMissao } from "./timeline-grupo";
import type { SosItem } from "./central-sos";
import { CATALOGO_ERROS_PLANTADOS, detectarErroPorPalavraChave, type ErroPlantadoId } from "@/lib/aviso-erros-plantados";

// === Palmas sintetizadas via Web Audio API ===
// Cada "palma" = burst curto de ruído branco com envelope rápido + filtro
// passa-banda (centro ~2kHz onde nossa percepção de palma é mais forte).
// Sequência de N palmas com pequena variação aleatória pra parecer multidão.
function tocarPalmas(audioCtx: AudioContext, qtdPalmas = 12) {
  const sampleRate = audioCtx.sampleRate;
  for (let i = 0; i < qtdPalmas; i++) {
    const atrasoMs = i * 90 + Math.random() * 30; // ~90ms entre palmas, com jitter
    setTimeout(() => {
      try {
        // Buffer de ruído branco de 80ms
        const duration = 0.08;
        const buf = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const dados = buf.getChannelData(0);
        for (let j = 0; j < dados.length; j++) dados[j] = Math.random() * 2 - 1;

        const src = audioCtx.createBufferSource();
        src.buffer = buf;

        // Filtro passa-banda centrado em ~2kHz (frequência típica de palma)
        const filtro = audioCtx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 1500 + Math.random() * 1500;
        filtro.Q.value = 0.8;

        // Envelope: ataque imediato, decay exponencial rápido (~50ms)
        const gain = audioCtx.createGain();
        const volume = 0.10 + Math.random() * 0.08;
        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(filtro);
        filtro.connect(gain);
        gain.connect(audioCtx.destination);
        src.start(now);
        src.stop(now + duration);
      } catch {}
    }, atrasoMs);
  }
}

// Confete dos 2 cantos (esquerdo + direito) por ~3 segundos
function dispararConfete() {
  const duracaoMs = 3000;
  const fim = Date.now() + duracaoMs;
  const cores = ["#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f87171", "#facc15"];
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: cores,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: cores,
    });
    if (Date.now() < fim) requestAnimationFrame(frame);
  })();
}

type Grupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  score: number;
  timeline: BolinhaMissao[];
  sos: SosItem[];
  kpis?: {
    dsrGame?: {
      score: number;
      respondeu: number;
      postergou: number;
      outros: number;
      pediuId: number;
      conservadores: number;
      semAcao: number;
    };
    aviso?: {
      status: string | null;
      publicSlug: string | null;
      conteudoChars: number;
    };
  };
  dsrGameOutros?: Array<{ titularNome: string; pedido: string; resposta: string }>;
  avisoErrosPlantados?: string[];
  avisoErrosReportados?: Array<{ userName: string; descricao: string; criadoEm: string }>;
};

function formatMin(seg: number): string {
  if (seg < 60) return `${seg}s`;
  const m = Math.floor(seg / 60);
  return `${m}min`;
}

function tempoMissaoSeg(b: BolinhaMissao): number {
  if (!b.inicioEm) return 0;
  const fim = b.status === "DONE" && b.ultimaAtividadeEm
    ? new Date(b.ultimaAtividadeEm).getTime()
    : Date.now();
  return Math.max(0, Math.floor((fim - new Date(b.inicioEm).getTime()) / 1000));
}

export function ResumoTurmaDialog({
  open,
  onClose,
  grupos,
}: {
  open: boolean;
  onClose: () => void;
  grupos: Grupo[];
}) {
  const ranking = [...grupos].sort((a, b) => b.score - a.score);
  const campeao = ranking[0];

  // Celebração: dispara UMA VEZ por abertura quando TODOS os grupos
  // têm a timeline 100% DONE. Não repete em re-render.
  const jaCelebrouRef = useRef(false);
  useEffect(() => {
    if (!open) {
      // reset quando fecha — próxima abertura pode comemorar de novo
      // só se atender a condição
      jaCelebrouRef.current = false;
      return;
    }
    if (jaCelebrouRef.current) return;
    if (grupos.length === 0) return;

    // Condição: TODOS os grupos têm todas as missões DONE
    const todosCompletos = grupos.every(
      (g) => g.timeline.length > 0 && g.timeline.every((b) => b.status === "DONE"),
    );
    if (!todosCompletos) return;

    jaCelebrouRef.current = true;

    // Confete já vai imediatamente (canvas-confetti não precisa de gesto)
    dispararConfete();

    // Palmas precisam de AudioContext — Chrome bloqueia se nunca houve gesto.
    // Mas como o user CLICOU em "Resumo" pra abrir o dialog, esse próprio
    // clique já é gesto válido — AudioContext novo aqui funciona.
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      // pequeno delay pra confete começar a aparecer antes do som chegar
      setTimeout(() => tocarPalmas(ctx, 14), 200);
      // fecha o ctx após 3s pra liberar recursos
      setTimeout(() => { try { ctx.close(); } catch {} }, 3500);
    } catch {}
  }, [open, grupos]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Resumo da Turma · Reflexão Final
          </DialogTitle>
          <DialogDescription>
            Use estes dados no fechamento. Mostra na projeção pra reforçar o aprendizado coletivo.
          </DialogDescription>
        </DialogHeader>

        {grupos.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">Sem grupos.</div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Campeão */}
            {campeao && (
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-10 w-10 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Grupo mais maduro</div>
                    <div className="text-xl font-bold text-amber-900">
                      G{campeao.numero} · {campeao.orgao} — {campeao.score}/100
                    </div>
                    <div className="text-xs text-amber-700 mt-0.5">
                      Maior PGP estruturado nas {campeao.timeline.filter((b) => b.status === "DONE").length} missões fechadas.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela por grupo */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border">
                <thead className="bg-gray-100">
                  <tr className="text-left">
                    <th className="px-2 py-1.5">Grupo</th>
                    <th className="px-2 py-1.5"><Award className="h-3.5 w-3.5 inline" /> Maturidade</th>
                    <th className="px-2 py-1.5">Missões fechadas</th>
                    <th className="px-2 py-1.5"><Clock className="h-3.5 w-3.5 inline" /> Missão mais longa</th>
                    <th className="px-2 py-1.5"><LifeBuoy className="h-3.5 w-3.5 inline" /> SOS</th>
                    <th className="px-2 py-1.5"><Mail className="h-3.5 w-3.5 inline" /> DSR Surpresa</th>
                    <th className="px-2 py-1.5">📜 Aviso</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((g) => {
                    const tempos = g.timeline
                      .filter((b) => b.inicioEm)
                      .map((b) => ({ label: `${b.label} · ${b.nomeCurto}`, seg: tempoMissaoSeg(b) }));
                    const maisLonga = tempos.length
                      ? tempos.reduce((max, t) => (t.seg > max.seg ? t : max), tempos[0])
                      : null;
                    const sosTotal = g.sos.length; // PENDING + ATTENDED (RESOLVED não vem do endpoint hoje, mas pode aparecer)
                    return (
                      <tr key={g.grupoId} className="border-t hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-semibold">G{g.numero} · {g.orgao}</td>
                        <td className="px-2 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            g.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                            g.score >= 60 ? "bg-blue-100 text-blue-700" :
                            g.score >= 40 ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {g.score}/100
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          {g.timeline.filter((b) => b.status === "DONE").length}/{g.timeline.length}
                        </td>
                        <td className="px-2 py-1.5 text-gray-700">
                          {maisLonga ? (
                            <span title={maisLonga.label}>
                              {maisLonga.label.split(" · ")[0]} · {formatMin(maisLonga.seg)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-2 py-1.5">
                          {sosTotal > 0
                            ? <span className="text-red-700 font-semibold">{sosTotal}</span>
                            : <span className="text-gray-400">0</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          {g.kpis?.dsrGame && (g.kpis.dsrGame.respondeu + g.kpis.dsrGame.postergou + g.kpis.dsrGame.outros + g.kpis.dsrGame.pediuId + g.kpis.dsrGame.conservadores + g.kpis.dsrGame.semAcao) > 0 ? (
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              g.kpis.dsrGame.score > 0 ? "bg-emerald-100 text-emerald-700" :
                              g.kpis.dsrGame.score < 0 ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`} title={`✗ Respondeu sem checar: ${g.kpis.dsrGame.respondeu} · ⏳ Postergou: ${g.kpis.dsrGame.postergou} · 💬 Outros: ${g.kpis.dsrGame.outros} · ✓ Pediu identidade: ${g.kpis.dsrGame.pediuId}`}>
                              {g.kpis.dsrGame.score > 0 ? "+" : ""}{g.kpis.dsrGame.score}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          {(() => {
                            const av = g.kpis?.aviso;
                            if (!av || (!av.status && av.conteudoChars === 0)) {
                              return <span className="text-gray-400">— não iniciado</span>;
                            }
                            const chars = av.conteudoChars || 0;
                            const preench = chars >= 2500 ? "preenchido" : chars >= 500 ? "esboçado" : "minimal";
                            if (av.status === "PUBLICADO") {
                              return (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                    ✅ Publicado
                                  </span>
                                  {av.publicSlug && (
                                    <a
                                      href={`/p/${av.publicSlug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-emerald-700 underline hover:no-underline"
                                      title="Abrir aviso público"
                                    >
                                      🔗 ver
                                    </a>
                                  )}
                                  <span className="text-[10px] text-gray-500">{preench}</span>
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                  🟡 Rascunho
                                </span>
                                <span className="text-[10px] text-gray-500">{preench}</span>
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900">
              <strong>Dica de Reflexão Final:</strong> peça pro &quot;Grupo mais maduro&quot; compartilhar o que fez de diferente.
              Use a coluna &quot;Missão mais longa&quot; pra explorar onde a turma sentiu mais dificuldade
              (geralmente o GAP ou o Aviso). O número de SOS mostra os pontos de maior dúvida da turma —
              vale revisar esses conceitos no fechamento.
            </div>

            {/* Aviso · Caça aos Erros — Missão 4b */}
            {(() => {
              const gruposComAtividade = ranking.filter(
                (g) => (g.avisoErrosPlantados?.length || 0) > 0 || (g.avisoErrosReportados?.length || 0) > 0,
              );
              if (gruposComAtividade.length === 0) return null;
              return (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-900 space-y-3">
                  <div className="font-semibold flex items-center gap-1">
                    <Bug className="h-4 w-4" />
                    📜 Aviso · Caça aos Erros (Missão 4b) — leia em voz alta no debrief:
                  </div>
                  {gruposComAtividade.map((g) => {
                    const plantados = g.avisoErrosPlantados || [];
                    const reports = g.avisoErrosReportados || [];
                    // Match heurístico: report → erro plantado
                    const matchesReport = reports.map((r) => ({
                      ...r,
                      matchId: detectarErroPorPalavraChave(r.descricao),
                    }));
                    const idsDetectados = new Set(matchesReport.map((m) => m.matchId).filter(Boolean) as ErroPlantadoId[]);
                    const idsPassados = plantados.filter((p) => !idsDetectados.has(p as ErroPlantadoId));
                    return (
                      <div key={g.grupoId} className="bg-white border border-orange-200 rounded p-3 space-y-2">
                        <div className="font-semibold text-orange-900">
                          G{g.numero}·{g.orgao} · {plantados.length} erros plantados · {reports.length} reports do grupo · {idsDetectados.size} match prováveis
                        </div>

                        {/* Erros DETECTADOS pelo grupo (match com palavra-chave) */}
                        {[...idsDetectados].length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                              ✓ Provavelmente detectados (palavra-chave bateu)
                            </div>
                            <ul className="space-y-1">
                              {[...idsDetectados].map((id) => {
                                const def = CATALOGO_ERROS_PLANTADOS.find((c) => c.id === id);
                                return (
                                  <li key={id} className="text-emerald-800 text-[11px]">
                                    • <strong>{def?.rotulo}</strong> <span className="text-emerald-600">— {def?.secao}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Erros que PASSARAM BATIDO */}
                        {idsPassados.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1">
                              ✗ Passaram batido (não detectados)
                            </div>
                            <ul className="space-y-1">
                              {idsPassados.map((id) => {
                                const def = CATALOGO_ERROS_PLANTADOS.find((c) => c.id === id);
                                return (
                                  <li key={id} className="text-red-800 text-[11px]">
                                    • <strong>{def?.rotulo}</strong> <span className="text-red-600">— {def?.secao}</span>
                                    {def?.dicaDoFacilitador && (
                                      <span className="block text-red-700 italic ml-3 mt-0.5">
                                        💡 {def.dicaDoFacilitador}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {/* Textos dos reports do grupo */}
                        {matchesReport.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                              📝 Reports do grupo (textos livres)
                            </div>
                            <div className="space-y-1.5">
                              {matchesReport.map((r, i) => {
                                const matchDef = r.matchId ? CATALOGO_ERROS_PLANTADOS.find((c) => c.id === r.matchId) : null;
                                return (
                                  <div key={i} className="bg-gray-50 border border-gray-200 rounded p-2">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-[10px] text-gray-600 font-medium">{r.userName}</span>
                                      {matchDef ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                                          ✓ {matchDef.rotulo.split(" — ")[0]}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                          ? sem match — classifique no debrief
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-800 whitespace-pre-wrap">{r.descricao}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="text-[11px] italic">
                    O matching usa palavras-chave (consentimento, sensíveis, retenção, juridiquês, transferência, canal/DSR).
                    Reports &quot;sem match&quot; você classifica oralmente no debrief.
                  </div>
                </div>
              );
            })()}

            {/* Respostas livres dos grupos no DSR Surpresa — leitura pro debrief */}
            {(() => {
              const todosOutros = ranking
                .flatMap((g) => (g.dsrGameOutros || []).map((o) => ({ ...o, grupoLabel: `G${g.numero}·${g.orgao}` })));
              if (todosOutros.length === 0) return null;
              return (
                <div className="bg-sky-50 border border-sky-200 rounded p-3 text-xs text-sky-900 space-y-2">
                  <div className="font-semibold flex items-center gap-1">
                    💬 Respostas livres no DSR Surpresa — leia em voz alta no debrief:
                  </div>
                  <div className="space-y-2">
                    {todosOutros.map((o, idx) => (
                      <div key={idx} className="bg-white border border-sky-200 rounded p-2">
                        <div className="text-[11px] font-medium text-sky-700 mb-1">
                          {o.grupoLabel} · pedido de {o.titularNome}
                        </div>
                        <div className="text-xs text-gray-800 whitespace-pre-wrap">{o.resposta}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] italic">
                    Procure grupos que mencionam &quot;identidade&quot;, &quot;documento&quot;, &quot;selfie&quot;, &quot;CPF&quot; ou &quot;confirmação&quot; — tiveram a sacada do art. 19 §1º LGPD.
                  </div>
                </div>
              );
            })()}

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
              <strong>📨 Sobre a DSR Surpresa:</strong> grupos com placar negativo responderam a pedidos sem
              verificar a identidade do titular — <em>vazaram dados</em> pra alguém que talvez nem fosse o titular real.
              Reforce no fechamento: &quot;Direito do titular não é direito de quem afirma ser titular&quot;
              (art. 19 §1º LGPD: o controlador deve confirmar a identidade do requerente antes de atender).
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
