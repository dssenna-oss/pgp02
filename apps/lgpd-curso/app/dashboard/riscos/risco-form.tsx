"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { saveRisco } from "./actions";
import toast from "react-hot-toast";

type Inv = { id: string; nome: string };
type Risco = any;

function parseLevel(severityLevel: string | null | undefined) {
  if (!severityLevel) return { p: "MEDIA", i: "MEDIO" };
  const parts = Object.fromEntries(severityLevel.split(";").map((kv) => kv.split(":")));
  const pMap: Record<string, string> = { B: "BAIXA", M: "MEDIA", A: "ALTA" };
  const iMap: Record<string, string> = { B: "BAIXO", M: "MEDIO", A: "ALTO" };
  return { p: pMap[parts.P] || "MEDIA", i: iMap[parts.I] || "MEDIO" };
}

export function RiscoForm({
  risco,
  inventories,
  inventarioPreSelecionado,
  open,
  onOpenChange,
}: {
  risco: Risco | null;
  inventories: Inv[];
  inventarioPreSelecionado?: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isEdit = !!risco;
  const initial = parseLevel(risco?.severityLevel);
  const [loading, setLoading] = useState(false);
  const inventoryIdDefault = risco?.inventoryId || inventarioPreSelecionado || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await saveRisco({
        id: risco?.id,
        inventoryId: String(fd.get("inventoryId") || "") || undefined,
        riscoTitulo: String(fd.get("riscoTitulo") || ""),
        descricao: String(fd.get("descricao") || ""),
        categoria: String(fd.get("categoria") || ""),
        probabilidade: String(fd.get("probabilidade") || "MEDIA") as any,
        impacto: String(fd.get("impacto") || "MEDIO") as any,
        mitigationPlan: String(fd.get("mitigationPlan") || ""),
      });
      toast.success(isEdit ? "Risco atualizado" : "Risco registrado");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar risco" : "Novo risco"}</DialogTitle>
          <DialogDescription>
            Risco não é abstrato — é o que pode acontecer com o cidadão se algo falhar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Processo relacionado (opcional)</Label>
            <Select name="inventoryId" defaultValue={inventoryIdDefault} key={inventoryIdDefault /* re-monta select quando muda pré-seleção */}>
              <option value="">— sem vínculo —</option>
              {inventories.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </Select>
          </div>
          <div>
            <Label>Título do risco</Label>
            <Input name="riscoTitulo" required defaultValue={risco?.riscoTitulo || ""} placeholder="Ex: Vazamento da base de prontuários" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea name="descricao" rows={2} defaultValue={risco?.descricao || ""} placeholder="Em que cenário esse risco se materializa?" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select name="categoria" defaultValue={risco?.categoria || ""}>
                <option value="">—</option>
                <option value="CONFIDENCIALIDADE">Confidencialidade</option>
                <option value="INTEGRIDADE">Integridade</option>
                <option value="DISPONIBILIDADE">Disponibilidade</option>
                <option value="BASE_LEGAL">Base legal</option>
                <option value="DIREITOS_TITULAR">Direitos do titular</option>
              </Select>
            </div>
            <div>
              <Label>Probabilidade</Label>
              <Select name="probabilidade" defaultValue={initial.p} required>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </Select>
            </div>
            <div>
              <Label>Impacto</Label>
              <Select name="impacto" defaultValue={initial.i} required>
                <option value="BAIXO">Baixo</option>
                <option value="MEDIO">Médio</option>
                <option value="ALTO">Alto</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Plano de mitigação (recomendações)</Label>
            <Textarea name="mitigationPlan" rows={3} defaultValue={risco?.mitigationPlan || ""} placeholder="Como reduzir esse risco? (ex: criptografia, segregação de acesso, treinamento da equipe)" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (isEdit ? "Atualizar" : "Criar risco")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
