"use client";

// Termômetro — Fase Preliminar (PA). INDIVIDUAL, em 2 blocos:
//   Parte 1 "Sobre você" (3 perguntas)            → score pessoal 0-100
//   Parte 2 "Sobre sua instituição" (7 perguntas)  → score institucional 0-100
// As 7 institucionais espelham as Fases do PGP em linguagem do dia-a-dia.
// Aplicado no INÍCIO e repetido no FIM pra mostrar os 2 saltos.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Check, RotateCcw, Thermometer, Award, User, Landmark } from "lucide-react";
import {
  DIMENSOES_TERMOMETRO,
  DIMENSOES_PESSOAIS,
  DIMENSOES_INSTITUICAO,
  calcularScoresTermometro,
  faixaQualitativa,
  faixaPessoal,
  SCORE_MAXIMO,
  type DimensaoTermometro,
  type NivelTermometro,
  type TermometroSalvo,
} from "@/lib/termometro-perguntas";
import { salvarTermometro } from "./actions";

type Momento = "INICIO" | "FIM";

// Reconstrói o estado de respostas a partir de um registro salvo, IGNORANDO
// ids de perguntas que não existem mais (registro feito numa versão anterior
// do questionário) — senão a contagem "X/10 respondidas" nunca fecha e o
// botão Finalizar trava.
const IDS_VALIDOS = new Set(DIMENSOES_TERMOMETRO.map((d) => d.id));
function respostasDoSalvo(s: TermometroSalvo | null): Record<string, NivelTermometro> {
  const r: Record<string, NivelTermometro> = {};
  s?.dimensoes.forEach((d) => {
    if (IDS_VALIDOS.has(d.id)) r[d.id] = d.opcaoEscolhida;
  });
  return r;
}

const COR_FAIXA: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  orange: "border-orange-200 bg-orange-50 text-orange-900",
  gray: "border-gray-200 bg-gray-50 text-gray-900",
};

// Medidor de UM score salvo (pessoal ou institucional) com a faixa qualitativa.
function MedidorResultado({
  titulo,
  icone,
  score,
  faixa,
}: {
  titulo: string;
  icone: React.ReactNode;
  score: number;
  faixa: { label: string; cor: string; descricao: string };
}) {
  return (
    <div className={`rounded-lg border p-4 ${COR_FAIXA[faixa.cor] ?? COR_FAIXA.gray}`}>
      <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider opacity-80">
        {icone} {titulo}
      </div>
      <div className="text-2xl font-bold mt-1">
        {score}
        <span className="text-base font-normal opacity-70">/{SCORE_MAXIMO}</span>
      </div>
      <div className="text-sm font-medium mt-0.5">{faixa.label}</div>
      <div className="text-xs mt-1 opacity-80">{faixa.descricao}</div>
    </div>
  );
}

export function TermometroRunner({
  inicioSalvo,
  fimSalvo,
  liberado,
  isAdmin,
}: {
  inicioSalvo: TermometroSalvo | null;
  fimSalvo: TermometroSalvo | null;
  liberado: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  // Largada conjunta: enquanto travado (e não-facilitador), o participante vê a
  // tela de espera. O ADMIN sempre passa (preview). Polling leve recarrega o
  // server component a cada 5s pra abrir sozinho quando o facilitador liberar.
  const bloqueado = !liberado && !isAdmin;
  useEffect(() => {
    if (!bloqueado) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [bloqueado, router]);

  // Decide qual termômetro estamos preenchendo. Padrão: INICIO se vazio.
  // Se INICIO já feito, abre o FIM. Toggle pra reabrir o INICIO se quiser
  // (ex: refazer antes de submeter).
  const [momento, setMomento] = useState<Momento>(
    inicioSalvo && !fimSalvo ? "FIM" : "INICIO",
  );
  const atualSalvo = momento === "INICIO" ? inicioSalvo : fimSalvo;

  // Pré-preenche com o salvo (se houver) pra permitir revisão
  const [respostas, setRespostas] = useState<Record<string, NivelTermometro>>(
    () => respostasDoSalvo(atualSalvo),
  );
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<
    { score: number; scorePessoal: number; momento: Momento } | null
  >(
    atualSalvo
      ? { score: atualSalvo.score, scorePessoal: atualSalvo.scorePessoal ?? 0, momento }
      : null,
  );

  function escolher(dimId: string, nivel: NivelTermometro) {
    setRespostas((prev) => ({ ...prev, [dimId]: nivel }));
  }

  function trocarMomento(novo: Momento) {
    setMomento(novo);
    const s = novo === "INICIO" ? inicioSalvo : fimSalvo;
    setRespostas(respostasDoSalvo(s));
    setResultado(
      s ? { score: s.score, scorePessoal: s.scorePessoal ?? 0, momento: novo } : null,
    );
  }

  function limpar() {
    setRespostas({});
    setResultado(null);
  }

  async function submeter() {
    const faltando = DIMENSOES_TERMOMETRO.filter((d) => !respostas[d.id]);
    if (faltando.length > 0) {
      toast.error(`Responda todas as ${DIMENSOES_TERMOMETRO.length} perguntas antes de finalizar.`);
      return;
    }
    setSalvando(true);
    try {
      const r = await salvarTermometro(momento, respostas);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(`✅ Salvo! Você: ${r.scorePessoal}/100 · Sua instituição: ${r.score}/100`);
      setResultado({ score: r.score, scorePessoal: r.scorePessoal, momento });
    } finally {
      setSalvando(false);
    }
  }

  // Tela de espera da largada conjunta — só pro participante, enquanto travado.
  if (bloqueado) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/fase-preliminar"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar à Fase Preliminar
        </Link>
        <div className="mt-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-8 text-center">
          <Thermometer className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h1 className="text-xl font-bold text-amber-900">🏁 Aguarde a largada</h1>
          {inicioSalvo ? (
            <p className="mt-2 text-sm text-amber-800">
              Você já preencheu o termômetro inicial ✓. Aguarde o facilitador liberar a
              próxima etapa — esta tela abre sozinha.
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-800">
              O facilitador vai liberar o Termômetro para todos começarem juntos. Pode deixar
              esta tela aberta — ela abre sozinha quando ele der a largada.
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> aguardando liberação…
          </div>
        </div>
      </div>
    );
  }

  const respondidas = DIMENSOES_TERMOMETRO.filter((d) => respostas[d.id]).length;
  const total = DIMENSOES_TERMOMETRO.length;
  const completou = respondidas === total;
  const previa = completou ? calcularScoresTermometro(respostas) : null;

  // Evolução: só faz sentido quando os 2 momentos estão preenchidos.
  const evolucao =
    inicioSalvo && fimSalvo
      ? {
          pessoal: {
            inicio: inicioSalvo.scorePessoal ?? 0,
            fim: fimSalvo.scorePessoal ?? 0,
            delta: (fimSalvo.scorePessoal ?? 0) - (inicioSalvo.scorePessoal ?? 0),
          },
          instituicao: {
            inicio: inicioSalvo.score,
            fim: fimSalvo.score,
            delta: fimSalvo.score - inicioSalvo.score,
          },
        }
      : null;

  // Renderiza uma pergunta (card com as 4 opções). `numero` é a posição
  // global (1-10) pra dar sensação de progresso contínuo.
  function CardPergunta({ dim, numero }: { dim: DimensaoTermometro; numero: number }) {
    const escolhida = respostas[dim.id];
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="shrink-0 h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
            {numero}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              {dim.emoji} {dim.titulo}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{dim.hint}</p>
          </div>
        </div>
        <div className="space-y-1.5 sm:ml-10">
          {dim.opcoes.map((op) => {
            const ativa = escolhida === op.id;
            return (
              <label
                key={op.id}
                className={`flex items-start gap-2 p-2.5 rounded-md cursor-pointer transition-colors border ${
                  ativa
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <input
                  type="radio"
                  name={`dim-${dim.id}`}
                  checked={ativa}
                  onChange={() => escolher(dim.id, op.id)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-bold ${ativa ? "text-emerald-800" : "text-gray-700"}`}>
                    {op.rotulo}
                  </span>
                  <p className="text-xs text-gray-700 mt-0.5">{op.descricao}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/fase-preliminar"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase Preliminar
      </Link>

      <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
        Fase Preliminar · Prática PA
      </div>
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Thermometer className="h-6 w-6 text-emerald-600" />
        Termômetro
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Um retrato de onde <strong>você</strong> e a <strong>sua instituição real</strong> (onde
        você trabalha) estão hoje na proteção de dados. Não é prova: não há resposta certa,
        ninguém vê quem respondeu o quê, e começar do zero é o mais comum. No fim do curso
        você refaz e vê o quanto avançou.
      </p>

      {/* Toggle Início / Fim */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => trocarMomento("INICIO")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            momento === "INICIO"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Início do curso {inicioSalvo ? "✓" : ""}
        </button>
        <button
          type="button"
          onClick={() => trocarMomento("FIM")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            momento === "FIM"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
          title={!inicioSalvo ? "Faça o termômetro inicial primeiro" : undefined}
          disabled={!inicioSalvo}
        >
          Final do curso {fimSalvo ? "✓" : ""}
        </button>
      </div>

      {/* Card de evolução — só aparece quando ambos preenchidos */}
      {evolucao && (
        <div className="mt-4 rounded-lg border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-700" />
            <span className="text-xs uppercase font-bold tracking-wider text-amber-800">
              Sua evolução durante o curso
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-amber-900">
            <div>
              <div className="text-[11px] uppercase font-semibold text-amber-700">👤 Você</div>
              <div>
                <span className="text-lg font-bold">{evolucao.pessoal.inicio}</span>
                <span className="mx-2 text-amber-600">→</span>
                <span className="text-2xl font-bold">{evolucao.pessoal.fim}</span>
                <span className="ml-2 text-sm font-medium">
                  ({evolucao.pessoal.delta >= 0 ? "+" : ""}{evolucao.pessoal.delta} pontos)
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase font-semibold text-amber-700">🏛️ Sua instituição</div>
              <div>
                <span className="text-lg font-bold">{evolucao.instituicao.inicio}</span>
                <span className="mx-2 text-amber-600">→</span>
                <span className="text-2xl font-bold">{evolucao.instituicao.fim}</span>
                <span className="ml-2 text-sm font-medium">
                  ({evolucao.instituicao.delta >= 0 ? "+" : ""}{evolucao.instituicao.delta} pontos)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado — quando o momento atual já foi salvo: 2 medidores */}
      {resultado && (
        <div className="mt-4">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-2">
            Resultado salvo ({momento === "INICIO" ? "início" : "final"})
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MedidorResultado
              titulo="Você"
              icone={<User className="h-3.5 w-3.5" />}
              score={resultado.scorePessoal}
              faixa={faixaPessoal(resultado.scorePessoal)}
            />
            <MedidorResultado
              titulo="Sua instituição"
              icone={<Landmark className="h-3.5 w-3.5" />}
              score={resultado.score}
              faixa={faixaQualitativa(resultado.score)}
            />
          </div>
        </div>
      )}

      {/* ── Parte 1 — Sobre você ── */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            👤 Sobre você ({DIMENSOES_PESSOAIS.length} perguntas)
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-8">
          Quanto <strong>você</strong> conhece a LGPD hoje — pra comparar com o fim do curso.
        </p>
        <div className="space-y-4">
          {DIMENSOES_PESSOAIS.map((dim, idx) => (
            <CardPergunta key={dim.id} dim={dim} numero={idx + 1} />
          ))}
        </div>
      </div>

      {/* ── Parte 2 — Sobre sua instituição ── */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">2</span>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            🏛️ Sobre a sua instituição ({DIMENSOES_INSTITUICAO.length} perguntas)
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-3 ml-8">
          Pense no <strong>seu órgão real</strong>. Cada pergunta é uma etapa da jornada que
          vamos percorrer no curso — a etiqueta abaixo de cada uma mostra qual.
        </p>
        <div className="space-y-4">
          {DIMENSOES_INSTITUICAO.map((dim, idx) => (
            <CardPergunta key={dim.id} dim={dim} numero={DIMENSOES_PESSOAIS.length + idx + 1} />
          ))}
        </div>
      </div>

      {/* Footer com ações */}
      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap sticky bottom-0 bg-white/95 backdrop-blur border-t pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="text-xs text-gray-600">
          {respondidas}/{total} respondida(s)
          {previa && (
            <span className="ml-2 font-semibold text-emerald-700">
              · Você: {previa.pessoal}/100 · Instituição: {previa.instituicao}/100
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={limpar}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </button>
          <button
            type="button"
            onClick={submeter}
            disabled={salvando || !completou}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {salvando ? "Salvando..." : atualSalvo ? "Atualizar resultado" : "Finalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
