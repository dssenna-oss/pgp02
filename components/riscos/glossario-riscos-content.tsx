/**
 * Glossário dos 13 tipos de risco do catálogo LGPD.
 *
 * Página estática didática — lista cada risco com código, nome curto,
 * descrição completa, resumo, base na LGPD e exemplos. Tem busca livre
 * que filtra por código, nome ou descrição.
 *
 * Decisão Opção 4 do cardápio (2026-05-08): combina com Opção 2 (chip
 * cinza ao lado do nome) pra que o user nunca fique no escuro.
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RISCOS_CATALOG } from "@/lib/riscos-catalog";

export default function GlossarioRiscosContent() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RISCOS_CATALOG;
    return RISCOS_CATALOG.filter((r) => {
      return (
        r.code.toLowerCase().includes(q) ||
        r.shortLabel.toLowerCase().includes(q) ||
        r.fullLabel.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/riscos"
          className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Análise de Riscos
        </Link>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5">
            <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Glossário de Riscos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Os {RISCOS_CATALOG.length} tipos de risco do catálogo LGPD
              usados pelo app. Cada risco do seu inventário é classificado
              com um destes códigos.
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por código (ex: BU), nome ou descrição..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {query && (
            <p className="text-xs text-gray-500 mt-2">
              {filtered.length === 0
                ? "Nenhum risco encontrado."
                : `${filtered.length} de ${RISCOS_CATALOG.length} risco(s)`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de riscos */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.code}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Badge
                  variant="outline"
                  className="font-mono text-xs px-2 py-1 mt-0.5 shrink-0 text-gray-600 dark:text-gray-300"
                >
                  {r.code}
                </Badge>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {r.shortLabel}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {r.fullLabel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    {r.summary}
                  </p>

                  {r.help?.fundamentoLegal && (
                    <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950/30 px-3 py-2 border border-blue-100 dark:border-blue-900/40">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-300 mb-0.5">
                        Fundamento legal
                      </div>
                      <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                        {r.help.fundamentoLegal}
                      </p>
                    </div>
                  )}

                  {r.help?.riscoIdentificado && (
                    <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 border border-amber-100 dark:border-amber-900/40">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-0.5">
                        O que acontece se nada for feito
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                        {r.help.riscoIdentificado}
                      </p>
                    </div>
                  )}

                  {r.help?.recomendacoes && r.help.recomendacoes.length > 0 && (
                    <details className="mt-3 group">
                      <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                        Recomendações típicas ({r.help.recomendacoes.length})
                      </summary>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        {r.help.recomendacoes.map((ex, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-600 dark:text-gray-400"
                          >
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
