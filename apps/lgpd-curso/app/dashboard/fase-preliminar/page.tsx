import Link from "next/link";
import { Thermometer, FileText, ArrowRight } from "lucide-react";
import { VisualizadorSlides } from "@/components/visualizador-slides";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getFaseSlides } from "@/lib/slides-fases";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFasePreliminar } from "@/lib/coluna-fase-preliminar";
import { ensureTabelaTermometro } from "@/lib/colunas-termometro";
import type { CartaAltaGestaoSalva } from "@/lib/carta-alta-gestao";

export const dynamic = "force-dynamic";

async function getStatusPraticas() {
  const session = await getSession();
  const userId = session?.user?.id;
  const companyId = session?.user?.companyId;
  if (!companyId) return { termometroInicio: null, cartaFinalizada: false };
  await ensureColunasFasePreliminar();
  await ensureTabelaTermometro();
  // Carta continua na company (produção do grupo); termômetro agora é do
  // próprio participante (individual).
  const [company, termo] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { cartaAltaGestao: true },
    }),
    userId
      ? prisma.termometroResposta.findUnique({
          where: { userId_momento: { userId, momento: "INICIO" } },
          select: { score: true },
        })
      : null,
  ]);
  return {
    termometroInicio: termo, // { score } | null
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

      {/* Trilha da fase — a ORDEM encena o bottom-up do serviço público:
          medir onde estou → me capacitar → engajar quem decide. Histórico e
          Estrutura moram em "Slides das fases", mas ganham endereço aqui
          porque SÃO sensibilização (conteúdo da Preliminar). */}
      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h2 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          🧭 Trilha da Fase Preliminar
        </h2>
        <p className="mt-0.5 text-xs text-indigo-800/80">
          Bottom-up do serviço público: <strong>medir</strong> onde estamos → <strong>se capacitar</strong> → <strong>engajar quem decide</strong>.
        </p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { n: "1", emoji: "🌡️", titulo: "Termômetro Institucional", desc: "Medir a maturidade percebida (antes de qualquer conteúdo).", href: "/dashboard/fase-preliminar/termometro" },
            { n: "2", emoji: "🕰️", titulo: "Histórico da LGPD", desc: "Por que a lei existe — a capacitação começa aqui.", href: "/dashboard/historico-lgpd" },
            { n: "3", emoji: "🏛️", titulo: "Estrutura da LGPD", desc: "O que a lei diz (+ Desafios art. 1–65, ao vivo no telão).", href: "/dashboard/estrutura-lgpd" },
            { n: "4", emoji: "✉️", titulo: "Carta para a Alta Gestão", desc: "Desfecho: engajar a gestão com os argumentos recém-aprendidos.", href: "/dashboard/fase-preliminar/carta-alta-gestao" },
          ].map((p) => (
            <li key={p.n}>
              <Link
                href={p.href}
                className="group flex items-start gap-2.5 rounded-lg border border-indigo-100 bg-white p-3 hover:bg-indigo-50 transition-colors h-full"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {p.n}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">{p.emoji} {p.titulo}</span>
                  <span className="block text-xs text-gray-600 mt-0.5">{p.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
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
