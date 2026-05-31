import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { statusDoc } from "@/lib/comite-ui";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const docs = await prisma.documento.findMany({ orderBy: { ordem: "asc" } });

  return (
    <>
      <PageHeader
        emoji="📁"
        title="Documentos do Comitê"
        lead="Repositório com versão e status de homologação. Atas, pareceres e instrumentos do PGP num só lugar."
      />
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        📄 Status: a elaborar → elaborado → pendente de aprovação → homologado
      </div>
      <div className="overflow-x-auto bg-white border rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {["Documento", "Tipo", "Versão", "Status", "Atualizado"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 text-[11px] uppercase tracking-wide text-gray-500 font-bold border-b">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const st = statusDoc(d.status);
              return (
                <tr key={d.id} className="border-b last:border-b-0">
                  <td className="px-3.5 py-3 text-[13px] font-semibold text-gray-900">{d.nome}</td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.tipo ?? "—"}</td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.versao ?? "—"}</td>
                  <td className="px-3.5 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="px-3.5 py-3 text-[13px] text-gray-600">{d.atualizadoEm ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
