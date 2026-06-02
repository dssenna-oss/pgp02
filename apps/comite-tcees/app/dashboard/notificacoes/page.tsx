import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { MarcarLidasBtn } from "@/components/marcar-lidas-btn";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ICONE: Record<string, { emoji: string; bg: string }> = {
  ATRASO: { emoji: "⏰", bg: "bg-red-100" },
  DOCUMENTO: { emoji: "📄", bg: "bg-amber-100" },
  REUNIAO: { emoji: "📅", bg: "bg-brand-50" },
  PAUTA: { emoji: "📋", bg: "bg-emerald-100" },
  PRAZO: { emoji: "⏳", bg: "bg-brand-50" },
  CONSULTA: { emoji: "⚖️", bg: "bg-slate-100" },
  MARCO: { emoji: "✅", bg: "bg-emerald-100" },
  TAREFA: { emoji: "🗒️", bg: "bg-indigo-100" },
};

function tempoRelativo(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const dias = Math.floor(diff / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  if (dias < 7) return `há ${dias} dias`;
  const semanas = Math.floor(dias / 7);
  return semanas === 1 ? "há 1 semana" : `há ${semanas} semanas`;
}

export default async function NotificacoesPage() {
  const notifs = await prisma.notificacao.findMany({ orderBy: { createdAt: "desc" } });
  const naoLidas = notifs.filter((n) => !n.lida).length;

  return (
    <>
      <PageHeader
        emoji="🔔"
        title="Notificações"
        lead="Avisos sobre prazos, pendências, consultas e reuniões — também enviados por e-mail (em etapas futuras)."
        action={<MarcarLidasBtn disabled={naoLidas === 0} />}
      />
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold mb-4">
        🔵 {naoLidas} não lida(s)
      </div>
      <div className="space-y-2">
        {notifs.map((n) => {
          const ic = ICONE[n.tipo] ?? { emoji: "🔔", bg: "bg-gray-100" };
          const inner = (
            <div
              className={`flex gap-3 bg-white border rounded-xl px-3.5 py-3 ${
                !n.lida ? "border-l-[3px] border-l-brand-500 bg-[#fbfdff]" : ""
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${ic.bg}`}>
                {ic.emoji}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] text-gray-900">{n.titulo}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {tempoRelativo(n.createdAt)}
                  {n.descricao ? ` · ${n.descricao}` : ""}
                </div>
              </div>
            </div>
          );
          return n.href ? (
            <Link key={n.id} href={n.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={n.id}>{inner}</div>
          );
        })}
      </div>
    </>
  );
}
