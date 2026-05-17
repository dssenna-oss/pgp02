"use client";

// Provider + Dialog global pra alerta "VOCÊ AINDA NÃO CONCLUIU A FASE 4".
// Plugado no /dashboard/layout.tsx. Qualquer client component pode disparar
// chamando `dispararAlertaPuloFase()` (helper exportado em
// lib/phase-skip-handler.ts) — que apenas dispatch um CustomEvent na window.
// Esse provider escuta o evento e abre o Dialog.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const PHASE_SKIP_EVENT = "curso:phase-skip-attempt";

export function PhaseSkipProvider() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handler() {
      setOpen(true);
    }
    window.addEventListener(PHASE_SKIP_EVENT, handler);
    return () => window.removeEventListener(PHASE_SKIP_EVENT, handler);
  }, []);

  function voltarParaGap() {
    setOpen(false);
    router.push("/dashboard/gap");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-red-500 sm:border-4">
        <div className="text-center py-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 animate-pulse">
            <AlertTriangle className="h-9 w-9 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-red-700 leading-tight mb-2">
            VOCÊ AINDA NÃO CONCLUIU
            <br />
            A FASE 4 - GAP ANALYSIS
          </h2>
          <p className="text-sm text-gray-700 font-medium">
            Seu grupo <span className="text-red-600 font-bold">perderá pontos</span> se prosseguir!
          </p>
          <p className="text-xs text-gray-500 mt-3">
            O PGP é construído em sequência — pular fases compromete a qualidade do programa.
            Conclua os 10 controles do GAP antes de avançar.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={voltarParaGap} className="bg-red-600 hover:bg-red-700 text-white">
              Voltar pra Fase 4 — GAP Analysis
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar (insistir)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
