import Link from "next/link";
import { Thermometer, FileText, ArrowRight } from "lucide-react";
import { VisualizadorSlides } from "@/components/visualizador-slides";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getFaseSlides } from "@/lib/slides-fases";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";
import type { TermometroSalvo } from "@/lib/termometro-perguntas";
import type { CartaAltaGestaoSalva } from "@/lib/carta-alta-gestao";

export const dynamic = "force-dynamic";

async function getStatusPraticas() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return { termometroInicio: null, cartaFinalizada: false };
  await ensureColunasFasePreliminar();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { termometroInicio: true, cartaAltaGestao: true },
  });
  return {
    termometroInicio: (company?.termometroInicio as TermometroSalvo | null) ?? null,
    cartaFinalizada: !!(company?.cartaAltaGestao as CartaAltaGestaoSalva | null)?.finalizadaEm,
  };
}

export default async function FasePreliminarPage() {
  const fase = getFaseSlides("fase-preliminar")!;
  const status = await getStatusPraticas();
  return (
    <div className="max-w-6xl mx-auto">
      <VisualizadorSlides fase={fase} />

      {/* Banner quando ADMIN/Facilitador acessa — explica que práticas
          são dos participantes. Some quando usuário tem companyId. */}
      <div className="mt-4">
        <AdminPreviewBanner />
      </div>

      {/* Coloque em prática — 2 atividades pedagógicas que o grupo executa
          após assistir aos slides. Termômetro (5min) + Carta (10min). */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          🎯 Coloque em prática
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard/fase-preliminar/termometro"
            className="group rounded-lg border-l-4 border-l-emerald-500 border border-emerald-100 bg-white p-4 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Thermometer className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Termômetro Institucional</h3>
                  {status.termometroInicio && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      ✓ {status.termometroInicio.score}/100
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  5 dimensões × 4 opções fechadas → score 0-100 de maturidade percebida.
                  Repetem no fim do curso para ver o salto. ~5min.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 group-hover:text-emerald-800">
                  {status.termometroInicio ? "Revisar" : "Começar"} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/fase-preliminar/carta-alta-gestao"
            className="group rounded-lg border-l-4 border-l-blue-500 border border-blue-100 bg-white p-4 hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Carta para a Alta Gestão</h3>
                  {status.cartaFinalizada && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      ✓ finalizada
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  5 campos com templates institucionais auto-preenchidos. Personalize e gere o
                  DOCX formal para impressão e assinatura. ~10min.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 group-hover:text-blue-800">
                  {status.cartaFinalizada ? "Revisar" : "Começar"} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {fase.faseKey && (
        <div className="mt-6">
          <BaseLegalCard faseKey={fase.faseKey} />
        </div>
      )}
    </div>
  );
}
