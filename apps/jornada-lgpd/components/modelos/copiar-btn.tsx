"use client";

// Botão "Copiar" dos modelos (client) — recebe o texto JÁ em versão pura.

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopiarBtn({ texto, rotulo = "Copiar texto" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
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
    <button
      type="button"
      onClick={copiar}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        copiado
          ? "bg-teal-600 text-white"
          : "border border-teal-300 bg-white text-teal-800 hover:bg-teal-50"
      }`}
    >
      {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}
