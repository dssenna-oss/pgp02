"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileCheck2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface InventoryOption {
  id: string;
  serviceName: string;
  setor: string | null;
}

interface RipdCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback ao criar com sucesso — recebe o id pra navegação. */
  onCreated: (id: string) => void;
}

/**
 * Modal pra criar novo RIPD. Usuário escolhe:
 *   1. Um processo do Inventário (opcional, mas recomendado — dispara
 *      pré-população automática das 8 seções)
 *   2. Título (obrigatório, default = "RIPD - {serviceName}")
 *
 * Lista de processos é carregada de `/api/inventario` e filtrada pra
 * mostrar somente APROVADOS (que têm dados estáveis e bases legais).
 */
export default function RipdCreateModal({
  open,
  onClose,
  onCreated,
}: RipdCreateModalProps) {
  const [inventories, setInventories] = useState<InventoryOption[]>([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [inventoryId, setInventoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Carrega processos aprovados ao abrir
  useEffect(() => {
    if (!open) return;
    setInventoryId("");
    setTitle("");
    let cancelled = false;
    (async () => {
      setLoadingInv(true);
      try {
        const r = await fetch("/api/inventario", { cache: "no-store" });
        if (!r.ok) {
          toast.error("Erro ao carregar processos do Inventário");
          return;
        }
        const j = await r.json();
        const all: any[] = Array.isArray(j) ? j : (j.items ?? []);
        const approved: InventoryOption[] = all
          .filter((i) => i.status === "APROVADO")
          .map((i) => ({
            id: i.id,
            serviceName: i.serviceName,
            setor: i.setor ?? null,
          }))
          .sort((a, b) => a.serviceName.localeCompare(b.serviceName, "pt-BR"));
        if (!cancelled) setInventories(approved);
      } finally {
        if (!cancelled) setLoadingInv(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Auto-preenche título quando seleciona processo
  useEffect(() => {
    if (!inventoryId) return;
    const inv = inventories.find((i) => i.id === inventoryId);
    if (inv && !title.trim()) {
      setTitle(`RIPD — ${inv.serviceName}`);
    }
  }, [inventoryId, inventories, title]);

  const handleCreate = async () => {
    const t = title.trim();
    if (!t) {
      toast.error("Informe um título pro RIPD");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/ripd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          inventoryId: inventoryId || null,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar RIPD");
        return;
      }
      const j = await r.json();
      toast.success(
        inventoryId
          ? "RIPD criado e pré-preenchido a partir do processo!"
          : "RIPD criado em rascunho"
      );
      onCreated(j.ripd.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !creating && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-blue-600" />
            Criar novo RIPD
          </DialogTitle>
          <DialogDescription>
            Vincule a um processo do Inventário pra que as 8 seções venham
            pré-preenchidas com dados, riscos e controles desse processo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ripd-inventory">
              Processo do Inventário (recomendado)
            </Label>
            {loadingInv ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando processos aprovados…
              </div>
            ) : inventories.length === 0 ? (
              <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Nenhum processo aprovado no Inventário ainda. Você pode
                  criar um RIPD avulso (sem pré-população) ou aprovar um
                  processo primeiro pra obter os dados automáticos.
                </p>
              </div>
            ) : (
              <select
                id="ripd-inventory"
                value={inventoryId}
                onChange={(e) => setInventoryId(e.target.value)}
                disabled={creating}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">— RIPD avulso (sem pré-população) —</option>
                {inventories.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.serviceName}
                    {i.setor ? ` · ${i.setor}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ripd-title">Título do RIPD *</Label>
            <Input
              id="ripd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: RIPD — Cadastro de clientes (programa de fidelidade)"
              disabled={creating}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Você pode ajustar a qualquer momento.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || !title.trim()}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando…
              </>
            ) : (
              "Criar RIPD"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
