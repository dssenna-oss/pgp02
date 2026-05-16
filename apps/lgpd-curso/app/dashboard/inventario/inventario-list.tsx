"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Pencil, Trash2, Send, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InventarioForm } from "./inventario-form";
import {
  aprovarInventario, devolverInventario, deletarInventario, submeterInventario,
} from "./actions";
import toast from "react-hot-toast";

type Inv = {
  id: string;
  nome: string;
  setor: string | null;
  baseLegal: string | null;
  dadosSensiveis: boolean | null;
  status: string;
  feedbackDpo: string | null;
  createdById: string | null;
  creator: { name: string; papel: string | null } | null;
  reviewer: { name: string; papel: string | null } | null;
};

function statusBadge(status: string) {
  if (status === "APROVADO") return <Badge variant="success">APROVADO</Badge>;
  if (status === "SUBMETIDO") return <Badge variant="primary">SUBMETIDO</Badge>;
  if (status === "DEVOLVIDO") return <Badge variant="destructive">DEVOLVIDO</Badge>;
  return <Badge variant="default">RASCUNHO</Badge>;
}

export function InventarioList({ items }: { items: Inv[] }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isDpo = role === "DPO" || role === "ADMIN";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [devolvendo, setDevolvendo] = useState<Inv | null>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [pending, setPending] = useState(false);

  function abrirNovo() { setEditing(null); setOpen(true); }
  function abrirEdicao(inv: Inv) { setEditing(inv); setOpen(true); }

  async function submeter(id: string) {
    try { await submeterInventario(id); toast.success("Processo submetido ao DPO"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function aprovar(id: string) {
    try { await aprovarInventario(id); toast.success("Processo aprovado"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function confirmarDevolucao() {
    if (!devolvendo) return;
    setPending(true);
    try {
      await devolverInventario(devolvendo.id, motivoDevolucao);
      toast.success("Processo devolvido ao contribuidor com o motivo");
      setDevolvendo(null);
      setMotivoDevolucao("");
    } catch (e: any) { toast.error(e.message); }
    setPending(false);
  }
  async function deletar(id: string) {
    if (!confirm("Tem certeza? Esta ação é definitiva.")) return;
    try { await deletarInventario(id); toast.success("Processo removido"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <>
      {/* "Novo processo" só pra DPO/ADMIN — contribuidores só editam o pré-seed. */}
      {isDpo && (
        <div className="flex justify-end mb-3">
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo processo
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum processo no Inventário ainda"
          description={
            isDpo
              ? "O grupo recebe 2 processos pré-cadastrados pela 'Criar turma'. Se ainda não aparecem, peça ao facilitador. Você (DPO) também pode adicionar novos processos."
              : "O grupo recebe 2 processos pré-cadastrados pela 'Criar turma'. Se ainda não aparecem, peça ao facilitador ou ao DPO do grupo."
          }
          action={isDpo ? <Button onClick={abrirNovo}><Plus className="h-4 w-4" /> Adicionar processo</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {items.map((inv) => {
            const ehDono = inv.createdById === userId;
            const podeEditar = ehDono || isDpo;
            const podeSubmeter = ehDono && ["RASCUNHO", "DEVOLVIDO"].includes(inv.status);
            const podeAprovar = isDpo && inv.status === "SUBMETIDO";
            const podeDevolver = isDpo && inv.status === "SUBMETIDO";
            const podeRemover = ehDono && inv.status !== "APROVADO";

            return (
              <div key={inv.id} className="border rounded-lg bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{inv.nome}</h3>
                    <div className="text-xs text-gray-500 mt-0.5">{inv.setor || "—"}</div>
                  </div>
                  <div className="flex gap-1 flex-wrap items-center">
                    {statusBadge(inv.status)}
                    {inv.dadosSensiveis && <Badge variant="destructive">SENSÍVEIS</Badge>}
                  </div>
                </div>

                <div className="text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-gray-400">Dono: </span>
                    <strong>{inv.creator?.papel || "—"}</strong>
                    {inv.creator?.name && <span className="text-gray-500"> · {inv.creator.name.split(" · ")[0]}</span>}
                  </div>
                  <div>
                    <span className="text-gray-400">Revisor (DPO): </span>
                    {inv.reviewer ? <strong>{inv.reviewer.name.split(" · ")[0]}</strong> : <span className="text-gray-400">—</span>}
                  </div>
                  <div>
                    <span className="text-gray-400">Base legal: </span>
                    {inv.baseLegal || <span className="text-amber-600">faltando</span>}
                  </div>
                </div>

                {inv.status === "DEVOLVIDO" && inv.feedbackDpo && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3 text-xs">
                    <div className="font-semibold text-red-800 flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Motivo da devolução pelo DPO:
                    </div>
                    <div className="text-red-700">{inv.feedbackDpo}</div>
                  </div>
                )}

                <div className="flex gap-1 flex-wrap justify-end">
                  {podeEditar && (
                    <Button size="sm" variant="outline" onClick={() => abrirEdicao(inv)}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </Button>
                  )}
                  {podeSubmeter && (
                    <Button size="sm" variant="primary" onClick={() => submeter(inv.id)}>
                      <Send className="h-3.5 w-3.5" /> Submeter ao DPO
                    </Button>
                  )}
                  {podeAprovar && (
                    <Button size="sm" variant="success" onClick={() => aprovar(inv.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                    </Button>
                  )}
                  {podeDevolver && (
                    <Button size="sm" variant="destructive" onClick={() => setDevolvendo(inv)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Devolver
                    </Button>
                  )}
                  {podeRemover && (
                    <Button size="sm" variant="ghost" onClick={() => deletar(inv.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InventarioForm inv={editing} open={open} onOpenChange={setOpen} />

      {/* Dialog de devolução */}
      <Dialog open={!!devolvendo} onOpenChange={(v) => { if (!v) { setDevolvendo(null); setMotivoDevolucao(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver "{devolvendo?.nome}" ao contribuidor</DialogTitle>
            <DialogDescription>
              Explique objetivamente o que precisa ser corrigido. O contribuidor verá esta mensagem e poderá ajustar.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea
              rows={4}
              value={motivoDevolucao}
              onChange={(e) => setMotivoDevolucao(e.target.value)}
              placeholder="Ex: 'Falta a base legal. Como há dados de saúde, é Art. 11 e não Art. 7º. Reveja também o prazo de retenção.'"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDevolvendo(null); setMotivoDevolucao(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDevolucao} disabled={pending || motivoDevolucao.trim().length < 5}>
              {pending ? "Devolvendo..." : "Confirmar devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
