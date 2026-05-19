"use client";

import { useState } from "react";
import { Pencil, Trash2, FileDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveIncidente, deletarIncidente, gerarComunicacaoAnpd, gerarCartaTitulares } from "./actions";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Inc = any;

function sevBadge(s: string) {
  if (s === "CRITICA") return <Badge variant="destructive">CRÍTICA</Badge>;
  if (s === "ALTA") return <Badge variant="destructive">ALTA</Badge>;
  if (s === "MEDIA") return <Badge variant="warning">MÉDIA</Badge>;
  return <Badge variant="default">BAIXA</Badge>;
}

// `qtdInventariosAprovados` segue na assinatura pra manter compat com a page.tsx
// e com o action publicarAviso (Inventário aprovado é pré-requisito de criação
// manual no servidor). Não é mais usado na UI porque a criação manual saiu.
export function IncidentesList({ items }: { items: Inc[]; qtdInventariosAprovados?: number }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inc | null>(null);
  const [loading, setLoading] = useState(false);

  function abrirEdicao(i: Inc) { setEditing(i); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await saveIncidente({
        id: editing?.id,
        titulo: String(fd.get("titulo") || ""),
        descricao: String(fd.get("descricao") || ""),
        severidade: String(fd.get("severidade") || "MEDIA") as any,
        status: String(fd.get("status") || "RASCUNHO"),
        ocorridoEm: String(fd.get("ocorridoEm") || ""),
        detectadoEm: String(fd.get("detectadoEm") || ""),
        comunicadoAnpd: fd.get("comunicadoAnpd") === "on",
        comunicadoTitular: fd.get("comunicadoTitular") === "on",
      });
      if (handlePhaseSkipResult(r)) return;
      toast.success(editing ? "Incidente atualizado" : "Incidente registrado");
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover este incidente?")) return;
    try {
      const r = await deletarIncidente(id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("Removido");
    } catch (e: any) { toast.error(e.message); }
  }

  async function gerarAnpd(id: string) {
    try {
      const texto = await gerarComunicacaoAnpd(id);
      downloadTxt(texto, "comunicacao-anpd.txt");
      toast.success("Texto da Comunicação ANPD baixado");
    } catch (e: any) { toast.error(e.message); }
  }
  async function gerarCarta(id: string) {
    try {
      const texto = await gerarCartaTitulares(id);
      downloadTxt(texto, "carta-titulares.txt");
      toast.success("Carta aos titulares baixada");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhum incidente registrado"
          description="Quando um incidente ocorrer (e não tenha dúvida que vai, só não sabemos quando!), lembrar que o prazo de comunicação à ANPD é muito curto (notificação em até 3 dias úteis). A notificação é obrigatória sempre que o incidente puder acarretar risco ou dano relevante aos titulares, como nos casos de discriminação ou danos à reputação."
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Incidente</TH>
                <TH>Severidade</TH>
                <TH>Ocorrido em</TH>
                <TH>Comunicado</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((i: any) => (
                <TR key={i.id}>
                  <TD>
                    <div className="font-medium">{i.titulo}</div>
                    {i.descricao && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.descricao}</div>}
                  </TD>
                  <TD>{sevBadge(i.severidade)}</TD>
                  <TD className="text-xs">
                    {i.ocorridoEm
                      ? new Date(i.ocorridoEm).toLocaleString("pt-BR")
                      : <span className="text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> sem data</span>}
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      {i.comunicadoAnpd && <Badge variant="success">ANPD</Badge>}
                      {i.comunicadoTitular && <Badge variant="success">Titular</Badge>}
                      {!i.comunicadoAnpd && !i.comunicadoTitular && <Badge variant="warning">pendente</Badge>}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => gerarAnpd(i.id)} title="Comunicação ANPD">
                        <FileDown className="h-4 w-4 text-brand-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => gerarCarta(i.id)} title="Carta titulares">
                        <FileDown className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(i)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deletar(i.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
            <DialogTitle>{editing ? "Editar incidente" : "Registrar incidente"}</DialogTitle>
            <DialogDescription>
              Velocidade + qualidade ganham. A LGPD exige comunicação "em prazo razoável" (Res. CD/ANPD nº 15/2024).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Título do incidente</Label>
                <Input name="titulo" required defaultValue={editing?.titulo || ""} placeholder="Ex: Vazamento da base de prontuários" />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea name="descricao" rows={3} defaultValue={editing?.descricao || ""} placeholder="O que aconteceu, dados afetados, suspeita inicial..." />
              </div>
              <div>
                <Label>Severidade</Label>
                <Select name="severidade" required defaultValue={editing?.severidade || "MEDIA"}>
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status || "RASCUNHO"}>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="ENCERRADO">Encerrado</option>
                </Select>
              </div>
              <div>
                <Label>Ocorrido em</Label>
                <Input
                  type="datetime-local"
                  name="ocorridoEm"
                  defaultValue={editing?.ocorridoEm ? new Date(editing.ocorridoEm).toISOString().slice(0, 16) : ""}
                />
              </div>
              <div>
                <Label>Detectado em</Label>
                <Input
                  type="datetime-local"
                  name="detectadoEm"
                  defaultValue={editing?.detectadoEm ? new Date(editing.detectadoEm).toISOString().slice(0, 16) : ""}
                />
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="comunicadoAnpd" defaultChecked={editing?.comunicadoAnpd ?? false} className="h-4 w-4" />
                  Comunicado à ANPD
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="comunicadoTitular" defaultChecked={editing?.comunicadoTitular ?? false} className="h-4 w-4" />
                  Comunicado aos titulares
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (editing ? "Atualizar" : "Registrar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
