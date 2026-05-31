import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { iniciais } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MembrosPage() {
  const membros = await prisma.membro.findMany({ orderBy: { ordem: "asc" } });
  const unidades = new Set(membros.map((m) => m.unidade).filter(Boolean));

  return (
    <>
      <PageHeader
        emoji="👥"
        title="Membros do Comitê"
        lead="Composição e papéis. Presidência, coordenação, encarregado (DPO) e membros por unidade."
      />
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        👤 {membros.length} integrantes · {unidades.size} unidades representadas
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {membros.map((m) => (
          <div key={m.id} className="bg-white border rounded-xl p-3.5 flex gap-3 items-start">
            <div className="w-[42px] h-[42px] rounded-lg bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
              {iniciais(m.nome)}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-gray-900">{m.nome}</div>
              <div className="text-[12px] text-brand-600 font-semibold mt-0.5">{m.funcao}</div>
              <div className="text-[11.5px] text-gray-500 mt-1">
                {m.cargo ? `${m.cargo} · ` : ""}
                {m.unidade}
                {m.matricula ? ` · mat. ${m.matricula}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
