"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

export function RelatorioBtn() {
  const [loading, setLoading] = useState(false);

  async function gerar() {
    setLoading(true);
    try {
      const res = await fetch("/api/comite/relatorio");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Relatorio_Anual_Comite_LGPD_TCEES.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório gerado");
    } catch {
      toast.error("Não foi possível gerar o relatório");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={gerar}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
    >
      <Download className="w-4 h-4" />
      {loading ? "Gerando…" : "Gerar Relatório Anual (DOCX)"}
    </button>
  );
}
