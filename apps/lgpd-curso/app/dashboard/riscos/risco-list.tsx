"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, FileText, AlertTriangle, ArrowRight, Eye,
  Send, CheckCircle2, RotateCcw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RiscoForm } from "./risco-form";
import { MatrizRiscos } from "./matriz";
import { deletarRisco, submeterRiscosDoProcesso, aprovarRiscosDoProcesso, devolverRiscosDoProcesso } from "./actions";
import toast from "react-hot-toast";

type Risco = {
  id: string;
  riscoTitulo: string;
  descricao: string | null;
  severityLevel: string | null;
  inventoryId: string | null;
  status: string;
  feedbackDpo: string | null;
  inventory: { id: string; nome: string; createdById: string | null } | null;
};

type Inventory = {
  id: string;
  nome: string;
  setor: string | null;
  status: string;
  dadosSensiveis: boolean | null;
  createdById: string | null;
};

function severityBadge(level: string | null) {
  if (!level) return <Badge variant="ghost">—</Badge>;
  const sev = level.match(/S:(\w+)/)?.[1];
  if (sev === "ALTO") return <Badge variant="destructive">ALTO</Badge>;
  if (sev === "MEDIO") return <Badge variant="warning">MÉDIO</Badge>;
  return <Badge variant="success">BAIXO</Badge>;
}

function statusBadge(status: string) {
  if (status === "APROVADO") return <Badge variant="success">APROVADO</Badge>;
  if (status === "SUBMETIDO") return <Badge variant="primary">SUBMETIDO</Badge>;
  if (status === "DEVOLVIDO") return <Badge variant="destructive">DEVOLVIDO</Badge>;
  return <Badge variant="default">RASCUNHO</Badge>;
}

export function RiscoList({ riscos, inventories }: { riscos: Risco[]; inventories: Inventory[] }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [inventarioPreSelecionado, setInventarioPreSelecionado] = useState<string | null>(null);
  const [devolvendoInvId, setDevolvendoInvId] = useState<string | null>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [pendingAction, setPendingAction] = useState(false);

  const inventariosAprovados = inventories.filter((i) => i.status === "APROVADO");

  function podeMexer(r: Risco): boolean {
    if (isDpoOuAdmin) return true;
    if (!r.inventory) return false;
    return r.inventory.createdById === userId;
  }

  function abrirNovoParaProcesso(inventoryId: string) {
    setEditing(null);
    setInventarioPreSelecionado(inventoryId);
    setOpen(true);
  }
  function abrirNovoSemProcesso() {
    setEditing(null);
    setInventarioPreSelecionado(null);
    setOpen(true);
  }
  function abrirEdicao(r: any) {
    setEditing(r);
    setInventarioPreSelecionado(null);
    setOpen(true);
  }
  async function deletar(id: string) {
    if (!confirm("Remover este risco?")) return;
    try {
      await deletarRisco(id);
      toast.success("Risco removido");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  }
  async function submeter(inventoryId: string, nomeProcesso: string) {
    if (!confirm(`Submeter todos os riscos do processo "${nomeProcesso}" pro DPO revisar?`)) return;
    setPendingAction(true);
    try {
      const r = await submeterRiscosDoProcesso(inventoryId);
      toast.success(`${r.count} risco(s) submetido(s) ao DPO`);
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function aprovar(inventoryId: string, nomeProcesso: string) {
    if (!confirm(`Aprovar todos os riscos SUBMETIDOS do processo "${nomeProcesso}"?`)) return;
    setPendingAction(true);
    try {
      const r = await aprovarRiscosDoProcesso(inventoryId);
      toast.success(`${r.count} risco(s) aprovado(s)`);
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function confirmarDevolucao() {
    if (!devolvendoInvId) return;
    setPendingAction(true);
    try {
      const r = await devolverRiscosDoProcesso(devolvendoInvId, motivoDevolucao);
      toast.success(`${r.count} risco(s) devolvido(s) com motivo`);
      setDevolvendoInvId(null);
      setMotivoDevolucao("");
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }

  // Agrupa riscos por inventário pra mostrar contagem + status nos cards
  type StatusCounts = { rascunho: number; submetido: number; aprovado: number; devolvido: number; total: number; ultimoFeedback?: string | null };
  const statsPorInv = new Map<string, StatusCounts>();
  for (const r of riscos) {
    if (!r.inventoryId) continue;
    const cur = statsPorInv.get(r.inventoryId) || { rascunho: 0, submetido: 0, aprovado: 0, devolvido: 0, total: 0 };
    cur.total++;
    if (r.status === "RASCUNHO") cur.rascunho++;
    else if (r.status === "SUBMETIDO") cur.submetido++;
    else if (r.status === "APROVADO") cur.aprovado++;
    else if (r.status === "DEVOLVIDO") {
      cur.devolvido++;
      if (r.feedbackDpo && !cur.ultimoFeedback) cur.ultimoFeedback = r.feedbackDpo;
    }
    statsPorInv.set(r.inventoryId, cur);
  }

  const semVinculo = riscos.filter((r) => !r.inventoryId).length;

  const devolvendoInv = inventariosAprovados.find((i) => i.id === devolvendoInvId);

  return (
    <>
      {/* Cards por processo */}
      {inventariosAprovados.length === 0 ? (
        <div className="border-l-4 border-amber-400 bg-amber-50 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm mb-1">
                Nenhum processo aprovado ainda
              </div>
              <p className="text-amber-900 text-xs leading-relaxed mb-2">
                {isDpoOuAdmin
                  ? "Aprove ao menos 1 processo no Inventário pra começar a analisar riscos."
                  : "Você não é dono de nenhum processo aprovado neste grupo. Peça ao DPO se houver risco que você queira registrar."}
              </p>
              <Link
                href="/dashboard/inventario"
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-2 rounded"
              >
                Ir pro Inventário (Missão 1) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
            {isDpoOuAdmin ? "Processos do grupo — coordene as análises de risco" : "Seu(s) processo(s) — você só vê o que você é dono"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventariosAprovados.map((inv) => {
              const stats = statsPorInv.get(inv.id) || { rascunho: 0, submetido: 0, aprovado: 0, devolvido: 0, total: 0, ultimoFeedback: null as string | null };
              const ehDono = inv.createdById === userId;
              const podeSubmeter = (ehDono || isDpoOuAdmin) && (stats.rascunho > 0 || stats.devolvido > 0);
              const podeAprovar = isDpoOuAdmin && stats.submetido > 0;
              const podeDevolver = isDpoOuAdmin && stats.submetido > 0;

              return (
                <div key={inv.id} className="border-2 border-gray-200 hover:border-brand-300 rounded-lg p-3 bg-white transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-snug">{inv.nome}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{inv.setor || "—"}</div>
                    </div>
                    {inv.dadosSensiveis && <Badge variant="destructive" className="shrink-0">SENSÍVEIS</Badge>}
                  </div>

                  {/* Status dos riscos */}
                  <div className="flex flex-wrap gap-1 mb-2 text-[10px]">
                    {stats.rascunho > 0 && <Badge variant="default">{stats.rascunho} rascunho</Badge>}
                    {stats.submetido > 0 && <Badge variant="primary">{stats.submetido} submetido</Badge>}
                    {stats.aprovado > 0 && <Badge variant="success">{stats.aprovado} aprovado</Badge>}
                    {stats.devolvido > 0 && <Badge variant="destructive">{stats.devolvido} devolvido</Badge>}
                    {stats.total === 0 && <span className="text-gray-400 text-[11px]">Sem riscos ainda</span>}
                  </div>

                  {/* Feedback do DPO se houver devolução */}
                  {stats.devolvido > 0 && stats.ultimoFeedback && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-[11px]">
                      <div className="font-semibold text-red-800 flex items-center gap-1 mb-0.5">
                        <AlertCircle className="h-3 w-3" /> Motivo da devolução:
                      </div>
                      <div className="text-red-700 leading-relaxed">{stats.ultimoFeedback}</div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-1 flex-wrap mt-3">
                    <Button size="sm" variant="primary" onClick={() => abrirNovoParaProcesso(inv.id)}>
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                    {podeSubmeter && (
                      <Button size="sm" variant="success" onClick={() => submeter(inv.id, inv.nome)} disabled={pendingAction}>
                        <Send className="h-3.5 w-3.5" /> Submeter ao DPO
                      </Button>
                    )}
                    {podeAprovar && (
                      <Button size="sm" variant="success" onClick={() => aprovar(inv.id, inv.nome)} disabled={pendingAction}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar {stats.submetido}
                      </Button>
                    )}
                    {podeDevolver && (
                      <Button size="sm" variant="destructive" onClick={() => { setDevolvendoInvId(inv.id); setMotivoDevolucao(""); }} disabled={pendingAction}>
                        <RotateCcw className="h-3.5 w-3.5" /> Devolver
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risco sem vínculo — só DPO/admin */}
      {isDpoOuAdmin && (
        <div className="flex items-center justify-between mb-4 text-xs flex-wrap gap-2">
          <span className="text-gray-500">
            Tem um risco transversal (sem processo específico)? {semVinculo > 0 && <span>· {semVinculo} já registrado{semVinculo > 1 ? "s" : ""}</span>}
          </span>
          <Button size="sm" variant="ghost" onClick={abrirNovoSemProcesso}>
            <Plus className="h-3.5 w-3.5" /> Risco sem vínculo a processo
          </Button>
        </div>
      )}

      {/* Matriz visual */}
      {riscos.length > 0 && (
        <div className="mb-6">
          <MatrizRiscos riscos={riscos as any} />
        </div>
      )}

      {/* Tabela completa */}
      {riscos.length === 0 ? (
        <EmptyState
          title="Nenhum risco registrado ainda"
          description={inventariosAprovados.length > 0
            ? "Use os cards de processos acima pra registrar o primeiro risco."
            : "Aprove ao menos 1 processo no Inventário primeiro."}
        />
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH>Risco</TH>
                <TH>Processo</TH>
                <TH>Status</TH>
                <TH>Severidade</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {riscos.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <div className="font-medium">{r.riscoTitulo}</div>
                    {r.descricao && <div className="text-xs text-gray-500 mt-0.5">{r.descricao}</div>}
                  </TD>
                  <TD className="text-xs">{r.inventory?.nome || <span className="text-gray-400 italic">—</span>}</TD>
                  <TD>{statusBadge(r.status)}</TD>
                  <TD>{severityBadge(r.severityLevel)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {podeMexer(r) && r.status !== "APROVADO" ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => abrirEdicao(r)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deletar(r.id)} title="Remover">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 inline-flex items-center gap-1" title="Risco aprovado ou de outro processo — não pode editar">
                          <Eye className="h-3 w-3" /> só visualização
                        </span>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <RiscoForm
        risco={editing}
        inventories={inventories}
        inventarioPreSelecionado={inventarioPreSelecionado}
        open={open}
        onOpenChange={setOpen}
      />

      {/* Dialog de devolução */}
      <Dialog open={!!devolvendoInvId} onOpenChange={(v) => { if (!v) { setDevolvendoInvId(null); setMotivoDevolucao(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver riscos de "{devolvendoInv?.nome}"</DialogTitle>
            <DialogDescription>
              Explique objetivamente o que precisa ser corrigido. O Contribuidor responsável verá esta mensagem em todos os riscos devolvidos.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo da devolução</Label>
            <Textarea
              rows={4}
              value={motivoDevolucao}
              onChange={(e) => setMotivoDevolucao(e.target.value)}
              placeholder="Ex: 'Faltou plano de mitigação no risco 2. O cenário de vazamento está descrito mas não há recomendações técnicas (criptografia, MFA, etc.).'"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDevolvendoInvId(null); setMotivoDevolucao(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDevolucao} disabled={pendingAction || motivoDevolucao.trim().length < 5}>
              {pendingAction ? "Devolvendo..." : "Confirmar devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
