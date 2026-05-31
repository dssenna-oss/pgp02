import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { statusEntrega, eixoTag, EIXO_BAR } from "@/lib/comite-ui";
import { dataBR } from "@/lib/utils";

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

  // Progresso por eixo = % de entregas concluídas dentro do eixo
  const progressoEixo = eixos.map((eixo) => {
    const doEixo = entregas.filter((e) => e.eixoCodigo === eixo.codigo);
    const ok = doEixo.filter((e) => e.status === "CONCLUIDO").length;
    const pct = doEixo.length ? Math.round((ok / doEixo.length) * 100) : 0;
    return { ...eixo, pct };
  });

  // Próximo marco crítico não concluído
  const proximo = marcos.find((m) => m.status !== "CONCLUIDO");

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
          <div className="text-3xl font-extrabold text-gray-900 mt-1">{execPct}%</div>
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

      {/* Marcos críticos */}
      <h2 className="text-sm font-extrabold text-gray-900 mt-7 mb-3 flex items-center gap-2">📌 Marcos críticos do biênio</h2>
      <div className="bg-white border rounded-xl p-5">
        <ol className="relative ml-2 pl-6 border-l-2 border-slate-200 space-y-4">
          {marcos.map((m) => {
            const st = statusEntrega(m.status);
            const mae = m.tipo === "MAE";
            return (
              <li key={m.id} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 rounded-full border-[3px] border-white shadow ${
                    mae ? "w-[18px] h-[18px] -left-[33px] bg-amber-500" : "w-3.5 h-3.5 bg-brand-500"
                  }`}
                />
                <div className="text-[12px] font-extrabold text-gray-900 flex items-center gap-2 flex-wrap">
                  {dataBR(m.data)}
                  {mae && <span className="text-amber-700">— MARCO-MÃE</span>}
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <div className="text-[13px] text-gray-700 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {m.descricao}
                  {m.eixoCodigos.split(",").map((c) => (
                    <span key={c} className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${eixoTag(c)}`}>
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
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
