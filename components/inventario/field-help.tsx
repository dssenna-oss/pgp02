"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Scale,
  ArrowRight,
  Lightbulb,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldHelp as FieldHelpType } from "@/lib/inventario-form-schema";
import { resolveMiniApps } from "@/lib/inventario-mini-apps";
import { autoLinkGlossario } from "./termo-lgpd";
import { GLOSSARIO_LGPD } from "@/lib/lgpd-glossario";

interface FieldHelpProps {
  help: FieldHelpType;
  /** Label da pergunta — usado no seed do chat. */
  fieldLabel: string;
  /** ID do field — usado pra contexto do chat. */
  fieldId: string;
}

/**
 * Botão "?" ao lado da label de uma pergunta. Abre popover com:
 *  - Selo de criticidade (se "alta")
 *  - Por que perguntamos isso (com termos do glossário sublinhados)
 *  - Artigo LGPD (se houver)
 *  - Chips dos mini-apps que essa resposta alimenta
 *  - Botão "Ver exemplos" (se houver) — expande lista
 *  - Botão "Quer aprofundar com IA?" — abre o chatbot já com contexto
 */
export function FieldHelp({ help, fieldLabel, fieldId }: FieldHelpProps) {
  const [showExemplos, setShowExemplos] = useState(false);
  const apps = resolveMiniApps(help.feedsInto);
  const isCritical = help.criticidade === "alta";
  const isMedium = help.criticidade === "media";

  const askChatbot = () => {
    const seed = buildChatSeed({
      fieldLabel,
      fieldId,
      why: help.why,
      lgpd: help.lgpd,
    });
    // Dispatch de evento global — o ChatbotWidget escuta e abre pré-preenchido.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chat:open-with", {
          detail: { seed, source: "field-help", fieldId },
        })
      );
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Ajuda sobre esta pergunta"
          className={cn(
            "shrink-0 inline-flex items-center justify-center rounded-full",
            "h-5 w-5 transition-colors",
            "text-blue-500 hover:text-blue-700 hover:bg-blue-100",
            "dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/40",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 overflow-hidden border-2 border-blue-300 dark:border-blue-900/60 shadow-xl"
        side="top"
        align="start"
        sideOffset={6}
      >
        {/* Faixa colorida superior — "etiqueta" do card de ajuda */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
        {/* Header com selo de criticidade quando aplicável */}
        {isCritical && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Alta criticidade — atenção redobrada
            </span>
          </div>
        )}
        {isMedium && !isCritical && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/40">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
              Pergunta importante
            </span>
          </div>
        )}

        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          {/* Por quê */}
          <div>
            <p className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wide text-blue-600 dark:text-blue-400 mb-1">
              <Lightbulb className="h-3.5 w-3.5" />
              Por que perguntamos isso?
            </p>
            <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {autoLinkGlossario(help.why, GLOSSARIO_LGPD)}
            </div>
          </div>

          {/* Artigo LGPD */}
          {help.lgpd && (
            <div className="rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <p className="text-[11px] uppercase font-bold tracking-wide text-purple-700 dark:text-purple-300">
                  LGPD · {help.lgpd.artigo}
                </p>
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {autoLinkGlossario(help.lgpd.resumo, GLOSSARIO_LGPD)}
              </div>
            </div>
          )}

          {/* Onde isso vai parar */}
          {apps.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">
                <Workflow className="h-3.5 w-3.5" />
                Esta resposta vai alimentar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {apps.map((app) => (
                  <Badge
                    key={app.id}
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 font-normal"
                  >
                    <span className="mr-1">{app.emoji}</span>
                    {app.short}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Exemplos (collapsible) */}
          {help.exemplos && help.exemplos.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowExemplos((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {showExemplos ? "Ocultar exemplos" : "Ver exemplos práticos"}
              </button>
              {showExemplos && (
                <ul className="mt-2 space-y-1.5 list-disc pl-5">
                  {help.exemplos.map((ex, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {ex}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer: ação pro chat */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={askChatbot}
            className="w-full justify-center text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Quer aprofundar com IA?
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Constrói a mensagem-semente que abre o chat com contexto da pergunta. */
function buildChatSeed(args: {
  fieldLabel: string;
  fieldId: string;
  why: string;
  lgpd?: { artigo: string; resumo: string };
}): string {
  const partes = [
    `Estou preenchendo o Inventário de Dados Pessoais do PGP e tenho dúvida sobre esta pergunta:`,
    ``,
    `**Pergunta:** ${args.fieldLabel}`,
  ];
  if (args.lgpd) {
    partes.push(
      ``,
      `Contexto LGPD relacionado: ${args.lgpd.artigo} — ${args.lgpd.resumo}`
    );
  }
  partes.push(
    ``,
    `Pode me explicar com mais detalhe, dar exemplos práticos pra organizações públicas brasileiras, e dizer o que considerar antes de responder?`
  );
  return partes.join("\n");
}
