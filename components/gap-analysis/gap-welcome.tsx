"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Sparkles,
  PlayCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import type { GapStats } from "@/lib/gap-helpers";

interface GapWelcomeProps {
  stats: GapStats;
  suggestionsCount: number;
  onStart: () => void;
}

export default function GapWelcome({
  stats,
  suggestionsCount,
  onStart,
}: GapWelcomeProps) {
  return (
    <div className="py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
          <ClipboardList className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          GAP Analysis
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Diagnóstico macro de adequação à LGPD. Você responde {stats.total}{" "}
          controles agrupados em {stats.byDomain.length} domínios — e descobre
          onde a organização está aderente, parcialmente aderente ou tem
          lacunas (gaps).
        </p>
      </div>

      {/* Sugestões disponíveis (banner amarelo) */}
      {suggestionsCount > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 max-w-3xl mx-auto">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                Boa notícia: {suggestionsCount} controle(s) já têm sugestão
                automática.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Como você já tem processos APROVADOS no Inventário, o sistema
                já preencheu boa parte dos campos óbvios — você só precisa
                confirmar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como funciona */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Step
              n={1}
              title="Domínios colapsados"
              text="Cada um dos 28 domínios fica num accordion. Abra um, responda os controles, vai pro próximo."
            />
            <Step
              n={2}
              title="4 campos por controle"
              text="Cenário Atual (texto), Mapeamento (não iniciado/em andamento/finalizado), Aderência (4 níveis), Ponto de Melhoria (texto)."
            />
            <Step
              n={3}
              title="Snapshots"
              text="Quando quiser congelar uma versão (Q1, Q2…) clica em Histórico → Novo snapshot. Útil pra acompanhar evolução."
            />
          </div>
        </CardContent>
      </Card>

      {/* Quem preenche */}
      <Card className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Acesso restrito:</strong> só o DPO (Principal, Substituto
            ou Auxiliar) responde o GAP. Contribuidores não veem essa tela.
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button size="lg" onClick={onStart}>
          <PlayCircle className="h-5 w-5 mr-2" />
          Começar diagnóstico
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={onStart}
          className="text-gray-600 dark:text-gray-400"
        >
          Pular introdução
        </Button>
      </div>

      {/* Footer info */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Conteúdo baseado no template oficial "Matriz de Controles e Avaliação
        de Gaps" do curso LGPD PRO. Você pode salvar quantos snapshots quiser
        pra acompanhar a evolução. <CheckCircle2 className="inline h-3 w-3 -mt-0.5 ml-1" />
      </p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold">
        {n}
      </div>
      <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  );
}
