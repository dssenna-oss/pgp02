"use client";

// Modalidade C — Onda 2: runner das atividades leves.
// Dois formatos uniformes:
//   opcoes  → toca uma opção por item (escala / gabarito / voto / balanceamento)
//   ordenar → coloca a lista na ordem certa (setas ↑ ↓, mobile-friendly)
// Envia pra /api/curso/atividade-c/submit e mostra o feedback individual.

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUp, ArrowDown, Send, CheckCircle2, RotateCcw } from "lucide-react";
import type { AtividadeC, FeedbackIndividual } from "@/lib/atividades-c";

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AtividadeRunner({
  atividade,
  respostaSalva,
  somenteLeitura = false,
}: {
  atividade: AtividadeC;
  respostaSalva: any;
  somenteLeitura?: boolean;
}) {
  const jaEnviou = !!respostaSalva;

  // ---- estado opcoes ----
  const [escolhas, setEscolhas] = useState<Record<string, string>>(
    () => (respostaSalva?.escolhas as Record<string, string>) || {},
  );

  // ---- estado ordenar ----
  const ordemInicial = useMemo<string[]>(() => {
    if (atividade.tipo !== "ordenar") return [];
    const salva = respostaSalva?.ordem as string[] | undefined;
    if (salva && salva.length === atividade.itens.length) return salva;
    return embaralhar(atividade.itens.map((i) => i.id));
  }, [atividade, respostaSalva]);
  const [ordem, setOrdem] = useState<string[]>(ordemInicial);

  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackIndividual | null>(null);

  function mover(idx: number, dir: -1 | 1) {
    if (somenteLeitura) return;
    const novo = [...ordem];
    const alvo = idx + dir;
    if (alvo < 0 || alvo >= novo.length) return;
    [novo[idx], novo[alvo]] = [novo[alvo], novo[idx]];
    setOrdem(novo);
  }

  const completo =
    atividade.tipo === "ordenar"
      ? ordem.length === atividade.itens.length
      : atividade.itens.every((it) => !!escolhas[it.id]);

  async function enviar() {
    if (somenteLeitura) {
      toast("Modo facilitador — visualização apenas.");
      return;
    }
    if (!completo) {
      toast.error("Responda todos os itens antes de enviar.");
      return;
    }
    setEnviando(true);
    try {
      const resposta = atividade.tipo === "ordenar" ? { ordem } : { escolhas };
      const res = await fetch("/api/curso/atividade-c/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atividadeId: atividade.id, resposta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar");
      setFeedback(data.feedback as FeedbackIndividual);
      toast.success("Resposta enviada! Veja o resultado da turma no telão.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar");
    } finally {
      setEnviando(false);
    }
  }

  const itensOrdenados =
    atividade.tipo === "ordenar"
      ? ordem.map((id) => atividade.itens.find((i) => i.id === id)!).filter(Boolean)
      : [];

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${atividade.faseCor}`}>
            {atividade.fase}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {atividade.emoji} {atividade.titulo}
        </h1>
        {atividade.contexto && (
          <p className="mt-1 text-sm font-medium text-gray-600">{atividade.contexto}</p>
        )}
        <p className="mt-2 text-gray-700 leading-relaxed">{atividade.instrucao}</p>
        {jaEnviou && !feedback && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4" /> Você já enviou — pode reenviar pra atualizar.
          </div>
        )}
      </header>

      {/* ---- FORMATO OPCOES ---- */}
      {atividade.tipo === "opcoes" && (
        <ol className="space-y-4">
          {atividade.itens.map((item, i) => {
            const ehSeletor = atividade.apresentacao === "seletor";
            return (
              <li
                key={item.id}
                className={`rounded-xl border border-gray-200 bg-white p-4 ${
                  ehSeletor ? "flex items-center gap-3" : ""
                }`}
              >
                <div className={ehSeletor ? "flex-1 min-w-0" : ""}>
                  <p className="font-medium text-gray-900">
                    <span className="text-gray-400">{i + 1}.</span> {item.enunciado}
                  </p>
                  {item.hint && <p className="mt-1 text-sm text-gray-500">💡 {item.hint}</p>}
                </div>

                {ehSeletor ? (
                  // Seletor compacto: 1 número por painel (Trilha do Conhecimento)
                  <select
                    value={escolhas[item.id] ?? ""}
                    disabled={somenteLeitura}
                    onChange={(e) =>
                      setEscolhas((p) => ({ ...p, [item.id]: e.target.value }))
                    }
                    className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
                      escolhas[item.id]
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-gray-300 bg-white text-gray-500"
                    } ${somenteLeitura ? "opacity-60 cursor-not-allowed" : ""}`}
                    aria-label={`Artigo do painel: ${item.enunciado}`}
                  >
                    <option value="" disabled>
                      Artigo…
                    </option>
                    {item.opcoes.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.rotulo}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.opcoes.map((op) => {
                      const sel = escolhas[item.id] === op.id;
                      return (
                        <button
                          key={op.id}
                          type="button"
                          disabled={somenteLeitura}
                          onClick={() => setEscolhas((p) => ({ ...p, [item.id]: op.id }))}
                          className={`px-3 py-2 rounded-lg border text-sm transition ${
                            sel
                              ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                              : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                          } ${somenteLeitura ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          {op.rotulo}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* ---- FORMATO ORDENAR ---- */}
      {atividade.tipo === "ordenar" && (
        <ol className="space-y-2">
          {itensOrdenados.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.rotulo}</p>
                {item.detalhe && <p className="text-sm text-gray-500">{item.detalhe}</p>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  disabled={somenteLeitura || idx === 0}
                  onClick={() => mover(idx, -1)}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={somenteLeitura || idx === itensOrdenados.length - 1}
                  onClick={() => mover(idx, 1)}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mover para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* ---- FEEDBACK ---- */}
      {feedback && <FeedbackBox atividade={atividade} feedback={feedback} />}

      {/* ---- AÇÃO ---- */}
      {!somenteLeitura && (
        <button
          type="button"
          onClick={enviar}
          disabled={enviando || !completo}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {feedback ? <RotateCcw className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          {enviando ? "Enviando…" : feedback ? "Reenviar" : "Enviar resposta"}
        </button>
      )}
    </div>
  );
}

function FeedbackBox({
  atividade,
  feedback,
}: {
  atividade: AtividadeC;
  feedback: FeedbackIndividual;
}) {
  return (
    <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <p className="font-semibold text-indigo-900">Sua resposta foi registrada</p>
      <div className="mt-2 text-sm text-indigo-900 space-y-1">
        {feedback.faixa && (
          <p>
            Score: <strong>{feedback.score}</strong>/{feedback.scoreMax} —{" "}
            <strong>{feedback.faixa.label}</strong>
          </p>
        )}
        {typeof feedback.acertos === "number" && (
          <p>
            Você acertou <strong>{feedback.acertos}</strong> de {feedback.totalGabarito}.
          </p>
        )}
        {feedback.veredito && (
          <p>
            Conclusão: <strong>{feedback.veredito.rotulo}</strong>
            {feedback.veredito.aprovado ? " ✅" : " 🔴"}
          </p>
        )}
        {typeof feedback.posicoesCorretas === "number" && (
          <p>
            {feedback.ordemExata ? (
              <strong>Ordem exata! 🎯</strong>
            ) : (
              <>
                Você acertou <strong>{feedback.posicoesCorretas}</strong> de{" "}
                {feedback.totalPosicoes} posições.
              </>
            )}
          </p>
        )}
        {atividade.tipo === "opcoes" && atividade.modo === "voto" && (
          <p>Obrigado por votar — o retrato da turma aparece no telão.</p>
        )}
      </div>
    </div>
  );
}
