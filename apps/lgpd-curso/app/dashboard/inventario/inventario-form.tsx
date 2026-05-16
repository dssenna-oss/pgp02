"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { saveInventario } from "./actions";
import toast from "react-hot-toast";

type Inv = Awaited<ReturnType<typeof import("./actions").listInventario>>[number];

export function InventarioForm({
  inv,
  open,
  onOpenChange,
}: {
  inv: Inv | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isEdit = !!inv;
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await saveInventario({
        id: inv?.id,
        nome: String(fd.get("nome") || ""),
        setor: String(fd.get("setor") || ""),
        finalidade: String(fd.get("finalidade") || ""),
        baseLegal: String(fd.get("baseLegal") || ""),
        tiposDados: String(fd.get("tiposDados") || ""),
        dadosSensiveis: fd.get("dadosSensiveis") === "on",
        retencao: String(fd.get("retencao") || ""),
        compartilhamento: String(fd.get("compartilhamento") || ""),
        medidasSeguranca: String(fd.get("medidasSeguranca") || ""),
      });
      toast.success(isEdit ? "Processo atualizado" : "Processo criado");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar processo" : "Novo processo no Inventário"}</DialogTitle>
          <DialogDescription>
            Preencha na ordem: titulares → dados coletados → finalidade → base legal → retenção → compartilhamentos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do processo / serviço</Label>
              <Input name="nome" required defaultValue={inv?.nome || ""} placeholder="Ex: Atendimento no Posto Dr. Joaquim Bento" />
            </div>
            <div>
              <Label>Setor responsável</Label>
              <Input name="setor" defaultValue={inv?.setor || ""} placeholder="Ex: Secretaria de Saúde" />
            </div>
            <div>
              <Label>Base legal (Art. 7º / 11)</Label>
              <Select name="baseLegal" defaultValue={inv?.baseLegal || ""}>
                <option value="">— escolha —</option>
                <optgroup label="Art. 7º — Dados pessoais comuns">
                  <option value="art7-i">I — Consentimento</option>
                  <option value="art7-ii">II — Cumprimento de obrigação legal/regulatória</option>
                  <option value="art7-iii">III — Execução de políticas públicas (Adm. Pública)</option>
                  <option value="art7-iv">IV — Estudos por órgão de pesquisa</option>
                  <option value="art7-v">V — Execução de contrato</option>
                  <option value="art7-vi">VI — Exercício regular de direitos</option>
                  <option value="art7-vii">VII — Proteção da vida ou incolumidade física</option>
                  <option value="art7-viii">VIII — Tutela da saúde</option>
                  <option value="art7-ix">IX — Legítimo interesse do controlador</option>
                  <option value="art7-x">X — Proteção do crédito</option>
                </optgroup>
                <optgroup label="Art. 11 — Dados sensíveis">
                  <option value="art11-a">a — Consentimento específico</option>
                  <option value="art11-b-ii">b.II — Obrigação legal/regulatória</option>
                  <option value="art11-b-iii">b.III — Adm. Pública (políticas públicas)</option>
                  <option value="art11-b-iv">b.IV — Estudos por órgão de pesquisa</option>
                  <option value="art11-b-v">b.V — Exercício regular de direitos</option>
                  <option value="art11-b-vi">b.VI — Proteção da vida</option>
                  <option value="art11-b-vii">b.VII — Tutela da saúde</option>
                </optgroup>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Finalidade do tratamento</Label>
              <Textarea name="finalidade" rows={2} defaultValue={inv?.finalidade || ""} placeholder="Para que esses dados são tratados? Qual o resultado esperado?" />
            </div>
            <div className="col-span-2">
              <Label>Tipos de dados coletados</Label>
              <Textarea name="tiposDados" rows={2} defaultValue={inv?.tiposDados || ""} placeholder="Ex: nome, CPF, endereço, dados de saúde, prontuário..." />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                name="dadosSensiveis"
                id="dadosSensiveis"
                defaultChecked={inv?.dadosSensiveis ?? false}
                className="h-4 w-4"
              />
              <Label htmlFor="dadosSensiveis" className="mb-0">Contém dados pessoais sensíveis (saúde, origem, religião, biométricos...)</Label>
            </div>
            <div>
              <Label>Prazo de retenção</Label>
              <Input name="retencao" defaultValue={inv?.retencao || ""} placeholder="Ex: 5 anos após encerramento" />
            </div>
            <div>
              <Label>Compartilhamentos</Label>
              <Input name="compartilhamento" defaultValue={inv?.compartilhamento || ""} placeholder="Ex: Laboratório terceirizado, Sec. Estadual de Saúde" />
            </div>
            <div className="col-span-2">
              <Label>Medidas de segurança</Label>
              <Textarea name="medidasSeguranca" rows={2} defaultValue={inv?.medidasSeguranca || ""} placeholder="Controles de acesso, criptografia, backup, logs..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (isEdit ? "Atualizar" : "Criar processo")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
