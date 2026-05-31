import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { RelatorioBtn } from "@/components/relatorio-btn";
import { IndicadoresClient, type IndicadorDTO } from "@/components/indicadores-client";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const indicadores = await prisma.indicador.findMany({ orderBy: { ordem: "asc" } });

  const acha = (cod: string) => indicadores.find((i) => i.codigo === cod)?.valorAtual ?? "—";
  const kpis = [
    { lbl: "Docs do PGP aprovados (A1)", val: acha("A1") },
    { lbl: "Processos inventariados (B2)", val: acha("B2") },
    { lbl: "Contratos c/ cláusula LGPD (C4)", val: acha("C4") },
    { lbl: "UGs capacitadas via Enfoc (D6)", val: acha("D6") },
  ];

  const dtos: IndicadorDTO[] = indicadores.map((i) => ({
    id: i.id, codigo: i.codigo, eixoCodigo: i.eixoCodigo, descricao: i.descricao,
    tipo: i.tipo, unidade: i.unidade, meta2026: i.meta2026, meta2027: i.meta2027,
    valorAtual: i.valorAtual, status: i.status,
  }));

  return (
    <>
      <PageHeader
        emoji="📈"
        title="Indicadores & Relatório"
        lead="Indicadores por eixo (A–E) + impacto. Edite o valor atual conforme o ano avança. Base do Relatório Anual (Portaria 22/2026, art. 4º §3º)."
        action={<RelatorioBtn />}
      />

      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 mb-2">
        {kpis.map((k) => (
          <div key={k.lbl} className="bg-white border rounded-xl p-4">
            <div className="text-xs text-gray-500 font-semibold">{k.lbl}</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">{k.val}</div>
          </div>
        ))}
      </div>

      <IndicadoresClient indicadores={dtos} />

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-5">
        💡 Na Etapa 3, parte destes indicadores passará a se preencher sozinha (puxando das ferramentas das Fases).
        Até lá, atualize o "valor atual" manualmente aqui.
      </div>
    </>
  );
}
