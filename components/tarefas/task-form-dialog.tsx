"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Tag, Calendar, ClipboardList } from "lucide-react";
import {
  TASK_PRIORITY_LABEL,
  CHIP_CLS_BY_COLOR,
  parseMarkers,
  type TaskDTO,
  type MarkerDTO,
  type TaskPriority,
} from "@/lib/tarefas-types";
import { cn } from "@/lib/utils";

interface ProcessOption {
  id: string;
  serviceName: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Tarefa em edição (se for null, é criação). */
  task: TaskDTO | null;
  markers: MarkerDTO[];
  processes: ProcessOption[];
  onSaved: () => Promise<void>;
}

/**
 * Modal de criar/editar tarefa.
 *
 * Campos: título (obrigatório), descrição, prioridade, prazo (data),
 * processo do inventário (opcional), marcadores (multi-seleção).
 */
export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  markers,
  processes,
  onSaved,
}: Props) {
  const isEdit = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIA");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
  const [dataInventoryId, setDataInventoryId] = useState<string>("__none__");
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Reset/hidrata quando o modal abre ou a tarefa muda
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setDataInventoryId(task.dataInventoryId ?? "__none__");
      setSelectedMarkers(parseMarkers(task.markers));
    } else {
      setTitle("");
      setDescription("");
      setPriority("MEDIA");
      setDueDate("");
      setDataInventoryId("__none__");
      setSelectedMarkers([]);
    }
  }, [open, task]);

  const toggleMarker = (name: string) => {
    setSelectedMarkers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    const t = title.trim();
    if (!t || t.length < 2) {
      toast.error("Título é obrigatório (mínimo 2 caracteres)");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: t,
        description: description.trim() || null,
        priority,
        dueDate: dueDate || null,
        dataInventoryId:
          dataInventoryId === "__none__" ? null : dataInventoryId,
        markers: selectedMarkers,
      };
      const res = isEdit
        ? await fetch(`/api/tarefas/${task!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/tarefas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erro ao salvar");
        return;
      }
      toast.success(isEdit ? "Tarefa atualizada!" : "Tarefa criada!");
      onOpenChange(false);
      await onSaved();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar tarefa" : "Nova tarefa"}
          </DialogTitle>
          <DialogDescription>
            Tarefa pessoal. Só você vê e edita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Título */}
          <div>
            <Label htmlFor="task-title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Atualizar política de retenção do RH"
              maxLength={200}
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="task-description">
              Descrição{" "}
              <span className="text-xs text-gray-500">(opcional)</span>
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, links, notas..."
              rows={3}
              maxLength={5000}
              className="mt-1"
            />
          </div>

          {/* Prioridade + Prazo (lado a lado em desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">
                    {TASK_PRIORITY_LABEL.BAIXA}
                  </SelectItem>
                  <SelectItem value="MEDIA">
                    {TASK_PRIORITY_LABEL.MEDIA}
                  </SelectItem>
                  <SelectItem value="ALTA">
                    {TASK_PRIORITY_LABEL.ALTA}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                Prazo{" "}
                <span className="text-xs text-gray-500">(opcional)</span>
              </Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Vínculo com processo do inventário */}
          {processes.length > 0 && (
            <div>
              <Label>
                <ClipboardList className="h-3.5 w-3.5 inline mr-1" />
                Vincular a um processo{" "}
                <span className="text-xs text-gray-500">(opcional)</span>
              </Label>
              <Select
                value={dataInventoryId}
                onValueChange={setDataInventoryId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sem vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem vínculo —</SelectItem>
                  {processes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.serviceName === "[Em preenchimento]"
                        ? "(processo sem nome)"
                        : p.serviceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Apenas processos aprovados. A tarefa vira "lembrete" daquele
                processo.
              </p>
            </div>
          )}

          {/* Marcadores */}
          <div>
            <Label>
              <Tag className="h-3.5 w-3.5 inline mr-1" />
              Marcadores{" "}
              <span className="text-xs text-gray-500">(opcional)</span>
            </Label>
            {markers.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">
                Você ainda não criou marcadores. Use o botão "Marcadores"
                no painel pra criar tags com cores personalizadas.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {markers.map((m) => {
                  const sel = selectedMarkers.includes(m.name);
                  const cls =
                    CHIP_CLS_BY_COLOR[
                      m.color as keyof typeof CHIP_CLS_BY_COLOR
                    ];
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMarker(m.name)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold transition",
                        sel ? cls : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                      )}
                    >
                      {sel && <X className="h-2.5 w-2.5" />}
                      {!sel && <Tag className="h-2.5 w-2.5" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || title.trim().length < 2}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
