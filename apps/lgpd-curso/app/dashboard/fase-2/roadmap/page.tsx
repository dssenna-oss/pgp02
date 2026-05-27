import Link from "next/link";
import { ArrowLeft, FileDown, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { gerarRoadmap90Dias } from "@/lib/roadmap-gerador";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  let orgao: "PM" | "CM" = "PM";
  let companyName = "";
  if (companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { orgao: true, name: true },
    });
    if (company?.orgao === "CM") orgao = "CM";
    companyName = company?.name || "";
  }
  const marcos = gerarRoadmap90Dias(orgao);

  // Agrupa por fase pra visualização compacta (mostrar "Fase 3" uma vez com seus marcos)
  const agrupado = marcos.reduce<Record<string, typeof marcos>>((acc, m) => {
    (acc[m.fase] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto">
      <AdminPreviewBanner />

      <Link
        href="/dashboard/fase-2"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase 2
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Fase 2 · Prática 2C
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            Roadmap de 90 dias
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Cronograma gerado <strong>automaticamente</strong> conforme o seu órgão e os 2
            processos críticos pré-cadastrados. 13 semanas distribuindo as 7 Fases do PGP.
            Sem input — apenas revise e baixe o DOCX pra apresentar à Alta Gestão.
          </p>
        </div>
        <a
          href="/api/curso/roadmap-90-dias/docx"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-purple-600 text-white px-3 py-2 text-sm font-medium hover:bg-purple-700"
        >
          <FileDown className="h-4 w-4" /> Baixar Roadmap DOCX
        </a>
      </div>

      {companyName && (
        <div className="mt-3 text-xs text-gray-500">
          Roadmap personalizado para: <strong className="text-gray-800">{companyName}</strong>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {Object.entries(agrupado).map(([fase, marcosDaFase]) => {
          const corFase =
            fase === "Fase 1" ? "blue" :
            fase === "Fase 2" ? "cyan" :
            fase === "Fase 3" ? "emerald" :
            fase === "Fase 4" ? "violet" :
            fase === "Fase 5" ? "amber" :
            fase === "Fase 6" ? "orange" :
            "red";
          return (
            <section key={fase}>
              <h2
                className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                  corFase === "blue" ? "text-blue-700" :
                  corFase === "cyan" ? "text-cyan-700" :
                  corFase === "emerald" ? "text-emerald-700" :
                  corFase === "violet" ? "text-violet-700" :
                  corFase === "amber" ? "text-amber-700" :
                  corFase === "orange" ? "text-orange-700" :
                  "text-red-700"
                }`}
              >
                {fase}
              </h2>
              <div className="space-y-2">
                {marcosDaFase.map((m) => (
                  <div
                    key={m.semana}
                    className={`rounded-lg border-l-4 ${
                      corFase === "blue" ? "border-l-blue-400" :
                      corFase === "cyan" ? "border-l-cyan-400" :
                      corFase === "emerald" ? "border-l-emerald-400" :
                      corFase === "violet" ? "border-l-violet-400" :
                      corFase === "amber" ? "border-l-amber-400" :
                      corFase === "orange" ? "border-l-orange-400" :
                      "border-l-red-400"
                    } border bg-white p-3`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-center w-12">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Sem.</div>
                        <div className="text-xl font-bold text-gray-900">{m.semana}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900">{m.titulo}</h3>
                        <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                          {m.detalhes.map((d, i) => (
                            <li key={i} className="flex gap-1.5">
                              <span className="text-gray-400 shrink-0">·</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                          🎯 <strong>Entrega:</strong> {m.entrega}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
