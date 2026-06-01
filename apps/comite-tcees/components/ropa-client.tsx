"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, FileText, Download, ChevronDown, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  completudeAtividade, resumoRopa, type RopaAtividade, type RopaCabecalho,
} from "@/lib/ropa";

export function RopaClient({ atividades, cabecalho }: { atividades: RopaAtividade[]; cabecalho: RopaCabecalho }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const r = resumoRopa(atividades);

  return (
    <div className="space-y-5">
      {/* Cabeçalho institucional (dados organizacionais do template ANPD) */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">Controlador dos dados</div>
            <div className="text-[14px] font-bold text-gray-900 mt-0.5">{cabecalho.controlador}</div>
            <div className="text-[12px] text-gray-500 mt-1">CNPJ {cabecalho.cnpj} · {cabecalho.sede}</div>
            <div className="text-[12px] text-gray-600 mt-1.5">
              <span className="text-gray-400">Encarregado (DPO):</span> <b>{cabecalho.encarregadoNome}</b> · {cabecalho.encarregadoContato}
            </div>
          </div>
          <a
            href="/api/ropa/docx"
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 shrink-0"
          >
            <Download className="w-4 h-4" /> Exportar ROPA (DOCX)
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <Kpi titulo="Atividades registradas" valor={String(r.total)} sub="processos de tratamento" />
        <Kpi titulo="Registros completos" valor={`${r.completas}/${r.total}`} sub={`${r.pctGeral}% dos obrigatórios`} cor="text-brand-700" barra={r.pctGeral} />
        <Kpi titulo="Alto risco" valor={String(r.altoRisco)} sub="exigem RIPD" cor={r.altoRisco ? "text-red-600" : "text-gray-900"} />
        <Kpi titulo="Com dados sensíveis" valor={String(r.comSensiveis)} sub="art. 11 da LGPD" />
      </div>

      {/* Lista de atividades */}
      <div className="space-y-2.5">
        {atividades.map((a) => {
          const c = completudeAtividade(a);
          const aberto = aberta === a.id;
          return (
            <div key={a.id} className="bg-white border rounded-xl overflow-hidden">
              <button onClick={() => setAberta(aberto ? null : a.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left">
                {c.completa
                  ? <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0" />
                  : <AlertCircle className="w-[18px] h-[18px] text-amber-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-gray-900">{a.nome}</div>
                  <div className="text-[11.5px] text-gray-500 mt-0.5">
                    {a.unidadeGestora ?? "—"} · {c.completa ? "registro completo" : `${c.obrigatoriosOk}/${c.obrigatoriosTotal} campos obrigatórios`}
                  </div>
                </div>
                {a.dadosSensiveis && <Badge variant="red" className="hidden sm:inline-flex"><ShieldAlert className="w-3 h-3" /> sensíveis</Badge>}
                {a.riscoMax === "ALTO" && <Badge variant="red">alto risco</Badge>}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`} />
              </button>

              {aberto && (
                <div className="border-t px-4 py-4 bg-slate-50/40">
                  {/* Campos do registro (template ANPD) */}
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
                    <Campo label="Finalidade" valor={a.finalidade} obrig />
                    <Campo label="Base legal" valor={a.baseLegal} obrig />
                    <Campo label="Categorias de titulares" valor={a.categoriasTitulares} obrig />
                    <Campo label="Dados tratados" valor={a.tiposDados} obrig />
                    <Campo label="Dados sensíveis" valor={a.dadosSensiveis ? "Sim (art. 11)" : "Não"} />
                    <Campo label="Fonte dos dados" valor={a.fonteDados} />
                    <Campo label="Compartilhamento externo" valor={a.compartilhamento} />
                    <Campo label="Destinatários internos" valor={a.destinatariosInternos} />
                    <Campo label="Transferência internacional" valor={a.transfInternacional || "Não há"} />
                    <Campo label="Prazo de retenção" valor={a.retencao} obrig />
                    <Campo label="Critério de descarte" valor={a.criterioDescarte} />
                    <Campo label="Medidas de segurança" valor={a.medidasSeguranca} obrig />
                  </dl>

                  {/* Checklist de completude */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {c.itens.map((i) => (
                      <span
                        key={i.campo}
                        className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          i.ok ? "bg-emerald-50 text-emerald-700" : i.obrigatorio ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {i.ok ? "✓" : "○"} {i.campo}
                      </span>
                    ))}
                  </div>

                  {/* Ações: editar no Inventário · gerar RIPD (alto risco) */}
                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <Link href="/dashboard/inventario" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 hover:text-brand-700">
                      <Pencil className="w-3.5 h-3.5" /> Completar no Inventário
                    </Link>
                    {a.riscoMax === "ALTO" && (
                      <Link href={`/dashboard/execucao/ripd?processo=${a.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-red-700 hover:text-red-800">
                        <FileText className="w-3.5 h-3.5" /> Elaborar RIPD (alto risco)
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {atividades.length === 0 && (
          <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">
            Cadastre processos no Inventário primeiro — o ROPA registra cada atividade de tratamento.
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px]">
        💡 O ROPA é o <b>registro formal das atividades de tratamento</b> (Art. 37). Ele consolida o que está no
        Inventário e nos Riscos — não duplica dados: para completar um registro, edite o processo no Inventário
        (seção “Detalhes para o ROPA”). Atividades de <b>alto risco</b> devem ter <b>RIPD</b>.
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, sub, cor = "text-gray-900", barra }: { titulo: string; valor: string; sub: string; cor?: string; barra?: number }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500 font-semibold">{titulo}</div>
      <div className={`text-2xl font-extrabold mt-1 ${cor}`}>{valor}</div>
      {typeof barra === "number" && (
        <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
          <span className="block h-full bg-brand-500 rounded-full" style={{ width: `${barra}%` }} />
        </div>
      )}
      <div className="text-[11px] text-gray-500 mt-1.5">{sub}</div>
    </div>
  );
}

function Campo({ label, valor, obrig }: { label: string; valor: string | null; obrig?: boolean }) {
  const vazio = !valor || !valor.trim();
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-wide text-gray-400 font-bold">
        {label} {obrig && <span className="text-amber-500">*</span>}
      </dt>
      <dd className={`mt-0.5 ${vazio ? "text-amber-600 italic" : "text-gray-800"}`}>{vazio ? "a preencher" : valor}</dd>
    </div>
  );
}
