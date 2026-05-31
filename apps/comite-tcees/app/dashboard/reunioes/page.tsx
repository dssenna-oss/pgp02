import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { dataBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReunioesPage() {
  const reunioes = await prisma.reuniao.findMany({ orderBy: { data: "desc" } });
  const proxima = reunioes.find((r) => r.status === "AGENDADA");

  return (
    <>
      <PageHeader
        emoji="📝"
        title="Reuniões & Atas"
        lead="Histórico das reuniões do colegiado — pauta, participantes, decisões e ata anexada."
      />
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        🗂️ {reunioes.length} reuniões registradas{proxima ? ` · próxima ${dataBR(proxima.data)}` : ""}
      </div>
      <div className="space-y-3">
        {reunioes.map((r) => {
          const agendada = r.status === "AGENDADA";
          return (
            <div
              key={r.id}
              className={`bg-white border border-l-4 ${agendada ? "border-l-indigo-500" : "border-l-emerald-500"} rounded-xl px-4 py-3.5`}
            >
              <div className="flex justify-between gap-3 items-start">
                <div className="text-sm font-bold text-gray-900">{r.titulo}</div>
                <Badge variant={agendada ? "indigo" : "green"}>
                  {agendada ? "agendada" : "realizada"} · {dataBR(r.data)}
                </Badge>
              </div>
              {r.pauta && (
                <p className="text-[12.5px] text-gray-700 mt-1.5">
                  <b>Pauta:</b> {r.pauta}
                </p>
              )}
              {r.decisoes && (
                <p className="text-[12.5px] text-gray-700 mt-1.5">
                  <b>Principais decisões:</b> {r.decisoes}
                </p>
              )}
              <div className="text-[11.5px] text-gray-500 mt-2 flex gap-3.5 flex-wrap">
                {r.local && <span><b className="text-gray-700">Local:</b> {r.local}{r.hora ? ` · ${r.hora}` : ""}</span>}
                {r.totalConvocados != null && (
                  <span>
                    <b className="text-gray-700">Participantes:</b>{" "}
                    {r.presentes != null ? `${r.presentes} de ${r.totalConvocados}` : `convocação a ${r.totalConvocados} membros`}
                  </span>
                )}
                <span><b className="text-gray-700">Ata:</b> {r.ataUrl ? "📎 disponível" : r.status === "REALIZADA" ? "📎 registrada" : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] flex gap-2 mt-4">
        💡 Em etapas futuras, cada reunião vincula as <b>decisões</b> a entregas do Plano de Trabalho e
        gera a <b>ata em DOCX</b> automaticamente a partir da pauta e dos registros.
      </div>
    </>
  );
}
