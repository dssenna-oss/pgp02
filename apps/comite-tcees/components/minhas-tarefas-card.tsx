import Link from "next/link";
import { prazoInfo, prazoBR } from "@/lib/tarefas";

export type MinhaTarefa = {
  id: string;
  titulo: string;
  prazoISO: string | null;
  status: string;
  inventoryId: string | null;
  inventoryNome: string | null;
};

/**
 * Card "Minhas tarefas" na Visão geral — mostra ao usuário logado as tarefas
 * pendentes atribuídas a ele. Não aparece se não houver nenhuma.
 */
export function MinhasTarefasCard({ tarefas }: { tarefas: MinhaTarefa[] }) {
  if (tarefas.length === 0) return null;

  return (
    <div className="bg-white border border-brand-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[13px] font-extrabold text-gray-900 flex items-center gap-2">
          🗒️ Minhas tarefas
          <span className="text-[11px] font-bold text-white bg-brand-600 rounded-full px-2 py-0.5">{tarefas.length}</span>
        </div>
        <Link href="/dashboard/tarefas" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700">
          Ver todas →
        </Link>
      </div>
      <div className="space-y-1.5">
        {tarefas.slice(0, 5).map((t) => {
          const pz = prazoInfo(t.prazoISO, t.status);
          const href = t.inventoryId ? `/dashboard/inventario?abrir=${t.inventoryId}` : "/dashboard/tarefas";
          return (
            <Link
              key={t.id}
              href={href}
              className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <span className="text-[12.5px] text-gray-800 truncate">{t.titulo}</span>
              <span className={`text-[11px] shrink-0 ${pz.cls}`}>
                {t.prazoISO ? `${prazoBR(t.prazoISO)} · ${pz.texto}` : pz.texto}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
