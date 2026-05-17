"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus, Pencil, Trash2, FileText, AlertTriangle, ArrowRight, Eye,
  Send, CheckCircle2, RotateCcw, AlertCircle, Users, Reply, RefreshCw, Unlock, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RiscoForm } from "./risco-form";
import { MatrizRiscos } from "./matriz";
import {
  deletarRisco,
  submeterRiscosDoProcesso,
  aprovarRiscosDoProcesso,
  devolverRiscosDoProcesso,
  tramitarRiscosParaApoio,
  devolverRiscosAoDPO,
  reabrirAnaliseDoProcesso,
} from "./actions";
import toast from "react-hot-toast";

type Risco = {
  id: string;
  riscoTitulo: string;
  descricao: string | null;
  severityLevel: string | null;
  inventoryId: string | null;
  status: string;
  feedbackDpo: string | null;
  tramitadoPara: string | null;
  tramitacaoNota: string | null;
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

const PAPEIS_DE_APOIO = [
  { value: "TI", label: "TI (Tecnologia da Informação)" },
  { value: "PROCURADORIA", label: "Procuradoria / Jurídico" },
  { value: "COMUNICACAO", label: "Comunicação" },
  { value: "ADMINISTRATIVO", label: "Administrativo (Contratos)" },
];

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
  const router = useRouter();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  const papel = session?.user?.papel;
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";

  // Polling a cada 8s + detecta mudanças relevantes (mesma pattern do Inventário)
  const previousRef = useRef<Map<string, { status: string; tramitadoPara: string | null }>>(new Map());
  useEffect(() => {
    const atual = new Map(riscos.map((r) => [r.id, { status: r.status, tramitadoPara: r.tramitadoPara }]));
    const anterior = previousRef.current;
    if (anterior.size > 0) {
      for (const r of riscos) {
        const prev = anterior.get(r.id);
        if (!prev) continue;
        const statusMudou = prev.status !== r.status;
        const tramitacaoMudou = prev.tramitadoPara !== r.tramitadoPara;

        if (statusMudou) {
          const ehDono = r.inventory?.createdById === userId;
          const titulo = r.riscoTitulo.slice(0, 40);
          if (r.status === "SUBMETIDO" && isDpoOuAdmin) {
            toast(`📥 Risco "${titulo}" foi submetido — sua revisão`, { duration: 7000, icon: "📥" });
          } else if (r.status === "APROVADO" && ehDono) {
            toast.success(`✓ DPO aprovou "${titulo}"`, { duration: 5000 });
          } else if (r.status === "DEVOLVIDO" && ehDono) {
            toast(`📝 DPO devolveu "${titulo}" — leia o motivo`, { duration: 7000, icon: "↻" });
          }
        }
        if (tramitacaoMudou) {
          const titulo = r.riscoTitulo.slice(0, 40);
          // Recebi tramitação?
          if (r.tramitadoPara === papel && prev.tramitadoPara !== papel) {
            toast(`👥 DPO pediu seu apoio em "${titulo}"`, { duration: 8000, icon: "👥" });
          }
          // Devolução pro DPO?
          if (!r.tramitadoPara && prev.tramitadoPara && isDpoOuAdmin) {
            toast(`↩ Setor ${prev.tramitadoPara} devolveu "${titulo}" pra você`, { duration: 7000, icon: "↩" });
          }
        }
      }
    }
    previousRef.current = atual;
  }, [riscos, userId, papel, isDpoOuAdmin]);

  // Polling silencioso a cada 8s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [inventarioPreSelecionado, setInventarioPreSelecionado] = useState<string | null>(null);
  const [devolvendoInvId, setDevolvendoInvId] = useState<string | null>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [tramitandoInvId, setTramitandoInvId] = useState<string | null>(null);
  const [papelDestino, setPapelDestino] = useState<string>("TI");
  const [notaTramitacao, setNotaTramitacao] = useState("");
  const [reabrindoInvId, setReabrindoInvId] = useState<string | null>(null);
  const [motivoReabertura, setMotivoReabertura] = useState("");
  const [pendingAction, setPendingAction] = useState(false);

  const inventariosAprovados = inventories.filter((i) => i.status === "APROVADO");

  // Pode EDITAR este risco?
  function podeEditar(r: Risco): boolean {
    // DPO/admin pode editar qualquer risco em qualquer estado (regra 2a)
    if (isDpoOuAdmin) return true;
    if (!r.inventory) return false;
    const ehDono = r.inventory.createdById === userId;
    const ehApoioTramitado = r.tramitadoPara === papel;
    // Contribuidor não mexe em risco APROVADO ou SUBMETIDO (regra 1)
    if (r.status === "APROVADO") return false;
    if (ehDono && !ehApoioTramitado && r.status === "SUBMETIDO") return false;
    return ehDono || ehApoioTramitado;
  }
  // Pode DELETAR este risco?
  function podeDeletar(r: Risco): boolean {
    if (!podeEditar(r)) return false;
    if (r.status === "APROVADO") return false; // nem DPO deleta APROVADO (só Reabrir + ajustar)
    return true;
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
  async function confirmarTramitacao() {
    if (!tramitandoInvId) return;
    setPendingAction(true);
    try {
      const r = await tramitarRiscosParaApoio(tramitandoInvId, papelDestino, notaTramitacao);
      toast.success(`${r.count} risco(s) tramitado(s) pra ${papelDestino}`);
      setTramitandoInvId(null);
      setNotaTramitacao("");
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function devolverAoDPO(inventoryId: string, nomeProcesso: string) {
    if (!confirm(`Devolver os riscos de "${nomeProcesso}" ao DPO (encerra sua participação como setor de apoio)?`)) return;
    setPendingAction(true);
    try {
      const r = await devolverRiscosAoDPO(inventoryId);
      toast.success(`${r.count} risco(s) devolvido(s) ao DPO`);
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }
  async function confirmarReabertura() {
    if (!reabrindoInvId) return;
    setPendingAction(true);
    try {
      const r = await reabrirAnaliseDoProcesso(reabrindoInvId, motivoReabertura);
      toast.success(`${r.count} risco(s) reabertos pra ajuste/expansão`);
      setReabrindoInvId(null);
      setMotivoReabertura("");
    } catch (e: any) { toast.error(e.message); }
    setPendingAction(false);
  }

  // Agrupa riscos por inventário pra mostrar contagem + status + tramitação nos cards
  type StatusCounts = {
    rascunho: number; submetido: number; aprovado: number; devolvido: number; total: number;
    tramitadoPara: string | null; tramitacaoNota: string | null;
    ultimoFeedback?: string | null;
  };
  const statsPorInv = new Map<string, StatusCounts>();
  for (const r of riscos) {
    if (!r.inventoryId) continue;
    const cur = statsPorInv.get(r.inventoryId) || { rascunho: 0, submetido: 0, aprovado: 0, devolvido: 0, total: 0, tramitadoPara: null, tramitacaoNota: null };
    cur.total++;
    if (r.status === "RASCUNHO") cur.rascunho++;
    else if (r.status === "SUBMETIDO") cur.submetido++;
    else if (r.status === "APROVADO") cur.aprovado++;
    else if (r.status === "DEVOLVIDO") {
      cur.devolvido++;
      if (r.feedbackDpo && !cur.ultimoFeedback) cur.ultimoFeedback = r.feedbackDpo;
    }
    if (r.tramitadoPara && !cur.tramitadoPara) {
      cur.tramitadoPara = r.tramitadoPara;
      cur.tramitacaoNota = r.tramitacaoNota;
    }
    statsPorInv.set(r.inventoryId, cur);
  }

  const semVinculo = riscos.filter((r) => !r.inventoryId).length;

  const devolvendoInv = inventariosAprovados.find((i) => i.id === devolvendoInvId);
  const tramitandoInv = inventariosAprovados.find((i) => i.id === tramitandoInvId);

  // Pra Contribuidor: detecta se TODOS os processos dele têm análise FECHADA
  // (sinal de "parte dele acabou — hora de passar pro DPO conduzir M3-M5")
  const meusInventarios = isDpoOuAdmin
    ? []
    : inventariosAprovados.filter((i) => i.createdById === userId);
  const meusTodosFechados = meusInventarios.length > 0 && meusInventarios.every((inv) => {
    const s = statsPorInv.get(inv.id);
    return s && s.total > 0 && s.aprovado === s.total;
  });

  return (
    <>
      {/* Indicador "ao vivo" */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Ao vivo · checa atualizações a cada 8s
        <button
          type="button"
          onClick={() => router.refresh()}
          className="ml-1 inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
          title="Verificar agora"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Banner de transição — Contribuidor finalizou sua parte */}
      {meusTodosFechados && (
        <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-900 mb-1 text-sm">
                Sua análise de riscos foi aprovada pelo DPO! 🎉
              </div>
              <p className="text-emerald-900 text-xs leading-relaxed">
                As próximas etapas (<strong>GAP Analysis, RIPD, Gestão de Terceiros, Aviso de Privacidade, Incidentes</strong>) são conduzidas pelo <strong>DPO do grupo</strong> — você não vê esses mini-apps na sua sidebar de propósito.
              </p>
              <p className="text-emerald-900 text-xs leading-relaxed mt-2">
                <strong>👥 Reúnam-se com o(a) DPO agora.</strong> Seu conhecimento sobre o processo continua sendo importante: o DPO pode pedir sua opinião durante as próximas missões (via tramitação ou na conversa). É hora de assistir e contribuir.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  : "Você não é dono de nenhum processo aprovado e não há tramitação pra você. Peça ao DPO se houver risco que você queira registrar."}
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
            {isDpoOuAdmin ? "Processos do grupo — coordene as análises de risco" : "Seu(s) processo(s) — donos + tramitações pra você"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventariosAprovados.map((inv) => {
              const stats = statsPorInv.get(inv.id) || { rascunho: 0, submetido: 0, aprovado: 0, devolvido: 0, total: 0, tramitadoPara: null as string | null, tramitacaoNota: null as string | null, ultimoFeedback: null as string | null };
              const ehDono = inv.createdById === userId;
              const ehApoioTramitado = stats.tramitadoPara === papel;
              // processoFechado = todos os riscos do processo APROVADOS (e existe ao menos 1)
              const processoFechado = stats.total > 0 && stats.aprovado === stats.total;
              // Não adiciona quando há SUBMETIDO esperando DPO (trabalho em lote)
              // Setor de apoio só edita os tramitados — não cria novos
              const podeAdicionar = !processoFechado
                && stats.submetido === 0
                && (ehDono || isDpoOuAdmin);
              const podeSubmeter = (ehDono || isDpoOuAdmin) && (stats.rascunho > 0 || stats.devolvido > 0) && !stats.tramitadoPara;
              const podeAprovar = isDpoOuAdmin && stats.submetido > 0 && !stats.tramitadoPara;
              const podeDevolverContribuidor = isDpoOuAdmin && stats.submetido > 0 && !stats.tramitadoPara;
              const podeTramitar = isDpoOuAdmin && stats.submetido > 0 && !stats.tramitadoPara;
              const podeDevolverAoDPO = ehApoioTramitado || (isDpoOuAdmin && stats.tramitadoPara);
              const podeReabrir = isDpoOuAdmin && processoFechado;

              const cardBorder = stats.tramitadoPara ? "border-violet-400" : processoFechado ? "border-emerald-400" : "border-gray-200 hover:border-brand-300";
              return (
                <div key={inv.id} className={`border-2 rounded-lg p-3 bg-white transition-colors ${cardBorder}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-snug">{inv.nome}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{inv.setor || "—"}</div>
                    </div>
                    {processoFechado && <Badge variant="success" className="shrink-0 inline-flex items-center gap-0.5"><Lock className="h-3 w-3" />FECHADO</Badge>}
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

                  {/* Tramitação ativa */}
                  {stats.tramitadoPara && (
                    <div className="bg-violet-50 border border-violet-300 rounded p-2 mb-2 text-[11px]">
                      <div className="font-semibold text-violet-900 flex items-center gap-1 mb-0.5">
                        <Users className="h-3 w-3" /> Em tramitação: aguardando apoio de <strong>{stats.tramitadoPara}</strong>
                      </div>
                      {stats.tramitacaoNota && (
                        <div className="text-violet-800 leading-relaxed italic">"{stats.tramitacaoNota}"</div>
                      )}
                    </div>
                  )}

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
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => abrirNovoParaProcesso(inv.id)}
                      disabled={!podeAdicionar}
                      title={
                        processoFechado
                          ? "Análise fechada — peça ao DPO pra reabrir antes de adicionar novos riscos"
                          : stats.submetido > 0
                            ? "Há risco(s) submetido(s) aguardando o DPO — aguarde a decisão antes de adicionar mais"
                            : ehApoioTramitado && !ehDono && !isDpoOuAdmin
                              ? "Setor de apoio só edita os riscos tramitados — não cria novos"
                              : undefined
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                    {podeReabrir && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setReabrindoInvId(inv.id); setMotivoReabertura(""); }}
                        disabled={pendingAction}
                        className="border border-amber-300 text-amber-700 hover:bg-amber-50"
                        title="Reabrir análise pra adicionar novos riscos ou ajustar os existentes"
                      >
                        <Unlock className="h-3.5 w-3.5" /> Reabrir análise
                      </Button>
                    )}
                    {podeSubmeter && (
                      <Button size="sm" variant="success" onClick={() => submeter(inv.id, inv.nome)} disabled={pendingAction}>
                        <Send className="h-3.5 w-3.5" /> Submeter ao DPO
                      </Button>
                    )}
                    {podeTramitar && (
                      <Button size="sm" variant="ghost" onClick={() => { setTramitandoInvId(inv.id); setNotaTramitacao(""); setPapelDestino("TI"); }} disabled={pendingAction} className="border border-violet-300 text-violet-700 hover:bg-violet-50">
                        <Users className="h-3.5 w-3.5" /> Pedir apoio
                      </Button>
                    )}
                    {podeAprovar && (
                      <Button size="sm" variant="success" onClick={() => aprovar(inv.id, inv.nome)} disabled={pendingAction}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar {stats.submetido}
                      </Button>
                    )}
                    {podeDevolverContribuidor && (
                      <Button size="sm" variant="destructive" onClick={() => { setDevolvendoInvId(inv.id); setMotivoDevolucao(""); }} disabled={pendingAction}>
                        <RotateCcw className="h-3.5 w-3.5" /> Devolver ao Contribuidor
                      </Button>
                    )}
                    {podeDevolverAoDPO && (
                      <Button size="sm" variant="success" onClick={() => devolverAoDPO(inv.id, inv.nome)} disabled={pendingAction}>
                        <Reply className="h-3.5 w-3.5" /> Devolver ao DPO
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

      {/* Matriz */}
      {riscos.length > 0 && (
        <div className="mb-6">
          <MatrizRiscos riscos={riscos as any} />
        </div>
      )}

      {/* Tabela */}
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
                    {r.tramitadoPara && (
                      <div className="text-[10px] text-violet-700 mt-0.5 inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> tramitado pra {r.tramitadoPara}
                      </div>
                    )}
                  </TD>
                  <TD className="text-xs">{r.inventory?.nome || <span className="text-gray-400 italic">—</span>}</TD>
                  <TD>{statusBadge(r.status)}</TD>
                  <TD>{severityBadge(r.severityLevel)}</TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      {podeEditar(r) ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => abrirEdicao(r)} title={r.status === "APROVADO" ? "Editar (risco APROVADO — só DPO pode)" : "Editar"}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {podeDeletar(r) && (
                            <Button size="sm" variant="ghost" onClick={() => deletar(r.id)} title="Remover">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 inline-flex items-center gap-1" title={r.status === "APROVADO" ? "Risco aprovado pelo DPO — peça reabertura ou devolução pra mexer" : "Risco de outro processo ou sem permissão"}>
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

      {/* Dialog: devolução pelo DPO ao Contribuidor */}
      <Dialog open={!!devolvendoInvId} onOpenChange={(v) => { if (!v) { setDevolvendoInvId(null); setMotivoDevolucao(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver riscos de "{devolvendoInv?.nome}" ao Contribuidor</DialogTitle>
            <DialogDescription>
              Explique o que precisa ser corrigido. O Contribuidor responsável vai ver esta mensagem.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo da devolução</Label>
            <Textarea
              rows={4}
              value={motivoDevolucao}
              onChange={(e) => setMotivoDevolucao(e.target.value)}
              placeholder="Ex: 'Faltou plano de mitigação no risco 2.'"
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

      {/* Dialog: reabertura de análise pelo DPO */}
      <Dialog open={!!reabrindoInvId} onOpenChange={(v) => { if (!v) { setReabrindoInvId(null); setMotivoReabertura(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔓 Reabrir análise de "{inventariosAprovados.find((i) => i.id === reabrindoInvId)?.nome}"</DialogTitle>
            <DialogDescription>
              Os riscos APROVADOS voltam pra DEVOLVIDO com o motivo abaixo. O Contribuidor responsável recebe a notificação e pode ajustar / adicionar novos riscos. Use só quando realmente precisar ajustar a análise — não como rotina.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo da reabertura</Label>
            <Textarea
              rows={4}
              value={motivoReabertura}
              onChange={(e) => setMotivoReabertura(e.target.value)}
              placeholder="Ex: 'Identificamos novo risco de transferência internacional via YouTube que não estava na análise original. Precisa incluir.'"
              autoFocus
            />
            <p className="text-[11px] text-gray-500 mt-1">Mínimo 10 caracteres</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReabrindoInvId(null); setMotivoReabertura(""); }}>Cancelar</Button>
            <Button onClick={confirmarReabertura} disabled={pendingAction || motivoReabertura.trim().length < 10} className="bg-amber-600 hover:bg-amber-700 text-white">
              {pendingAction ? "Reabrindo..." : "Confirmar reabertura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: tramitação multi-setor */}
      <Dialog open={!!tramitandoInvId} onOpenChange={(v) => { if (!v) { setTramitandoInvId(null); setNotaTramitacao(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>👥 Pedir apoio do Comitê LGPD pra "{tramitandoInv?.nome}"</DialogTitle>
            <DialogDescription>
              Análise de risco beneficia de visão multi-setor. Encaminhe pra TI, Procuradoria ou Comunicação dar opinião antes de aprovar. O setor recebe acesso temporário aos riscos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Encaminhar pra qual setor</Label>
              <Select value={papelDestino} onChange={(e) => setPapelDestino(e.target.value)}>
                {PAPEIS_DE_APOIO.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Nota explicativa (o que você precisa)</Label>
              <Textarea
                rows={4}
                value={notaTramitacao}
                onChange={(e) => setNotaTramitacao(e.target.value)}
                placeholder="Ex: 'TI, avaliem se a recomendação de MFA no Saúde+Municipal é viável até o fim do ano e qual o custo estimado de licenciamento.'"
                autoFocus
              />
              <p className="text-[11px] text-gray-500 mt-1">Mínimo 10 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTramitandoInvId(null); setNotaTramitacao(""); }}>Cancelar</Button>
            <Button onClick={confirmarTramitacao} disabled={pendingAction || notaTramitacao.trim().length < 10} className="bg-violet-600 hover:bg-violet-700 text-white">
              {pendingAction ? "Tramitando..." : `Tramitar pra ${papelDestino}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
