"use client";

/**
 * Modal de criação de Termo de Consentimento.
 *
 * Passos:
 *   1. DPO escolhe 1 dos 5 templates (catálogo via /api/consent-terms/templates)
 *   2. Opcional: vincula 1 ou mais processos do Inventário aprovados
 *   3. Define modo (físico/digital/ambos)
 *   4. Submit → /api/consent-terms POST → editor abre pra revisar texto
 */

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateOption {
  id: string;
  label: string;
  blurb: string;
  legalRef: string;
}

interface InventoryOption {
  id: string;
  serviceName: string;
  setor: string | null;
  hasConsentBase: boolean; // marca se já usa Consentimento (sugere selecionar)
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (termId: string) => void;
}

export default function TermoCreateDialog({ open, onClose, onCreated }: Props) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [inventories, setInventories] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [allowsPhysical, setAllowsPhysical] = useState(true);
  const [allowsDigital, setAllowsDigital] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSelectedTemplate("");
    setTitle("");
    setLinkedIds(new Set());
    setAllowsPhysical(true);
    setAllowsDigital(true);
    (async () => {
      try {
        const [tplsRes, invRes, statusRes] = await Promise.all([
          fetch("/api/consent-terms/templates"),
          fetch("/api/inventario"),
          fetch("/api/inventario/consent-status").catch(() => null),
        ]);
        if (cancelled) return;
        const tj = await tplsRes.json();
        const ij = await invRes.json();
        const invArr = Array.isArray(ij) ? ij : [];
        const consentInvIds = new Set<string>();
        if (statusRes && statusRes.ok) {
          const sj = await statusRes.json();
          for (const it of sj.items ?? []) consentInvIds.add(it.inventoryId);
        }
        setTemplates(tj.templates ?? []);
        setInventories(
          invArr
            .filter((x: any) => x.status === "APROVADO")
            .map((x: any) => ({
              id: x.id,
              serviceName: x.serviceName ?? "(sem nome)",
              setor: x.setor ?? null,
              hasConsentBase: consentInvIds.has(x.id),
            })),
        );
      } catch {
        if (!cancelled) toast.error("Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function toggleInventory(id: string) {
    setLinkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!selectedTemplate) {
      toast.error("Escolha um modelo de termo");
      return;
    }
    if (!allowsPhysical && !allowsDigital) {
      toast.error("Habilite pelo menos um modo (físico ou digital)");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/consent-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: selectedTemplate,
          title: title.trim() || undefined,
          linkedInventoryIds: Array.from(linkedIds),
          allowsPhysical,
          allowsDigital,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao criar termo");
        return;
      }
      toast.success("Termo criado. Revise o texto antes de publicar.");
      onCreated(json.term.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro de rede");
    } finally {
      setSubmitting(false);
    }
  }

  const consentSuggested = inventories.filter((i) => i.hasConsentBase);
  const other = inventories.filter((i) => !i.hasConsentBase);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Criar Termo de Consentimento
          </DialogTitle>
          <DialogDescription>
            Escolha um modelo, vincule aos processos do Inventário e ajuste o texto depois.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              Carregando catálogo...
            </div>
          ) : (
            <>
              {/* Picker de templates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  1. Modelo de termo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templates.map((tpl) => {
                    const selected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={cn(
                          "text-left p-3 rounded-lg border-2 transition-all",
                          selected
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200"
                            : "border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:bg-gray-50 dark:hover:bg-gray-800/40",
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {tpl.label}
                          </span>
                          {selected && (
                            <Check className="h-4 w-4 text-violet-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                          {tpl.blurb}
                        </p>
                        <span className="inline-block text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono">
                          {tpl.legalRef}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Título personalizado */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  2. Título do termo <span className="text-xs font-normal text-gray-500">(opcional)</span>
                </h3>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Termo de Consentimento — Cadastro de Eventos Culturais"
                  maxLength={200}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se vazio, geramos automaticamente baseado no modelo + processo vinculado.
                </p>
              </div>

              {/* Vínculos com Inventário */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  3. Vincular a processos do Inventário <span className="text-xs font-normal text-gray-500">(opcional)</span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Um termo pode cobrir vários processos. Os campos do termo (finalidade, dados,
                  retenção) são puxados do 1º processo vinculado.
                </p>
                {consentSuggested.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                      ⚠ Sugeridos (Consentimento sem termo):
                    </p>
                    <div className="space-y-1">
                      {consentSuggested.map((i) => (
                        <InvCheckbox
                          key={i.id}
                          inv={i}
                          checked={linkedIds.has(i.id)}
                          onToggle={() => toggleInventory(i.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {other.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 mb-2">
                      Outros processos aprovados ({other.length})
                    </summary>
                    <div className="space-y-1">
                      {other.slice(0, 30).map((i) => (
                        <InvCheckbox
                          key={i.id}
                          inv={i}
                          checked={linkedIds.has(i.id)}
                          onToggle={() => toggleInventory(i.id)}
                        />
                      ))}
                    </div>
                  </details>
                )}
                {inventories.length === 0 && (
                  <p className="text-xs italic text-gray-500">
                    Nenhum processo APROVADO ainda — termo nasce genérico, você pode vincular depois.
                  </p>
                )}
              </div>

              {/* Modos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  4. Como o titular vai dar o aceite
                </h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowsPhysical}
                      onChange={(e) => setAllowsPhysical(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded text-violet-600"
                    />
                    <div className="text-sm">
                      <strong>Físico</strong> — gera DOCX/PDF pra imprimir e coletar assinatura
                      no balcão / Ouvidoria / atendimento presencial.
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowsDigital}
                      onChange={(e) => setAllowsDigital(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded text-violet-600"
                    />
                    <div className="text-sm">
                      <strong>Digital</strong> — URL pública com botão "Aceito"; sistema grava
                      IP, navegador, data/hora e versão exata do termo.
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedTemplate}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Criar e abrir editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvCheckbox({
  inv,
  checked,
  onToggle,
}: {
  inv: InventoryOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1 h-4 w-4 rounded text-violet-600"
      />
      <div className="text-sm flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {inv.serviceName}
        </div>
        {inv.setor && (
          <div className="text-xs text-gray-500">Setor: {inv.setor}</div>
        )}
      </div>
    </label>
  );
}
