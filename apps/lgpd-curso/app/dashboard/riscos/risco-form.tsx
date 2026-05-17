"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LgpdHelp } from "@/components/lgpd-help";
import { riscoTipicoDoProcesso } from "@/lib/lgpd-refs";
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
  const [loading, setLoading] = useState(false);

  // Form controlado pra permitir Sugerir preencher
  const [inventoryId, setInventoryId] = useState("");
  const [riscoTitulo, setRiscoTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [probabilidade, setProbabilidade] = useState<"BAIXA" | "MEDIA" | "ALTA">("MEDIA");
  const [impacto, setImpacto] = useState<"BAIXO" | "MEDIO" | "ALTO">("MEDIO");
  const [mitigationPlan, setMitigationPlan] = useState("");

  // Reseta state quando dialog abre
  useEffect(() => {
    if (!open) return;
    const initial = parseLevel(risco?.severityLevel);
    setInventoryId(risco?.inventoryId || inventarioPreSelecionado || "");
    setRiscoTitulo(risco?.riscoTitulo || "");
    setDescricao(risco?.descricao || "");
    setCategoria(risco?.categoria || "");
    setProbabilidade((initial.p as any) || "MEDIA");
    setImpacto((initial.i as any) || "MEDIO");
    setMitigationPlan(risco?.mitigationPlan || "");
  }, [open, risco, inventarioPreSelecionado]);

  // Sugestão depende do nome do processo selecionado
  const invSelecionado = inventories.find((i) => i.id === inventoryId);
  const sugestao = riscoTipicoDoProcesso(invSelecionado?.nome);

  function aplicarSugestao() {
    if (!sugestao) return;
    setRiscoTitulo(sugestao.riscoTitulo);
    setDescricao(sugestao.descricao);
    setCategoria(sugestao.categoria);
    setProbabilidade(sugestao.probabilidade);
    setImpacto(sugestao.impacto);
    setMitigationPlan(sugestao.mitigationPlan);
    toast("Risco típico aplicado — REVISE antes de salvar", { icon: "✨" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveRisco({
        id: risco?.id,
        inventoryId: inventoryId || undefined,
        riscoTitulo,
        descricao,
        categoria,
        probabilidade,
        impacto,
        mitigationPlan,
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
            {sugestao && !isEdit && (
              <span className="block mt-1 text-brand-700">
                💡 Existe um risco típico mapeado pra este processo. Use ✨ Sugerir abaixo pra começar (revise antes de salvar).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Processo relacionado (opcional)</Label>
            <Select value={inventoryId} onChange={(e) => setInventoryId(e.target.value)}>
              <option value="">— sem vínculo —</option>
              {inventories.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </Select>
          </div>

          {sugestao && !isEdit && (
            <div className="border border-brand-300 bg-brand-50 rounded p-2 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-brand-900">
                ✨ Risco típico disponível: <strong>{sugestao.riscoTitulo.slice(0, 50)}{sugestao.riscoTitulo.length > 50 ? "..." : ""}</strong>
              </span>
              <Button type="button" size="sm" variant="primary" onClick={aplicarSugestao}>
                <Sparkles className="h-3.5 w-3.5" /> Sugerir
              </Button>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-1">
              Título do risco
              <LgpdHelp campoKey="riscoDescricao" />
            </Label>
            <Input value={riscoTitulo} onChange={(e) => setRiscoTitulo(e.target.value)} required placeholder="Ex: Vazamento da base de prontuários" />
          </div>

          <div>
            <Label className="flex items-center gap-1">
              Descrição
              <LgpdHelp campoKey="riscoDescricao" />
            </Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Em que cenário esse risco se materializa? (ameaça + vulnerabilidade + impacto no cidadão)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="flex items-center gap-1">
                Categoria
                <LgpdHelp campoKey="riscoCategoria" />
              </Label>
              <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">—</option>
                <option value="CONFIDENCIALIDADE">Confidencialidade</option>
                <option value="INTEGRIDADE">Integridade</option>
                <option value="DISPONIBILIDADE">Disponibilidade</option>
                <option value="BASE_LEGAL">Base legal</option>
                <option value="DIREITOS_TITULAR">Direitos do titular</option>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                Probabilidade
                <LgpdHelp campoKey="riscoProbabilidade" />
              </Label>
              <Select value={probabilidade} onChange={(e) => setProbabilidade(e.target.value as any)} required>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                Impacto
                <LgpdHelp campoKey="riscoImpacto" />
              </Label>
              <Select value={impacto} onChange={(e) => setImpacto(e.target.value as any)} required>
                <option value="BAIXO">Baixo</option>
                <option value="MEDIO">Médio</option>
                <option value="ALTO">Alto</option>
              </Select>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1">
              Plano de mitigação (recomendações)
              <LgpdHelp campoKey="riscoMitigacao" />
            </Label>
            <Textarea value={mitigationPlan} onChange={(e) => setMitigationPlan(e.target.value)} rows={4} placeholder="Como reduzir esse risco? Liste ações técnicas + administrativas, com responsável e prazo se possível." />
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
