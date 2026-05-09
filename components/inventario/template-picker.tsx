"use client";

/**
 * Picker de Modelos Padronizados de Inventário (2026-05-11).
 *
 * Modal aberto a partir da tela de entrada do wizard. Lista todos os
 * `INVENTARIO_TEMPLATES` agrupados por domínio, com busca livre por
 * nome/tags. Ao confirmar, dispara `onPick(template)` — quem chama
 * mescla via `applyTemplate()` em `lib/inventario-templates-publicos.ts`.
 */

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  INVENTARIO_TEMPLATES,
  TEMPLATES_BY_DOMAIN,
  DOMAIN_LABEL,
  countPreenchidos,
  type InventarioTemplate,
  type TemplateDomain,
} from "@/lib/inventario-templates-publicos";
import { Search, ArrowLeft, ArrowRight, BookOpen, AlertCircle } from "lucide-react";

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado quando o user CONFIRMA a aplicação do template selecionado. */
  onPick: (template: InventarioTemplate) => void;
}

export default function TemplatePicker({
  open,
  onOpenChange,
  onPick,
}: TemplatePickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventarioTemplate | null>(null);

  /** Filtragem por nome OU tags. Case-insensitive, sem acento sensível. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INVENTARIO_TEMPLATES;
    return INVENTARIO_TEMPLATES.filter((t) => {
      if (t.nome.toLowerCase().includes(q)) return true;
      if (t.descricaoCurta.toLowerCase().includes(q)) return true;
      return t.tags.some((tag) => tag.toLowerCase().includes(q));
    });
  }, [query]);

  /** Re-agrupa o resultado filtrado por domínio. */
  const filteredByDomain = useMemo(() => {
    const out: Record<TemplateDomain, InventarioTemplate[]> = {} as any;
    for (const t of filtered) {
      (out[t.domain] ??= []).push(t);
    }
    return out;
  }, [filtered]);

  const close = () => {
    setSelected(null);
    setQuery("");
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onPick(selected);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {selected ? "Confirmar modelo" : "Escolha um modelo padronizado"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Revise os detalhes e confirme. Os campos preenchidos pelo modelo poderão ser editados livremente no formulário."
              : "Modelos do setor público brasileiro com a maioria dos campos pré-preenchidos. Use a busca pra filtrar."}
          </DialogDescription>
        </DialogHeader>

        {selected ? (
          <TemplateDetail template={selected} />
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busque por nome, sistema (ex: SCDP, SEI) ou processo (ex: licitação, ouvidoria)…"
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-2 -mr-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Nenhum modelo corresponde à busca. Tente um termo mais
                  genérico ou use{" "}
                  <span className="font-medium">Preenchimento Manual</span>.
                </div>
              ) : (
                Object.entries(filteredByDomain).map(([domain, items]) => (
                  <div key={domain} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {DOMAIN_LABEL[domain as TemplateDomain]}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(t)}
                            className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {t.nome}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                                  {t.descricaoCurta}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="flex-shrink-0 text-xs"
                              >
                                {countPreenchidos(t)} campos
                              </Badge>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
          {selected ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Voltar à lista
              </Button>
              <Button onClick={handleConfirm}>
                Aplicar modelo
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs text-gray-500">
                {filtered.length} de {INVENTARIO_TEMPLATES.length} modelos
              </div>
              <Button variant="outline" onClick={close}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateDetail({ template }: { template: InventarioTemplate }) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
      <div>
        <h3 className="text-base font-semibold">{template.nome}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {template.descricaoCurta}
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-sm">
        <div className="font-medium text-blue-900 dark:text-blue-200 mb-1 text-xs uppercase tracking-wide">
          Quando usar
        </div>
        <p className="text-blue-900 dark:text-blue-200 leading-snug">
          {template.quandoUsar}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Bases legais
          </div>
          <ul className="space-y-1 text-sm">
            {template.basesLegais.map((b) => (
              <li
                key={b}
                className="text-gray-700 dark:text-gray-300 leading-snug"
              >
                • {b}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Hipóteses LGPD aplicáveis
          </div>
          <ul className="space-y-1 text-sm">
            {template.hipotesesLgpd.map((h) => (
              <li
                key={h}
                className="text-gray-700 dark:text-gray-300 leading-snug"
              >
                • {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-3 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
          Pré-preenchimento
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-snug">
          Este modelo vai preencher{" "}
          <strong>{countPreenchidos(template)} campos</strong> do formulário.
          Você poderá editar todos eles depois.
        </p>
        {template.camposPendentes.length > 0 && (
          <div className="mt-3 flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-snug">
              <strong>{template.camposPendentes.length} campos</strong> ficam
              pendentes de revisão humana — são informações específicas da sua
              instituição que o modelo não tem como preencher (volume de
              titulares, local de armazenamento, sistemas internos, etc.).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
