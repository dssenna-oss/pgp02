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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FORUM_CATEGORY_LABEL,
  FORUM_TYPE_LABEL,
  type ForumCategory,
  type ForumPostType,
} from "@/lib/forum-types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isDPO: boolean;
  onSaved: () => Promise<void>;
}

/**
 * Modal de criar novo post público (Discussão ou Comunicado).
 *
 * - Contribuidor só pode criar Discussão
 * - DPO pode criar os 2 + escolher fixar
 */
export default function NewPostDialog({
  open,
  onOpenChange,
  isDPO,
  onSaved,
}: Props) {
  const [type, setType] = useState<ForumPostType>("DISCUSSION");
  const [category, setCategory] = useState<ForumCategory>("GERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset ao fechar
      setType("DISCUSSION");
      setCategory("GERAL");
      setTitle("");
      setContent("");
      setPinned(false);
    }
  }, [open]);

  const handleSave = async () => {
    const t = title.trim();
    const c = content.trim();
    if (!t || t.length < 2) {
      toast.error("Título é obrigatório (mínimo 2 caracteres)");
      return;
    }
    if (!c) {
      toast.error("Conteúdo é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          title: t,
          content: c,
          pinned: isDPO ? pinned : false,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erro ao criar");
        return;
      }
      toast.success(
        type === "ANNOUNCEMENT" ? "Comunicado publicado!" : "Post criado!"
      );
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
          <DialogTitle>Novo post</DialogTitle>
          <DialogDescription>
            Visível pra toda a organização. Use Mensagem direta pra falar
            com alguém em particular.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Tipo (só DPO escolhe — Contribuidor é forçado a Discussion) */}
          {isDPO && (
            <div>
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ForumPostType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCUSSION">
                    {FORUM_TYPE_LABEL.DISCUSSION}
                  </SelectItem>
                  <SelectItem value="ANNOUNCEMENT">
                    {FORUM_TYPE_LABEL.ANNOUNCEMENT}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Comunicado é destacado e pode ser fixado no topo.
              </p>
            </div>
          )}

          {/* Categoria */}
          <div>
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ForumCategory)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GERAL">{FORUM_CATEGORY_LABEL.GERAL}</SelectItem>
                <SelectItem value="INVENTARIO">
                  {FORUM_CATEGORY_LABEL.INVENTARIO}
                </SelectItem>
                <SelectItem value="RISCOS">
                  {FORUM_CATEGORY_LABEL.RISCOS}
                </SelectItem>
                <SelectItem value="BASES_LEGAIS">
                  {FORUM_CATEGORY_LABEL.BASES_LEGAIS}
                </SelectItem>
                <SelectItem value="DUVIDA">
                  {FORUM_CATEGORY_LABEL.DUVIDA}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="post-title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treinamento de LGPD na próxima semana"
              maxLength={200}
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <Label htmlFor="post-content">
              Conteúdo <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui..."
              rows={6}
              className="mt-1"
            />
          </div>

          {/* Fixar (só DPO + só pra Comunicado faz mais sentido, mas
              permitimos pra qualquer post se for DPO) */}
          {isDPO && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Fixar no topo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Posts fixados aparecem antes dos demais. Use pra
                  comunicados importantes.
                </p>
              </div>
              <Switch checked={pinned} onCheckedChange={setPinned} />
            </div>
          )}
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
            disabled={saving || title.trim().length < 2 || content.trim() === ""}
            className="w-full sm:w-auto"
          >
            {saving ? "Publicando..." : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
