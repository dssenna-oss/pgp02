"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Plus,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  FileUp,
  Sparkles,
  Trash2,
  Pencil,
  ListChecks,
  CalendarRange,
  FileText,
  Paperclip,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Tipos (espelham o DTO da API)
// ============================================================

type Eixo = "ONBOARDING" | "PILULAS" | "PRATICA" | "DEPARTAMENTAL" | "MONITORAMENTO";
type AudienceKey =
  | "GERAL" | "RH_MARKETING" | "TI_SEGURANCA" | "EXTERNOS"
  | "DIRETORIA" | "ATENDIMENTO" | "NOVOS_COLABORADORES";
type StatusKey = "PLANEJADO" | "REALIZADO" | "CANCELADO";
type TypeKey =
  | "PALESTRA" | "WORKSHOP" | "TREINAMENTO" | "EMAIL" | "VIDEO"
  | "CAMPANHA" | "SIMULADO" | "QUIZ" | "OUTRO";
type RecurrenceKey = "UNICO" | "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

interface CapacitacaoEvento {
  id: string;
  title: string;
  description: string | null;
  eixo: Eixo;
  eixoLabel: string;
  type: TypeKey;
  typeLabel: string;
  audience: AudienceKey;
  audienceLabel: string;
  scheduledAt: string | null;
  completedAt: string | null;
  status: StatusKey;
  statusLabel: string;
  recurrence: RecurrenceKey;
  recurrenceLabel: string;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  attendeesCount: number | null;
  notes: string | null;
  operator: { id: string; name: string } | null;
  incident: { id: string; title: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  items: CapacitacaoEvento[];
  stats: {
    total: number;
    byStatus: Record<StatusKey, number>;
    byEixo: Record<Eixo, number>;
    byAudience: Record<AudienceKey, number>;
    nextScheduled: { id: string; title: string; scheduledAt: string } | null;
    eixosCovered: number;
    audiencesCovered: number;
    withEvidence: number;
  };
}

const EIXO_OPTIONS: { value: Eixo; label: string; icon: string }[] = [
  { value: "ONBOARDING", label: "Onboarding", icon: "🎓" },
  { value: "PILULAS", label: "Pílulas", icon: "💊" },
  { value: "PRATICA", label: "Prática/Gamificação", icon: "🎮" },
  { value: "DEPARTAMENTAL", label: "Departamental", icon: "🏢" },
  { value: "MONITORAMENTO", label: "Monitoramento", icon: "📊" },
];

const TYPE_OPTIONS: { value: TypeKey; label: string }[] = [
  { value: "PALESTRA", label: "Palestra" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "TREINAMENTO", label: "Treinamento (E-learning)" },
  { value: "EMAIL", label: "E-mail / Newsletter" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "CAMPANHA", label: "Campanha visual" },
  { value: "SIMULADO", label: "Simulado (phishing)" },
  { value: "QUIZ", label: "Quiz / Gamificação" },
  { value: "OUTRO", label: "Outro" },
];

const AUDIENCE_OPTIONS: { value: AudienceKey; label: string }[] = [
  { value: "GERAL", label: "Geral (todos)" },
  { value: "RH_MARKETING", label: "RH e Marketing" },
  { value: "TI_SEGURANCA", label: "TI e Segurança" },
  { value: "EXTERNOS", label: "Externos / Terceiros" },
  { value: "DIRETORIA", label: "Diretoria" },
  { value: "ATENDIMENTO", label: "Atendimento (SAC)" },
  { value: "NOVOS_COLABORADORES", label: "Novos Colaboradores" },
];

const STATUS_OPTIONS: { value: StatusKey; label: string }[] = [
  { value: "PLANEJADO", label: "Planejado" },
  { value: "REALIZADO", label: "Realizado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const RECURRENCE_OPTIONS: { value: RecurrenceKey; label: string }[] = [
  { value: "UNICO", label: "Único" },
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
];

interface FormState {
  id: string | null;
  title: string;
  description: string;
  eixo: Eixo;
  type: TypeKey;
  audience: AudienceKey;
  status: StatusKey;
  recurrence: RecurrenceKey;
  scheduledAt: string;
  completedAt: string;
  attendeesCount: string;
  notes: string;
  operatorId: string;
  incidentId: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  eixo: "ONBOARDING",
  type: "PALESTRA",
  audience: "GERAL",
  status: "PLANEJADO",
  recurrence: "UNICO",
  scheduledAt: "",
  completedAt: "",
  attendeesCount: "",
  notes: "",
  operatorId: "",
  incidentId: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function statusBadgeClasses(s: StatusKey): string {
  switch (s) {
    case "REALIZADO":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "PLANEJADO":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
    case "CANCELADO":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

// ============================================================
// Componente principal
// ============================================================

export default function CapacitacaoContent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filterEixo, setFilterEixo] = useState<Eixo | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusKey | "ALL">("ALL");
  const [view, setView] = useState<"list" | "timeline">("list");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
  const [operators, setOperators] = useState<Array<{ id: string; name: string }>>([]);
  const [incidents, setIncidents] = useState<Array<{ id: string; title: string }>>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/capacitacao", { cache: "no-store" });
      if (r.status === 403) {
        setForbidden(true);
      } else if (r.ok) {
        setData(await r.json());
        setForbidden(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega vínculos (operadores + incidentes) sob demanda na primeira abertura do modal
  const loadLinks = useCallback(async () => {
    if (operators.length > 0 || incidents.length > 0) return;
    try {
      const [opRes, incRes] = await Promise.all([
        fetch("/api/operadores").catch(() => null),
        fetch("/api/incidents").catch(() => null),
      ]);
      if (opRes?.ok) {
        const j = await opRes.json();
        setOperators((j.items ?? []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name })));
      }
      if (incRes?.ok) {
        const j = await incRes.json();
        setIncidents((j.items ?? []).map((i: { id: string; title: string }) => ({ id: i.id, title: i.title })));
      }
    } catch {
      // silencioso
    }
  }, [operators.length, incidents.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtros aplicados client-side (lista já vem inteira)
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((e) => {
      if (filterEixo !== "ALL" && e.eixo !== filterEixo) return false;
      if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterEixo, filterStatus]);

  // Cronograma agrupa por mês
  const timelineGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, CapacitacaoEvento[]>();
    for (const e of filtered) {
      const ref = e.completedAt ?? e.scheduledAt;
      const key = ref ? new Date(ref).toLocaleString("pt-BR", { month: "long", year: "numeric" }) : "Sem data";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
  }, [data, filtered]);

  function openCreate() {
    loadLinks();
    setEditing({ ...EMPTY_FORM });
  }

  function openEdit(ev: CapacitacaoEvento) {
    loadLinks();
    setEditing({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? "",
      eixo: ev.eixo,
      type: ev.type,
      audience: ev.audience,
      status: ev.status,
      recurrence: ev.recurrence,
      scheduledAt: ev.scheduledAt ? ev.scheduledAt.slice(0, 10) : "",
      completedAt: ev.completedAt ? ev.completedAt.slice(0, 10) : "",
      attendeesCount: ev.attendeesCount?.toString() ?? "",
      notes: ev.notes ?? "",
      operatorId: ev.operator?.id ?? "",
      incidentId: ev.incident?.id ?? "",
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        title: editing.title,
        description: editing.description || null,
        eixo: editing.eixo,
        type: editing.type,
        audience: editing.audience,
        status: editing.status,
        recurrence: editing.recurrence,
        scheduledAt: editing.scheduledAt || null,
        completedAt: editing.completedAt || null,
        attendeesCount: editing.attendeesCount ? parseInt(editing.attendeesCount, 10) : null,
        notes: editing.notes || null,
        operatorId: editing.operatorId || null,
        incidentId: editing.incidentId || null,
      };
      const url = editing.id ? `/api/capacitacao/${editing.id}` : "/api/capacitacao";
      const method = editing.id ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        setEditing(null);
        await fetchData();
      } else {
        const j = await r.json().catch(() => ({}));
        alert(j.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este evento de capacitação? A evidência também será removida.")) return;
    const r = await fetch(`/api/capacitacao/${id}`, { method: "DELETE" });
    if (r.ok) {
      await fetchData();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error ?? "Erro ao excluir");
    }
  }

  async function importCatalog() {
    if (!confirm("Importar 18 tarefas de sensibilização para suas Tarefas pessoais? Tarefas já existentes não serão duplicadas.")) return;
    setImporting(true);
    try {
      const r = await fetch("/api/capacitacao/import-tasks", { method: "POST" });
      if (r.ok) {
        const j = await r.json();
        setImportResult({ created: j.created, skipped: j.skipped });
      } else {
        const j = await r.json().catch(() => ({}));
        alert(j.error ?? "Erro ao importar");
      }
    } finally {
      setImporting(false);
    }
  }

  async function uploadEvidence(id: string, file: File) {
    setUploadingFor(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/capacitacao/${id}/upload-evidencia`, {
        method: "POST",
        body: fd,
      });
      if (r.ok) {
        await fetchData();
      } else {
        const j = await r.json().catch(() => ({}));
        alert(j.error ?? "Erro ao enviar evidência");
      }
    } finally {
      setUploadingFor(null);
    }
  }

  async function removeEvidence(id: string) {
    if (!confirm("Remover a evidência anexada? O evento fica preservado.")) return;
    const r = await fetch(`/api/capacitacao/${id}/upload-evidencia`, { method: "DELETE" });
    if (r.ok) await fetchData();
  }

  if (forbidden) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
          <p className="text-gray-600">Esta tela é trabalhada pelo DPO da organização.</p>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-6 text-center text-gray-500">Carregando...</div>
    );
  }

  const stats = data.stats;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-amber-600" />
            Capacitação LGPD
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-3xl">
            Registro temporal de evidências do programa de sensibilização. Base legal:
            Art. 41§2º I, 50, 6º VIII e 52§1º VIII LGPD.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={importCatalog} variant="outline" disabled={importing}>
            <ListChecks className="h-4 w-4 mr-2" />
            {importing ? "Importando..." : "Importar checklist"}
          </Button>
          <a href="/api/capacitacao/export-evidencia">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar DOCX
            </Button>
          </a>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo evento
          </Button>
        </div>
      </div>

      {/* Resultado da importação */}
      {importResult && (
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm">
              <strong>Importação concluída:</strong> {importResult.created} tarefas criadas, {importResult.skipped} já existiam.
              Veja em <a href="/dashboard/tarefas" className="underline">Tarefas</a>.
            </div>
            <button onClick={() => setImportResult(null)} className="text-gray-500 hover:text-gray-700">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={<FileText className="h-5 w-5" />} label="Total" value={stats.total} />
        <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Realizados" value={stats.byStatus.REALIZADO} color="emerald" />
        <Kpi icon={<Clock className="h-5 w-5" />} label="Planejados" value={stats.byStatus.PLANEJADO} color="blue" />
        <Kpi icon={<Target className="h-5 w-5" />} label="Eixos cobertos" value={`${stats.eixosCovered}/5`} color={stats.eixosCovered === 5 ? "emerald" : "amber"} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Públicos cobertos" value={`${stats.audiencesCovered}/7`} color={stats.audiencesCovered >= 5 ? "emerald" : "amber"} />
      </div>

      {/* Próxima sessão */}
      {stats.nextScheduled && (
        <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <strong>Próxima sessão:</strong> {stats.nextScheduled.title} — {formatDate(stats.nextScheduled.scheduledAt)}
          </div>
        </Card>
      )}

      {/* Filtros + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1">
          <FilterPill active={filterEixo === "ALL"} onClick={() => setFilterEixo("ALL")}>
            Todos os eixos
          </FilterPill>
          {EIXO_OPTIONS.map((o) => (
            <FilterPill
              key={o.value}
              active={filterEixo === o.value}
              onClick={() => setFilterEixo(o.value)}
            >
              {o.icon} {o.label}
              {stats.byEixo[o.value] > 0 && (
                <span className="ml-1.5 text-xs opacity-75">({stats.byEixo[o.value]})</span>
              )}
            </FilterPill>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusKey | "ALL")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <button
              className={cn("px-3 py-1.5 text-sm flex items-center gap-1", view === "list" ? "bg-gray-100" : "")}
              onClick={() => setView("list")}
            >
              <ListChecks className="h-4 w-4" /> Lista
            </button>
            <button
              className={cn("px-3 py-1.5 text-sm flex items-center gap-1 border-l", view === "timeline" ? "bg-gray-100" : "")}
              onClick={() => setView("timeline")}
            >
              <CalendarRange className="h-4 w-4" /> Cronograma
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo: lista ou cronograma */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
          {data.items.length === 0
            ? "Nenhum evento de capacitação cadastrado ainda. Use \"Importar checklist\" para gerar tarefas pré-definidas dos 5 eixos, ou clique em \"Novo evento\" pra registrar manualmente."
            : "Nenhum evento atende aos filtros selecionados."}
        </Card>
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
              evento={ev}
              onEdit={() => openEdit(ev)}
              onDelete={() => remove(ev.id)}
              onUpload={(file) => uploadEvidence(ev.id, file)}
              onRemoveEvidence={() => removeEvidence(ev.id)}
              uploading={uploadingFor === ev.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {timelineGroups.map((g) => (
            <div key={g.month}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
                {g.month} <span className="text-gray-500 font-normal">({g.items.length})</span>
              </h3>
              <div className="space-y-2 ml-4 border-l-2 border-amber-200 pl-4">
                {g.items.map((ev) => (
                  <EventCard
                    key={ev.id}
                    evento={ev}
                    onEdit={() => openEdit(ev)}
                    onDelete={() => remove(ev.id)}
                    onUpload={(file) => uploadEvidence(ev.id, file)}
                    onRemoveEvidence={() => removeEvidence(ev.id)}
                    uploading={uploadingFor === ev.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de cadastro/edição */}
      <Dialog open={editing != null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar evento" : "Novo evento de capacitação"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Ex: Palestra Inaugural sobre LGPD"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Eixo *</Label>
                  <Select value={editing.eixo} onValueChange={(v) => setEditing({ ...editing, eixo: v as Eixo })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EIXO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.icon} {o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as TypeKey })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Público *</Label>
                  <Select value={editing.audience} onValueChange={(v) => setEditing({ ...editing, audience: v as AudienceKey })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as StatusKey })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recorrência</Label>
                  <Select value={editing.recurrence} onValueChange={(v) => setEditing({ ...editing, recurrence: v as RecurrenceKey })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Participantes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.attendeesCount}
                    onChange={(e) => setEditing({ ...editing, attendeesCount: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Data planejada</Label>
                  <Input type="date" value={editing.scheduledAt} onChange={(e) => setEditing({ ...editing, scheduledAt: e.target.value })} />
                </div>
                <div>
                  <Label>Data realizada</Label>
                  <Input type="date" value={editing.completedAt} onChange={(e) => setEditing({ ...editing, completedAt: e.target.value })} />
                </div>
              </div>

              {/* Vínculos opcionais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Vincular a Terceiro (opcional)</Label>
                  <Select value={editing.operatorId || "none"} onValueChange={(v) => setEditing({ ...editing, operatorId: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {operators.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vincular a Incidente (opcional)</Label>
                  <Select value={editing.incidentId || "none"} onValueChange={(v) => setEditing({ ...editing, incidentId: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Detalhes do evento, conteúdo programático, instrutor, etc."
                />
              </div>
              <div>
                <Label>Notas internas</Label>
                <Textarea
                  rows={2}
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  placeholder="Avaliação pós-evento, lições aprendidas, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !editing?.title}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: "emerald" | "blue" | "amber" }) {
  const colorClass = color === "emerald" ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
    : color === "blue" ? "text-blue-700 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
    : color === "amber" ? "text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
    : "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300";
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className={cn("p-2 rounded-md", colorClass)}>{icon}</div>
      <div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </Card>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 font-medium"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      )}
    >
      {children}
    </button>
  );
}

function EventCard({
  evento,
  onEdit,
  onDelete,
  onUpload,
  onRemoveEvidence,
  uploading,
}: {
  evento: CapacitacaoEvento;
  onEdit: () => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onRemoveEvidence: () => void;
  uploading: boolean;
}) {
  const eixoIcon = EIXO_OPTIONS.find((o) => o.value === evento.eixo)?.icon ?? "";
  return (
    <Card className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{evento.title}</h3>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", statusBadgeClasses(evento.status))}>
              {evento.statusLabel}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{eixoIcon} {evento.eixoLabel}</span>
            <span>· {evento.typeLabel}</span>
            <span>· {evento.audienceLabel}</span>
            {evento.scheduledAt && <span>· 📅 Planejado: {formatDate(evento.scheduledAt)}</span>}
            {evento.completedAt && <span>· ✅ Realizado: {formatDate(evento.completedAt)}</span>}
            {evento.attendeesCount != null && <span>· 👥 {evento.attendeesCount} participantes</span>}
            {evento.recurrence !== "UNICO" && <span>· 🔄 {evento.recurrenceLabel}</span>}
          </div>
          {evento.operator && (
            <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              🤝 Terceiro: {evento.operator.name}
            </div>
          )}
          {evento.incident && (
            <div className="text-xs text-red-700 dark:text-red-400 mt-1">
              ⚠️ Capacitação corretiva — Incidente: {evento.incident.title}
            </div>
          )}
          {evento.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{evento.description}</p>
          )}
          {evento.evidenceUrl && (
            <div className="text-xs mt-2 flex items-center gap-2">
              <Paperclip className="h-3 w-3 text-emerald-600" />
              <a href={evento.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 underline truncate">
                {evento.evidenceFileName ?? "Evidência anexada"}
              </a>
              <button
                onClick={onRemoveEvidence}
                title="Remover evidência"
                className="text-gray-400 hover:text-red-600"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!evento.evidenceUrl && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
                disabled={uploading}
              />
              <span className="inline-flex items-center px-2 py-1 text-xs border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <FileUp className="h-3.5 w-3.5 mr-1" />
                {uploading ? "Enviando..." : "Anexar"}
              </span>
            </label>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-red-600"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
