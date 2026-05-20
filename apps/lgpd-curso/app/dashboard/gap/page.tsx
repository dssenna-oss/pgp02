import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { GapControl } from "./gap-control";
import { GapContextoBanner } from "./gap-contexto-banner";
import { listAnswers } from "./actions";
import { getPacoteAtivo } from "@/lib/gap-pacote";
import { FASES_ORDEM, PACOTE_DEFAULT_IDS, type ControleCatalogo, type FaseGap } from "@/lib/gap-catalogo";
import { requireCompany } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { Flag } from "lucide-react";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function GapPage() {
  const { companyId, session } = await requireCompany();
  const podeEditar = podeEditarFaseAvancada(session.user.role);
  const [answers, pacote, grupoComTurma] = await Promise.all([
    listAnswers(),
    getPacoteAtivo(companyId),
    prisma.cursoGrupo.findUnique({
      where: { companyId },
      select: { turma: { select: { gapPacote: true } } },
    }),
  ]);

  const byId = new Map(answers.map((a) => [a.controleId, a]));
  const idsPacote = new Set(pacote.map((c) => c.id));

  const total = pacote.length;
  const respondidos = answers.filter((a) => idsPacote.has(a.controleId)).length;
  const aderentes = answers.filter((a) => a.resposta === "ADERENTE" && idsPacote.has(a.controleId)).length;
  const parciais = answers.filter((a) => a.resposta === "PARCIAL" && idsPacote.has(a.controleId)).length;
  const naoAderentes = answers.filter((a) => a.resposta === "NAO_ADERENTE" && idsPacote.has(a.controleId)).length;
  const acoesPlanejadas = answers.filter((a) => a.resposta === "ACAO_PLANEJADA" && idsPacote.has(a.controleId)).length;
  const apoiosPendentes = answers.filter((a) => a.resposta === "APOIO_PENDENTE" && idsPacote.has(a.controleId)).length;

  // Score: ignora APOIO_PENDENTE (não foi avaliado). ACAO_PLANEJADA conta como
  // 0 pontos (não premia promessa) mas entra no denominador.
  const avaliados = aderentes + parciais + naoAderentes + acoesPlanejadas;
  const score = avaliados > 0
    ? Math.round(((aderentes * 100 + parciais * 50) / (avaliados * 100)) * 100)
    : 0;

  // Pacote: customizado ou padrão?
  const idsTurma = grupoComTurma?.turma?.gapPacote || [];
  const customizado = idsTurma.length > 0;

  // Agrupa pacote ativo pelas Fases
  const porFase = new Map<FaseGap, ControleCatalogo[]>();
  for (const c of pacote) {
    const arr = porFase.get(c.fase) || [];
    arr.push(c);
    porFase.set(c.fase, arr);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        missao="Missão 3 · GAP"
        titulo={`GAP Analysis — ${total} controles`}
        descricao="Medir maturidade real vale mais que parecer maduro. Responda cada controle com honestidade — esta é fotografia da casa hoje, não onde queremos chegar."
      />

      <BaseLegalCard faseKey="gap" />

      {!podeEditar && <ModoObservadorBanner />}

      <FaseReadOnlyWrapper podeEditar={podeEditar}>
      <GapContextoBanner />

      {/* Origem do pacote: padrão vs customizado pelo facilitador */}
      <div className={`mb-4 text-xs px-3 py-2 rounded border ${
        customizado
          ? "bg-purple-50 border-purple-200 text-purple-900"
          : "bg-gray-50 border-gray-200 text-gray-600"
      }`}>
        {customizado
          ? <>📋 <strong>Pacote customizado</strong> pela turma — {total} controles selecionados pelo facilitador entre os 30 do catálogo do curso.</>
          : <>📋 <strong>Pacote padrão</strong> — {total} controles cobrindo as 7 Fases do PGP.</>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
        <div className="border rounded-lg p-3 bg-slate-50">
          <div className="text-[11px] text-slate-700 uppercase">📅 Planejadas</div>
          <div className="text-xl font-bold mt-1 text-slate-700">{acoesPlanejadas}</div>
        </div>
        <div className="border rounded-lg p-3 bg-sky-50">
          <div className="text-[11px] text-sky-700 uppercase">🤝 Apoio</div>
          <div className="text-xl font-bold mt-1 text-sky-700">{apoiosPendentes}</div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-brand-50 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-brand-900">
            Score de aderência
            {(apoiosPendentes > 0 || acoesPlanejadas > 0) && (
              <span className="text-[11px] font-normal text-brand-700 ml-2">
                (sobre {avaliados} avaliações
                {acoesPlanejadas > 0 && `, ${acoesPlanejadas} planejada${acoesPlanejadas > 1 ? "s" : ""}`}
                {apoiosPendentes > 0 && `, ${apoiosPendentes} em apoio`}
                )
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-brand-700">{score}%</div>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${score}%` }} />
        </div>
      </div>

      {/* Controles agrupados pelas Fases do PGP */}
      <div className="space-y-6">
        {FASES_ORDEM.map((fase) => {
          const controles = porFase.get(fase.id);
          if (!controles || controles.length === 0) return null;
          return (
            <section key={fase.id}>
              <h2 className={`flex items-center gap-2 text-sm font-semibold text-gray-800 border-l-4 ${fase.cor} pl-3 py-1 mb-3 bg-gray-50/60`}>
                <Flag className="h-4 w-4 text-gray-500" />
                <span>{fase.emoji} {fase.nome}</span>
                <span className="text-[11px] font-normal text-gray-500 ml-auto">
                  {controles.length} controle{controles.length > 1 ? "s" : ""}
                </span>
              </h2>
              <div className="space-y-3">
                {controles.map((c) => (
                  <GapControl key={c.id} controle={c} answer={byId.get(c.id) || null} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      </FaseReadOnlyWrapper>
    </div>
  );
}
