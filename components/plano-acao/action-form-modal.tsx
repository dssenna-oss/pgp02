"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  type ActionPlanDTO,
  ACTION_PRIORITY,
  ACTION_STATUS,
} from "@/lib/action-plan-helpers";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  /** null = criar nova; objeto = editar existente */
  action: ActionPlanDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ActionFormModal({ action, onClose, onSaved }: Props) {
  const isEdit = !!action;
  const [title, setTitle] = useState(action?.title ?? "");
  const [description, setDescription] = useState(action?.description ?? "");
  const [notes, setNotes] = useState(action?.notes ?? "");
  const [priority, setPriority] = useState<string>(action?.priority ?? ACTION_PRIORITY.MEDIA);
  const [status, setStatus] = useState<string>(action?.status ?? ACTION_STATUS.A_FAZER);
  const [assigneeId, setAssigneeId] = useState<string>(action?.assigneeId ?? "_unassigned");
  const [dueDate, setDueDate] = useState<string>(
    action?.dueDate ? action.dueDate.slice(0, 10) : "",
  );
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  // Carrega lista de users da org pra escolher responsável
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/team", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          // /api/team devolve { members: [{id, name, email, role}] }
          setUsers(j.members ?? j ?? []);
        }
      } catch {
        // sem responsáveis disponíveis — fica vazio
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        priority,
        status,
        assigneeId: assigneeId && assigneeId !== "_unassigned" ? assigneeId : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      const r = await fetch(
        isEdit ? `/api/plano-acao/${action!.id}` : "/api/plano-acao",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      toast.success(isEdit ? "Ação atualizada" : "Ação criada");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar ação" : "Nova ação do Plano"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Título *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Definir base legal para Sistema de RH"
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Descrição
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="O que precisa ser feito? Contexto, requisitos, links..."
              maxLength={5000}
            />
          </div>

          {/* Linha: Prioridade + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Prioridade
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ACTION_PRIORITY.ALTA}>Alta</SelectItem>
                  <SelectItem value={ACTION_PRIORITY.MEDIA}>Média</SelectItem>
                  <SelectItem value={ACTION_PRIORITY.BAIXA}>Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ACTION_STATUS.A_FAZER}>A fazer</SelectItem>
                  <SelectItem value={ACTION_STATUS.EM_ANDAMENTO}>
                    Em andamento
                  </SelectItem>
                  <SelectItem value={ACTION_STATUS.CONCLUIDA}>
                    Concluída
                  </SelectItem>
                  <SelectItem value={ACTION_STATUS.CANCELADA}>
                    Cancelada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha: Responsável + Prazo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Responsável
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unassigned">— Sem responsável —</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Prazo
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Notas / observações internas
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Andamento, decisões em curso, links pra reuniões..."
              maxLength={5000}
            />
          </div>

          {/* Origem (informativo, read-only) */}
          {action && action.origin !== "MANUAL" && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-800 dark:text-blue-300">
              <strong>Origem:</strong> {action.refLabel ?? action.origin}
              <br />
              Esta ação foi criada automaticamente pelo "Importar pendentes".
              Pode editar título, prazo, responsável e prioridade normalmente.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
