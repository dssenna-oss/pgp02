import type { ReactNode } from "react";

// "Papel" estilizado pra projetar documentos-MODELO no telão (Fase 1: Ato de
// Designação e Portaria do Comitê). Trechos entre [colchetes] são o que cada
// órgão preenche; o aviso âmbar deixa claro que é exemplo e aponta o Pacote de
// Modelos (versão editável pra levar). Server component (só apresentação).
export function ModeloDocumento({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{titulo}</h1>
      <div className="mb-5 rounded-lg border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed">
        📄 <strong>Modelo demonstrativo.</strong> Os trechos entre <strong>[colchetes]</strong> você
        substitui pelos dados do seu órgão. A versão editável (.docx) está no{" "}
        <strong>Pacote de Modelos</strong> — leve pra casa e adapte com calma.
      </div>
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-8 sm:px-10 sm:py-12 leading-relaxed text-gray-900 text-[15px] space-y-3">
        {children}
      </article>
    </div>
  );
}
