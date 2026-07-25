"use client";

// 💬 Chat do Titular — conversa simulada com a Dona Marta (DSR na prática).
// Bolhas estilo mensageiro + termômetro da conversa. Sem servidor, sem banco.

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import { CHAT_TURNOS, CHAT_TEMP_INICIAL, type OpcaoChat } from "@/lib/jogos";

type Msg = { de: "ela" | "voce" | "nota"; texto: string };

export function JogoChatTitular() {
  const [turnoIdx, setTurnoIdx] = useState(0);
  const [temp, setTemp] = useState(CHAT_TEMP_INICIAL);
  const [boas, setBoas] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(() => CHAT_TURNOS[0].dela.map((t) => ({ de: "ela", texto: t })));
  const [aguardando, setAguardando] = useState(true); // aguardando escolha do jogador
  const [fim, setFim] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, fim]);

  const turno = CHAT_TURNOS[turnoIdx];
  const tempClamped = Math.max(0, Math.min(10, temp));
  const tempEmoji = tempClamped >= 7 ? "🥵" : tempClamped >= 4 ? "😐" : "😊";
  const tempRotulo = tempClamped >= 7 ? "fervendo" : tempClamped >= 4 ? "morna" : "tranquila";

  function responder(op: OpcaoChat) {
    if (!aguardando) return;
    setAguardando(false);
    setTemp((t) => Math.max(0, Math.min(10, t + op.delta)));
    if (op.boa) setBoas((b) => b + 1);
    setMsgs((m) => [
      ...m,
      { de: "voce", texto: op.texto },
      { de: "ela", texto: op.reacaoDela },
      { de: "nota", texto: op.nota },
    ]);
    // próximo turno (ou fim)
    setTimeout(() => {
      const prox = turnoIdx + 1;
      if (prox < CHAT_TURNOS.length) {
        setTurnoIdx(prox);
        setMsgs((m) => [...m, ...CHAT_TURNOS[prox].dela.map((t) => ({ de: "ela" as const, texto: t }))]);
        setAguardando(true);
      } else {
        setFim(true);
      }
    }, 400);
  }

  function reiniciar() {
    setTurnoIdx(0);
    setTemp(CHAT_TEMP_INICIAL);
    setBoas(0);
    setMsgs(CHAT_TURNOS[0].dela.map((t) => ({ de: "ela", texto: t })));
    setAguardando(true);
    setFim(false);
  }

  const estrelas = fim ? Math.max(1, Math.min(5, Math.round(boas * (5 / CHAT_TURNOS.length)) + (tempClamped <= 3 ? 1 : 0) - (tempClamped >= 7 ? 1 : 0))) : 0;

  return (
    <div>
      {/* Termômetro */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600">
          <span>🌡️ Temperatura da conversa</span>
          <span>
            {tempEmoji} {tempRotulo}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${tempClamped >= 7 ? "bg-rose-500" : tempClamped >= 4 ? "bg-amber-400" : "bg-green-500"}`}
            style={{ width: `${tempClamped * 10}%` }}
          />
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-lg">👵</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Dona Marta</p>
            <p className="text-[11px] text-gray-400">titular de dados · online</p>
          </div>
        </div>

        <div className="max-h-[46vh] space-y-2 overflow-y-auto py-1">
          {msgs.map((m, i) =>
            m.de === "nota" ? (
              <p key={i} className="mx-auto max-w-[95%] rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-center text-[11px] text-indigo-800">
                💡 {m.texto}
              </p>
            ) : (
              <div key={i} className={`flex ${m.de === "voce" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-snug ${
                    m.de === "voce"
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.texto}
                </p>
              </div>
            ),
          )}
          <div ref={fimRef} />
        </div>
      </div>

      {/* Escolhas ou final */}
      {fim ? (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
          <p className="text-sm font-semibold text-gray-700">Avaliação da Dona Marta:</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`h-7 w-7 ${n <= estrelas ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
            ))}
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {boas} de {CHAT_TURNOS.length} respostas no tom certo · conversa terminou {tempRotulo} {tempEmoji}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {estrelas >= 5
              ? "Atendimento exemplar: acolheu, verificou identidade, foi transparente sobre limites e fechou com protocolo. A Dona Marta virou fã."
              : estrelas >= 3
                ? "Bom atendimento com tropeços — releia as notas 💡 pra ver onde a conversa esquentou."
                : "A Dona Marta saiu direto pra ouvidoria… Releia as notas 💡: acolher, verificar, ser transparente e fechar com protocolo."}
          </p>
          <button
            type="button"
            onClick={reiniciar}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Atender de novo
          </button>
        </div>
      ) : (
        aguardando && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sua resposta:</p>
            {turno.opcoes.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => responder(op)}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-800 transition hover:border-indigo-300 active:bg-indigo-50"
              >
                {op.texto}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
