"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveOperador, deletarOperador } from "./actions";
import toast from "react-hot-toast";

type Op = any;

export function TerceirosList({ items }: { items: Op[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Op | null>(null);
  const [loading, setLoading] = useState(false);

  function abrirNovo() { setEditing(null); setOpen(true); }
  function abrirEdicao(op: Op) { setEditing(op); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await saveOperador({
        id: editing?.id,
        nome: String(fd.get("nome") || ""),
        cnpj: String(fd.get("cnpj") || ""),
        servico: String(fd.get("servico") || ""),
        contato: String(fd.get("contato") || ""),
        contratoNumero: String(fd.get("contratoNumero") || ""),
        contratoObjeto: String(fd.get("contratoObjeto") || ""),
        clausulasLgpd: fd.get("clausulasLgpd") === "on",
      });
      toast.success(editing ? "Operador atualizado" : "Operador registrado");
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover este operador?")) return;
    try { await deletarOperador(id); toast.success("Operador removido"); }
    catch (e: any) { toast.error(e.message); }
  }

  const c = editing?.contracts?.[0];

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo operador
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum operador registrado"
          description="Operadores são terceiros que tratam dados em nome do TCEES (Art. 39 LGPD). Liste contratos vigentes — laboratórios, empresas terceirizadas, sistemas de TI hospedados."
          action={<Button onClick={abrirNovo}><Plus className="h-4 w-4" /> Registrar primeiro operador</Button>}
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Operador</TH>
                <TH>Serviço</TH>
                <TH>Contrato</TH>
                <TH>Cláusulas LGPD?</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((op: any) => {
                const ct = op.contracts?.[0];
                return (
                  <TR key={op.id}>
                    <TD>
                      <div className="font-medium">{op.nome}</div>
                      {op.cnpj && <div className="text-xs text-gray-500">{op.cnpj}</div>}
                    </TD>
                    <TD className="text-xs">{op.servico || "—"}</TD>
                    <TD className="text-xs">{ct?.numero || "—"}</TD>
                    <TD>
                      {ct?.clausulasLgpd ? (
                        <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />sim</Badge>
                      ) : (
                        <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />falta</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => abrirEdicao(op)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deletar(op.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar operador" : "Novo operador"}</DialogTitle>
            <DialogDescription>
              Operador = terceiro que trata dados em nome do TCEES. Sem cláusulas LGPD no contrato, o TCEES responde pelo erro do operador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Razão social</Label><Input name="nome" required defaultValue={editing?.nome || ""} /></div>
              <div><Label>CNPJ</Label><Input name="cnpj" defaultValue={editing?.cnpj || ""} placeholder="00.000.000/0000-00" /></div>
              <div><Label>Contato (e-mail/tel)</Label><Input name="contato" defaultValue={editing?.contato || ""} /></div>
              <div className="col-span-2"><Label>Serviço prestado</Label><Input name="servico" defaultValue={editing?.servico || ""} placeholder="Ex: hospedagem do sistema X, exames laboratoriais" /></div>
              <div><Label>Nº do contrato</Label><Input name="contratoNumero" defaultValue={c?.numero || ""} /></div>
              <div className="col-span-2"><Label>Objeto do contrato</Label><Textarea name="contratoObjeto" rows={2} defaultValue={c?.objeto || ""} /></div>
              <div className="col-span-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                <input type="checkbox" name="clausulasLgpd" id="clausulasLgpd" defaultChecked={c?.clausulasLgpd ?? false} className="h-4 w-4" />
                <Label htmlFor="clausulasLgpd" className="mb-0 text-amber-900">
                  Contrato contém cláusulas LGPD (art. 39 da LGPD)
                </Label>
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
