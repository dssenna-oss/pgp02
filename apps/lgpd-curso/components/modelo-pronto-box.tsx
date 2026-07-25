"use client";

// "Modelo pronto" — o documento-gabarito exibido no Saiba mais, com botão de
// copiar (pra colar no Word/Docs do celular) e os links do Pacote oficial.
// Recebe o markdown já montado (modeloPronto) — client só pela interação.

import { useState } from "react";
import { Check, Copy, FileDown } from "lucide-react";

// Texto puro pra área de transferência: sem marcadores **/_ e com títulos limpos.
function paraTextoPuro(md: string): string {
  return md
    .split("\n")
    .map((l) => l.replace(/^#{1,2} /, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/_(.+?)_/g, "$1"))
    .join("\n")
    .trim();
}

export function ModeloProntoBox({
  md,
  modeloNoPacote,
}: {
  md: string;
  modeloNoPacote?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const texto = paraTextoPuro(md);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // fallback (navegadores antigos / iframe sem permissão)
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-green-800">
        📄 Modelo pronto pra levar
      </h2>
      <p className="mt-1 text-sm text-gray-700">
        O documento completo com as cláusulas corretas — é o gabarito das
        atividades. Troque os campos <strong>[entre colchetes]</strong> pelos
        dados da sua instituição.
      </p>

      <details className="mt-3 rounded-xl border border-green-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-green-800">
          Ver o modelo completo
        </summary>
        <div className="space-y-1.5 border-t border-green-100 px-4 py-3 text-sm leading-relaxed">
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
              <p
                key={i}
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: negrito(linha) }}
              />
            );
          })}
        </div>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
            copiado
              ? "bg-green-600 text-white"
              : "border border-green-300 bg-white text-green-800 hover:bg-green-100"
          }`}
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? "Copiado!" : "Copiar texto"}
        </button>
      </div>

      <p className="mt-3 border-t border-green-200 pt-3 text-sm text-gray-700">
        📦 {modeloNoPacote ? (
          <>
            No <strong>Pacote de Modelos</strong> oficial, este é o{" "}
            <strong>{modeloNoPacote}</strong> — junto de mais 20 modelos
            diagramados, prontos pra editar:
          </>
        ) : (
          <>
            Quer mais? O <strong>Pacote de Modelos</strong> oficial traz 21
            modelos diagramados, prontos pra editar:
          </>
        )}{" "}
        <a
          href="/pacote-modelos-pgp.docx"
          className="inline-flex items-center gap-1 font-semibold text-green-800 underline hover:text-green-900"
        >
          <FileDown className="h-3.5 w-3.5" /> Word
        </a>{" "}
        ·{" "}
        <a
          href="/pacote-modelos-pgp.pdf"
          target="_blank"
          rel="noopener"
          className="font-semibold text-green-800 underline hover:text-green-900"
        >
          PDF
        </a>
      </p>
    </section>
  );
}

function negrito(s: string): string {
  const escaped = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/_(.+?)_/g, "<em>$1</em>");
}
