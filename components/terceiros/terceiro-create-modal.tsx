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
import { Loader2, Handshake } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  OPERATOR_TYPE,
  operatorTypeLabel,
} from "@/lib/operadores-helpers";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  /** Pré-preenche a razão social (Checkpoint 14 G4 — auto-import). */
  prefillName?: string;
  /** Vincula automaticamente ao processo do Inventário ao criar. */
  linkInventoryId?: string;
  /** Texto livre da atividade neste processo (vai pra OperatorProcessLink). */
  linkActivityDescription?: string;
}

export default function TerceiroCreateModal({
  open,
  onClose,
  onCreated,
  prefillName,
  linkInventoryId,
  linkActivityDescription,
}: Props) {
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [operatorType, setOperatorType] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Sempre que o modal abre com prefillName novo, popula o campo
  useEffect(() => {
    if (open && prefillName) setName(prefillName);
  }, [open, prefillName]);

  const reset = () => {
    setName("");
    setTradeName("");
    setCnpj("");
    setOperatorType("");
  };

  const handleCreate = async () => {
    const n = name.trim();
    if (!n) {
      toast.error("Razão social é obrigatória");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          tradeName: tradeName.trim() || null,
          cnpj: cnpj.trim() || null,
          operatorType: operatorType || null,
          linkInventoryId: linkInventoryId || undefined,
          linkActivityDescription: linkActivityDescription || undefined,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar operador");
        return;
      }
      const j = await r.json();
      reset();
      toast.success("Operador cadastrado — abrindo detalhes…");
      onCreated(j.operator.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !creating && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-blue-600" />
            Cadastrar terceiro
          </DialogTitle>
          <DialogDescription>
            Cadastro inicial — dados do contrato, posição na relação,
            critérios de risco e cláusulas presentes você completa na
            tela de detalhes depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="op-name">Razão social *</Label>
            <Input
              id="op-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Acme Tecnologia Ltda."
              disabled={creating}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="op-trade">Nome fantasia</Label>
              <Input
                id="op-trade"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Acme"
                disabled={creating}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="op-cnpj">CNPJ</Label>
              <Input
                id="op-cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                disabled={creating}
                maxLength={30}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="op-type">Tipo de operador</Label>
            <select
              id="op-type"
              value={operatorType}
              onChange={(e) => setOperatorType(e.target.value)}
              disabled={creating}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="">— Selecionar —</option>
              {Object.values(OPERATOR_TYPE).map((t) => (
                <option key={t} value={t}>
                  {operatorTypeLabel(t)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Categorização opcional pra facilitar filtros depois.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cadastrando…
              </>
            ) : (
              "Cadastrar e abrir detalhes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
