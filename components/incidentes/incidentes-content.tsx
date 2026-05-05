"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Plus,
  Search,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  statusLabel,
  statusBadgeClass,
  severityLabel,
  severityBadgeClass,
  incidentTypeLabel,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_TYPE,
  type IncidentDTO,
  type IncidentStats,
} from "@/lib/incidentes-helpers";

interface IncidentesContentProps {
  session: Session;
}

export default function IncidentesContent({ session }: IncidentesContentProps) {
  const userIsDPO = isDPO(session?.user?.role);

  const [items, setItems] = useState<IncidentDTO[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Modal de criação
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<string>(INCIDENT_TYPE.VAZAMENTO);
  const [newSeverity, setNewSeverity] = useState<string>(INCIDENT_SEVERITY.MEDIO);
  const [newDetectedAt, setNewDetectedAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/incidents", { cache: "no-store" });
      if (!r.ok) {
        throw new Error("Erro ao carregar incidentes");
      }
      const j = await r.json();
      setItems(j.items || []);
      setStats(j.stats || null);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível carregar os incidentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
      if (severityFilter !== "ALL" && i.severity !== severityFilter) return false;
      if (q && !`${i.title} ${i.description}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items, search, statusFilter, severityFilter]);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      toast.error("Informe um título");
      return;
    }
    if (!newDescription.trim()) {
      toast.error("Descreva o incidente");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          incidentType: newType,
          severity: newSeverity,
          detectedAt: new Date(newDetectedAt).toISOString(),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao criar incidente");
      }
      const j = await r.json();
      toast.success("Incidente registrado");
      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      notifySidebarRefresh();
      // Redirect pro editor
      window.location.href = `/dashboard/incidentes/${j.incident.id}`;
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar incidente");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Incidentes de Segurança
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestão de incidentes envolvendo dados pessoais (Art. 48 LGPD + Res.
            CD/ANPD nº 15/2024). Comunicação à ANPD em até <strong>3 dias úteis</strong>.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Registrar incidente
        </Button>
      </div>

      {/* Form de criação rápida */}
      {showCreate && (
        <div className="border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-red-900 dark:text-red-200">
            Registro rápido
          </h3>
          <p className="text-xs text-red-800/80 dark:text-red-300/80">
            Preencha o essencial agora — você completa as 6 abas depois (dados afetados, técnico, risco, comunicações, encerramento).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Título <span className="text-red-600">*</span>
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Vazamento de e-mails do CRM"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Descrição <span className="text-red-600">*</span>
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                placeholder="O que aconteceu? Como descobrimos?"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Tipo
              </label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(INCIDENT_TYPE).map((t) => (
                    <SelectItem key={t} value={t}>
                      {incidentTypeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Severidade
              </label>
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Quando detectamos? <span className="text-red-600">*</span>
              </label>
              <Input
                type="datetime-local"
                value={newDetectedAt}
                onChange={(e) => setNewDetectedAt(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Esta data inicia o prazo regressivo de 72h pra comunicação ANPD.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" /> Registrar e abrir editor
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          color="amber"
          label="Em aberto"
          value={stats?.open ?? 0}
        />
        <KpiCard
          icon={<Clock className="h-4 w-4" />}
          color="red"
          label="Prazo crítico (≤24h)"
          value={stats?.criticalDeadline ?? 0}
          highlight={(stats?.criticalDeadline ?? 0) > 0}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="emerald"
          label="Encerrados"
          value={stats?.closed ?? 0}
        />
        <KpiCard
          icon={<XCircle className="h-4 w-4" />}
          color="gray"
          label="Falsos positivos"
          value={stats?.falsePositives ?? 0}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-56">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {Object.values(INCIDENT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="md:w-44">
            <SelectValue placeholder="Severidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas</SelectItem>
            <SelectItem value="ALTO">Alto</SelectItem>
            <SelectItem value="MEDIO">Médio</SelectItem>
            <SelectItem value="BAIXO">Baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          {items.length === 0 ? (
            <>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Nenhum incidente registrado.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Use "Registrar incidente" pra criar o primeiro.
              </p>
            </>
          ) : (
            <p className="text-gray-500">
              Nenhum incidente bate com os filtros atuais.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => (
            <IncidentRow key={i.id} item={i} userIsDPO={userIsDPO} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// KpiCard
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "amber" | "red" | "emerald" | "gray";
  highlight?: boolean;
}) {
  const colorClass =
    color === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : color === "red"
      ? "text-red-700 dark:text-red-300"
      : color === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-gray-700 dark:text-gray-300";

  return (
    <div
      className={`border rounded-lg p-3 bg-white dark:bg-gray-950 ${
        highlight
          ? "border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-950/40"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</div>
    </div>
  );
}

// ============================================================
// IncidentRow
// ============================================================

function IncidentRow({
  item,
  userIsDPO,
}: {
  item: IncidentDTO;
  userIsDPO: boolean;
}) {
  const detected = new Date(item.detectedAt);
  const detectedFmt = detected.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const deadlineLevelClass =
    item.anpdDeadline?.level === "CRITICAL"
      ? "text-red-700 dark:text-red-300 font-semibold"
      : item.anpdDeadline?.level === "WARN"
      ? "text-amber-700 dark:text-amber-300 font-semibold"
      : "text-gray-600 dark:text-gray-400";

  return (
    <Link
      href={`/dashboard/incidentes/${item.id}`}
      className="block border rounded-lg p-4 bg-white dark:bg-gray-950 hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {item.title}
            </h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded border ${statusBadgeClass(
                item.status
              )}`}
            >
              {statusLabel(item.status)}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded border ${severityBadgeClass(
                item.severity
              )}`}
            >
              Severidade {severityLabel(item.severity)}
            </span>
            {item.hasSensitiveData && (
              <span className="text-[11px] px-2 py-0.5 rounded border bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                Dados sensíveis
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
            {item.description}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <Clock className="h-3 w-3 inline mr-1" />
              Detectado: {detectedFmt}
            </span>
            <span>{incidentTypeLabel(item.incidentType)}</span>
            {item.affectedSubjectsCount != null && (
              <span>
                {new Intl.NumberFormat("pt-BR").format(
                  item.affectedSubjectsCount
                )}{" "}
                titulares afetados
              </span>
            )}
          </div>
        </div>

        <div className="md:text-right flex md:flex-col gap-2 md:gap-1 items-center md:items-end shrink-0">
          {item.anpdDeadline ? (
            <div className={`text-xs flex items-center gap-1 ${deadlineLevelClass}`}>
              <Clock className="h-3.5 w-3.5" />
              ANPD: {item.anpdDeadline.label}
            </div>
          ) : item.anpdNotifiedAt ? (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ANPD comunicada
            </div>
          ) : null}
          {item.anpdCommunicationRequired && userIsDPO && (
            <span className="text-[11px] text-red-700 dark:text-red-300 font-medium">
              Comunicação obrigatória
            </span>
          )}
          <span className="text-[11px] text-gray-400 inline-flex items-center gap-1 mt-1">
            Abrir <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
