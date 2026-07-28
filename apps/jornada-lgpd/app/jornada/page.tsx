// A TRILHA — home do gestor: as 8 etapas (Preliminar + 7 Fases) como
// prateleiras de documentos, com a régua de completude do Perfil no topo.

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireInstituicao } from "@/lib/auth-server";
import { TRILHA } from "@/lib/trilha";
import { completudePerfil } from "@/lib/perfil";

export const dynamic = "force-dynamic";

export default async function JornadaPage() {
  const { instituicaoId } = await requireInstituicao();
  const inst = await prisma.instituicao.findUnique({ where: { id: instituicaoId } });
  if (!inst) return <p className="text-sm text-rose-700">Instituição não encontrada.</p>;

  const respostas = await prisma.documentoResposta.findMany({
    where: { instituicaoId },
    select: { numeroModelo: true, status: true },
  });
  const statusPorModelo = new Map(respostas.map((r) => [r.numeroModelo, r.status]));

  const { feitos, total } = completudePerfil(inst);
  const perfilCompleto = feitos === total;

  return (
    <div>
      <h1 className="text-xl font-extrabold text-gray-900">{inst.nome}</h1>
      <p className="mt-0.5 text-sm text-gray-500">Sua jornada de implementação da LGPD.</p>

      <Link
        href="/perfil"
        className={`mt-4 block rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
          perfilCompleto
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <p className="text-sm font-bold text-gray-900">
          {perfilCompleto ? "✅ Perfil da instituição completo" : "📝 Comece pelo Perfil da instituição"}
        </p>
        <p className="mt-0.5 text-xs text-gray-600">
          {feitos} de {total} campos essenciais preenchidos — são eles que preencherão os
          documentos automaticamente. Toque pra {perfilCompleto ? "revisar" : "completar"}.
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full ${perfilCompleto ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${Math.round((feitos / total) * 100)}%` }}
          />
        </div>
      </Link>

      <div className="mt-6 space-y-6">
        {TRILHA.map((etapa, i) => (
          <section key={etapa.id}>
            <div className="flex items-baseline gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white">
                {i + 1}
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wide text-teal-800">
                {etapa.rotulo}
              </h2>
            </div>
            <p className="mt-0.5 pl-8 text-xs text-gray-500">{etapa.resumo}</p>
            <ol className="mt-2 space-y-2 pl-0 sm:pl-8">
              {etapa.modelos.map((m) => {
                const status = statusPorModelo.get(m.numero);
                return (
                  <li key={m.slug}>
                    <Link
                      href={`/jornada/documento/${m.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[11px] font-extrabold text-white">
                        {String(m.numero).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold leading-snug text-gray-900">
                          {m.titulo}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          {status === "pronto" ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                              ✅ PRONTO
                            </span>
                          ) : status === "rascunho" ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                              ✏️ RASCUNHO
                            </span>
                          ) : (
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-extrabold text-gray-500">
                              MODELO DISPONÍVEL
                            </span>
                          )}
                          {m.minuta && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                              📝 COMENTADA
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-lg text-gray-300 transition group-hover:text-teal-600">
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
