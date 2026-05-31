import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { statusIndicador, eixoTag } from "@/lib/comite-ui";
import { RelatorioBtn } from "@/components/relatorio-btn";

export const dynamic = "force-dynamic";

const EIXO_NOME: Record<string, string> = {
  A: "Eixo A — Governança e Homologação",
  B: "Eixo B — Inventário, Riscos e RIPDs",
  C: "Eixo C — Documentos Institucionais Externos",
  D: "Eixo D — Cultura Organizacional e Capacitação",
  E: "Eixo E — Monitoramento, Incidentes e Auditoria",
  IMPACTO: "Indicadores de impacto institucional (top-level)",
};

export default async function IndicadoresPage() {
  const indicadores = await prisma.indicador.findMany({ orderBy: { ordem: "asc" } });

  // KPIs de destaque
  const docsAprovados = indicadores.find((i) => i.codigo === "A1");
  const procInv = indicadores.find((i) => i.codigo === "B2");
  const clausulas = indicadores.find((i) => i.codigo === "C4");
  const ugs = indicadores.find((i) => i.codigo === "D6");

  const grupos = ["A", "B", "C", "D", "E", "IMPACTO"];

  return (
    <>
      <PageHeader
        emoji="📈"
        title="Indicadores & Relatório"
        lead="Indicadores por eixo (A–E) + impacto institucional. Base do Relatório Anual de Resultados exigido pela Portaria 22/2026 (art. 4º §3º)."
        action={<RelatorioBtn />}
      />

      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-2">
        {[
          { lbl: "Docs do PGP aprovados (A1)", val: docsAprovados?.valorAtual ?? "—" },
          { lbl: "Processos inventariados (B2)", val: procInv?.valorAtual ?? "—" },
          { lbl: "Contratos c/ cláusula LGPD (C4)", val: clausulas?.valorAtual ?? "—" },
          { lbl: "UGs capacitadas via Enfoc (D6)", val: ugs?.valorAtual ?? "—" },
        ].map((k) => (
          <div key={k.lbl} className="bg-white border rounded-xl p-4">
            <div className="text-xs text-gray-500 font-semibold">{k.lbl}</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{k.val}</div>
          </div>
        ))}
      </div>

      {grupos.map((g) => {
        const doGrupo = indicadores.filter((i) => i.eixoCodigo === g);
        if (doGrupo.length === 0) return null;
        return (
          <div key={g} className="mt-6">
            <h2 className="text-sm font-extrabold text-gray-900 mb-3">{EIXO_NOME[g]}</h2>
            <div className="overflow-x-auto bg-white border rounded-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    {["Cód.", "Indicador", "Tipo", "Meta 2026", "Meta 2027", "Atual", "Status"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wide text-gray-500 font-bold border-b whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doGrupo.map((i) => {
                    const st = statusIndicador(i.status);
                    return (
                      <tr key={i.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2.5">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(g)}`}>{i.codigo}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[12.5px] text-gray-800 min-w-[220px]">{i.descricao}</td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-500">{i.tipo}</td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">{i.meta2026 ?? "—"}</td>
                        <td className="px-3 py-2.5 text-[12px] text-gray-600 whitespace-nowrap">{i.meta2027 ?? "—"}</td>
                        <td className="px-3 py-2.5 text-[12.5px] font-semibold text-gray-900 whitespace-nowrap">{i.valorAtual ?? "—"}</td>
                        <td className="px-3 py-2.5"><Badge variant={st.variant}>{st.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-5">
        💡 O botão acima gera o <b>Relatório Anual de Resultados</b> (Portaria 22/2026, art. 4º §3º) já preenchido
        com estes indicadores, o andamento das entregas e os marcos do biênio.
      </div>
    </>
  );
}
