import { PageHeader } from "@/components/page-header";
import { GapControl } from "./gap-control";
import { listAnswers } from "./actions";
import { GAP_PACOTE } from "@/lib/gap-pacote";

export const dynamic = "force-dynamic";

export default async function GapPage() {
  const answers = await listAnswers();
  const byId = new Map(answers.map((a) => [a.controleId, a]));

  const total = GAP_PACOTE.length;
  const respondidos = answers.length;
  const aderentes = answers.filter((a) => a.resposta === "ADERENTE").length;
  const parciais = answers.filter((a) => a.resposta === "PARCIAL").length;
  const naoAderentes = answers.filter((a) => a.resposta === "NAO_ADERENTE").length;

  // Score: ADERENTE = 100%, PARCIAL = 50%, NAO_ADERENTE = 0%
  const score = total > 0
    ? Math.round(((aderentes * 100 + parciais * 50) / (total * 100)) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        missao="Missão 3 · GAP"
        titulo="GAP Analysis — 10 controles"
        descricao="Medir maturidade real vale mais que parecer maduro. Responda cada controle com honestidade — esta é fotografia do TCEES hoje, não onde queremos chegar."
      />

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border rounded-lg p-3 bg-white">
          <div className="text-[11px] text-gray-500 uppercase">Respondidos</div>
          <div className="text-xl font-bold mt-1">{respondidos} / {total}</div>
        </div>
        <div className="border rounded-lg p-3 bg-emerald-50">
          <div className="text-[11px] text-emerald-700 uppercase">Aderentes</div>
          <div className="text-xl font-bold mt-1 text-emerald-700">{aderentes}</div>
        </div>
        <div className="border rounded-lg p-3 bg-amber-50">
          <div className="text-[11px] text-amber-700 uppercase">Parciais</div>
          <div className="text-xl font-bold mt-1 text-amber-700">{parciais}</div>
        </div>
        <div className="border rounded-lg p-3 bg-red-50">
          <div className="text-[11px] text-red-700 uppercase">Não aderentes</div>
          <div className="text-xl font-bold mt-1 text-red-700">{naoAderentes}</div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-brand-50 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-brand-900">Score de aderência</div>
          <div className="text-2xl font-bold text-brand-700">{score}%</div>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {GAP_PACOTE.map((c) => (
          <GapControl key={c.id} controle={c} answer={byId.get(c.id) || null} />
        ))}
      </div>
    </div>
  );
}
