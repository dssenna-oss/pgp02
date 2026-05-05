"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Save,
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Download,
  Loader2,
  History,
  Activity,
} from "lucide-react";
import IncidentTimeline from "./incident-timeline";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  statusLabel,
  statusBadgeClass,
  severityLabel,
  severityBadgeClass,
  incidentTypeLabel,
  commTargetLabel,
  computeAnpdDeadline,
  requiresAnpdCommunication,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  INCIDENT_TYPE,
  type IncidentDTO,
} from "@/lib/incidentes-helpers";

interface Props {
  session: Session;
  incidentId: string;
}

export default function IncidenteEditorContent({ session, incidentId }: Props) {
  const router = useRouter();
  const userIsDPO = isDPO(session?.user?.role);

  const [incident, setIncident] = useState<IncidentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [communicating, setCommunicating] = useState(false);
  const [communicatingSubjects, setCommunicatingSubjects] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state local — espelha o DTO
  const [form, setForm] = useState<Partial<IncidentDTO>>({});

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(`/api/incidents/${incidentId}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        if (r.status === 404) {
          setError("Incidente não encontrado");
        } else {
          setError("Erro ao carregar incidente");
        }
        return;
      }
      const j = await r.json();
      setIncident(j.incident);
      setForm(j.incident);
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar incidente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  // Tick a cada 60s pra atualizar o relógio do prazo regressivo
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const liveDeadline = useMemo(() => {
    if (!incident) return null;
    return computeAnpdDeadline(incident.detectedAt, incident.anpdNotifiedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident, tick]);

  const updateField = <K extends keyof IncidentDTO>(
    key: K,
    value: IncidentDTO[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!incident) return;
    setSaving(true);
    try {
      // Monta payload só com campos editáveis (descarta derivados)
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        incidentType: form.incidentType,
        severity: form.severity,
        occurredAt: form.occurredAt,
        affectedDataTypes: form.affectedDataTypes,
        hasSensitiveData: form.hasSensitiveData,
        affectedSubjectsCategories: form.affectedSubjectsCategories,
        affectedSubjectsCount: form.affectedSubjectsCount,
        rootCause: form.rootCause,
        attackVector: form.attackVector,
        affectedSystems: form.affectedSystems,
        affectedOperators: form.affectedOperators,
        riskAssessment: form.riskAssessment,
        securityMeasuresInPlace: form.securityMeasuresInPlace,
        containmentMeasures: form.containmentMeasures,
        correctiveMeasures: form.correctiveMeasures,
        delayJustification: form.delayJustification,
        closureNotes: form.closureNotes,
      };
      // DPO pode ajustar detectedAt
      if (userIsDPO && form.detectedAt && form.detectedAt !== incident.detectedAt) {
        payload.detectedAt = form.detectedAt;
      }
      const r = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao salvar");
      }
      const j = await r.json();
      setIncident(j.incident);
      setForm(j.incident);
      toast.success("Incidente salvo");
      notifySidebarRefresh();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!incident) return;
    if (newStatus === incident.status) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao atualizar status");
      }
      const j = await r.json();
      setIncident(j.incident);
      setForm(j.incident);
      toast.success(`Status: ${statusLabel(newStatus)}`);
      notifySidebarRefresh();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  };

  const handleCommunicateSubjects = async () => {
    if (!incident) return;
    if (
      !confirm(
        "Gerar a carta de comunicação aos titulares? Isso registrará a notificação na trilha de auditoria e baixará a carta em DOCX."
      )
    )
      return;
    setCommunicatingSubjects(true);
    try {
      const r = await fetch(
        `/api/incidents/${incidentId}/communicate-subjects`,
        { method: "POST" }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar carta");
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comunicado-titulares-${incident.id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Carta gerada e baixada");
      await load();
      notifySidebarRefresh();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar carta");
    } finally {
      setCommunicatingSubjects(false);
    }
  };

  const handleCommunicateAnpd = async () => {
    if (!incident) return;
    if (
      !confirm(
        "Gerar a comunicação à ANPD agora? Isso registrará a notificação na trilha de auditoria e baixará o ofício em DOCX."
      )
    )
      return;
    setCommunicating(true);
    try {
      const r = await fetch(`/api/incidents/${incidentId}/communicate-anpd`, {
        method: "POST",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao gerar comunicação");
      }
      // Download do DOCX
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comunicacao-anpd-${incident.id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Comunicação gerada e baixada");
      // Reload pra refletir status novo + nova linha em communications
      await load();
      notifySidebarRefresh();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar comunicação");
    } finally {
      setCommunicating(false);
    }
  };

  const handleDelete = async () => {
    if (!incident) return;
    if (
      !confirm(
        `Excluir o incidente "${incident.title}" permanentemente? Esta ação não pode ser desfeita.`
      )
    )
      return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/incidents/${incidentId}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao excluir");
      }
      toast.success("Incidente excluído");
      notifySidebarRefresh();
      router.push("/dashboard/incidentes");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <p className="text-red-700 mb-4">{error ?? "Incidente não encontrado"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/incidentes">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar à lista
          </Link>
        </Button>
      </div>
    );
  }

  const showAnpdBanner =
    requiresAnpdCommunication(incident.severity) &&
    !incident.anpdNotifiedAt &&
    incident.status !== "FALSO_POSITIVO";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/incidentes">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Lista
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 md:h-6 md:w-6 text-red-600 shrink-0" />
            <span className="truncate">{incident.title}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-[11px] px-2 py-0.5 rounded border ${statusBadgeClass(
                incident.status
              )}`}
            >
              {statusLabel(incident.status)}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded border ${severityBadgeClass(
                incident.severity
              )}`}
            >
              Severidade {severityLabel(incident.severity)}
            </span>
            {incident.hasSensitiveData && (
              <span className="text-[11px] px-2 py-0.5 rounded border bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                Dados sensíveis
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Salvar
          </Button>
          {userIsDPO && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              title="Excluir incidente (apenas DPO)"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-600" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Banner ANPD 72h */}
      {showAnpdBanner && liveDeadline && (
        <div
          className={`rounded-lg p-4 border ${
            liveDeadline.level === "CRITICAL"
              ? "bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-800"
              : liveDeadline.level === "WARN"
              ? "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
              : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                liveDeadline.level === "CRITICAL"
                  ? "text-red-700 dark:text-red-300"
                  : liveDeadline.level === "WARN"
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-blue-700 dark:text-blue-300"
              }`}
            />
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  liveDeadline.level === "CRITICAL"
                    ? "text-red-900 dark:text-red-200"
                    : liveDeadline.level === "WARN"
                    ? "text-amber-900 dark:text-amber-200"
                    : "text-blue-900 dark:text-blue-200"
                }`}
              >
                {liveDeadline.level === "CRITICAL"
                  ? `Prazo ANPD vencido — ${liveDeadline.label}`
                  : `Comunicação à ANPD: ${liveDeadline.label}`}
              </p>
              <p className="text-sm mt-1 opacity-90">
                Severidade {severityLabel(incident.severity)} dispara
                obrigatoriedade de comunicação à ANPD em até{" "}
                <strong>3 dias úteis (Art. 48 LGPD)</strong>.
                {liveDeadline.level === "CRITICAL" &&
                  " Justifique a demora na aba Risco antes de gerar o ofício."}
              </p>
            </div>
            {userIsDPO && (
              <Button
                onClick={handleCommunicateAnpd}
                disabled={communicating}
                className="bg-red-600 hover:bg-red-700 shrink-0"
              >
                {communicating ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Gerar ofício ANPD
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status switcher */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Mover para:
          </span>
          <Select value={incident.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(INCIDENT_STATUS).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-500">
            Transições inválidas serão rejeitadas pelo servidor.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ident" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="ident">Identificação</TabsTrigger>
          <TabsTrigger value="dados">Dados afetados</TabsTrigger>
          <TabsTrigger value="tecnico">Técnico</TabsTrigger>
          <TabsTrigger value="risco">Risco</TabsTrigger>
          <TabsTrigger value="comm">Comunicações</TabsTrigger>
          <TabsTrigger value="timeline">
            <Activity className="h-3.5 w-3.5 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="encerramento">Encerramento</TabsTrigger>
        </TabsList>

        {/* ----- Identificação ----- */}
        <TabsContent value="ident" className="space-y-4 mt-4">
          <FieldText
            label="Título"
            required
            value={form.title ?? ""}
            onChange={(v) => updateField("title", v as any)}
          />
          <FieldArea
            label="Descrição"
            required
            value={form.description ?? ""}
            onChange={(v) => updateField("description", v as any)}
            rows={5}
            help="O que aconteceu, contexto narrativo, como descobrimos."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldSelect
              label="Tipo do incidente"
              value={form.incidentType ?? "OUTRO"}
              onChange={(v) => updateField("incidentType", v as any)}
              options={Object.values(INCIDENT_TYPE).map((t) => ({
                value: t,
                label: incidentTypeLabel(t),
              }))}
            />
            <FieldSelect
              label="Severidade"
              value={form.severity ?? "MEDIO"}
              onChange={(v) => updateField("severity", v as any)}
              options={[
                { value: "ALTO", label: "Alto" },
                { value: "MEDIO", label: "Médio" },
                { value: "BAIXO", label: "Baixo" },
              ]}
              help="ALTO/MEDIO disparam obrigatoriedade ANPD."
            />
            <FieldDate
              label="Data/hora do incidente (estimado)"
              value={form.occurredAt ?? null}
              onChange={(v) => updateField("occurredAt", v as any)}
              help="Quando o evento de fato aconteceu (pode ser anterior à detecção)."
            />
            <FieldDate
              label="Data/hora de detecção (ciência)"
              required
              value={form.detectedAt ?? null}
              onChange={(v) => updateField("detectedAt", v as any)}
              disabled={!userIsDPO}
              help={
                userIsDPO
                  ? "Inicia o prazo regressivo de 72h ANPD."
                  : "Apenas DPO pode ajustar."
              }
            />
          </div>
        </TabsContent>

        {/* ----- Dados afetados ----- */}
        <TabsContent value="dados" className="space-y-4 mt-4">
          <FieldArea
            label="Categorias de dados pessoais afetados"
            value={form.affectedDataTypes ?? ""}
            onChange={(v) => updateField("affectedDataTypes", v as any)}
            help="Ex: nome completo, e-mail, CPF, dados financeiros, etc."
          />
          <div className="flex items-center gap-2">
            <input
              id="hasSensitiveData"
              type="checkbox"
              checked={!!form.hasSensitiveData}
              onChange={(e) =>
                updateField("hasSensitiveData", e.target.checked as any)
              }
              className="h-4 w-4"
            />
            <label
              htmlFor="hasSensitiveData"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Houve dados pessoais <strong>sensíveis</strong> envolvidos (Art.
              11 LGPD)?
            </label>
          </div>
          <FieldArea
            label="Categorias de titulares afetados"
            value={form.affectedSubjectsCategories ?? ""}
            onChange={(v) =>
              updateField("affectedSubjectsCategories", v as any)
            }
            help="Ex: clientes ativos, candidatos, funcionários, ex-clientes."
          />
          <FieldText
            label="Número aproximado de titulares afetados"
            value={
              form.affectedSubjectsCount != null
                ? String(form.affectedSubjectsCount)
                : ""
            }
            onChange={(v) => {
              const n = v.trim() === "" ? null : parseInt(v, 10);
              updateField(
                "affectedSubjectsCount",
                Number.isFinite(n as number) ? (n as any) : (null as any)
              );
            }}
            type="number"
          />
        </TabsContent>

        {/* ----- Técnico ----- */}
        <TabsContent value="tecnico" className="space-y-4 mt-4">
          <FieldArea
            label="Causa raiz identificada"
            value={form.rootCause ?? ""}
            onChange={(v) => updateField("rootCause", v as any)}
            help="O que efetivamente causou o incidente (preencha quando confirmado)."
          />
          <FieldText
            label="Vetor de origem"
            value={form.attackVector ?? ""}
            onChange={(v) => updateField("attackVector", v as any)}
            help="Phishing, erro humano, falha técnica, acesso indevido, etc."
          />
          <FieldArea
            label="Sistemas e ativos afetados"
            value={form.affectedSystems ?? ""}
            onChange={(v) => updateField("affectedSystems", v as any)}
            help="Bancos, sistemas, integrações, endpoints impactados."
          />
          <FieldArea
            label="Operadores/terceiros envolvidos"
            value={form.affectedOperators ?? ""}
            onChange={(v) => updateField("affectedOperators", v as any)}
            help="Fornecedores que tratam dados afetados (texto livre nesta versão; M:N em refino futuro)."
          />
        </TabsContent>

        {/* ----- Risco ----- */}
        <TabsContent value="risco" className="space-y-4 mt-4">
          <FieldArea
            label="Avaliação de risco aos titulares"
            value={form.riskAssessment ?? ""}
            onChange={(v) => updateField("riskAssessment", v as any)}
            rows={4}
            help="Qual o risco efetivo aos titulares? (financeiro, reputacional, físico, discriminatório, etc.)"
          />
          <FieldArea
            label="Medidas técnicas e administrativas em vigor"
            value={form.securityMeasuresInPlace ?? ""}
            onChange={(v) => updateField("securityMeasuresInPlace", v as any)}
            help="Controles que existiam ANTES do incidente (criptografia, MFA, backup, segregação, etc.)."
          />
          <FieldArea
            label="Medidas de contenção (curto prazo)"
            value={form.containmentMeasures ?? ""}
            onChange={(v) => updateField("containmentMeasures", v as any)}
            help="O que já foi feito pra parar o problema agora."
          />
          <FieldArea
            label="Medidas corretivas e preventivas (médio/longo prazo)"
            value={form.correctiveMeasures ?? ""}
            onChange={(v) => updateField("correctiveMeasures", v as any)}
            help="Plano pra evitar recorrência (alimenta automaticamente o Plano de Ação como origem INCIDENTE)."
          />
          <FieldArea
            label="Justificativa de demora (se aplicável)"
            value={form.delayJustification ?? ""}
            onChange={(v) => updateField("delayJustification", v as any)}
            help="Preencha se a comunicação à ANPD ultrapassou os 3 dias úteis."
          />
        </TabsContent>

        {/* ----- Comunicações ----- */}
        <TabsContent value="comm" className="space-y-4 mt-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Comunicação à ANPD
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium">
                  {incident.anpdNotifiedAt ? (
                    <span className="text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Comunicada em{" "}
                      {new Date(incident.anpdNotifiedAt).toLocaleString("pt-BR")}
                    </span>
                  ) : requiresAnpdCommunication(incident.severity) ? (
                    <span className="text-red-700 dark:text-red-300 inline-flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Pendente
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Não obrigatória (severidade
                      BAIXO)
                    </span>
                  )}
                </span>
              </div>
              {liveDeadline && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-600 dark:text-gray-400">
                    Prazo regressivo:
                  </span>
                  <span
                    className={
                      liveDeadline.level === "CRITICAL"
                        ? "text-red-700 dark:text-red-300 font-semibold"
                        : liveDeadline.level === "WARN"
                        ? "text-amber-700 dark:text-amber-300 font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }
                  >
                    <Clock className="h-3.5 w-3.5 inline mr-1" />
                    {liveDeadline.label}
                  </span>
                </div>
              )}
            </div>
            {userIsDPO && (
              <div className="mt-4">
                <Button
                  onClick={handleCommunicateAnpd}
                  disabled={communicating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {communicating ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  {incident.anpdNotifiedAt
                    ? "Re-emitir ofício ANPD"
                    : "Gerar ofício ANPD"}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Gera o DOCX no formato da Resolução CD/ANPD nº 15/2024 e
                  registra a notificação na trilha de auditoria.
                </p>
              </div>
            )}
          </div>

          {/* Histórico de comunicações */}
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de comunicações
            </h3>
            {incident.communications.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma comunicação registrada ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {incident.communications.map((c) => (
                  <li
                    key={c.id}
                    className="border-l-2 border-cyan-400 pl-3 py-1"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {commTargetLabel(c.target)}
                      </span>
                      {c.channel && (
                        <span className="text-xs text-gray-500">
                          via {c.channel}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(c.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {c.createdBy && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Por {c.createdBy.name ?? c.createdBy.email}
                      </p>
                    )}
                    <details className="mt-1.5">
                      <summary className="text-xs text-blue-700 dark:text-blue-300 cursor-pointer">
                        Ver snapshot
                      </summary>
                      <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1.5 whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                        {c.content}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comunicação aos titulares (Checkpoint 16 / D) */}
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Comunicação aos titulares
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <span className="font-medium">
                  {incident.subjectsNotifiedAt ? (
                    <span className="text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Comunicada em{" "}
                      {new Date(incident.subjectsNotifiedAt).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 inline-flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Pendente
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Art. 48 §1º da LGPD — quando o incidente puder acarretar
                <strong> risco ou dano relevante aos titulares</strong>, eles
                também devem ser comunicados. A carta gerada usa linguagem
                acessível e inclui os direitos do titular (Art. 18).
              </p>
            </div>
            {userIsDPO && (
              <div className="mt-4">
                <Button
                  onClick={handleCommunicateSubjects}
                  disabled={communicatingSubjects}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  {communicatingSubjects ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  {incident.subjectsNotifiedAt
                    ? "Re-emitir carta aos titulares"
                    : "Gerar carta aos titulares"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ----- Timeline (E3) ----- */}
        <TabsContent value="timeline" className="space-y-4 mt-4">
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Linha do Tempo do Incidente
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Eventos do ciclo de vida agregados em ordem cronológica decrescente.
              Útil pra apresentar à ANPD ou auditoria como evidência da resposta.
            </p>
            <IncidentTimeline incident={incident} />
          </div>
        </TabsContent>

        {/* ----- Encerramento ----- */}
        <TabsContent value="encerramento" className="space-y-4 mt-4">
          <FieldArea
            label="Notas de encerramento / lições aprendidas"
            value={form.closureNotes ?? ""}
            onChange={(v) => updateField("closureNotes", v as any)}
            rows={5}
            help="Reflexão final sobre o incidente — o que mudamos pra que não se repita."
          />
          {incident.closedAt ? (
            <div className="border rounded-lg p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-sm">
              <CheckCircle2 className="h-4 w-4 inline mr-1.5 text-emerald-700 dark:text-emerald-300" />
              Encerrado em{" "}
              <strong>{new Date(incident.closedAt).toLocaleString("pt-BR")}</strong>
              {incident.closedBy?.name && ` por ${incident.closedBy.name}`}.
            </div>
          ) : userIsDPO ? (
            <Button
              onClick={() => handleStatusChange(INCIDENT_STATUS.ENCERRADO)}
              disabled={
                saving ||
                incident.status === "ENCERRADO" ||
                incident.status === "FALSO_POSITIVO"
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Encerrar incidente
            </Button>
          ) : (
            <p className="text-sm text-gray-500">
              Apenas o DPO pode encerrar o incidente.
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer save */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Field components
// ============================================================

function FieldText({
  label,
  value,
  onChange,
  help,
  required,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {help && <p className="text-[11px] text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

function FieldArea({
  label,
  value,
  onChange,
  help,
  required,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 disabled:opacity-60"
      />
      {help && <p className="text-[11px] text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  help?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {help && <p className="text-[11px] text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

function FieldDate({
  label,
  value,
  onChange,
  help,
  required,
  disabled,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  help?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  // datetime-local quer "YYYY-MM-DDTHH:mm" — converte ISO de volta
  const local = value
    ? (() => {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");
        return `${yy}-${mm}-${dd}T${hh}:${mi}`;
      })()
    : "";

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <Input
        type="datetime-local"
        value={local}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? new Date(v).toISOString() : null);
        }}
      />
      {help && <p className="text-[11px] text-gray-500 mt-1">{help}</p>}
    </div>
  );
}
