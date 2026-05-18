"use client";

// Resumo da Turma (Reflexão Final) — modal grande com:
//   - Grupo mais maduro (maior score)
//   - Tabela por grupo: maturidade, tempo total ativo, missão mais demorada, qtd SOS
//   - Highlights pedagógicos pra usar no debrief

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Award, Trophy, Clock, LifeBuoy, Mail } from "lucide-react";
import type { BolinhaMissao } from "./timeline-grupo";
import type { SosItem } from "./central-sos";

type Grupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  score: number;
  timeline: BolinhaMissao[];
  sos: SosItem[];
  kpis?: {
    dsrGame?: { score: number; acertos: number; erros: number; conservadores: number; semAcao: number };
  };
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
                          {g.kpis?.dsrGame && (g.kpis.dsrGame.acertos + g.kpis.dsrGame.erros + g.kpis.dsrGame.conservadores + g.kpis.dsrGame.semAcao) > 0 ? (
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              g.kpis.dsrGame.score > 0 ? "bg-emerald-100 text-emerald-700" :
                              g.kpis.dsrGame.score < 0 ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`} title={`✓${g.kpis.dsrGame.acertos} ✗${g.kpis.dsrGame.erros} ⛔${g.kpis.dsrGame.conservadores} ⏳${g.kpis.dsrGame.semAcao}`}>
                              {g.kpis.dsrGame.score > 0 ? "+" : ""}{g.kpis.dsrGame.score}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
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

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
              <strong>📨 Sobre a DSR Surpresa:</strong> grupos com placar negativo responderam a pedidos sem
              verificar a identidade do titular — <em>vazaram dados</em> pra alguém que talvez nem fosse o titular real.
              Grupos com placar positivo pediram comprovação (art. 19 §1º LGPD) antes de responder.
              Reforce no fechamento: &quot;Direito do titular não é direito de quem afirma ser titular&quot;.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
