"use client";

// Painel do Facilitador — Quiz Diagnóstico.
//
// Mostra ao facilitador o estado AGREGADO do quiz da turma selecionada:
//   - Total de respondentes
//   - Score médio + histograma 0-25/25-50/50-75/75-100
//   - Por categoria: % médio de acerto (radar visual)
//   - Por questão: % acerto + distribuição + alternativa mais errada
//
// Polling 5s — mesmo padrão do Painel do Facilitador principal.

import { useEffect, useState } from "react";
import {
  Lightbulb, Scale, Users, Shield, Flag,
  ClipboardCheck, RefreshCw, ExternalLink, Copy, Check,
  AlertTriangle, TrendingUp, BarChart3, Award,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import type { CategoriaQuiz } from "@/lib/quiz-perguntas";

type Turma = {
  id: string;
  nome: string;
  cidade: string;
  slug: string;
  proximoCurso: boolean;
};

type Dados = {
  total: {
    respondentes: number;
    completos: number;
    scoreMedio: number;
    scoreMediano: number;
    totalPerguntas: number;
  };
  histograma: { "0-25": number; "25-50": number; "50-75": number; "75-100": number };
  porQuestao: {
    qid: string;
    enunciado: string;
    categoria: CategoriaQuiz;
    rotuloCategoria: string;
    emojiCategoria: string;
    alternativas: string[];
    correta: number;
    totalRespostas: number;
    acertos: number;
    percAcerto: number;
    distribuicao: number[];
    maisErrada: number | null;
  }[];
  porCategoria: {
    categoria: CategoriaQuiz;
    rotulo: string;
    emoji: string;
    percAcertoMedio: number;
    totalQuestoes: number;
    respondentes: number;
  }[];
  geradoEm: string;
};

const ICONE_CATEGORIA: Record<CategoriaQuiz, React.ComponentType<{ className?: string }>> = {
  principios: Lightbulb,
  bases_legais: Scale,
  personagens: Users,
  direitos_titular: Shield,
  fases_pgp: Flag,
};

export function PainelQuiz({ turmas }: { turmas: Turma[] }) {
  const inicial = turmas.find((t) => t.proximoCurso)?.id ?? turmas[0]?.id ?? "";
  const [turmaId, setTurmaId] = useState<string>(inicial);
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiou, setCopiou] = useState(false);

  const turmaSel = turmas.find((t) => t.id === turmaId);
  const quizUrl = turmaSel
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/quiz/${turmaSel.slug}`
    : "";

  useEffect(() => {
    if (!turmaId) return;
    let cancelado = false;
    async function load() {
      try {
        if (!cancelado) setCarregando(true);
        const res = await fetch(`/api/quiz/painel?turmaId=${turmaId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setDados(data);
      } catch {} finally {
        if (!cancelado) setCarregando(false);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [turmaId]);

  function copiarUrl() {
    if (!quizUrl) return;
    navigator.clipboard.writeText(quizUrl).then(() => {
      setCopiou(true);
      setTimeout(() => setCopiou(false), 2000);
    });
  }

  if (turmas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Quiz Diagnóstico</h1>
        <div className="mt-5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
          Nenhuma turma ativa. Crie uma turma em <code className="text-xs">/admin/criar-turma</code> primeiro.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Facilitador · Avaliação inicial
      </div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-blue-600" />
            Quiz Diagnóstico LGPD
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Aplicado no início do curso, anônimo, 30 perguntas. Resultado consolidado da turma.
          </p>
        </div>
        <div className="shrink-0">
          <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="text-sm">
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.proximoCurso ? "🎯 " : ""}{t.nome} · {t.cidade}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* URL pública pro QR/copiar */}
      {turmaSel && (
        <div className="mt-4 rounded-lg border-l-4 border-l-blue-400 bg-blue-50 p-4">
          <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1.5">
            🔗 URL pública pra o participante
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="flex-1 min-w-0 truncate rounded bg-white px-3 py-2 text-sm font-mono text-blue-700 ring-1 ring-blue-200">
              {quizUrl}
            </code>
            <button
              type="button"
              onClick={copiarUrl}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {copiou ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
            </button>
            <a
              href={quizUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" /> Abrir
            </a>
          </div>
          <p className="mt-2 text-xs text-blue-800">
            Gere o QR Code dessa URL (qualquer ferramenta online) e projete no início do curso, ou cole no e-mail de convite.
          </p>
        </div>
      )}

      {/* Estado vazio */}
      {dados && dados.total.completos === 0 && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
          <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Ainda nenhuma resposta. O painel atualiza automaticamente a cada 5 segundos.</p>
          {dados.total.respondentes > 0 && (
            <p className="text-xs mt-2">
              {dados.total.respondentes} pessoa(s) iniciaram mas ainda não enviaram.
            </p>
          )}
        </div>
      )}

      {/* Métricas resumo */}
      {dados && dados.total.completos > 0 && (
        <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
          <MetricaCard label="Respondentes" valor={String(dados.total.completos)} icon={Users} cor="blue" />
          <MetricaCard
            label="Score médio"
            valor={`${dados.total.scoreMedio}/${dados.total.totalPerguntas}`}
            sub={`${Math.round((dados.total.scoreMedio / dados.total.totalPerguntas) * 100)}%`}
            icon={Award}
            cor="emerald"
          />
          <MetricaCard
            label="Score mediano"
            valor={`${dados.total.scoreMediano}/${dados.total.totalPerguntas}`}
            icon={TrendingUp}
            cor="violet"
          />
          <MetricaCard
            label="Em andamento"
            valor={String(Math.max(0, dados.total.respondentes - dados.total.completos))}
            sub="iniciaram, faltam enviar"
            icon={ClipboardCheck}
            cor="amber"
          />
        </div>
      )}

      {/* Histograma */}
      {dados && dados.total.completos > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            Distribuição dos scores
          </h2>
          <div className="mt-4 space-y-2.5">
            {(["75-100", "50-75", "25-50", "0-25"] as const).map((faixa) => {
              const n = dados.histograma[faixa];
              const perc = dados.total.completos > 0 ? (n / dados.total.completos) * 100 : 0;
              const cor =
                faixa === "75-100" ? "bg-emerald-500" :
                faixa === "50-75" ? "bg-blue-500" :
                faixa === "25-50" ? "bg-amber-500" :
                                    "bg-rose-500";
              const rotulo =
                faixa === "75-100" ? "75-100% — Conhecimento sólido" :
                faixa === "50-75" ? "50-75% — Intermediário" :
                faixa === "25-50" ? "25-50% — Espaço pra aprofundar" :
                                    "0-25% — Curso vai ajudar bastante";
              return (
                <div key={faixa} className="flex items-center gap-3">
                  <div className="w-56 shrink-0 text-xs text-gray-700">{rotulo}</div>
                  <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                    <div className={`h-full ${cor} transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold text-white`} style={{ width: `${Math.max(perc, 6)}%` }}>
                      {n > 0 && <span>{n}</span>}
                    </div>
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs tabular-nums text-gray-700">
                    {Math.round(perc)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Por categoria */}
      {dados && dados.total.completos > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            Acerto médio por categoria
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Use pra calibrar onde aprofundar na apresentação inicial.</p>
          <div className="mt-4 space-y-2.5">
            {dados.porCategoria.map((cat) => {
              const Icone = ICONE_CATEGORIA[cat.categoria];
              const cor =
                cat.percAcertoMedio >= 75 ? "bg-emerald-500" :
                cat.percAcertoMedio >= 50 ? "bg-blue-500" :
                cat.percAcertoMedio >= 25 ? "bg-amber-500" :
                                             "bg-rose-500";
              return (
                <div key={cat.categoria} className="flex items-center gap-3">
                  <div className="w-48 shrink-0 flex items-center gap-2">
                    <Icone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-800 truncate">{cat.rotulo}</span>
                    <span className="text-[10px] text-gray-400">({cat.totalQuestoes}q)</span>
                  </div>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${cor} transition-all duration-500`} style={{ width: `${cat.percAcertoMedio}%` }} />
                  </div>
                  <div className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-800">
                    {cat.percAcertoMedio}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Por questão */}
      {dados && dados.total.completos > 0 && (
        <div className="mt-6 rounded-lg border bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-gray-500" />
            Detalhe por questão
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Onde a turma errou mais — bom material pra responder ao vivo na apresentação.
          </p>
          <div className="mt-4 space-y-3">
            {dados.porQuestao
              .filter((q) => q.totalRespostas > 0)
              .map((q, i) => {
                const Icone = ICONE_CATEGORIA[q.categoria];
                const corPerc =
                  q.percAcerto >= 75 ? "text-emerald-700 bg-emerald-50 ring-emerald-200" :
                  q.percAcerto >= 50 ? "text-blue-700 bg-blue-50 ring-blue-200" :
                  q.percAcerto >= 25 ? "text-amber-700 bg-amber-50 ring-amber-200" :
                                       "text-rose-700 bg-rose-50 ring-rose-200";
                return (
                  <details key={q.qid} className="group rounded-lg border bg-white p-3">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tabular-nums">
                            {(i + 1).toString().padStart(2, "0")}
                          </span>
                          <Icone className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 line-clamp-2">{q.enunciado}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{q.rotuloCategoria}</div>
                        </div>
                        <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${corPerc} tabular-nums`}>
                          {q.percAcerto}%
                        </div>
                      </div>
                    </summary>
                    <div className="mt-3 ml-9 space-y-1.5">
                      {q.alternativas.map((alt, j) => {
                        const perc = q.distribuicao[j] || 0;
                        const ehCorreta = j === q.correta;
                        const ehMaisErrada = j === q.maisErrada;
                        return (
                          <div key={j} className="flex items-center gap-2">
                            <div
                              className={`w-6 shrink-0 text-center text-xs font-bold rounded ${
                                ehCorreta
                                  ? "bg-emerald-100 text-emerald-700"
                                  : ehMaisErrada
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {String.fromCharCode(97 + j)}
                            </div>
                            <div className="flex-1 text-xs text-gray-700 truncate">{alt}</div>
                            <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full ${ehCorreta ? "bg-emerald-500" : ehMaisErrada ? "bg-rose-400" : "bg-gray-300"}`}
                                style={{ width: `${perc}%` }}
                              />
                            </div>
                            <div className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-gray-600">
                              {perc}%
                            </div>
                          </div>
                        );
                      })}
                      {q.maisErrada !== null && q.percAcerto < 50 && (
                        <div className="mt-2 flex items-start gap-2 rounded border-l-4 border-l-amber-400 bg-amber-50 p-2 text-[11px] text-amber-900">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            Maioria escolheu a alternativa <strong>{String.fromCharCode(97 + q.maisErrada)}</strong>.
                            Vale explicar o porquê na apresentação.
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
          </div>
        </div>
      )}

      {dados && (
        <div className="mt-6 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          {carregando ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Atualiza a cada 5s · {new Date(dados.geradoEm).toLocaleTimeString("pt-BR")}
        </div>
      )}
    </div>
  );
}

function MetricaCard({
  label, valor, sub, icon: Icon, cor,
}: {
  label: string;
  valor: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  cor: "blue" | "emerald" | "violet" | "amber";
}) {
  const corBg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${corBg[cor]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{valor}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
