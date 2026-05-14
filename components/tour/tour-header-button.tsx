"use client";

/**
 * TourHeaderButton — versão integrada do botão de tour pra usar dentro
 * do header de uma página (em vez do flutuante do canto). Visual de
 * outline button discreto, em harmonia com o resto da UI.
 *
 * Decisão UX 2026-05-10 (Sugestão C): substituir o botão 'Relatório'
 * placeholder do dashboard por um acesso ao tour mais bem integrado.
 * O TourFloatingButton continua existindo nas outras telas pra
 * manter cobertura universal.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTour } from "./tour-provider";
import { hasEverInteracted } from "@/lib/tour/tour-storage";
import { Mic, RotateCcw } from "lucide-react";

export default function TourHeaderButton() {
  const { isOpen, start } = useTour();
  const [interacted, setInteracted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInteracted(hasEverInteracted("master"));
    }
  }, [isOpen]);

  if (isOpen) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => start("master")}
      title={
        interacted
          ? "Refazer o tour guiado do PGP"
          : "Fazer o tour guiado do PGP — explica o app em ~5min"
      }
      className="border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/30"
    >
      {interacted ? (
        <RotateCcw className="h-4 w-4 mr-2" />
      ) : (
        <Mic className="h-4 w-4 mr-2" />
      )}
      {interacted ? "Refazer tour" : "Fazer tour guiado"}
    </Button>
  );
}
