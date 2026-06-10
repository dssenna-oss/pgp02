"use client";

// Cartaz (telão) do RESULTADO do Quiz Diagnóstico — pra projetar o agregado da
// turma e comentar coletivamente. Polling 4s. Fontes grandes pra projeção.
// Reusa o agregado que já existe em /api/quiz/painel (quantos terminaram, média,
// % de acerto por categoria). Faz par com o CartazQuiz (que é só o QR de entrada):
// fluxo = manda "Quiz (QR)" pra todos responderem → manda "Resultado" pro debrief.

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type Turma = { id: string; nome: string; cidade: string; slug: string };

type PainelQuiz = {
  total: { respondentes: number; completos: number; scoreMedio: number; totalPerguntas: number };
  porCategoria: {
    categoria: string;
    rotulo: string;
    emoji: string;
    percAcertoMedio: number;
    respondentes: number;
  }[];
};

function corPerc(p: number): { barra: string; texto: string } {
  if (p >= 70) return { barra: "bg-emerald-500", texto: "text-emerald-700" };
  if (p >= 40) return { barra: "bg-amber-500", texto: "text-amber-700" };
  return { barra: "bg-rose-500", texto: "text-rose-700" };
}

export function CartazQuizResultado({ turma }: { turma: Turma }) {
  const [dados, setDados] = useState<PainelQuiz | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function load() {
      try {
        if (!cancelado) setCarregando(true);
        const res = await fetch(`/api/quiz/painel?turmaId=${turma.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelado) setDados(d);
      } catch {
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    load();
    const iv = setInterval(load, 4000);
    return () => {
      cancelado = true;
      clearInterval(iv);
    };
  }, [turma.id]);

  const t = dados?.total;
  const mediaPerc = t && t.totalPerguntas > 0 ? Math.round((t.scoreMedio / t.totalPerguntas) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <p className="text-lg font-medium text-indigo-600">Diagnóstico Inicial · Quiz LGPD</p>
          <h1 className="text-4xl font-bold text-gray-900">📊 Resultado da Turma</h1>
          <p className="mt-2 text-base text-gray-400">
            {turma.nome} · {turma.cidade}
            {carregando && <RefreshCw className="inline h-4 w-4 ml-2 animate-spin align-text-bottom" />}
          </p>
        </header>

        {!dados ? (
          <p className="text-center text-gray-500 text-xl">Carregando…</p>
        ) : !t || t.completos === 0 ? (
          <p className="mt-16 text-center text-2xl text-gray-500">
            📱 Ninguém terminou o quiz ainda. Assim que finalizarem, o resultado aparece aqui ao vivo.
          </p>
        ) : (
          <>
            {/* Números grandes */}
            <div className="mb-8 grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-indigo-100 bg-white p-6 text-center shadow-sm">
                <div className="text-6xl font-extrabold text-indigo-700 leading-none">{t.completos}</div>
                <div className="mt-2 text-lg text-gray-500">terminaram o quiz</div>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-white p-6 text-center shadow-sm">
                <div className={`text-6xl font-extrabold leading-none ${corPerc(mediaPerc).texto}`}>{mediaPerc}%</div>
                <div className="mt-2 text-lg text-gray-500">
                  média de acerto <span className="text-gray-400">({t.scoreMedio}/{t.totalPerguntas})</span>
                </div>
              </div>
            </div>

            {/* Por categoria */}
            <h2 className="mb-3 text-xl font-bold uppercase tracking-wide text-gray-500">
              Acerto por categoria
            </h2>
            <div className="space-y-4">
              {dados.porCategoria.map((c) => {
                const cor = corPerc(c.percAcertoMedio);
                return (
                  <div key={c.categoria}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-xl font-semibold text-gray-800">
                        {c.emoji} {c.rotulo}
                      </span>
                      <span className={`text-2xl font-extrabold ${cor.texto}`}>{c.percAcertoMedio}%</span>
                    </div>
                    <div className="h-5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-5 rounded-full transition-all duration-700 ${cor.barra}`}
                        style={{ width: `${Math.max(2, c.percAcertoMedio)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-base italic text-gray-400">
              Errar aqui é o objetivo — é por isso que estamos no curso. 🚀
            </p>
          </>
        )}
      </div>
    </div>
  );
}
