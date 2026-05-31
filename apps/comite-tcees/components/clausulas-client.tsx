"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { marked } from "marked";
import { FileDown, Eye } from "lucide-react";
import { RECOMMENDED_CLAUSE, recommendedClauseLabel, type RecommendedClause } from "@/lib/operadores-helpers";
import { renderClauseTemplate, getClauseTemplate, type ClauseRenderMode } from "@/lib/operadores-clausulas";

marked.setOptions({ gfm: true, breaks: false });

type CompanyData = {
  companyName: string;
  cnpj: string;
  address: string;
  dpoName: string;
  dpoEmail: string;
  dpoPhone: string;
};

const TIPOS: RecommendedClause[] = [
  RECOMMENDED_CLAUSE.ROBUSTA,
  RECOMMENDED_CLAUSE.SIMPLES,
  RECOMMENDED_CLAUSE.CC,
  RECOMMENDED_CLAUSE.CLIENTE_OPERADOR,
  RECOMMENDED_CLAUSE.MINUTA,
];

export function ClausulasClient({ company }: { company: CompanyData }) {
  const [tipo, setTipo] = useState<RecommendedClause>(RECOMMENDED_CLAUSE.ROBUSTA);
  const [mode, setMode] = useState<ClauseRenderMode>("NOVA");
  const [op, setOp] = useState({ name: "", cnpj: "", country: "", contractLabel: "", contractSignedAt: "" });
  const [baixando, setBaixando] = useState(false);

  const blurb = getClauseTemplate(tipo)?.blurb ?? "";

  const rendered = useMemo(() => {
    return renderClauseTemplate({
      operator: {
        name: op.name,
        cnpj: op.cnpj,
        country: op.country || null,
        contractLabel: op.contractLabel || null,
        contractSignedAt: op.contractSignedAt || null,
      },
      company,
      clauseType: tipo,
      mode,
    });
  }, [op, company, tipo, mode]);

  const previewHtml = useMemo(
    () => (rendered ? (marked.parse(rendered.content) as string) : ""),
    [rendered],
  );

  async function baixarDocx() {
    if (!rendered) return;
    if (!op.name.trim()) {
      if (!confirm("Você não preencheu a razão social do terceiro. Baixar mesmo assim (com [A PREENCHER])?")) return;
    }
    setBaixando(true);
    try {
      const res = await fetch("/api/clausulas/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: rendered.title, content: rendered.content }),
      });
      if (!res.ok) throw new Error("Falha ao gerar DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Clausula_LGPD_${(op.name || "operador").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX gerado");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível gerar");
    } finally {
      setBaixando(false);
    }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Formulário */}
      <div className="space-y-3.5">
        <div className="bg-white border rounded-xl p-4 space-y-3.5">
          <div>
            <label className={labelCls}>Modelo de cláusula</label>
            <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as RecommendedClause)}>
              {TIPOS.map((t) => <option key={t} value={t}>{recommendedClauseLabel(t)}</option>)}
            </select>
            <p className="text-[11.5px] text-gray-500 mt-1.5">{blurb}</p>
          </div>

          <div>
            <label className={labelCls}>Formato</label>
            <div className="flex gap-2">
              {(["NOVA", "ADITIVO"] as ClauseRenderMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`text-xs font-semibold border rounded-full px-3 py-1.5 ${mode === m ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                >
                  {m === "NOVA" ? "Cláusula nova (no contrato)" : "Termo aditivo (contrato vigente)"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 space-y-3.5">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">Dados do terceiro (operador)</div>
          <div>
            <label className={labelCls}>Razão social</label>
            <input className={inputCls} value={op.name} onChange={(e) => setOp({ ...op, name: e.target.value })} placeholder="Ex.: Empresa de Tecnologia LTDA" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CNPJ</label>
              <input className={inputCls} value={op.cnpj} onChange={(e) => setOp({ ...op, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className={labelCls}>País (se exterior)</label>
              <input className={inputCls} value={op.country} onChange={(e) => setOp({ ...op, country: e.target.value })} placeholder="Brasil" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Contrato (identificação)</label>
            <input className={inputCls} value={op.contractLabel} onChange={(e) => setOp({ ...op, contractLabel: e.target.value })} placeholder="Ex.: Contrato 2026/045 — videomonitoramento" />
          </div>
          <div>
            <label className={labelCls}>Data de assinatura do contrato</label>
            <input type="date" className={inputCls} value={op.contractSignedAt} onChange={(e) => setOp({ ...op, contractSignedAt: e.target.value })} />
          </div>
        </div>

        <button
          onClick={baixarDocx}
          disabled={baixando}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-60"
        >
          <FileDown className="w-4 h-4" /> {baixando ? "Gerando…" : "Baixar cláusula em Word (.docx)"}
        </button>
        <p className="text-[11px] text-gray-400 text-center">
          O TCE-ES entra como controlador; os dados acima identificam o terceiro. Campos vazios aparecem como [A PREENCHER].
        </p>
      </div>

      {/* Preview */}
      <div className="flex flex-col">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-1.5 flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> Pré-visualização
        </div>
        <div
          className="prose prose-sm max-w-none h-[72vh] overflow-auto px-4 py-3 border rounded-md bg-white"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
    </div>
  );
}
