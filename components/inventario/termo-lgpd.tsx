"use client";

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { findTermo, type TermoLGPD as TermoLGPDType } from "@/lib/lgpd-glossario";
import { cn } from "@/lib/utils";

interface TermoLGPDProps {
  /** Termo a buscar no glossário. Se omitido, usa o `children` como string. */
  termo?: string;
  /** O texto que vai aparecer pro user (pode ser plural, com acento, etc.). */
  children: ReactNode;
  /** Custom className extra. */
  className?: string;
}

/**
 * Envolve uma palavra com sublinhado pontilhado e tooltip explicativo.
 *
 * Uso:
 *   <TermoLGPD>dado pessoal</TermoLGPD>
 *   <TermoLGPD termo="dado sensivel">dados sensíveis</TermoLGPD>
 *
 * Se o termo não estiver no glossário (lib/lgpd-glossario.ts), renderiza
 * só o texto sem decoração — falha silenciosa, não quebra o layout.
 */
export function TermoLGPD({ termo, children, className }: TermoLGPDProps) {
  const lookup = termo ?? (typeof children === "string" ? children : "");
  const found = findTermo(lookup);

  if (!found) {
    // Sem termo registrado — só renderiza o texto.
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "underline decoration-dotted decoration-blue-500 dark:decoration-blue-400 underline-offset-2 cursor-help",
              className
            )}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-left p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          {/* `<div>` em vez de `<p>` aqui — TermoLGPD costuma ser usado
              dentro de um <p> (texto longo do FieldHelp.why), e <p> dentro
              de <p> dispara hydration warning mesmo com Radix Portal. */}
          <div className="space-y-1.5">
            <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
              {found.termo}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {found.definicao}
            </div>
            {found.artigo && (
              <div className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                LGPD · {found.artigo}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Renderiza um texto plain procurando termos do glossário e envolvendo-os
 * em <TermoLGPD> automaticamente. Útil pra textos longos onde marcar
 * termo a termo manualmente seria chato.
 *
 * NOTA: faz match case-insensitive nas chaves + aliases. Não cobre
 * variações morfológicas (plurais não-aliados etc.). Pra usar com
 * confiança em conteúdo grande, registrar aliases necessários no
 * glossário.
 */
export function autoLinkGlossario(
  text: string,
  // Importação local pra evitar circular dep
  glossario: Record<string, TermoLGPDType>
): ReactNode[] {
  // Coleta todas as variações (chave + aliases) ordenadas por tamanho desc
  // pra match maior primeiro (ex: "dado sensível" antes de "dado").
  const tokens: Array<{ key: string; t: TermoLGPDType }> = [];
  for (const [key, t] of Object.entries(glossario)) {
    tokens.push({ key, t });
    for (const a of t.aliases ?? []) tokens.push({ key: a, t });
  }
  tokens.sort((a, b) => b.key.length - a.key.length);

  if (tokens.length === 0) return [text];
  // Pattern com word boundaries — escapa regex chars
  const pattern = new RegExp(
    `\\b(${tokens
      .map((tk) => tk.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\b`,
    "gi"
  );

  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(
      <TermoLGPD key={`tlgpd-${i++}`} termo={match[0]}>
        {match[0]}
      </TermoLGPD>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result;
}
