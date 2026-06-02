import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { RelatorioBtn } from "@/components/relatorio-btn";
import { IndicadoresClient, type IndicadorDTO } from "@/components/indicadores-client";
import { calcularIndicadoresAuto } from "@/lib/indicadores-auto";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const [indicadores, auto] = await Promise.all([
    prisma.indicador.findMany({ orderBy: { ordem: "asc" } }),
    calcularIndicadoresAuto(),
  ]);

  // Valor exibido: o automático (quando existir) tem precedência sobre o manual.
  const valor = (cod: string) =>
    auto[cod]?.valor ?? indicadores.find((i) => i.codigo === cod)?.valorAtual ?? "—";
  const kpis = [
    { lbl: "Docs do PGP aprovados (A1)", val: valor("A1") },
    { lbl: "Reuniões realizadas (A8)", val: valor("A8") },
    { lbl: "Aderência GAP (B7)", val: valor("B7") },
    { lbl: "Incidentes tratados (E5)", val: valor("E5") },
  ];

  const dtos: IndicadorDTO[] = indicadores.map((i) => ({
    id: i.id, codigo: i.codigo, eixoCodigo: i.eixoCodigo, descricao: i.descricao,
    tipo: i.tipo, unidade: i.unidade, meta2026: i.meta2026, meta2027: i.meta2027,
    valorAtual: i.valorAtual, status: i.status,
    auto: auto[i.codigo] ?? null,
  }));

  return (
    <>
      <PageHeader
        emoji="📈"
        title="Indicadores & Relatório"
        lead="Indicadores por eixo (A–E) + impacto. Base do Relatório Anual (Portaria 22/2026, art. 4º §3º)."
        editHint="Edite o valor atual conforme o ano avança."
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

      <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-5">
        ⚙ Indicadores marcados com <b>auto</b> se preenchem sozinhos a partir das ferramentas das Fases
        (Inventário, GAP, Riscos, Consultas, Reuniões, Documentos, Instrumentos, Incidentes) — clique no valor
        para abrir a fonte. Os demais você atualiza manualmente pelo lápis. O Relatório Anual já usa esses valores.
      </div>
    </>
  );
}
