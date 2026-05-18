"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, Send, CheckCircle2, RotateCcw, Trash2, AlertCircle, AlertTriangle, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createRipd, saveSecao, aprovarRipd, devolverRipd, deletarRipd, submeterRipd, aprovarRipdDireto, sugerirSecao } from "./actions";
import { LgpdHelp } from "@/components/lgpd-help";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

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
  qtdInventariosAprovados,
}: {
  ripds: Ripd[];
  inventariosDisponiveis: InventarioDisp[];
  qtdRiscos: number;
  qtdInventariosAprovados: number;
}) {
  const [inventarioId, setInventarioId] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function criar() {
    const inv = inventariosDisponiveis.find((i) => i.id === inventarioId);
    if (!inv) { toast.error("Escolha o processo do Inventário"); return; }
    const titulo = `RIPD do processo "${inv.nome}"`;
    startTransition(async () => {
      try {
        const r = await createRipd({ titulo, inventoryRef: inv.id });
        if (handlePhaseSkipResult(r)) return;
        toast.success("RIPD criado com as 8 seções ANPD");
        setInventarioId("");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  // Pré-requisitos LEGAIS — Art. 38, parágrafo único LGPD
  // Sem M1 ou M2, RIPD nasce vazio por definição. Bloqueia criação.
  const semInventarioAprovado = qtdInventariosAprovados === 0;
  const semRiscos = qtdRiscos === 0;
  const bloqueado = semInventarioAprovado || semRiscos;

  return (
    <>
      {/* Bloqueio firme quando faltam pré-requisitos legais */}
      {bloqueado && (
        <div className="border-l-4 border-red-500 bg-red-50 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 mb-1 text-sm">
                Pré-requisitos legais do RIPD não atendidos
              </div>
              <p className="text-red-900 text-xs leading-relaxed mb-2">
                O <strong>Art. 38, parágrafo único da LGPD</strong> exige que o RIPD contenha, no mínimo: <em>descrição dos tipos de dados coletados</em> (vem do Inventário), <em>metodologia de coleta e segurança</em> e <em>análise das medidas de mitigação de risco</em> (vem da Análise de Riscos). Sem esses dois insumos, o RIPD nasce vazio por definição.
              </p>
              <div className="space-y-2 mt-3">
                {semInventarioAprovado && (
                  <Link
                    href="/dashboard/inventario"
                    className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded mr-2"
                  >
                    Ir pro Inventário (Missão 1) <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {!semInventarioAprovado && semRiscos && (
                  <Link
                    href="/dashboard/riscos"
                    className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded mr-2"
                  >
                    Ir pra Análise de Riscos (Missão 2) <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <div className="text-[11px] text-red-700 mt-3 space-y-0.5">
                <div>{semInventarioAprovado ? "❌" : "✓"} Inventário — {qtdInventariosAprovados} processo(s) aprovado(s) {qtdInventariosAprovados === 0 && "(mínimo: 1)"}</div>
                <div>{semRiscos ? "❌" : "✓"} Análise de Riscos — {qtdRiscos} risco(s) identificado(s) {qtdRiscos === 0 && "(mínimo: 1)"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form de criação só aparece quando NÃO bloqueado */}
      {!bloqueado && (
        <div className="border rounded-lg p-4 bg-white mb-6">
          <h3 className="text-sm font-medium mb-2">Novo RIPD</h3>
          {inventariosDisponiveis.length === 0 ? (
            <div className="text-xs text-gray-500 py-2">
              Os processos aprovados já têm RIPD. Aprove novos processos no <Link href="/dashboard/inventario" className="text-brand-600 underline">Inventário</Link> pra criar mais RIPDs.
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
      )}

      {ripds.length === 0 ? (
        <EmptyState
          title="Nenhum RIPD criado ainda"
          description={bloqueado
            ? "Atenda os pré-requisitos legais acima antes de criar o RIPD."
            : "O RIPD é pré-requisito do Aviso de Privacidade. Escolha um processo aprovado do Inventário acima pra começar. Depois SUBMETE ao DPO."}
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
  // Caso especial: o próprio DPO criou o RIPD — não faz sentido "submeter pra si mesmo"
  // O botão vira "Aprovar (você é o DPO)" e pula direto pro status APROVADO.
  const dpoEDono = isDpo && ehDono;
  const podeAprovarDireto = dpoEDono && ["RASCUNHO", "DEVOLVIDO"].includes(ripd.status);
  const podeSubmeter = ehDono && !dpoEDono && ["RASCUNHO", "DEVOLVIDO"].includes(ripd.status);
  const podeAprovar = isDpo && ripd.status === "SUBMETIDO";
  const podeDevolver = isDpo && ripd.status === "SUBMETIDO";
  const podeRemover = ehDono && ripd.status !== "APROVADO";

  const preenchidas = ripd.sections.filter((s) => s.conteudo && s.conteudo.trim().length > 0).length;
  const [devolvendo, setDevolvendo] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [pendingAction, setPendingAction] = useState(false);

  async function submeter() {
    if (preenchidas < 8 && !confirm(`Apenas ${preenchidas} de 8 seções preenchidas. Submeter mesmo assim?`)) return;
    try {
      const r = await submeterRipd(ripd.id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("RIPD submetido ao DPO");
    } catch (e: any) { toast.error(e.message); }
  }
  async function aprovarDireto() {
    if (preenchidas < 8 && !confirm(`Apenas ${preenchidas} de 8 seções preenchidas. Aprovar mesmo assim?`)) return;
    try {
      const r = await aprovarRipdDireto(ripd.id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("RIPD aprovado");
    } catch (e: any) { toast.error(e.message); }
  }
  async function aprovar() {
    try {
      const r = await aprovarRipd(ripd.id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("RIPD aprovado");
    } catch (e: any) { toast.error(e.message); }
  }
  async function confirmarDevolucao() {
    setPendingAction(true);
    try {
      const r = await devolverRipd(ripd.id, motivoDevolucao);
      if (handlePhaseSkipResult(r)) { setPendingAction(false); return; }
      toast.success("RIPD devolvido com motivo");
      setDevolvendo(false); setMotivoDevolucao("");
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function deletar() {
    if (!confirm("Remover este RIPD e suas 8 seções?")) return;
    try {
      const r = await deletarRipd(ripd.id);
      if (handlePhaseSkipResult(r)) return;
      toast.success("RIPD removido");
    } catch (e: any) { toast.error(e.message); }
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
          {podeAprovarDireto && (
            <Button size="sm" variant="success" onClick={aprovarDireto} title="Você é o DPO — pode aprovar diretamente sem precisar submeter">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar (você é o DPO)
            </Button>
          )}
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

// Quais seções têm sugerirSecao() — bate com lib/ripd-sugestoes.ts
const SECOES_SUGERIVEIS = new Set([1, 2, 4, 5, 6, 8]);

function SecaoEditor({ ripdId, secao, podeEditar }: { ripdId: string; secao: Section; podeEditar: boolean }) {
  const [conteudo, setConteudo] = useState(secao.conteudo || "");
  const [pending, startTransition] = useTransition();
  const [sugerindo, setSugerindo] = useState(false);

  function salvar(textoOverride?: string) {
    const texto = textoOverride !== undefined ? textoOverride : conteudo;
    if (texto === (secao.conteudo || "")) return;
    startTransition(async () => {
      try {
        const r = await saveSecao(ripdId, secao.numero, texto);
        if (handlePhaseSkipResult(r)) return;
        toast.success(`Seção ${secao.numero} salva`);
      } catch (e: any) { toast.error(e.message); }
    });
  }

  async function sugerir() {
    if (!SECOES_SUGERIVEIS.has(secao.numero)) return;
    if (conteudo.trim().length > 0 && !confirm("Substituir o conteúdo atual pela sugestão gerada?")) return;
    setSugerindo(true);
    try {
      const r = await sugerirSecao(ripdId, secao.numero as any);
      if (handlePhaseSkipResult(r)) return;
      if (r && typeof r === "object" && "texto" in r) {
        setConteudo(r.texto);
        toast.success("Sugestão gerada — revise e ajuste antes de salvar");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setSugerindo(false); }
  }

  const podeSugerir = SECOES_SUGERIVEIS.has(secao.numero) && podeEditar;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <Badge variant="ghost">{secao.numero}</Badge>
        <h4 className="text-sm font-medium">{secao.titulo}</h4>
        <LgpdHelp campoKey={`ripd_secao_${secao.numero}`} />
        {podeSugerir && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={sugerir}
            disabled={sugerindo || pending}
            className="ml-auto h-7 text-[11px] text-brand-700 hover:bg-brand-50"
            title="Gera sugestão a partir do Inventário, Riscos e Encarregado já cadastrados"
          >
            <Sparkles className="h-3.5 w-3.5" /> {sugerindo ? "Gerando..." : "✨ Sugerir"}
          </Button>
        )}
      </div>
      <Textarea rows={3} value={conteudo} onChange={(e) => setConteudo(e.target.value)} onBlur={() => salvar()}
        placeholder="Preencha esta seção..." className="text-xs" disabled={pending || sugerindo || !podeEditar} />
    </div>
  );
}
