"use client";

/**
 * TourSettingsCard — bloco em Configurações com:
 *  - Status atual do tour (concluído / pulado / nunca feito) lido do localStorage
 *  - Botão "Refazer tour agora" — abre o tour mestre imediatamente
 *  - Botão "Resetar progresso" — limpa o registro local (volta a auto-abrir)
 *
 * Útil pra testar e pro próprio usuário rever o onboarding.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, RotateCcw, Play } from "lucide-react";
import { useTour } from "./tour-provider";
import { loadTourState, resetTourState, type TourLocalState } from "@/lib/tour/tour-storage";

function describe(state: TourLocalState): { label: string; tone: "success" | "warning" | "muted" } {
  if (state.completedAt) {
    return {
      label: `Tour concluído em ${new Date(state.completedAt).toLocaleString("pt-BR")}`,
      tone: "success",
    };
  }
  if (state.skippedAt) {
    return {
      label: `Tour pulado em ${new Date(state.skippedAt).toLocaleString("pt-BR")}`,
      tone: "warning",
    };
  }
  return { label: "Você ainda não fez o tour. Ele abrirá automaticamente na próxima visita.", tone: "muted" };
}

export default function TourSettingsCard() {
  const { start, isOpen } = useTour();
  const [state, setState] = useState<TourLocalState>({ completedAt: null, skippedAt: null });

  // Carrega estado no mount + sempre que o tour fechar.
  useEffect(() => {
    if (!isOpen) {
      setState(loadTourState("master"));
    }
  }, [isOpen]);

  const info = describe(state);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Tour guiado com narração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Apresentação interativa de aproximadamente 3 minutos com narração da
          voz Bella (ElevenLabs) cobrindo as principais ferramentas do PGP.
        </p>

        <div
          className={
            info.tone === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
              : info.tone === "warning"
              ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
              : "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300"
          }
        >
          {info.label}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => start("master")} className="gap-2">
            <Play className="h-4 w-4" />
            {state.completedAt || state.skippedAt ? "Refazer tour" : "Fazer tour agora"}
          </Button>
          {(state.completedAt || state.skippedAt) && (
            <Button
              variant="outline"
              onClick={() => {
                resetTourState("master");
                setState({ completedAt: null, skippedAt: null });
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Resetar progresso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
