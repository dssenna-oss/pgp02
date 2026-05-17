"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Download, Target, AlertTriangle, ClipboardCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  savePlanoAcao,
  deletarPlanoAcao,
  atualizarStatus,
  importarDeRiscosEGap,
} from "./actions";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Acao = any;

const ABAS = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA"] as const;
const LABELS_ABA: Record<string, string> = {
  ABERTA: "Em aberto",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluídas",
};

export function PlanoAcaoList({ items }: { items: Acao[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Acao | null>(null);
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState(false);
  const [aba, setAba] = useState<typeof ABAS[number]>("ABERTA");

  const contagens = useMemo(() => {
    const c: Record<string, number> = { ABERTA: 0, EM_ANDAMENTO: 0, CONCLUIDA: 0 };
    for (const a of items) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [items]);

  const itensDaAba = items.filter((a) => a.status === aba);

  function abrirNovo() { setEditing(null); setOpen(true); }
  function abrirEdicao(a: Acao) { setEditing(a); setOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await savePlanoAcao({
        id: editing?.id,
        acao: String(fd.get("acao") || ""),
        responsavel: String(fd.get("responsavel") || ""),
        prazoIso: (fd.get("prazo") as string) || null,
        status: String(fd.get("status") || "ABERTA"),
        prioridade: String(fd.get("prioridade") || "MEDIA"),
      });
      toast.success(editing ? "Ação atualizada" : "Ação criada");
      setOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  }

  async function deletar(id: string) {
    if (!confirm("Remover esta ação?")) return;
    try { await deletarPlanoAcao(id); toast.success("Removida"); }
    catch (e: any) { toast.error(e.message); }
  }

  async function mudarStatus(id: string, novoStatus: string) {
    try {
      await atualizarStatus(id, novoStatus);
      toast.success("Status atualizado");
    } catch (e: any) { toast.error(e.message); }
  }

  async function importar() {
    setImportando(true);
    try {
      const res = await importarDeRiscosEGap();
      if (res.criados === 0) {
        toast(
          `Nada novo pra importar. ${res.jaExistiam > 0 ? `(${res.jaExistiam} já estavam aqui)` : "Você ainda não tem Riscos ALTO nem GAPs NÃO ADERENTE."}`,
          { duration: 5000 },
        );
      } else {
        toast.success(`${res.criados} nova(s) ação(ões) criada(s) automaticamente!`);
      }
    } catch (e: any) { toast.error(e.message); } finally { setImportando(false); }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Nova ação manual
          </Button>
          <Button variant="outline" onClick={importar} disabled={importando} title="Pega automaticamente Riscos ALTO + GAPs NÃO ADERENTE e cria como ações abertas">
            <Download className="h-4 w-4" />
            {importando ? "Importando..." : "Importar de Riscos e GAP"}
          </Button>
        </div>
      </div>

      {/* Abas de status */}
      <div className="border-b mb-4 flex gap-1">
        {ABAS.map((s) => (
          <button
            key={s}
            onClick={() => setAba(s)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              aba === s
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-600 hover:text-gray-900",
            )}
          >
            {LABELS_ABA[s]}
            <span className={cn(
              "ml-1.5 inline-flex items-center justify-center text-[10px] font-mono rounded-full min-w-[18px] h-[18px] px-1",
              aba === s ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-600",
            )}>
              {contagens[s] || 0}
            </span>
          </button>
        ))}
      </div>

      {itensDaAba.length === 0 ? (
        <EmptyState
          title={
            aba === "ABERTA" ? "Nenhuma ação em aberto" :
            aba === "EM_ANDAMENTO" ? "Nada em andamento" :
            "Nenhuma ação concluída ainda"
          }
          description={
            aba === "ABERTA"
              ? "Clique em \"Importar de Riscos e GAP\" pra trazer automaticamente cada Risco ALTO e cada GAP NÃO ADERENTE como ação aqui. Ou crie manualmente pra ações específicas que você identificou."
              : "Mude o status de uma ação para vê-la nesta aba."
          }
          action={
            aba === "ABERTA" ? (
              <div className="flex gap-2">
                <Button onClick={importar} disabled={importando}>
                  <Download className="h-4 w-4" /> Importar agora
                </Button>
                <Button variant="outline" onClick={abrirNovo}>
                  <Plus className="h-4 w-4" /> Criar manual
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Ação</TH>
                <TH>Origem</TH>
                <TH>Prioridade</TH>
                <TH>Responsável</TH>
                <TH>Prazo</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {itensDaAba.map((a: any) => (
                <TR key={a.id}>
                  <TD>
                    <div className="font-medium text-sm">{a.acao}</div>
                  </TD>
                  <TD>
                    <OrigemBadge origem={a.origem} />
                  </TD>
                  <TD>
                    <PrioridadeBadge prioridade={a.prioridade} />
                  </TD>
                  <TD className="text-xs">
                    {a.responsavel ? (
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{a.responsavel}</span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </TD>
                  <TD className="text-xs">
                    {a.prazo ? new Date(a.prazo).toLocaleDateString("pt-BR") : <span className="text-gray-400 italic">—</span>}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {a.status === "ABERTA" && (
                        <Button size="sm" variant="outline" onClick={() => mudarStatus(a.id, "EM_ANDAMENTO")} title="Marcar como em andamento">
                          ▶
                        </Button>
                      )}
                      {a.status === "EM_ANDAMENTO" && (
                        <Button size="sm" variant="outline" onClick={() => mudarStatus(a.id, "CONCLUIDA")} title="Marcar como concluída">
                          ✓
                        </Button>
                      )}
                      {a.status === "CONCLUIDA" && (
                        <Button size="sm" variant="ghost" onClick={() => mudarStatus(a.id, "ABERTA")} title="Reabrir">
                          ↻
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deletar(a.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
            <DialogTitle>{editing ? "Editar ação" : "Nova ação"}</DialogTitle>
            <DialogDescription>
              Descreva a ação, defina prioridade, responsável e prazo. Ações importadas automaticamente vêm com origem e ficam editáveis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label>Ação</Label>
              <Input name="acao" required defaultValue={editing?.acao || ""} placeholder="Ex: Implementar MFA nos sistemas críticos" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select name="prioridade" defaultValue={editing?.prioridade || "MEDIA"}>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status || "ABERTA"}>
                  <option value="ABERTA">Em aberto</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="CONCLUIDA">Concluída</option>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Input name="responsavel" defaultValue={editing?.responsavel || ""} placeholder="Ex: Departamento de TI" />
              </div>
              <div>
                <Label>Prazo</Label>
                <Input name="prazo" type="date" defaultValue={editing?.prazo ? new Date(editing.prazo).toISOString().slice(0, 10) : ""} />
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

function OrigemBadge({ origem }: { origem: string }) {
  if (origem === "RISCO") {
    return (
      <Badge variant="destructive" className="text-[10px]">
        <AlertTriangle className="h-3 w-3" /> RISCO
      </Badge>
    );
  }
  if (origem === "GAP") {
    return (
      <Badge variant="warning" className="text-[10px]">
        <ClipboardCheck className="h-3 w-3" /> GAP
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="text-[10px]">
      <Target className="h-3 w-3" /> MANUAL
    </Badge>
  );
}

function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const cor =
    prioridade === "ALTA" ? "bg-red-100 text-red-800 border-red-200" :
    prioridade === "BAIXA" ? "bg-gray-100 text-gray-700 border-gray-200" :
    "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cor}`}>
      {prioridade}
    </span>
  );
}
