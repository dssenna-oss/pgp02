"use client";

/**
 * Modal pra adicionar processos do Inventário a um Termo já existente.
 *
 * Usado na aba "Configurações" do editor (S4 — pendência #2). Reusa
 * filtro de "sugeridos" (base = Consentimento) vs "outros aprovados",
 * idêntico ao TermoCreateDialog. Apenas processos APROVADOS que ainda
 * não estão vinculados aparecem como opção.
 */

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InventoryOption {
  id: string;
  serviceName: string;
  setor: string | null;
  hasConsentBase: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Ids já vinculados (ficam ocultos do picker). */
  alreadyLinkedIds: string[];
  /** Chamado com a lista FINAL de ids vinculados (atual + novos). */
  onConfirm: (newLinkedIds: string[]) => Promise<void>;
}

export default function TermoLinkPickerModal({
  open,
  onClose,
  alreadyLinkedIds,
  onConfirm,
}: Props) {
  const [inventories, setInventories] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setPicked(new Set());
    (async () => {
      try {
        const [invRes, statusRes] = await Promise.all([
          fetch("/api/inventario"),
          fetch("/api/inventario/consent-status").catch(() => null),
        ]);
        if (cancelled) return;
        const ij = await invRes.json();
        const invArr = Array.isArray(ij) ? ij : [];
        const consentIds = new Set<string>();
        if (statusRes && statusRes.ok) {
          const sj = await statusRes.json();
          for (const it of sj.items ?? []) consentIds.add(it.inventoryId);
        }
        const linkedSet = new Set(alreadyLinkedIds);
        const formatted: InventoryOption[] = invArr
          .filter((x: any) => x.status === "APROVADO" && !linkedSet.has(x.id))
          .map((x: any) => ({
            id: x.id,
            serviceName: x.serviceName ?? "(sem nome)",
            setor: x.setor ?? null,
            hasConsentBase: consentIds.has(x.id),
          }));
        setInventories(formatted);
      } catch {
        if (!cancelled) toast.error("Erro ao carregar Inventário");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, alreadyLinkedIds]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (picked.size === 0) {
      toast.error("Escolha pelo menos um processo");
      return;
    }
    setSaving(true);
    try {
      const final = Array.from(new Set([...alreadyLinkedIds, ...picked]));
      await onConfirm(final);
    } finally {
      setSaving(false);
    }
  }

  const suggested = inventories.filter((i) => i.hasConsentBase);
  const other = inventories.filter((i) => !i.hasConsentBase);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-violet-600" />
            Vincular processos do Inventário
          </DialogTitle>
          <DialogDescription>
            Selecione 1 ou mais processos. Os campos do termo (finalidade,
            dados) continuam usando o 1º processo vinculado como referência.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-8 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
              Carregando processos...
            </div>
          ) : inventories.length === 0 ? (
            <p className="text-sm italic text-gray-500 py-6 text-center">
              Não há processos aprovados disponíveis pra vincular
              {alreadyLinkedIds.length > 0
                ? " (todos os aprovados já estão vinculados a este termo)."
                : "."}
            </p>
          ) : (
            <>
              {suggested.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                    ⚠ Sugeridos (Consentimento sem termo):
                  </p>
                  <div className="space-y-1">
                    {suggested.map((i) => (
                      <Row
                        key={i.id}
                        inv={i}
                        checked={picked.has(i.id)}
                        onToggle={() => toggle(i.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {other.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Outros processos aprovados
                  </p>
                  <div className="space-y-1">
                    {other.slice(0, 50).map((i) => (
                      <Row
                        key={i.id}
                        inv={i}
                        checked={picked.has(i.id)}
                        onToggle={() => toggle(i.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || picked.size === 0}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Vincular {picked.size > 0 ? `(${picked.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
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
