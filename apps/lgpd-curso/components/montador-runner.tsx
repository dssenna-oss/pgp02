"use client";

// Montador Guiado — runner (celular do participante).
// Uma decisão por tela → o documento vai se montando → placar final.
// Sem envio ao servidor: produção pessoal (a versão editável fica no Pacote).
//
// Usado em 2 contextos:
//   /dashboard/montador/[docId] — logado (Modo Cards)
//   /montador/[docId]           — PÚBLICO/standalone (embed em apresentação)
// `hubHref` aponta o "Outros documentos" pro hub do contexto certo.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { MontadorDoc, OpcaoDecisao } from "@/lib/montador-docs";
import { montarDocumento, pontuar } from "@/lib/montador-docs";

// embaralha as opções (correta/pegadinha) de forma estável por decisão
function ordemOpcoes(op: OpcaoDecisao[], seed: number): OpcaoDecisao[] {
  return seed % 2 === 0 ? op : [...op].reverse();
}

export function MontadorRunner({
  doc,
  hubHref = "/dashboard/montador",
}: {
  doc: MontadorDoc;
  hubHref?: string;
}) {
  const [passo, setPasso] = useState(0); // índice da decisão atual
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [revelado, setRevelado] = useState<Record<string, boolean>>({});
  const [finalizado, setFinalizado] = useState(false);

  const total = doc.decisoes.length;
  const decisao = doc.decisoes[passo];
  const escolhaAtual = decisao ? escolhas[decisao.id] : undefined;
  const jaRevelou = decisao ? !!revelado[decisao.id] : false;

  const opcoesEmbaralhadas = useMemo(
    () => (decisao ? ordemOpcoes(decisao.opcoes, passo) : []),
    [decisao, passo],
  );

  function escolher(opId: string) {
    if (!decisao || jaRevelou) return;
    setEscolhas((p) => ({ ...p, [decisao.id]: opId }));
    setRevelado((p) => ({ ...p, [decisao.id]: true }));
  }

  function avancar() {
    if (passo < total - 1) setPasso(passo + 1);
    else setFinalizado(true);
  }

  function reiniciar() {
    setPasso(0);
    setEscolhas({});
    setRevelado({});
    setFinalizado(false);
  }

  // ---------------------------------------------------------------- PLACAR
  if (finalizado) {
    const { acertos } = pontuar(doc, escolhas);
    const perfeito = acertos === total;
    const md = montarDocumento(doc, escolhas);
    return (
      <div>
        <div
          className={`rounded-2xl border p-5 text-center ${
            perfeito
              ? "border-amber-300 bg-amber-50"
              : "border-indigo-200 bg-indigo-50"
          }`}
        >
          <Trophy
            className={`mx-auto h-10 w-10 ${perfeito ? "text-amber-500" : "text-indigo-500"}`}
          />
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {acertos} de {total} corretas
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {perfeito
              ? "Documento impecável! Você fugiu de todas as pegadinhas. 🎯"
              : "Bom trabalho! Veja abaixo onde estavam as pegadinhas."}
          </p>
        </div>

        {/* Revisão decisão a decisão */}
        <h2 className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Suas decisões
        </h2>
        <ol className="space-y-3">
          {doc.decisoes.map((d) => {
            const op = d.opcoes.find((o) => o.id === escolhas[d.id]);
            const acertou = !!op?.correta;
            return (
              <li
                key={d.id}
                className={`rounded-xl border p-4 ${
                  acertou ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  {acertou ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{d.pergunta}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      Você escolheu: <em>{op?.rotulo}</em>
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{op?.porque}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">📖 {op?.artigo}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Documento montado */}
        <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <FileText className="h-4 w-4" /> O documento que você montou
        </h2>
        <DocumentoPreview md={md} />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" /> Refazer
          </button>
          <Link
            href={hubHref}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            Outros documentos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          💡 A versão editável, pronta pra sua instituição, está no{" "}
          <strong>Pacote de Modelos</strong> — é só levar pra casa.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- WIZARD
  const md = montarDocumento(doc, escolhas);
  return (
    <div>
      {/* Progresso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500">
          <span>
            Decisão {passo + 1} de {total}
          </span>
          <span>{doc.titulo}</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${((passo + (jaRevelou ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Pergunta */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Seção {decisao.secaoNumero} ·{" "}
          {doc.esqueleto.find((s) => s.numero === decisao.secaoNumero)?.titulo}
        </p>
        {decisao.contexto && (
          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {decisao.contexto}
          </p>
        )}
        <h1 className="mt-3 text-lg font-bold text-gray-900">{decisao.pergunta}</h1>

        <div className="mt-4 space-y-3">
          {opcoesEmbaralhadas.map((op) => {
            const selecionada = escolhaAtual === op.id;
            let cls =
              "w-full rounded-xl border p-4 text-left text-sm transition min-h-[52px]";
            if (!jaRevelou) {
              cls +=
                " border-gray-200 bg-white text-gray-800 hover:border-indigo-300 active:bg-indigo-50";
            } else if (op.correta) {
              cls += " border-green-400 bg-green-50 text-green-900";
            } else if (selecionada) {
              cls += " border-rose-400 bg-rose-50 text-rose-900";
            } else {
              cls += " border-gray-200 bg-white text-gray-400";
            }
            return (
              <button
                key={op.id}
                type="button"
                disabled={jaRevelou}
                onClick={() => escolher(op.id)}
                className={cls}
              >
                <span className="flex items-start gap-2">
                  {jaRevelou && op.correta && (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  )}
                  {jaRevelou && selecionada && !op.correta && (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  )}
                  <span className="font-medium">{op.rotulo}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback da decisão */}
        {jaRevelou && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
            {(() => {
              const op = decisao.opcoes.find((o) => o.id === escolhaAtual);
              const acertou = !!op?.correta;
              return (
                <>
                  <p className={`font-semibold ${acertou ? "text-green-700" : "text-rose-700"}`}>
                    {acertou ? "✅ Certa!" : "⚠️ Essa é a pegadinha."}
                  </p>
                  <p className="mt-1 text-gray-700">{op?.porque}</p>
                  <p className="mt-1 text-xs font-medium text-gray-500">📖 {op?.artigo}</p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Documento se montando */}
      <details className="mt-4 rounded-xl border border-gray-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
          📄 Ver o documento até aqui
        </summary>
        <div className="border-t border-gray-100 px-4 py-3">
          <DocumentoPreview md={md} />
        </div>
      </details>

      {/* Ação */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={passo === 0}
          onClick={() => setPasso(passo - 1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          type="button"
          disabled={!jaRevelou}
          onClick={avancar}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {passo < total - 1 ? "Próxima" : "Ver resultado"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Render bem simples do markdown do documento (títulos ## e **negrito**).
function DocumentoPreview({ md }: { md: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {md.split("\n").map((linha, i) => {
        if (linha.startsWith("# ")) {
          return (
            <p key={i} className="text-base font-bold text-gray-900">
              {linha.slice(2)}
            </p>
          );
        }
        if (linha.startsWith("## ")) {
          return (
            <p key={i} className="mt-2 font-semibold text-gray-800">
              {linha.slice(3)}
            </p>
          );
        }
        if (!linha.trim()) return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-gray-700" dangerouslySetInnerHTML={{ __html: negrito(linha) }} />
        );
      })}
    </div>
  );
}

function negrito(s: string): string {
  const escaped = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/_(.+?)_/g, "<em>$1</em>");
}
