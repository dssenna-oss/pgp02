"use client";

// Modalidade C — Onda 2: visualização AGREGADA de uma atividade.
// Usada tanto no painel do facilitador quanto no cartaz (telão). O prop
// `grande` aumenta as fontes pra projeção.

import type { AgregadoAtividade } from "@/lib/atividades-c";

function Barra({
  perc,
  rotulo,
  n,
  destaque,
  grande,
}: {
  perc: number;
  rotulo: string;
  n: number;
  destaque?: "certo" | "neutro";
  grande?: boolean;
}) {
  const cor =
    destaque === "certo" ? "bg-green-500" : "bg-indigo-500";
  return (
    <div className={grande ? "mb-2" : "mb-1.5"}>
      <div className={`flex justify-between ${grande ? "text-base" : "text-sm"} text-gray-700`}>
        <span className="truncate pr-2">
          {rotulo}
          {destaque === "certo" && " ✓"}
        </span>
        <span className="shrink-0 tabular-nums font-medium">
          {perc}% <span className="text-gray-400">({n})</span>
        </span>
      </div>
      <div className={`mt-0.5 w-full rounded-full bg-gray-100 ${grande ? "h-3" : "h-2"}`}>
        <div className={`${cor} rounded-full ${grande ? "h-3" : "h-2"}`} style={{ width: `${perc}%` }} />
      </div>
    </div>
  );
}

export function AgregadoView({
  agregado,
  grande = false,
}: {
  agregado: AgregadoAtividade;
  grande?: boolean;
}) {
  const h2 = grande ? "text-2xl" : "text-lg";
  const card = grande ? "p-5" : "p-4";

  if (agregado.respondentes === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        Aguardando as primeiras respostas…
      </div>
    );
  }

  // ---- ORDENAR ----
  if (agregado.tipo === "ordenar" && agregado.ordenar) {
    const o = agregado.ordenar;
    return (
      <div className="space-y-4">
        <div className={`rounded-xl border border-indigo-200 bg-indigo-50 ${card} text-center`}>
          <p className={`${grande ? "text-5xl" : "text-3xl"} font-bold text-indigo-700`}>
            {o.percExato}%
          </p>
          <p className={`${grande ? "text-lg" : "text-sm"} text-indigo-900`}>
            acertaram a ordem exata · {agregado.respondentes} respostas
          </p>
        </div>
        <div className={`rounded-xl border border-gray-200 bg-white ${card}`}>
          <p className={`${grande ? "text-base" : "text-sm"} font-semibold text-gray-700 mb-3`}>
            % que acertou cada posição
          </p>
          {o.porPosicao.map((p) => (
            <Barra
              key={p.posicao}
              perc={p.percCorreto}
              n={p.posicao}
              rotulo={`${p.posicao}. ${p.rotuloCorreto}`}
              grande={grande}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- OPCOES ----
  return (
    <div className="space-y-4">
      {/* destaque do modo */}
      {agregado.modo === "escala" && agregado.faixaMedia && (
        <div className={`rounded-xl border border-amber-200 bg-amber-50 ${card} text-center`}>
          <p className={`${grande ? "text-5xl" : "text-3xl"} font-bold text-amber-700`}>
            {agregado.scoreMedio}
            <span className={`${grande ? "text-2xl" : "text-lg"} text-amber-500`}>/{agregado.scoreMax}</span>
          </p>
          <p className={`${grande ? "text-lg" : "text-sm"} text-amber-900`}>
            score médio · <strong>{agregado.faixaMedia.label}</strong> · {agregado.respondentes} respostas
          </p>
        </div>
      )}
      {agregado.modo === "gabarito" && (
        <div className={`rounded-xl border border-green-200 bg-green-50 ${card} text-center`}>
          <p className={`${grande ? "text-5xl" : "text-3xl"} font-bold text-green-700`}>
            {agregado.acertoMedio}%
          </p>
          <p className={`${grande ? "text-lg" : "text-sm"} text-green-900`}>
            acerto médio · {agregado.respondentes} respostas
          </p>
        </div>
      )}
      {agregado.modo === "balanceamento" && agregado.balanceamento && (
        <div className={`rounded-xl border border-purple-200 bg-purple-50 ${card} text-center`}>
          <p className={`${grande ? "text-5xl" : "text-3xl"} font-bold text-purple-700`}>
            {agregado.balanceamento.percAprovado}%
          </p>
          <p className={`${grande ? "text-lg" : "text-sm"} text-purple-900`}>
            concluíram que <strong>pode usar</strong> · {agregado.balanceamento.aprovados} sim /{" "}
            {agregado.balanceamento.reprovados} não · {agregado.respondentes} respostas
          </p>
        </div>
      )}
      {agregado.modo === "voto" && (
        <p className={`${grande ? "text-lg" : "text-sm"} text-gray-600`}>
          Retrato da turma · {agregado.respondentes} respostas
        </p>
      )}

      {/* por item — visão COMPACTA pra apresentação "seletor" (muitas opções):
          uma barra de % de acerto por painel + o artigo correto, sem a
          distribuição completa das opções (que poluiria o telão). */}
      {agregado.apresentacao === "seletor" ? (
        <div className={`rounded-xl border border-gray-200 bg-white ${card}`}>
          <p className={`${grande ? "text-base" : "text-sm"} font-semibold text-gray-700 mb-3`}>
            % que acertou cada painel
          </p>
          {agregado.itens?.map((item, i) => {
            const correta = item.distribuicao.find((d) => d.correta);
            return (
              <Barra
                key={item.itemId}
                perc={item.percAcerto ?? 0}
                n={item.respondentes}
                rotulo={`${i + 1}. ${item.enunciado}${correta ? ` → ${correta.rotulo}` : ""}`}
                destaque="certo"
                grande={grande}
              />
            );
          })}
        </div>
      ) : (
        agregado.itens?.map((item, i) => (
          <div key={item.itemId} className={`rounded-xl border border-gray-200 bg-white ${card}`}>
            <p className={`${grande ? "text-lg" : "text-sm"} font-medium text-gray-900 mb-2`}>
              <span className="text-gray-400">{i + 1}.</span> {item.enunciado}
              {typeof item.percAcerto === "number" && (
                <span className="ml-2 text-green-600 font-semibold">{item.percAcerto}% ✓</span>
              )}
              {typeof item.mediaPontos === "number" && (
                <span className="ml-2 text-amber-600 font-semibold">média {item.mediaPontos}</span>
              )}
            </p>
            {item.distribuicao.map((d) => (
              <Barra
                key={d.opcaoId}
                perc={d.perc}
                n={d.n}
                rotulo={d.rotulo}
                destaque={d.correta ? "certo" : "neutro"}
                grande={grande}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export { type AgregadoAtividade };
