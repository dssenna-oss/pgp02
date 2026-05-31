import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { statusConsulta } from "@/lib/comite-ui";
import { dataBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ConsultasPage() {
  const consultas = await prisma.consultaPrevia.findMany({ orderBy: { ordem: "asc" } });
  const pendentes = consultas.filter((c) => c.status !== "RESPONDIDA").length;

  return (
    <>
      <PageHeader
        emoji="⚖️"
        title="Consulta prévia ao Comitê"
        lead="Registro das decisões que envolvem dados pessoais submetidas ao Comitê (contratos, convênios, novos sistemas, vigilância). Materializa o princípio da consulta prévia obrigatória."
      />
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        📝 {consultas.length} consultas · {pendentes} pendente(s)
      </div>
      <div className="space-y-3">
        {consultas.map((c) => {
          const st = statusConsulta(c.status);
          return (
            <div key={c.id} className={`bg-white border border-l-4 ${st.border} rounded-xl px-4 py-3.5`}>
              <div className="flex justify-between gap-3 items-start">
                <div className="text-sm font-bold text-gray-900">{c.titulo}</div>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              {c.descricao && <p className="text-[12.5px] text-gray-700 mt-1.5">{c.descricao}</p>}
              <div className="text-[11.5px] text-gray-500 mt-2 flex gap-3.5 flex-wrap">
                {c.area && <span><b className="text-gray-700">Área:</b> {c.area}</span>}
                {c.parecerCju && <span><b className="text-gray-700">Parecer CJU:</b> {c.parecerCju}</span>}
                {c.abertaEm && <span><b className="text-gray-700">Aberta em:</b> {dataBR(c.abertaEm)}</span>}
                {c.respondidaEm && <span><b className="text-gray-700">Respondida em:</b> {dataBR(c.respondidaEm)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
