import Link from "next/link";
import { Building, Target, Calendar, ArrowRight, AlertTriangle, Thermometer } from "lucide-react";
import { VisualizadorSlides } from "@/components/visualizador-slides";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getFaseSlides } from "@/lib/slides-fases";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunasFase2 } from "@/lib/coluna-fase-2";
import type { SetoresSalvos } from "./setores/actions";
import type { PriorizacaoSalva } from "@/lib/criterios-priorizacao";

export const dynamic = "force-dynamic";

async function getStatusPraticasFase2() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return { setoresDiscutidos: 0, priorizacaoFeita: false };
  await ensureColunasFase2();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { setoresDiscutidos: true, priorizacaoProcessos: true },
  });
  const setores = (company?.setoresDiscutidos as SetoresSalvos | null)?.setores || [];
  const priorizacao = company?.priorizacaoProcessos as PriorizacaoSalva | null;
  return {
    setoresDiscutidos: setores.filter((s) => s.discutido).length,
    setoresTotal: setores.length,
    priorizacaoFeita: !!priorizacao && priorizacao.processos.length > 0,
  };
}

export default async function Fase2Page() {
  const fase = getFaseSlides("fase-2")!;
  const status = await getStatusPraticasFase2();
  return (
    <div className="max-w-6xl mx-auto">
      <VisualizadorSlides fase={fase} />

      <div className="mt-4">
        <AdminPreviewBanner />
      </div>

      {/* Nota de orientação — o "diagnóstico de maturidade/cultura" dos slides
          01/02 NÃO é uma prática daqui: é o Termômetro (Fase Preliminar). Aqui
          (slide 03) começa o PLANEJAMENTO: priorizar processos + cronograma.
          Evita o facilitador procurar uma tela de diagnóstico que não existe. */}
      <div className="mt-6 rounded-xl border-l-4 border-l-indigo-400 border border-indigo-200 bg-indigo-50/60 p-4">
        <h2 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-indigo-600" />
          Maturidade e cultura? Já foi medido no Termômetro
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-indigo-900/80">
          Os slides <strong>01 (cultura organizacional)</strong> e <strong>02 (maturidade — 7 dimensões)</strong>{" "}
          referem-se ao <strong>Termômetro Institucional</strong>, respondido na Fase Preliminar: o bloco
          “Sobre você” mede a cultura e “Sobre sua instituição” são as 7 dimensões de adequação.{" "}
          <strong>Não há uma tela de diagnóstico aqui</strong> — na hora desses slides, projete os
          resultados do Termômetro pra abrir a discussão. As 3 atividades abaixo são o{" "}
          <strong>planejamento</strong> (slide 03): priorizar os processos e montar o cronograma.
        </p>
        <Link
          href="/dashboard/fase-preliminar/termometro"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-800"
        >
          Ver o Termômetro Institucional <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Aprofundamento — Avaliação de Alto Risco (regra "1+1" da ANPD).
          Vem ANTES das práticas: entender o conceito (incl. alto risco) antes
          de pôr a mão na massa. Infográfico + PDF + liga priorização ao RIPD. */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          📖 Aprofundamento
        </h2>
        <Link
          href="/dashboard/fase-2/alto-risco"
          className="group block rounded-lg border-l-4 border-l-amber-500 border border-amber-100 bg-white p-4 hover:bg-amber-50/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900">O tratamento é de Alto Risco?</h3>
              <p className="text-xs text-gray-600 mt-1">
                A regra <strong>“1 + 1”</strong> da ANPD (1 critério geral + 1 específico),
                infográfico e a referência completa em PDF. Alto risco = prioridade máxima + RIPD
                obrigatório (Art. 38).
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 group-hover:text-amber-800">
                Abrir o guia <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Coloque em prática — 3 atividades pedagógicas da Fase 2:
          (2A) Setores que tratam dados · (2B) Matriz de Priorização ·
          (2C) Roadmap 90 dias auto-gerado. */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          🎯 Coloque em prática
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/fase-2/setores"
            className="group rounded-lg border-l-4 border-l-cyan-500 border border-cyan-100 bg-white p-4 hover:bg-cyan-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">Setores</h3>
                  {(status.setoresTotal ?? 0) > 0 && status.setoresDiscutidos > 0 && (
                    <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                      ✓ {status.setoresDiscutidos}/{status.setoresTotal}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Discutam os 2 processos pré-cadastrados do órgão. Carta de Serviços como fonte
                  na vida real. ~5min.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 group-hover:text-cyan-800">
                  Abrir <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/fase-2/priorizacao"
            className="group rounded-lg border-l-4 border-l-blue-500 border border-blue-100 bg-white p-4 hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">Priorização</h3>
                  {status.priorizacaoFeita && (
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Matriz com 6 critérios da Resolução CD/ANPD nº 2/2022. Score automático +
                  ranking. ~10min.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 group-hover:text-blue-800">
                  Abrir <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/fase-2/roadmap"
            className="group rounded-lg border-l-4 border-l-purple-500 border border-purple-100 bg-white p-4 hover:bg-purple-50/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">Roadmap 90 dias</h3>
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                    Auto
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Cronograma gerado automaticamente. 13 semanas com marcos por Fase. Baixa
                  DOCX direto. ~2min.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-purple-700 group-hover:text-purple-800">
                  Abrir <ArrowRight className="h-3 w-3" />
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
