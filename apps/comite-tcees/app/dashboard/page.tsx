import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { eixoTag, EIXO_BAR } from "@/lib/comite-ui";
import { dataBR } from "@/lib/utils";
import { MarcosClient, type MarcoDTO } from "@/components/marcos-client";

export const dynamic = "force-dynamic";

export default async function VisaoGeral() {
  const [entregas, marcos, eixos, comite] = await Promise.all([
    prisma.entrega.findMany({ orderBy: { ordem: "asc" } }),
    prisma.marco.findMany({ orderBy: { ordem: "asc" } }),
    prisma.eixo.findMany({ orderBy: { ordem: "asc" } }),
    prisma.comite.findFirst(),
  ]);

  const total = entregas.length;
  const concluidas = entregas.filter((e) => e.status === "CONCLUIDO").length;
  const atrasadas = entregas.filter((e) => e.status === "ATRASADO").length;
  const execPct = total ? Math.round((concluidas / total) * 100) : 0;

  const progressoEixo = eixos.map((eixo) => {
    const doEixo = entregas.filter((e) => e.eixoCodigo === eixo.codigo);
    const ok = doEixo.filter((e) => e.status === "CONCLUIDO").length;
    const pct = doEixo.length ? Math.round((ok / doEixo.length) * 100) : 0;
    return { ...eixo, pct };
  });

  const proximo = marcos.find((m) => m.status !== "CONCLUIDO");

  const marcosDtos: MarcoDTO[] = marcos.map((m) => ({
    id: m.id,
    dataISO: new Date(m.data).toISOString().slice(0, 10),
    dataBR: dataBR(m.data),
    descricao: m.descricao,
    eixoCodigos: m.eixoCodigos,
    tipo: m.tipo,
    status: m.status,
  }));

  return (
    <>
      <PageHeader
        emoji="📊"
        title="Visão geral"
        lead={`Acompanhamento do Plano de Trabalho do ${comite?.nomeComite ?? "Comitê"} — biênio ${comite?.bienio ?? "2026-2027"}.`}
      />

      {/* KPIs */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border rounded-xl p-4 border-l-4 border-l-brand-500">
          <div className="text-xs text-gray-500 font-semibold">Execução do Plano</div>
          <div className="text-3xl font-extrabold text-brand-700 mt-1">{execPct}%</div>
          <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <span className="block h-full bg-brand-500 rounded-full" style={{ width: `${execPct}%` }} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1.5">
            {concluidas} de {total} entregas concluídas
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500 font-semibold">Marco-mãe</div>
          <div className="text-lg font-extrabold text-gray-900 mt-2">{comite?.marcoMae ?? "PGP consolidado"}</div>
          <div className="text-[11px] text-gray-500 mt-1">prazo {dataBR(comite?.marcoMaePrazo)}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500 font-semibold">Próximo marco crítico</div>
          <div className="text-lg font-extrabold text-gray-900 mt-2">{dataBR(proximo?.data)}</div>
          <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">{proximo?.descricao ?? "—"}</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-xs text-gray-500 font-semibold">Entregas atrasadas</div>
          <div className="text-3xl font-extrabold mt-1" style={{ color: atrasadas ? "#dc2626" : "#111827" }}>
            {atrasadas}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">exigem atenção</div>
        </div>
      </div>

      {/* Marcos críticos (editáveis) */}
      <div className="mt-7">
        <MarcosClient marcos={marcosDtos} />
      </div>

      {/* Progresso por eixo */}
      <h2 className="text-sm font-extrabold text-gray-900 mt-7 mb-3 flex items-center gap-2">🧭 Progresso por eixo</h2>
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {progressoEixo.map((e) => (
          <div key={e.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(e.codigo)}`}>
                Eixo {e.codigo} · {e.nome}
              </span>
              <b className="text-sm">{e.pct}%</b>
            </div>
            <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
              <span
                className={`block h-full rounded-full ${EIXO_BAR[e.codigo] ?? "bg-brand-500"}`}
                style={{ width: `${e.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
