// Modalidade C — Onda 2: hub das Atividades ao vivo do participante.
// Lista as 6 atividades leves (lib/atividades-c.ts) com o estado de cada uma
// (respondida ou não). Acessível a participantes logados; o facilitador (ADMIN)
// vê o painel agregado em /facilitador/atividades.

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, LayoutGrid } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";
import { ATIVIDADES_C } from "@/lib/atividades-c";

export const dynamic = "force-dynamic";

export default async function AtividadesHubPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  let respondidas = new Set<string>();
  if (userId) {
    await ensureTabelaAtividadesC();
    const minhas = await prisma.cursoAtividadeResposta.findMany({
      where: { userId },
      select: { atividadeId: true },
    });
    respondidas = new Set(minhas.map((m) => m.atividadeId));
  }

  const feitas = ATIVIDADES_C.filter((a) => respondidas.has(a.id)).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AdminPreviewBanner />

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Atividades ao vivo</h1>
        </div>
        <p className="mt-2 text-gray-600 leading-relaxed">
          Toques rápidos no celular durante o curso. Você vota, classifica ou ordena, e o
          resultado do grupo aparece no telão na hora. A produção completa continua nos{" "}
          <strong>cards da mesa</strong> — aqui é só a decisão rápida.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {feitas} de {ATIVIDADES_C.length} respondidas
        </p>
      </header>

      <ul className="space-y-3">
        {ATIVIDADES_C.map((a) => {
          const feita = respondidas.has(a.id);
          return (
            <li key={a.id}>
              <Link
                href={`/dashboard/atividades/${a.id}`}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <span className="text-2xl leading-none mt-0.5">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${a.faseCor}`}>
                      {a.fase}
                    </span>
                  </div>
                  <h2 className="mt-1 font-semibold text-gray-900">{a.titulo}</h2>
                  {a.contexto && <p className="text-sm text-gray-500">{a.contexto}</p>}
                </div>
                {feita ? (
                  <span className="inline-flex items-center gap-1 text-sm text-green-700 shrink-0">
                    <CheckCircle2 className="h-5 w-5" /> Enviada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-gray-400 shrink-0">
                    <Circle className="h-5 w-5" /> Pendente
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
