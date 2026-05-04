"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GAP_DOMAINS, type GapControl } from "@/lib/gap-catalog";
import {
  type GapAnswerDTO,
  type GapStats,
} from "@/lib/gap-helpers";
import type { GapSuggestion } from "@/lib/gap-suggest";
import GapControlRow from "./gap-control-row";

interface GapDomainAccordionProps {
  stats: GapStats;
  answersByCode: Map<string, GapAnswerDTO>;
  suggestions: Record<string, GapSuggestion>;
  search: string;
  aderFilter: string | null;
  onlyWithPM: boolean;
  onAnswerSaved: () => void;
}

export default function GapDomainAccordion({
  stats,
  answersByCode,
  suggestions,
  search,
  aderFilter,
  onlyWithPM,
  onAnswerSaved,
}: GapDomainAccordionProps) {
  // Pré-calcula quais controles passam nos filtros (filtro = mostrar)
  const visibleByDomain = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = new Map<string, GapControl[]>();
    for (const dom of GAP_DOMAINS) {
      const filtered = dom.controls.filter((c) => {
        // Filtro por aderência (do controle ou da resposta)
        const ans = answersByCode.get(c.code);
        if (aderFilter && ans?.aderencia !== aderFilter) return false;
        if (onlyWithPM && !(ans?.pontoMelhoria && ans.pontoMelhoria.trim()))
          return false;
        // Busca textual
        if (q) {
          const hay = (
            c.question +
            " " +
            c.domain +
            " " +
            (c.article ?? "")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      out.set(dom.code, filtered);
    }
    return out;
  }, [search, aderFilter, onlyWithPM, answersByCode]);

  const totalVisible = [...visibleByDomain.values()].reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  if (totalVisible === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
        Nenhum controle bate com os filtros. Limpe a busca ou troque o filtro
        de aderência.
      </div>
    );
  }

  // Stats por domínio mapeado por code (lookup rápido)
  const statsByDomain = new Map(stats.byDomain.map((d) => [d.domainCode, d]));

  // Monta lista de domínios que têm pelo menos 1 controle visível
  const visibleDomains = GAP_DOMAINS.filter(
    (d) => (visibleByDomain.get(d.code)?.length ?? 0) > 0,
  );

  return (
    <Accordion
      type="multiple"
      defaultValue={search ? visibleDomains.map((d) => d.code) : []}
      className="w-full space-y-2"
    >
      {visibleDomains.map((dom) => {
        const ds = statsByDomain.get(dom.code)!;
        const visibleCtrls = visibleByDomain.get(dom.code) ?? [];
        const pct = Math.round((ds.answered / ds.total) * 100);
        return (
          <AccordionItem
            key={dom.code}
            value={dom.code}
            className="border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800"
          >
            <AccordionTrigger className="hover:no-underline px-4 group">
              <div className="flex-1 flex items-start gap-3 text-left min-w-0">
                <div
                  className={cn(
                    "shrink-0 mt-1 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                    pct === 100
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : pct > 0
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                  )}
                >
                  {pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {dom.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
                    <Badge variant="outline" className="font-normal">
                      {ds.answered} / {ds.total} respondidos
                    </Badge>
                    {ds.byAderencia.NAO_ADERENTE > 0 && (
                      <Badge
                        variant="outline"
                        className="font-normal bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                      >
                        {ds.byAderencia.NAO_ADERENTE} não aderente(s)
                      </Badge>
                    )}
                    {ds.byAderencia.PARCIAL > 0 && (
                      <Badge
                        variant="outline"
                        className="font-normal bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                      >
                        {ds.byAderencia.PARCIAL} parcial(is)
                      </Badge>
                    )}
                    {visibleCtrls.length !== ds.total && (
                      <Badge variant="outline" className="font-normal italic">
                        ({visibleCtrls.length} mostrando)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="space-y-2 mt-2">
                {visibleCtrls.map((ctrl) => (
                  <GapControlRow
                    key={ctrl.code}
                    control={ctrl}
                    answer={answersByCode.get(ctrl.code) ?? null}
                    suggestion={suggestions[ctrl.code]}
                    onSaved={onAnswerSaved}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
