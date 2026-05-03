"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Plus, Trash2, Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MARKER_COLORS,
  CHIP_CLS_BY_COLOR,
  type MarkerDTO,
  type MarkerColor,
} from "@/lib/tarefas-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  markers: MarkerDTO[];
  onChanged: () => Promise<void>;
}

/**
 * Modal de gerenciamento de marcadores (tags) personalizados.
 *
 * Permite: criar (nome + cor), editar (renomear ou trocar cor),
 * excluir (remove o marcador das tarefas que o usavam).
 *
 * Visibilidade: cada user só vê os próprios marcadores (privado).
 */
export default function MarkersManager({
  open,
  onOpenChange,
  markers,
  onChanged,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<MarkerColor>("indigo");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<MarkerColor>("slate");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    const n = newName.trim();
    if (!n || n.length < 2) {
      toast.error("Nome obrigatório (mínimo 2 caracteres)");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/marcadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, color: newColor }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao criar");
        return;
      }
      toast.success("Marcador criado");
      setNewName("");
      setNewColor("indigo");
      setCreating(false);
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (m: MarkerDTO) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditColor(m.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleEdit = async (id: string) => {
    const n = editName.trim();
    if (!n || n.length < 2) {
      toast.error("Nome inválido");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/marcadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, color: editColor }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Marcador atualizado");
      cancelEdit();
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (m: MarkerDTO) => {
    if (
      !confirm(
        `Excluir o marcador "${m.name}"? Ele será removido das tarefas que o usam.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/marcadores/${m.id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Marcador excluído");
      await onChanged();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meus marcadores</DialogTitle>
          <DialogDescription>
            Marcadores são tags personalizadas pra organizar suas tarefas
            (Urgente, Pessoal, Reunião...). Cada um tem uma cor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Lista de marcadores existentes */}
          {markers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 italic">
              Você ainda não criou nenhum marcador. Use o botão abaixo.
            </p>
          ) : (
            <div className="space-y-2">
              {markers.map((m) => {
                const isEditing = editingId === m.id;
                if (isEditing) {
                  return (
                    <div
                      key={m.id}
                      className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-2"
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome do marcador"
                        maxLength={60}
                      />
                      <ColorPicker value={editColor} onChange={setEditColor} />
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={busy}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(m.id)}
                          disabled={busy}
                        >
                          <Check className="h-4 w-4 mr-1" /> Salvar
                        </Button>
                      </div>
                    </div>
                  );
                }
                const cls =
                  CHIP_CLS_BY_COLOR[m.color as keyof typeof CHIP_CLS_BY_COLOR];
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 border border-gray-200 dark:border-gray-800 rounded-lg p-2"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold",
                        cls
                      )}
                    >
                      {m.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Form de criação */}
          {creating ? (
            <div className="border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/15 rounded-lg p-3 space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do novo marcador"
                maxLength={60}
                autoFocus
              />
              <ColorPicker value={newColor} onChange={setNewColor} />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setNewName("");
                  }}
                  disabled={busy}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={busy || newName.trim().length < 2}
                >
                  <Plus className="h-4 w-4 mr-1" /> Criar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setCreating(true)}
              disabled={busy}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo marcador
            </Button>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ColorPicker — paleta visual de 6 cores
// ============================================================

function ColorPicker({
  value,
  onChange,
}: {
  value: MarkerColor;
  onChange: (c: MarkerColor) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 dark:text-gray-400">Cor:</span>
      {MARKER_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-all",
            c.swatchCls,
            value === c.value
              ? "border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-300 dark:ring-gray-700"
              : "border-white dark:border-gray-700 hover:scale-105"
          )}
        />
      ))}
    </div>
  );
}
