"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Send, CheckCircle2, RotateCcw, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createRipd, saveSecao, aprovarRipd, devolverRipd, deletarRipd, submeterRipd } from "./actions";
import toast from "react-hot-toast";

type Section = { id: string; numero: number; titulo: string; conteudo: string | null };
type Ripd = {
  id: string; titulo: string; status: string; inventoryRef: string | null;
  feedbackDpo: string | null; createdById: string | null;
  creator: { name: string; papel: string | null } | null;
  reviewer: { name: string; papel: string | null } | null;
  sections: Section[];
};

function statusBadge(status: string) {
  if (status === "APROVADO") return <Badge variant="success">APROVADO</Badge>;
  if (status === "SUBMETIDO") return <Badge variant="primary">SUBMETIDO</Badge>;
  if (status === "DEVOLVIDO") return <Badge variant="destructive">DEVOLVIDO</Badge>;
  return <Badge variant="default">RASCUNHO</Badge>;
}

type InventarioDisp = {
  id: string;
  nome: string;
  setor: string | null;
  dadosSensiveis: boolean | null;
};

export function RipdEditor({
  ripds,
  inventariosDisponiveis,
  qtdRiscos,
}: {
  ripds: Ripd[];
  inventariosDisponiveis: InventarioDisp[];
  qtdRiscos: number;
}) {
  const [inventarioId, setInventarioId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function criar() {
    const inv = inventariosDisponiveis.find((i) => i.id === inventarioId);
    if (!inv) { toast.error("Escolha o processo do Inventário"); return; }
    const titulo = `RIPD do processo "${inv.nome}"`;
    startTransition(async () => {
      try {
        await createRipd({ titulo, inventoryRef: inv.id });
        toast.success("RIPD criado com as 8 seções ANPD");
        setInventarioId("");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  // Pré-requisitos recomendados (NÃO bloqueia — só orienta)
  const semInventarioAprovado = inventariosDisponiveis.length === 0 && ripds.length === 0;
  const semRiscos = qtdRiscos === 0;

  return (
    <>
      {/* Banner de pré-requisitos quando algo está faltando */}
      {(semRiscos || semInventarioAprovado) && (
        <div className="border-l-4 border-amber-400 bg-amber-50 rounded p-3 mb-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-amber-900 mb-1">Pré-requisitos recomendados</div>
              <p className="text-amber-900 text-xs leading-relaxed mb-1">
                O RIPD fica mais forte quando se baseia em <strong>Inventário aprovado</strong> e <strong>riscos identificados</strong>. Você pode fazer assim mesmo, mas:
              </p>
              <ul className="text-xs space-y-0.5 text-amber-900">
                {semInventarioAprovado && (
                  <li>• <Link href="/dashboard/inventario" className="underline">Faça o Inventário (Missão 1)</Link> primeiro — RIPD se liga a um processo do inventário.</li>
                )}
                {semRiscos && (
                  <li>• <Link href="/dashboard/riscos" className="underline">Identifique os Riscos (Missão 2)</Link> — eles alimentam a Seção 5 do RIPD (medidas de mitigação).</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-white mb-6">
        <h3 className="text-sm font-medium mb-2">Novo RIPD</h3>
        {inventariosDisponiveis.length === 0 ? (
          <div className="text-xs text-gray-500 py-2">
            Nenhum processo do Inventário disponível pra gerar RIPD. {ripds.length > 0
              ? "Os processos aprovados já têm RIPD."
              : <>Volte em <Link href="/dashboard/inventario" className="text-brand-600 underline">Inventário</Link> e aprove pelo menos um processo primeiro.</>}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={inventarioId}
              onChange={(e) => setInventarioId(e.target.value)}
              className="flex-1"
            >
              <option value="">— Escolha o processo do Inventário —</option>
              {inventariosDisponiveis.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.nome}{inv.dadosSensiveis ? " · ⚠ SENSÍVEIS" : ""}{inv.setor ? ` · ${inv.setor}` : ""}
                </option>
              ))}
            </Select>
            <Button onClick={criar} disabled={pending || !inventarioId}>
              <Plus className="h-4 w-4" /> Criar RIPD
            </Button>
          </div>
        )}
        <p className="text-[11px] text-gray-500 mt-2">
          O RIPD é exigido pra tratamentos de alto risco (dados sensíveis · menores · larga escala · decisão automatizada · vigilância). Os 4 processos pré-cadastrados da turma têm SENSÍVEIS ou potencial de causar dano — todos merecem RIPD.
        </p>
      </div>

      {ripds.length === 0 ? (
        <EmptyState
          title="Nenhum RIPD criado ainda"
          description="O RIPD é pré-requisito do Aviso de Privacidade. Escolha um processo aprovado do Inventário acima pra começar. Depois SUBMETE ao DPO."
        />
      ) : (
        <div className="space-y-4">
          {ripds.map((r) => <RipdCard key={r.id} ripd={r} />)}
        </div>
      )}
    </>
  );
}

function RipdCard({ ripd }: { ripd: Ripd }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const isDpo = role === "DPO" || role === "ADMIN";
  const ehDono = ripd.createdById === userId;

  const podeEditar = (ehDono || isDpo) && ripd.status !== "APROVADO";
  const podeSubmeter = ehDono && ["RASCUNHO", "DEVOLVIDO"].includes(ripd.status);
  const podeAprovar = isDpo && ripd.status === "SUBMETIDO";
  const podeDevolver = isDpo && ripd.status === "SUBMETIDO";
  const podeRemover = ehDono && ripd.status !== "APROVADO";

  const preenchidas = ripd.sections.filter((s) => s.conteudo && s.conteudo.trim().length > 0).length;
  const [devolvendo, setDevolvendo] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [pendingAction, setPendingAction] = useState(false);

  async function submeter() {
    if (preenchidas < 8 && !confirm(`Apenas ${preenchidas} de 8 seções preenchidas. Submeter mesmo assim?`)) return;
    try { await submeterRipd(ripd.id); toast.success("RIPD submetido ao DPO"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function aprovar() {
    try { await aprovarRipd(ripd.id); toast.success("RIPD aprovado"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function confirmarDevolucao() {
    setPendingAction(true);
    try {
      await devolverRipd(ripd.id, motivoDevolucao);
      toast.success("RIPD devolvido com motivo");
      setDevolvendo(false); setMotivoDevolucao("");
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function deletar() {
    if (!confirm("Remover este RIPD e suas 8 seções?")) return;
    try { await deletarRipd(ripd.id); toast.success("RIPD removido"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="border rounded-lg bg-white">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b bg-gray-50">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {statusBadge(ripd.status)}
          <h3 className="text-sm font-semibold">{ripd.titulo}</h3>
          <span className="text-xs text-gray-500">{preenchidas}/8 seções</span>
          {ripd.creator && (
            <span className="text-xs text-gray-500">
              · Dono: <strong>{ripd.creator.papel || ripd.creator.name}</strong>
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {podeSubmeter && (
            <Button size="sm" variant="primary" onClick={submeter}>
              <Send className="h-3.5 w-3.5" /> Submeter ao DPO
            </Button>
          )}
          {podeAprovar && (
            <Button size="sm" variant="success" onClick={aprovar}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
            </Button>
          )}
          {podeDevolver && (
            <Button size="sm" variant="destructive" onClick={() => setDevolvendo(true)}>
              <RotateCcw className="h-3.5 w-3.5" /> Devolver
            </Button>
          )}
          {podeRemover && (
            <Button size="sm" variant="ghost" onClick={deletar}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      </header>

      {ripd.status === "DEVOLVIDO" && ripd.feedbackDpo && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs">
          <div className="font-semibold text-red-800 flex items-center gap-1 mb-1">
            <AlertCircle className="h-3.5 w-3.5" /> Motivo da devolução pelo DPO:
          </div>
          <div className="text-red-700">{ripd.feedbackDpo}</div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {ripd.sections.map((s) => (
          <SecaoEditor key={s.id} ripdId={ripd.id} secao={s} podeEditar={podeEditar} />
        ))}
      </div>

      <Dialog open={devolvendo} onOpenChange={setDevolvendo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver "{ripd.titulo}" ao contribuidor</DialogTitle>
            <DialogDescription>
              Indique objetivamente o que precisa ser corrigido nas 8 seções.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea rows={4} value={motivoDevolucao} onChange={(e) => setMotivoDevolucao(e.target.value)}
              placeholder="Ex: 'Seção 4 (riscos) está superficial — falta avaliar consequência pro titular. Seção 7 (compartilhamentos) não cita o IPAJM.'"
              autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolvendo(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarDevolucao} disabled={pendingAction || motivoDevolucao.trim().length < 5}>
              {pendingAction ? "Devolvendo..." : "Confirmar devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SecaoEditor({ ripdId, secao, podeEditar }: { ripdId: string; secao: Section; podeEditar: boolean }) {
  const [conteudo, setConteudo] = useState(secao.conteudo || "");
  const [pending, startTransition] = useTransition();

  function salvar() {
    if (conteudo === (secao.conteudo || "")) return;
    startTransition(async () => {
      try {
        await saveSecao(ripdId, secao.numero, conteudo);
        toast.success(`Seção ${secao.numero} salva`);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="ghost">{secao.numero}</Badge>
        <h4 className="text-sm font-medium">{secao.titulo}</h4>
      </div>
      <Textarea rows={3} value={conteudo} onChange={(e) => setConteudo(e.target.value)} onBlur={salvar}
        placeholder="Preencha esta seção..." className="text-xs" disabled={pending || !podeEditar} />
    </div>
  );
}
