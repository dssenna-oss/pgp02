"use client";

// Quiz "Caça às Pegadinhas" — missão de Encerramento do curso.
//
// 8 cards de pegadinhas plantadas:
//   - 2 dos processos do órgão (PM ou CM)
//   - 6 erros plantados no Aviso de Privacidade auto-preenchido
//
// Pra cada card, o grupo responde "Você identifica algum problema aqui?"
// (Sim/Não/Não sei) com observação opcional. Após submeter, vê o gabarito
// completo com descrição pedagógica + artigo LGPD + dica do facilitador.

import { useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Search, Check, X, HelpCircle, Award, RotateCcw, AlertTriangle } from "lucide-react";
import { getPegadinhasPorOrgao, type PegadinhaProcesso } from "@/lib/processos-pegadinhas";
import { CATALOGO_ERROS_PLANTADOS, type ErroPlantado } from "@/lib/aviso-erros-plantados";
import { submeterQuiz, refazerQuiz, type RespostaQuiz, type QuizEstado, type QuizSalvo } from "./actions";

type Detectou = "SIM" | "NAO" | "NAO_SEI";

// Pergunta unificada — funde Pegadinha (processo) e ErroPlantado (aviso) na
// mesma estrutura visual.
type Pergunta = {
  id: string;
  tipo: "PROCESSO" | "AVISO";
  rotuloCurto: string;
  trecho: string;
  contexto: string; // ex: "Processo: Atendimento no Posto" ou "Aviso · Seção 4"
  porqueEpegadinha: string;
  artigoLgpd: string;
  dicaDoFacilitador: string;
};

function pegadinhaProcessoParaPergunta(p: PegadinhaProcesso): Pergunta {
  return {
    id: p.id,
    tipo: "PROCESSO",
    rotuloCurto: p.rotuloCurto,
    trecho: p.trechoBriefing,
    contexto: `Processo do órgão (${p.orgao === "PM" ? "Prefeitura" : "Câmara"})`,
    porqueEpegadinha: p.porqueEpegadinha,
    artigoLgpd: p.artigoLgpd,
    dicaDoFacilitador: p.dicaDoFacilitador,
  };
}

function erroAvisoParaPergunta(e: ErroPlantado): Pergunta {
  return {
    id: e.id,
    tipo: "AVISO",
    rotuloCurto: e.rotulo,
    // Pra erros do Aviso o "trecho" é descrição da seção em que ocorre
    trecho: `Trecho que apareceu na ${e.secao} do Aviso auto-preenchido — releia esta seção do Aviso e avalie se está conforme a LGPD.`,
    contexto: `Aviso de Privacidade · ${e.secao}`,
    porqueEpegadinha: e.descricaoPedagogica,
    artigoLgpd: e.artigoLgpd,
    dicaDoFacilitador: e.dicaDoFacilitador,
  };
}

export function CacaPegadinhasView({ estado }: { estado: QuizEstado }) {
  // Bloqueado se sem grupo (modo facilitador-preview)
  if (estado.bloqueado || !estado.orgao) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-7 w-7 text-amber-600" />
            Caça às Pegadinhas
          </h1>
        </header>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-sm">
            {estado.motivoBloqueio || "Esta missão é da equipe do grupo. Faça login como participante (DPO ou Contribuidor) pra responder."}
          </p>
        </div>
      </div>
    );
  }

  // Monta as 8 perguntas: 2 processos do órgão + 6 erros do aviso
  const perguntas = useMemo<Pergunta[]>(() => {
    const pegProcessos = getPegadinhasPorOrgao(estado.orgao as "PM" | "CM").map(pegadinhaProcessoParaPergunta);
    const pegAviso = CATALOGO_ERROS_PLANTADOS.map(erroAvisoParaPergunta);
    return [...pegProcessos, ...pegAviso];
  }, [estado.orgao]);

  // 2 modos: "responder" e "gabarito"
  const jaTemQuiz = !!estado.quizSalvo;
  const [modo, setModo] = useState<"responder" | "gabarito">(jaTemQuiz ? "gabarito" : "responder");

  // Mapa de respostas em rascunho (modo responder)
  const [respostas, setRespostas] = useState<Record<string, { detectou: Detectou | null; observacao: string }>>(() => {
    const inicial: Record<string, { detectou: Detectou | null; observacao: string }> = {};
    for (const p of perguntas) {
      const salva = estado.quizSalvo?.respostas?.find((r) => r.pegadinhaId === p.id);
      inicial[p.id] = {
        detectou: salva ? (salva.detectou as Detectou) : null,
        observacao: salva?.observacao || "",
      };
    }
    return inicial;
  });

  const [submetendo, setSubmetendo] = useState(false);
  const [resultadoLocal, setResultadoLocal] = useState<QuizSalvo | null>(estado.quizSalvo);

  const todasRespondidas = perguntas.every((p) => respostas[p.id]?.detectou !== null);
  const respondidasCount = perguntas.filter((p) => respostas[p.id]?.detectou !== null).length;

  function escolher(pId: string, valor: Detectou) {
    setRespostas((prev) => ({
      ...prev,
      [pId]: { ...prev[pId], detectou: valor },
    }));
  }

  function atualizarObservacao(pId: string, texto: string) {
    setRespostas((prev) => ({
      ...prev,
      [pId]: { ...prev[pId], observacao: texto },
    }));
  }

  async function onSubmeter() {
    if (!todasRespondidas) {
      toast.error(`Responda todas as ${perguntas.length} perguntas antes de submeter`);
      return;
    }
    setSubmetendo(true);
    const payload: RespostaQuiz[] = perguntas.map((p) => ({
      pegadinhaId: p.id as any,
      tipo: p.tipo,
      detectou: respostas[p.id].detectou as Detectou,
      observacao: respostas[p.id].observacao,
    }));
    const r = await submeterQuiz(payload);
    setSubmetendo(false);
    if (r.ok) {
      toast.success(`Quiz finalizado! Olho clínico: ${r.score}/${r.total}`);
      setResultadoLocal({
        respostas: payload,
        score: r.score,
        total: r.total,
        finalizadoEm: new Date().toISOString(),
      });
      setModo("gabarito");
    } else {
      toast.error(r.error || "Erro ao submeter");
    }
  }

  async function onRefazer() {
    if (!confirm("Apagar as respostas atuais e refazer o quiz?")) return;
    setSubmetendo(true);
    const r = await refazerQuiz();
    setSubmetendo(false);
    if (r.ok) {
      setResultadoLocal(null);
      setRespostas(Object.fromEntries(perguntas.map((p) => [p.id, { detectou: null, observacao: "" }])));
      setModo("responder");
      toast.success("Quiz reaberto");
    } else {
      toast.error(r.error || "Erro ao refazer");
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-7 w-7 text-amber-600" />
          Caça às Pegadinhas
        </h1>
        <p className="text-gray-600 mt-2">
          Missão de encerramento. Pra cada situação abaixo, decida se vocês identificam algum problema de LGPD —
          {" "}<span className="text-amber-700 font-semibold">use o olho clínico que aprenderam durante o curso</span>.
          Há 8 situações no total: 2 dos processos que vocês mapearam + 6 do Aviso de Privacidade que vocês publicaram.
        </p>
      </header>

      {modo === "gabarito" && resultadoLocal ? (
        <GabaritoCard resultadoLocal={resultadoLocal} perguntas={perguntas} respostas={respostas} onRefazer={onRefazer} submetendo={submetendo} />
      ) : (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 mb-6 text-sm text-amber-900">
          <p className="font-semibold mb-1">Dica de equipe:</p>
          <p>
            Conversem em grupo antes de responder cada uma. Nem toda &ldquo;coisa estranha&rdquo; é violação da LGPD — e nem toda
            violação é óbvia. Quem identifica corretamente <strong>todas as 8</strong> ganha o selo &ldquo;🔍 Olho Clínico Total&rdquo;.
          </p>
        </div>
      )}

      <ol className="space-y-4">
        {perguntas.map((p, idx) => (
          <PerguntaCard
            key={p.id}
            indice={idx + 1}
            pergunta={p}
            resposta={respostas[p.id]}
            modo={modo}
            onEscolher={(v) => escolher(p.id, v)}
            onObservacao={(t) => atualizarObservacao(p.id, t)}
          />
        ))}
      </ol>

      {modo === "responder" && (
        <div className="mt-8 sticky bottom-4 bg-white shadow-lg rounded-lg border-2 border-amber-300 p-4 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-gray-700">
              Respondidas: {respondidasCount} de {perguntas.length}
            </span>
            {!todasRespondidas && (
              <span className="text-amber-700 ml-3">— responda todas pra finalizar</span>
            )}
          </div>
          <button
            onClick={onSubmeter}
            disabled={!todasRespondidas || submetendo}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Award className="h-4 w-4" /> Finalizar e ver gabarito
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card de pergunta ─────────────────────────────────────────────────────────
function PerguntaCard({
  indice,
  pergunta,
  resposta,
  modo,
  onEscolher,
  onObservacao,
}: {
  indice: number;
  pergunta: Pergunta;
  resposta?: { detectou: Detectou | null; observacao: string };
  modo: "responder" | "gabarito";
  onEscolher: (v: Detectou) => void;
  onObservacao: (t: string) => void;
}) {
  const escolhida = resposta?.detectou ?? null;
  const acertou = escolhida === "SIM"; // todas as 8 são pegadinhas reais

  return (
    <li className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <header className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {pergunta.contexto} · Pergunta {indice}
            </div>
            <h3 className="font-semibold text-gray-900 mt-0.5">{pergunta.rotuloCurto}</h3>
          </div>
          {modo === "gabarito" && (
            <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${acertou ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
              {acertou ? "✓ Detectou" : escolhida === "NAO" ? "✗ Passou batido" : "? Não sabia"}
            </div>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Trecho do briefing/aviso */}
        <blockquote className="border-l-4 border-amber-300 bg-amber-50 px-4 py-3 italic text-gray-800 text-sm">
          {pergunta.trecho}
        </blockquote>

        {/* Pergunta + 3 botões */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Vocês identificam algum problema de LGPD nesse trecho?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <BotaoOpcao
              icone={<Check className="h-4 w-4" />}
              rotulo="Sim, tem problema"
              cor="emerald"
              selecionado={escolhida === "SIM"}
              disabled={modo === "gabarito"}
              onClick={() => onEscolher("SIM")}
            />
            <BotaoOpcao
              icone={<X className="h-4 w-4" />}
              rotulo="Não, está OK"
              cor="gray"
              selecionado={escolhida === "NAO"}
              disabled={modo === "gabarito"}
              onClick={() => onEscolher("NAO")}
            />
            <BotaoOpcao
              icone={<HelpCircle className="h-4 w-4" />}
              rotulo="Não sei"
              cor="amber"
              selecionado={escolhida === "NAO_SEI"}
              disabled={modo === "gabarito"}
              onClick={() => onEscolher("NAO_SEI")}
            />
          </div>
        </div>

        {/* Observação opcional */}
        {escolhida === "SIM" && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Qual o problema? <span className="font-normal text-gray-500">(opcional)</span>
            </label>
            <textarea
              value={resposta?.observacao || ""}
              onChange={(e) => onObservacao(e.target.value)}
              disabled={modo === "gabarito"}
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
              placeholder="Ex: dado sensível compartilhado sem base legal específica…"
            />
          </div>
        )}

        {/* Gabarito (revelado após submit) */}
        {modo === "gabarito" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Por que é pegadinha
            </div>
            <p className="text-sm text-blue-900 leading-relaxed">{pergunta.porqueEpegadinha}</p>
            <p className="text-xs text-blue-700 pt-1">
              <strong>Base legal:</strong> {pergunta.artigoLgpd}
            </p>
            <details className="text-xs text-blue-800 pt-1">
              <summary className="cursor-pointer font-semibold">💡 Dica do facilitador</summary>
              <p className="mt-1 italic">{pergunta.dicaDoFacilitador}</p>
            </details>
          </div>
        )}
      </div>
    </li>
  );
}

function BotaoOpcao({
  icone,
  rotulo,
  cor,
  selecionado,
  disabled,
  onClick,
}: {
  icone: React.ReactNode;
  rotulo: string;
  cor: "emerald" | "gray" | "amber";
  selecionado: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const cores: Record<string, { active: string; inactive: string }> = {
    emerald: { active: "bg-emerald-600 text-white border-emerald-700", inactive: "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50" },
    gray: { active: "bg-gray-700 text-white border-gray-800", inactive: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" },
    amber: { active: "bg-amber-500 text-white border-amber-600", inactive: "bg-white text-amber-700 border-amber-200 hover:bg-amber-50" },
  };
  const c = cores[cor];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 py-2 px-3 rounded border text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${selecionado ? c.active : c.inactive}`}
    >
      {icone}
      <span>{rotulo}</span>
    </button>
  );
}

// ─── Card do gabarito (resumo + ações) ────────────────────────────────────────
function GabaritoCard({
  resultadoLocal,
  perguntas,
  onRefazer,
  submetendo,
}: {
  resultadoLocal: QuizSalvo;
  perguntas: Pergunta[];
  respostas: Record<string, { detectou: Detectou | null; observacao: string }>;
  onRefazer: () => void;
  submetendo: boolean;
}) {
  const score = resultadoLocal.score;
  const total = resultadoLocal.total || perguntas.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const selo = pct === 100 ? { emoji: "🥇", texto: "Olho Clínico Total!", cor: "emerald" }
    : pct >= 75 ? { emoji: "🥈", texto: "Olho Clínico Apurado", cor: "blue" }
    : pct >= 50 ? { emoji: "🥉", texto: "Olho Clínico em Treinamento", cor: "amber" }
    : { emoji: "🔎", texto: "Continue treinando — leia o gabarito abaixo", cor: "rose" };
  const corClasses: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-900",
    blue: "bg-blue-50 border-blue-300 text-blue-900",
    amber: "bg-amber-50 border-amber-300 text-amber-900",
    rose: "bg-rose-50 border-rose-300 text-rose-900",
  };

  return (
    <div className={`rounded-lg border-2 p-6 mb-6 ${corClasses[selo.cor]}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-4xl font-bold flex items-baseline gap-2">
            <span>{selo.emoji}</span>
            <span>{score}/{total}</span>
            <span className="text-lg font-medium opacity-80">({pct}%)</span>
          </div>
          <p className="font-semibold mt-1">{selo.texto}</p>
          <p className="text-sm opacity-80 mt-1">
            Veja o gabarito completo abaixo — cada situação revela por que era pegadinha, qual artigo da LGPD
            se aplica, e dica pra discussão presencial com o facilitador.
          </p>
        </div>
        <button
          onClick={onRefazer}
          disabled={submetendo}
          className="bg-white/80 hover:bg-white border border-current py-2 px-4 rounded text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" /> Refazer quiz
        </button>
      </div>
    </div>
  );
}
