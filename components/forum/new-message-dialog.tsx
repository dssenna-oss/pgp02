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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  setor?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Pré-seleciona um destinatário (ex: "Responder Fulano"). Opcional. */
  initialRecipientId?: string | null;
  onSaved: () => Promise<void>;
}

/**
 * Modal de envio de mensagem direta 1-pra-1.
 *
 * Lista os outros usuários da org no select e permite escolher quem
 * vai receber. Decisão 9a: todos podem mandar pra todos.
 */
export default function NewMessageDialog({
  open,
  onOpenChange,
  initialRecipientId,
  onSaved,
}: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [recipientId, setRecipientId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!open) {
      setRecipientId("");
      setTitle("");
      setContent("");
      return;
    }
    setRecipientId(initialRecipientId ?? "");
    void loadUsers();
  }, [open, initialRecipientId]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await fetch("/api/forum/usuarios");
      if (r.ok) {
        const j = await r.json();
        setUsers(j.users ?? []);
      }
    } catch {
      // silencioso
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async () => {
    if (!recipientId) {
      toast.error("Escolha um destinatário");
      return;
    }
    const t = title.trim();
    const c = content.trim();
    if (!t || t.length < 2) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!c) {
      toast.error("Mensagem é obrigatória");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/forum/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          title: t,
          content: c,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao enviar");
        return;
      }
      toast.success("Mensagem enviada!");
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
          <DialogTitle>Nova mensagem direta</DialogTitle>
          <DialogDescription>
            Só você e o destinatário verão essa conversa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Destinatário */}
          <div>
            <Label>
              Para <span className="text-red-500">*</span>
            </Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    loadingUsers ? "Carregando..." : "Escolha um usuário..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex flex-col">
                      <span>{u.name ?? u.email}</span>
                      {(u.setor || u.role) && (
                        <span className="text-xs text-gray-500">
                          {[u.role, u.setor].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {users.length === 0 && !loadingUsers && (
                  <SelectItem value="__none__" disabled>
                    Nenhum outro usuário na organização
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="msg-title">
              Assunto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="msg-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dúvida sobre o processo de RH"
              maxLength={200}
              className="mt-1"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <Label htmlFor="msg-content">
              Mensagem <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="msg-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui..."
              rows={6}
              className="mt-1"
            />
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
            onClick={handleSend}
            disabled={
              saving ||
              !recipientId ||
              title.trim().length < 2 ||
              content.trim() === ""
            }
            className="w-full sm:w-auto"
          >
            {saving ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
