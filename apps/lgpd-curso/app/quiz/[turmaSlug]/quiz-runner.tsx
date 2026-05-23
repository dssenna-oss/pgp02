"use client";

// Runner do Quiz — máquina de estados simples no client:
//   IDLE → carregando perguntas
//   READY → tela de boas-vindas (botão Começar)
//   RUNNING (idx 0..N-1) → 1 pergunta por tela
//   SUBMITTING → POST /api/quiz/submit
//   RESULT → score + lacunas
//   JA_RESPONDEU → tela "você já fez este quiz, aqui está seu resultado"
//
// UUID anônimo guardado em localStorage('quiz-uuid-{turmaSlug}') — sobrevive
// a refresh do navegador e impede contar 2x.

import { useEffect, useState } from "react";
import {
  Lightbulb, Scale, Users, Shield, Flag,
  ArrowRight, ArrowLeft, CheckCircle2, Circle, Sparkles, AlertTriangle,
  RefreshCw, Award, Loader2,
} from "lucide-react";
import { QuizHero } from "./quiz-hero";
import type { CategoriaQuiz, PerguntaPublica } from "@/lib/quiz-perguntas";

type Estado = "IDLE" | "READY" | "RUNNING" | "SUBMITTING" | "RESULT" | "JA_RESPONDEU" | "ERRO";

type Lacuna = {
  categoria: CategoriaQuiz;
  rotulo: string;
  emoji: string;
  correct: number;
  total: number;
  ehLacuna: boolean;
};

type Resultado = {
  scoreTotal: number;
  totalPerguntas: number;
  lacunas: Lacuna[];
};

const ICONE_CATEGORIA: Record<CategoriaQuiz, React.ComponentType<{ className?: string }>> = {
  principios: Lightbulb,
  bases_legais: Scale,
  personagens: Users,
  direitos_titular: Shield,
  fases_pgp: Flag,
};

const COR_CATEGORIA: Record<CategoriaQuiz, { bg: string; text: string; ring: string }> = {
  principios:       { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200" },
  bases_legais:     { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  personagens:      { bg: "bg-sky-50",    text: "text-sky-700",    ring: "ring-sky-200" },
  direitos_titular: { bg: "bg-emerald-50",text: "text-emerald-700",ring: "ring-emerald-200" },
  fases_pgp:        { bg: "bg-rose-50",   text: "text-rose-700",   ring: "ring-rose-200" },
};

function gerarUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "uuid-" + Math.random().toString(36).slice(2) + Date.now();
}

export function QuizRunner({ turmaSlug }: { turmaSlug: string }) {
  const [estado, setEstado] = useState<Estado>("IDLE");
  const [erro, setErro] = useState<string | null>(null);
  const [turmaNome, setTurmaNome] = useState<string>("");
  const [perguntas, setPerguntas] = useState<PerguntaPublica[]>([]);
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [uuid, setUuid] = useState<string>("");

  // Inicializa: pega/cria UUID + chama /start
  useEffect(() => {
    const chave = `quiz-uuid-${turmaSlug}`;
    let u = "";
    try {
      u = localStorage.getItem(chave) || "";
    } catch {}
    if (!u) {
      u = gerarUUID();
      try {
        localStorage.setItem(chave, u);
      } catch {}
    }
    setUuid(u);

    (async () => {
      try {
        const res = await fetch("/api/quiz/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turmaSlug, uuid: u }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar quiz");
        }
        setTurmaNome(`${data.turma.nome} · ${data.turma.cidade}`);
        setPerguntas(data.perguntas || []);
        if (data.jaRespondeu && data.resultadoSalvo) {
          // Tela "você já respondeu" com o resultado salvo
          const lacunas: Lacuna[] = [];
          const cats = data.resultadoSalvo.scorePorCategoria as Record<string, { correct: number; total: number }>;
          const meta: Record<CategoriaQuiz, { rotulo: string; emoji: string }> = {
            principios:       { rotulo: "Princípios da LGPD",   emoji: "📚" },
            bases_legais:     { rotulo: "Bases Legais",         emoji: "⚖️" },
            personagens:      { rotulo: "Personagens",          emoji: "👥" },
            direitos_titular: { rotulo: "Direitos do Titular",  emoji: "🛡️" },
            fases_pgp:        { rotulo: "Fases do PGP",         emoji: "🚩" },
          };
          (Object.keys(meta) as CategoriaQuiz[]).forEach((cat) => {
            const dados = cats?.[cat];
            if (dados) {
              lacunas.push({
                categoria: cat,
                rotulo: meta[cat].rotulo,
                emoji: meta[cat].emoji,
                correct: dados.correct,
                total: dados.total,
                ehLacuna: dados.total > 0 && dados.correct < dados.total / 2,
              });
            }
          });
          setResultado({
            scoreTotal: data.resultadoSalvo.scoreTotal,
            totalPerguntas: data.total,
            lacunas,
          });
          setEstado("JA_RESPONDEU");
        } else {
          setEstado("READY");
        }
      } catch (e: any) {
        setErro(e.message || "Erro ao carregar");
        setEstado("ERRO");
      }
    })();
  }, [turmaSlug]);

  function escolher(qid: string, selected: number) {
    setRespostas((prev) => ({ ...prev, [qid]: selected }));
  }

  function avancar() {
    if (idx < perguntas.length - 1) {
      setIdx(idx + 1);
      // Scroll pro topo da pergunta
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      enviar();
    }
  }

  function voltar() {
    if (idx > 0) setIdx(idx - 1);
  }

  async function enviar() {
    setEstado("SUBMITTING");
    try {
      const respostasArr = Object.entries(respostas).map(([qid, selected]) => ({ qid, selected }));
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaSlug, uuid, respostas: respostasArr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao enviar");
      setResultado({
        scoreTotal: data.scoreTotal,
        totalPerguntas: data.totalPerguntas,
        lacunas: data.lacunas,
      });
      setEstado("RESULT");
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar");
      setEstado("ERRO");
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════
  if (estado === "IDLE") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Carregando quiz…</p>
      </div>
    );
  }

  if (estado === "ERRO") {
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

  if (estado === "READY") {
    return (
      <div className="space-y-5">
        <QuizHero subtitle={turmaNome} />
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Pronto pra começar?</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            São <strong>{perguntas.length} perguntas</strong> de múltipla escolha, distribuídas em 5 categorias da LGPD.
            <br className="hidden sm:inline" />{" "}
            Leva uns <strong>7-10 minutos</strong>. É anônimo — sua resposta não é vinculada ao seu nome.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Você vê seu resultado individual ao final</span>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <Award className="h-4 w-4 shrink-0" />
              <span>Sirve pra calibrar o curso do dia</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEstado("RUNNING")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-blue-700"
          >
            Começar quiz <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (estado === "JA_RESPONDEU" && resultado) {
    return <TelaResultado resultado={resultado} ja />;
  }

  if (estado === "RESULT" && resultado) {
    return <TelaResultado resultado={resultado} />;
  }

  if (estado === "SUBMITTING") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm">Calculando seu resultado…</p>
      </div>
    );
  }

  // RUNNING
  const p = perguntas[idx];
  const Icone = ICONE_CATEGORIA[p.categoria];
  const cor = COR_CATEGORIA[p.categoria];
  const escolhida = respostas[p.qid];
  const ehUltima = idx === perguntas.length - 1;
  const podeAvancar = escolhida !== undefined;
  const respondidas = Object.keys(respostas).length;
  const percProgresso = ((idx + 1) / perguntas.length) * 100;

  return (
    <div className="space-y-4">
      {/* Barra de progresso compacta */}
      <div className="rounded-lg border bg-white px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Pergunta <strong className="text-gray-900">{idx + 1}</strong> de {perguntas.length}
          </span>
          <span>{respondidas}/{perguntas.length} respondidas</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${percProgresso}%` }}
          />
        </div>
      </div>

      {/* Card da pergunta */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        {/* Categoria badge */}
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${cor.bg} ${cor.text} ${cor.ring}`}>
          <Icone className="h-3.5 w-3.5" />
          <span>{categoriaRotulo(p.categoria)}</span>
        </div>

        {/* Enunciado */}
        <h2 className="mt-3 text-lg font-semibold leading-snug text-gray-900 sm:text-xl">
          {p.enunciado}
        </h2>

        {/* Alternativas */}
        <div className="mt-4 space-y-2">
          {p.alternativas.map((alt, i) => {
            const selecionada = escolhida === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => escolher(p.qid, i)}
                className={`group flex w-full items-start gap-3 rounded-lg border-2 p-3.5 text-left transition-all ${
                  selecionada
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selecionada ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}
                >
                  {selecionada ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={`flex-1 text-sm leading-relaxed ${selecionada ? "text-blue-900 font-medium" : "text-gray-700"}`}>
                  <span className="mr-1.5 inline-block min-w-[1.25rem] font-semibold">
                    {String.fromCharCode(97 + i)})
                  </span>
                  {alt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegação */}
      <div className="flex gap-2">
        {idx > 0 && (
          <button
            type="button"
            onClick={voltar}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        )}
        <button
          type="button"
          onClick={avancar}
          disabled={!podeAvancar}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-semibold transition-colors ${
            podeAvancar
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {ehUltima ? "Enviar respostas" : "Próxima"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {!podeAvancar && (
        <p className="text-center text-xs text-gray-500">Selecione uma alternativa para continuar</p>
      )}
    </div>
  );
}

function categoriaRotulo(cat: CategoriaQuiz): string {
  return {
    principios: "Princípios da LGPD",
    bases_legais: "Bases Legais",
    personagens: "Personagens",
    direitos_titular: "Direitos do Titular",
    fases_pgp: "Fases do PGP",
  }[cat];
}

function TelaResultado({ resultado, ja }: { resultado: Resultado; ja?: boolean }) {
  const perc = Math.round((resultado.scoreTotal / resultado.totalPerguntas) * 100);
  const lacunas = resultado.lacunas.filter((l) => l.ehLacuna);

  const conceito =
    perc >= 75 ? { txt: "Conhecimento sólido", cor: "from-emerald-500 to-teal-600", emoji: "🌟" } :
    perc >= 50 ? { txt: "Conhecimento intermediário", cor: "from-blue-500 to-indigo-600", emoji: "📘" } :
    perc >= 25 ? { txt: "Espaço pra aprofundar", cor: "from-amber-500 to-orange-600", emoji: "📖" } :
                 { txt: "Curso vai te ajudar bastante", cor: "from-rose-500 to-pink-600", emoji: "🌱" };

  return (
    <div className="space-y-5">
      {ja && (
        <div className="flex items-center gap-2 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-900">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Você já tinha respondido este quiz neste dispositivo — aqui está seu resultado.</span>
        </div>
      )}
      {/* Card score */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${conceito.cor} px-5 py-6 text-white shadow-lg`}>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl ring-2 ring-white/40">
            {conceito.emoji}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80">
              Seu resultado
            </div>
            <div className="mt-0.5 text-4xl font-bold leading-none">
              {resultado.scoreTotal}<span className="text-2xl text-white/70">/{resultado.totalPerguntas}</span>
            </div>
            <div className="mt-1 text-sm font-medium text-white/95">
              {perc}% · {conceito.txt}
            </div>
          </div>
        </div>
      </div>

      {/* Lacunas por categoria */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-base font-semibold text-gray-900">
          Lacunas por área
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Acerto menor que metade = recomendamos atenção especial durante o curso.
        </p>
        <div className="mt-4 space-y-2">
          {resultado.lacunas.map((l) => {
            const percCat = l.total > 0 ? Math.round((l.correct / l.total) * 100) : 0;
            const barColor =
              percCat >= 75 ? "bg-emerald-500" :
              percCat >= 50 ? "bg-blue-500" :
              percCat >= 25 ? "bg-amber-500" :
                              "bg-rose-500";
            return (
              <div key={l.categoria} className="flex items-center gap-3">
                <div className="w-24 shrink-0 text-xs">
                  <span className="mr-1">{l.emoji}</span>
                  <span className="text-gray-700">{l.rotulo}</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percCat}%` }} />
                  </div>
                </div>
                <div className="w-14 shrink-0 text-right text-xs font-semibold text-gray-700 tabular-nums">
                  {l.correct}/{l.total}
                </div>
              </div>
            );
          })}
        </div>
        {lacunas.length > 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border-l-4 border-amber-400 bg-amber-50 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-900">
              Foque atenção especial em:{" "}
              <strong>{lacunas.map((l) => l.rotulo).join(" · ")}</strong>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2 rounded-md border-l-4 border-emerald-400 bg-emerald-50 p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="text-xs text-emerald-900">
              Sem lacunas críticas. Foco do curso pra você: aprofundar e ver o lado <strong>prático</strong>.
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-gray-50 p-4 text-center text-xs text-gray-600">
        Resposta enviada anonimamente. O facilitador vê só números agregados da turma.<br />
        Bom curso! 🎯
      </div>
    </div>
  );
}
