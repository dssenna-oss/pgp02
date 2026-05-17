"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveDsr, deletarDsr } from "./actions";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Dsr = any;

const TIPOS = [
  { v: "ACESSO",        l: "Acesso aos dados (art. 18, II)" },
  { v: "CORRECAO",      l: "Correção de dados incompletos/inexatos (art. 18, III)" },
  { v: "EXCLUSAO",      l: "Exclusão / anonimização (art. 18, IV)" },
  { v: "PORTABILIDADE", l: "Portabilidade a outro fornecedor (art. 18, V)" },
  { v: "OPOSICAO",      l: "Oposição ao tratamento (art. 18, § 2º)" },
  { v: "INFO",          l: "Informações sobre tratamento (art. 9º)" },
  { v: "OUTRO",         l: "Outro" },
];

export function DsrList({ items }: { items: Dsr[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dsr | null>(null);
  const [loading, setLoading] = useState(false);

  function abrirNovo() { setEditing(null); setOpen(true); }
  function abrirEdicao(d: Dsr) { setEditing(d); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await saveDsr({
        id: editing?.id,
        titularNome: String(fd.get("titularNome") || ""),
        titularContato: String(fd.get("titularContato") || ""),
        tipoSolicitacao: String(fd.get("tipoSolicitacao") || "ACESSO"),
        descricao: String(fd.get("descricao") || ""),
        respostaTexto: String(fd.get("respostaTexto") || ""),
        status: String(fd.get("status") || "ABERTA"),
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success(editing ? "Solicitação atualizada" : "Solicitação registrada");
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover esta solicitação?")) return;
    try {
      const r = await deletarDsr(id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("Removida");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Nova solicitação
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Canal vazio"
          description="O canal do titular precisa existir antes de o Aviso de Privacidade ser publicado. Registre aqui solicitações simuladas (acesso, correção, exclusão) pra estruturar o fluxo."
          action={<Button onClick={abrirNovo}><Plus className="h-4 w-4" /> Simular primeira solicitação</Button>}
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Titular</TH>
                <TH>Tipo</TH>
                <TH>Status</TH>
                <TH>Recebida em</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((d: any) => (
                <TR key={d.id}>
                  <TD>
                    <div className="font-medium">{d.titularNome}</div>
                    <div className="text-xs text-gray-500">{d.titularContato}</div>
                  </TD>
                  <TD className="text-xs">{TIPOS.find((t) => t.v === d.tipoSolicitacao)?.l || d.tipoSolicitacao}</TD>
                  <TD>
                    <Badge variant={d.status === "RESPONDIDA" ? "success" : d.status === "NEGADA" ? "destructive" : "warning"}>
                      {d.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{new Date(d.createdAt).toLocaleDateString("pt-BR")}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deletar(d.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar solicitação" : "Nova solicitação do titular"}</DialogTitle>
            <DialogDescription>
              Prazo de resposta: 15 dias úteis (art. 19, II, LGPD).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Nome do titular</Label><Input name="titularNome" required defaultValue={editing?.titularNome || ""} /></div>
              <div><Label>Contato</Label><Input name="titularContato" required defaultValue={editing?.titularContato || ""} placeholder="e-mail ou telefone" /></div>
              <div className="col-span-2">
                <Label>Tipo de solicitação</Label>
                <Select name="tipoSolicitacao" required defaultValue={editing?.tipoSolicitacao || "ACESSO"}>
                  {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </Select>
              </div>
              <div className="col-span-2"><Label>Descrição</Label><Textarea name="descricao" rows={2} defaultValue={editing?.descricao || ""} /></div>
              <div className="col-span-2"><Label>Resposta dada ao titular</Label><Textarea name="respostaTexto" rows={3} defaultValue={editing?.respostaTexto || ""} placeholder="Texto da resposta (preencher quando responder)" /></div>
              <div className="col-span-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status || "ABERTA"}>
                  <option value="ABERTA">Aberta</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="RESPONDIDA">Respondida</option>
                  <option value="NEGADA">Negada (com justificativa)</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (editing ? "Atualizar" : "Criar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
