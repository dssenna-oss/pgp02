"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  AlertCircle,
  Trash2,
  Sparkles,
  Plus,
  X,
  ShieldAlert,
  CalendarDays,
  ScrollText,
  FileDown,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isDPO } from "@/lib/auth-helpers";
import {
  type OperatorDTO,
  type ClassificationAnswers,
  CLASSIFICATION_QUESTIONS,
  classifyRelationType,
  RELATION_TYPE,
  CONTRACT_STATUS,
  OPERATOR_TYPE,
  LGPD_COMPLIANCE_STATUS,
  relationTypeLabel,
  relationTypeBadgeClass,
  contractStatusLabel,
  contractStatusBadgeClass,
  contractRiskClassLabel,
  contractRiskBadgeClass,
  recommendedClauseLabel,
  operatorTypeLabel,
  lgpdComplianceStatusLabel,
  lgpdComplianceBadgeClass,
} from "@/lib/operadores-helpers";
import TerceiroAssessmentSection from "./terceiro-assessment-section";
import TerceiroAttachmentUpload, { type AttachmentItem } from "./terceiro-attachment-upload";
import AddToActionPlanButton from "@/components/plano-acao/add-to-action-plan-button";
import LinkedIncidentsCard from "@/components/incidentes/linked-incidents-card";

interface Props {
  operatorId: string;
}

interface InventoryOption {
  id: string;
  serviceName: string;
  status: string;
}

const SECTIONS = [
  { key: "id",         label: "Identificação" },
  { key: "position",   label: "Posição (Op/Controlador)" },
  { key: "risk",       label: "Risco do contrato" },
  { key: "contract",   label: "Contrato" },
  { key: "processes",  label: "Processos vinculados" },
  { key: "assessment", label: "Avaliação de risco" },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

export default function TerceiroDetailContent({ operatorId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const userIsDPO = isDPO(session?.user?.role);

  const [op, setOp] = useState<OperatorDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("id");

  // Local form state — controlled
  const [form, setForm] = useState<Partial<OperatorDTO>>({});
  const [classification, setClassification] = useState<ClassificationAnswers>({});
  const [dirty, setDirty] = useState(false);

  // Vincular processo
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [inventories, setInventories] = useState<InventoryOption[]>([]);
  const [pickedInvId, setPickedInvId] = useState("");
  const [linkActivity, setLinkActivity] = useState("");
  const [linking, setLinking] = useState(false);

  // Sincroniza form local com o operator carregado
  useEffect(() => {
    if (!op) return;
    setForm({
      name: op.name,
      tradeName: op.tradeName,
      cnpj: op.cnpj,
      country: op.country,
      operatorType: op.operatorType,
      description: op.description,
      notes: op.notes,
      relationType: op.relationType,
      thirdPartyDpoName: op.thirdPartyDpoName,
      thirdPartyDpoEmail: op.thirdPartyDpoEmail,
      thirdPartyDpoPhone: op.thirdPartyDpoPhone,
      contractLabel: op.contractLabel,
      contractSignedAt: op.contractSignedAt,
      contractExpiresAt: op.contractExpiresAt,
      contractLastReviewedAt: op.contractLastReviewedAt,
      contractStatus: op.contractStatus,
      largaEscala: op.largaEscala,
      afetaTitulares: op.afetaTitulares,
      novasTecnologias: op.novasTecnologias,
      vigilanciaPublica: op.vigilanciaPublica,
      decisaoAutomatizada: op.decisaoAutomatizada,
      dadosSensiveis: op.dadosSensiveis,
      hasPrivacyClause: op.hasPrivacyClause,
      hasIncidentClause: op.hasIncidentClause,
      incidentNotificationDays: op.incidentNotificationDays,
      permitsSubcontracting: op.permitsSubcontracting,
      permitsInternationalTransfer: op.permitsInternationalTransfer,
      isStandardMinute: op.isStandardMinute,
      confidentialityTermSignedAt: op.confidentialityTermSignedAt,
      confidentialityTermAttachment: op.confidentialityTermAttachment,
      contractAttachments: op.contractAttachments as any,
    });
    setClassification(op.classificationAnswers ?? {});
    setDirty(false);
  }, [op]);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/operadores/${operatorId}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar terceiro");
        router.push("/dashboard/terceiros");
        return;
      }
      const j = await r.json();
      setOp(j.operator);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorId]);

  const setField = <K extends keyof OperatorDTO>(key: K, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handleClassChange = (id: string, val: boolean) => {
    setClassification((c) => ({ ...c, [id]: val }));
    setDirty(true);
  };

  const classResult = useMemo(
    () => classifyRelationType(classification),
    [classification]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/operadores/${operatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          classificationAnswers:
            Object.keys(classification).length > 0 ? classification : null,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      const j = await r.json();
      setOp(j.operator);
      setDirty(false);
      toast.success("Salvo");
    } finally {
      setSaving(false);
    }
  };

  /** Inicia campanha de adequação LGPD (Checkpoint 14 H1).
   *  Muda lgpdComplianceStatus pra EM_ADEQUACAO + cria 5 ações no Plano. */
  const [startingAdequacao, setStartingAdequacao] = useState(false);
  const handleStartAdequacao = async () => {
    if (
      !confirm(
        `Iniciar campanha de adequação LGPD para "${op?.name}"?\n\n` +
          `Isso vai:\n` +
          `• Marcar o operador como "Em adequação"\n` +
          `• Criar 5 ações automáticas no Plano de Ação (avaliar, decidir cláusula, negociar, assinar, reavaliar)\n\n` +
          `Você pode acompanhar/ajustar cada ação no Plano de Ação depois.`
      )
    ) {
      return;
    }
    setStartingAdequacao(true);
    try {
      const r = await fetch(
        `/api/operadores/${operatorId}/start-adequacao`,
        { method: "POST" }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao iniciar adequação");
        return;
      }
      const j = await r.json();
      const msg = j.skipped
        ? `Campanha iniciada — ${j.created} ação(ões) criada(s), ${j.skipped} já existiam.`
        : `Campanha iniciada — ${j.created} ações criadas no Plano.`;
      toast.success(msg);
      // Recarrega operador pra refletir novo status
      const r2 = await fetch(`/api/operadores/${operatorId}`, { cache: "no-store" });
      if (r2.ok) {
        const data = await r2.json();
        setOp(data.operator);
      }
    } finally {
      setStartingAdequacao(false);
    }
  };

  // Carregar processos pra modal de vínculo
  const loadInventories = async () => {
    try {
      const r = await fetch("/api/inventario", { cache: "no-store" });
      if (!r.ok) {
        toast.error("Erro ao carregar processos");
        return;
      }
      const j = await r.json();
      const all: any[] = Array.isArray(j) ? j : (j.items ?? []);
      const linked = new Set(op?.processLinks.map((l) => l.dataInventoryId) ?? []);
      setInventories(
        all
          .filter((i) => !linked.has(i.id))
          .map((i) => ({
            id: i.id,
            serviceName: i.serviceName,
            status: i.status,
          }))
          .sort((a, b) => a.serviceName.localeCompare(b.serviceName, "pt-BR"))
      );
    } catch {
      toast.error("Erro de rede");
    }
  };

  const openLinkModal = async () => {
    setPickedInvId("");
    setLinkActivity("");
    await loadInventories();
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    if (!pickedInvId) {
      toast.error("Selecione um processo");
      return;
    }
    setLinking(true);
    try {
      const r = await fetch(`/api/operadores/${operatorId}/processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataInventoryId: pickedInvId,
          activityDescription: linkActivity.trim() || null,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao vincular");
        return;
      }
      const j = await r.json();
      setOp(j.operator);
      setShowLinkModal(false);
      toast.success("Processo vinculado");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (linkId: string, name: string) => {
    if (!confirm(`Desvincular "${name}" deste terceiro?`)) return;
    const r = await fetch(
      `/api/operadores/${operatorId}/processes?linkId=${encodeURIComponent(linkId)}`,
      { method: "DELETE" }
    );
    if (!r.ok) {
      toast.error("Erro ao desvincular");
      return;
    }
    toast.success("Vínculo removido");
    refresh();
  };

  if (loading || !op) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando…
      </div>
    );
  }

  const canEdit = userIsDPO;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/terceiros">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Lista
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge
              variant="outline"
              className={cn("text-xs", relationTypeBadgeClass(op.relationType))}
            >
              {relationTypeLabel(op.relationType)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", contractRiskBadgeClass(op.contractRiskClass))}
            >
              Risco {contractRiskClassLabel(op.contractRiskClass)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", contractStatusBadgeClass(op.contractStatus))}
            >
              {contractStatusLabel(op.contractStatus)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                lgpdComplianceBadgeClass(op.lgpdComplianceStatus)
              )}
              title="Status de adequação LGPD"
            >
              {lgpdComplianceStatusLabel(op.lgpdComplianceStatus)}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            {form.name || op.name}
          </h1>
          {op.recommendedClause !== "INDEFINIDO" && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              Cláusula recomendada:{" "}
              <span className="font-medium">
                {recommendedClauseLabel(op.recommendedClause)}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {canEdit && op.lgpdComplianceStatus === "NAO_AVALIADO" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartAdequacao}
              disabled={startingAdequacao}
              title="Cria 5 ações no Plano de Ação e marca o operador como 'Em adequação'"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
            >
              {startingAdequacao ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              Iniciar adequação
            </Button>
          )}
          {canEdit && hasOperatorIssues(op) && (
            <AddToActionPlanButton
              title={buildOperatorActionTitle(op)}
              description={buildOperatorActionDescription(op)}
              origin="OPERADOR"
              refOperatorId={op.id}
              priority={operatorActionPriority(op)}
              variant="outline"
              size="sm"
            />
          )}
          {canEdit && op.recommendedClause !== "INDEFINIDO" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `/api/operadores/${op.id}/clause?mode=NOVA`,
                    "_blank"
                  );
                }}
                title="Cláusula isolada pra constar em contrato em redação"
              >
                <FileDown className="h-4 w-4 mr-1.5" />
                Cláusula nova (.docx)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    `/api/operadores/${op.id}/clause?mode=ADITIVO`,
                    "_blank"
                  );
                }}
                title="Termo aditivo de adequação LGPD pra contrato vigente pré-LGPD"
              >
                <FileDown className="h-4 w-4 mr-1.5" />
                Termo aditivo (.docx)
              </Button>
            </>
          )}
          {canEdit && (
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {dirty ? "Salvar" : "Salvo"}
            </Button>
          )}
        </div>
      </div>

      {/* Layout 2 colunas: nav + form */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Nav lateral */}
        <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-medium",
                activeSection === s.key
                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Form */}
        <div className="min-w-0 space-y-4">
          {/* Caminho inverso M:N IncidentOperator (D2, 2026-05-10):
              mostra incidentes que envolveram este operador, se houver. */}
          <LinkedIncidentsCard operatorId={operatorId} context="operator" />

          <Card>
            <CardContent className="p-6">
              {activeSection === "id" && (
                <SectionId
                  form={form}
                  setField={setField}
                  disabled={!canEdit}
                />
              )}
              {activeSection === "position" && (
                <SectionPosition
                  form={form}
                  setField={setField}
                  classification={classification}
                  onClassChange={handleClassChange}
                  classResult={classResult}
                  disabled={!canEdit}
                />
              )}
              {activeSection === "risk" && (
                <SectionRisk
                  form={form}
                  setField={setField}
                  riskClass={op.contractRiskClass}
                  recommendedClause={op.recommendedClause}
                  relationType={(form.relationType as any) ?? op.relationType}
                  disabled={!canEdit}
                />
              )}
              {activeSection === "contract" && (
                <SectionContract
                  form={form}
                  setField={setField}
                  disabled={!canEdit}
                  operatorId={op.id}
                />
              )}
              {activeSection === "processes" && (
                <SectionProcesses
                  op={op}
                  canEdit={canEdit}
                  onAdd={openLinkModal}
                  onUnlink={handleUnlink}
                />
              )}
              {activeSection === "assessment" && (
                <TerceiroAssessmentSection
                  operatorId={op.id}
                  canEdit={canEdit}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: vincular processo */}
      <Dialog open={showLinkModal} onOpenChange={(o) => !o && !linking && setShowLinkModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular processo do Inventário</DialogTitle>
            <DialogDescription>
              Indique qual processo este terceiro trata, com descrição
              opcional da atividade exata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pick-inv">Processo</Label>
              {inventories.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">
                  Nenhum processo disponível pra vincular (todos os
                  processos da organização já estão vinculados, ou
                  ainda não há processos cadastrados).
                </p>
              ) : (
                <select
                  id="pick-inv"
                  value={pickedInvId}
                  onChange={(e) => setPickedInvId(e.target.value)}
                  disabled={linking}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">— Selecionar processo —</option>
                  {inventories.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.serviceName} ({i.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-activity">Atividade no processo</Label>
              <Textarea
                id="link-activity"
                value={linkActivity}
                onChange={(e) => setLinkActivity(e.target.value)}
                disabled={linking}
                placeholder="Ex: hospedagem do banco de dados de clientes"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLinkModal(false)}
              disabled={linking}
            >
              Cancelar
            </Button>
            <Button onClick={handleLink} disabled={linking || !pickedInvId}>
              {linking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vinculando…
                </>
              ) : (
                "Vincular processo"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Section: Identificação
// ============================================================

function SectionId({
  form,
  setField,
  disabled,
}: {
  form: any;
  setField: any;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Identificação</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label>Razão social *</Label>
          <Input
            value={form.name ?? ""}
            onChange={(e) => setField("name", e.target.value)}
            disabled={disabled}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nome fantasia</Label>
          <Input
            value={form.tradeName ?? ""}
            onChange={(e) => setField("tradeName", e.target.value)}
            disabled={disabled}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ</Label>
          <Input
            value={form.cnpj ?? ""}
            onChange={(e) => setField("cnpj", e.target.value)}
            disabled={disabled}
            maxLength={30}
          />
        </div>
        <div className="space-y-1.5">
          <Label>País sede</Label>
          <Input
            value={form.country ?? ""}
            onChange={(e) => setField("country", e.target.value)}
            disabled={disabled}
            placeholder="Brasil"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de operador</Label>
          <select
            value={form.operatorType ?? ""}
            onChange={(e) => setField("operatorType", e.target.value || null)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            <option value="">— Selecionar —</option>
            {Object.values(OPERATOR_TYPE).map((t) => (
              <option key={t} value={t}>
                {operatorTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Descrição da atividade</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setField("description", e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Ex: provedor de hospedagem do banco de dados de clientes"
          />
        </div>
      </div>

      <div className="border-t pt-3 space-y-3">
        <h3 className="text-sm font-semibold">Contato do DPO/responsável LGPD do terceiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              value={form.thirdPartyDpoName ?? ""}
              onChange={(e) => setField("thirdPartyDpoName", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input
              value={form.thirdPartyDpoEmail ?? ""}
              onChange={(e) => setField("thirdPartyDpoEmail", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={form.thirdPartyDpoPhone ?? ""}
              onChange={(e) => setField("thirdPartyDpoPhone", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notas internas</Label>
        <Textarea
          value={form.notes ?? ""}
          onChange={(e) => setField("notes", e.target.value)}
          disabled={disabled}
          rows={3}
        />
      </div>
    </div>
  );
}

// ============================================================
// Section: Posição (checklist + sugestão automática)
// ============================================================

function SectionPosition({
  form,
  setField,
  classification,
  onClassChange,
  classResult,
  disabled,
}: {
  form: any;
  setField: any;
  classification: ClassificationAnswers;
  onClassChange: (id: string, v: boolean) => void;
  classResult: ReturnType<typeof classifyRelationType>;
  disabled: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Posição na relação</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina se o terceiro é Operador (segue suas instruções) ou
          Controlador (toma decisões essenciais sobre o tratamento).
          Use o checklist pra ver a sugestão automática e confirme
          abaixo.
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">
          Checklist de classificação (sugestão automática)
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Indícios de CONTROLADOR:
            </p>
            <div className="space-y-1.5">
              {CLASSIFICATION_QUESTIONS.filter((q) => q.block === "C").map(
                (q) => (
                  <label
                    key={q.id}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={!!classification[q.id]}
                      disabled={disabled}
                      onCheckedChange={(v) => onClassChange(q.id, !!v)}
                    />
                    <span>{q.question}</span>
                  </label>
                )
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Indícios de OPERADOR:
            </p>
            <div className="space-y-1.5">
              {CLASSIFICATION_QUESTIONS.filter((q) => q.block === "O").map(
                (q) => (
                  <label
                    key={q.id}
                    className="flex items-start gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={!!classification[q.id]}
                      disabled={disabled}
                      onCheckedChange={(v) => onClassChange(q.id, !!v)}
                    />
                    <span>{q.question}</span>
                  </label>
                )
              )}
            </div>
          </div>
        </div>

        {/* Sugestão */}
        <Card className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900">
          <CardContent className="p-3 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                Sugestão automática:{" "}
                <span className="font-bold">
                  {relationTypeLabel(classResult.suggestion)}
                </span>{" "}
                <span className="font-normal text-xs">
                  (Controlador: {classResult.controllerScore}/5 · Operador:{" "}
                  {classResult.operatorScore}/5)
                </span>
              </p>
              <p className="text-xs text-violet-800 dark:text-violet-300 mt-1">
                {classResult.rationale}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmação manual */}
      <div className="space-y-1.5 border-t pt-3">
        <Label>Posição definida (DPO confirma)</Label>
        <select
          value={form.relationType ?? "INDEFINIDO"}
          onChange={(e) => setField("relationType", e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          {Object.values(RELATION_TYPE).map((rt) => (
            <option key={rt} value={rt}>
              {relationTypeLabel(rt)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          A posição definida é usada pra calcular a cláusula recomendada
          (junto com o risco do contrato).
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Section: Risco do contrato (régua 6 critérios ANPD)
// ============================================================

function SectionRisk({
  form,
  setField,
  riskClass,
  recommendedClause,
  relationType,
  disabled,
}: {
  form: any;
  setField: any;
  riskClass: string;
  recommendedClause: string;
  relationType: string;
  disabled: boolean;
}) {
  const generalCount =
    Number(form.largaEscala) + Number(form.afetaTitulares);
  const specificCount =
    Number(form.novasTecnologias) +
    Number(form.vigilanciaPublica) +
    Number(form.decisaoAutomatizada) +
    Number(form.dadosSensiveis);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Régua de risco do contrato</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Critérios ANPD pra classificar tratamento de alto risco. A
          combinação de pelo menos 1 geral + 1 específico classifica o
          contrato como ALTO. A classificação determina qual cláusula
          contratual é recomendada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Critério geral ({generalCount}/2)
          </p>
          <RiskCheckbox
            label="Tratamento em larga escala"
            value={!!form.largaEscala}
            onChange={(v) => setField("largaEscala", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Afeta significativamente direitos dos titulares"
            value={!!form.afetaTitulares}
            onChange={(v) => setField("afetaTitulares", v)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">
            Critério específico ({specificCount}/4)
          </p>
          <RiskCheckbox
            label="Uso de tecnologias emergentes/inovadoras"
            value={!!form.novasTecnologias}
            onChange={(v) => setField("novasTecnologias", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Vigilância em zonas acessíveis ao público"
            value={!!form.vigilanciaPublica}
            onChange={(v) => setField("vigilanciaPublica", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Decisão automatizada"
            value={!!form.decisaoAutomatizada}
            onChange={(v) => setField("decisaoAutomatizada", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Dados sensíveis OU crianças/adolescentes/idosos"
            value={!!form.dadosSensiveis}
            onChange={(v) => setField("dadosSensiveis", v)}
            disabled={disabled}
          />
        </div>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-200">
              Classificação:{" "}
              <Badge
                variant="outline"
                className={cn("ml-1", contractRiskBadgeClass(riskClass))}
              >
                Risco {contractRiskClassLabel(riskClass)}
              </Badge>
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
              Cláusula recomendada (com base em posição "
              {relationTypeLabel(relationType)}" + risco "
              {contractRiskClassLabel(riskClass)}"):{" "}
              <span className="font-semibold">
                {recommendedClauseLabel(recommendedClause)}
              </span>
              {recommendedClause === "INDEFINIDO" && (
                <> — defina a posição na seção anterior pra ver a recomendação.</>
              )}
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1.5 italic">
              Use o botão <strong>"Baixar cláusula (.docx)"</strong> no
              topo desta tela pra gerar o aditivo já preenchido com os
              dados do controlador, do terceiro e do contrato.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RiskCheckbox({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <Checkbox
        checked={value}
        disabled={disabled}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <span>{label}</span>
    </label>
  );
}

// ============================================================
// Section: Contrato (vigência + cláusulas presentes + termo confidencialidade)
// ============================================================

function SectionContract({
  form,
  setField,
  disabled,
  operatorId,
}: {
  form: any;
  setField: any;
  disabled: boolean;
  operatorId: string;
}) {
  // Lista atual de anexos do contrato (array JSON normalizado)
  const contractAttachments: AttachmentItem[] = Array.isArray(form.contractAttachments)
    ? (form.contractAttachments as AttachmentItem[])
    : [];
  // Termo de confidencialidade — single (URL ou null)
  const termAttachments: AttachmentItem[] = form.confidentialityTermAttachment
    ? [
        {
          url: form.confidentialityTermAttachment,
          name: "Termo de Confidencialidade",
          uploadedAt: form.confidentialityTermSignedAt ?? new Date().toISOString(),
          kind: "TERMO_CONFIDENCIALIDADE",
        },
      ]
    : [];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Contrato</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dados do contrato celebrado e checklist das cláusulas LGPD
          presentes. Status "Vigente / Vencendo / Vencido" é calculado
          automaticamente a partir da data de expiração.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Identificador do contrato</Label>
          <Input
            value={form.contractLabel ?? ""}
            onChange={(e) => setField("contractLabel", e.target.value)}
            disabled={disabled}
            placeholder="Ex: Contrato 2026/045"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status (manual)</Label>
          <select
            value={form.contractStatus ?? "SEM_CONTRATO"}
            onChange={(e) => setField("contractStatus", e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          >
            {Object.values(CONTRACT_STATUS).map((s) => (
              <option key={s} value={s}>
                {contractStatusLabel(s)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            "Vencendo" e "Vencido" são derivados automaticamente da data
            de expiração — só sobrescrevem em casos especiais.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Data de assinatura</Label>
          <Input
            type="date"
            value={form.contractSignedAt ? form.contractSignedAt.slice(0, 10) : ""}
            onChange={(e) =>
              setField("contractSignedAt", e.target.value || null)
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Data de expiração</Label>
          <Input
            type="date"
            value={form.contractExpiresAt ? form.contractExpiresAt.slice(0, 10) : ""}
            onChange={(e) =>
              setField("contractExpiresAt", e.target.value || null)
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Última revisão</Label>
          <Input
            type="date"
            value={form.contractLastReviewedAt ? form.contractLastReviewedAt.slice(0, 10) : ""}
            onChange={(e) =>
              setField("contractLastReviewedAt", e.target.value || null)
            }
            disabled={disabled}
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold">Cláusulas LGPD presentes no contrato</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <RiskCheckbox
            label="Cláusula de privacidade e proteção de dados"
            value={!!form.hasPrivacyClause}
            onChange={(v) => setField("hasPrivacyClause", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Cláusula de notificação de incidentes"
            value={!!form.hasIncidentClause}
            onChange={(v) => setField("hasIncidentClause", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Permite subcontratação"
            value={!!form.permitsSubcontracting}
            onChange={(v) => setField("permitsSubcontracting", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Permite transferência internacional"
            value={!!form.permitsInternationalTransfer}
            onChange={(v) => setField("permitsInternationalTransfer", v)}
            disabled={disabled}
          />
          <RiskCheckbox
            label="Segue minuta padrão da empresa"
            value={!!form.isStandardMinute}
            onChange={(v) => setField("isStandardMinute", v)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <Label>Prazo de notificação de incidente (dias)</Label>
          <Input
            type="number"
            min={0}
            max={365}
            value={form.incidentNotificationDays ?? ""}
            onChange={(e) =>
              setField(
                "incidentNotificationDays",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            disabled={disabled || !form.hasIncidentClause}
            placeholder={form.hasIncidentClause ? "ex: 1" : "—"}
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold">Termo de Confidencialidade</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Data de assinatura</Label>
            <Input
              type="date"
              value={form.confidentialityTermSignedAt ? form.confidentialityTermSignedAt.slice(0, 10) : ""}
              onChange={(e) =>
                setField("confidentialityTermSignedAt", e.target.value || null)
              }
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Anexo do termo (PDF)</Label>
            <TerceiroAttachmentUpload
              operatorId={operatorId}
              kind="TERMO_CONFIDENCIALIDADE"
              mode="single"
              current={termAttachments}
              disabled={disabled}
              label="Enviar termo assinado"
              onChange={(next) => {
                setField(
                  "confidentialityTermAttachment",
                  next[0]?.url ?? null
                );
              }}
            />
            <p className="text-[11px] text-muted-foreground italic">
              Lembre de salvar a página depois de enviar o anexo.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-semibold">
          Anexos do contrato (PDF do contrato, DPA, evidências)
        </p>
        <TerceiroAttachmentUpload
          operatorId={operatorId}
          kind="CONTRATO"
          mode="list"
          current={contractAttachments}
          disabled={disabled}
          label="Enviar anexo"
          onChange={(next) => setField("contractAttachments", next)}
        />
        <p className="text-[11px] text-muted-foreground italic">
          Múltiplos arquivos permitidos. Lembre de salvar após enviar.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Section: Processos vinculados
// ============================================================

function SectionProcesses({
  op,
  canEdit,
  onAdd,
  onUnlink,
}: {
  op: OperatorDTO;
  canEdit: boolean;
  onAdd: () => void;
  onUnlink: (linkId: string, name: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Processos vinculados</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quais processos do Inventário este terceiro trata. O vínculo
            é usado pra escopo do Contribuidor, pra Seção 1 do RIPD, e
            pra detectar quais operadores tratam um processo aprovado.
          </p>
        </div>
        {canEdit && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Vincular processo
          </Button>
        )}
      </div>

      {op.processLinks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto opacity-30 mb-2" />
            <p className="text-sm">
              Nenhum processo vinculado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {op.processLinks.map((l) => (
            <Card key={l.id} className="border-l-4 border-l-blue-400">
              <CardContent className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/inventario/${l.dataInventoryId}`}
                    className="hover:underline"
                  >
                    <p className="font-medium text-sm truncate">
                      {l.inventory?.serviceName ?? "—"}
                    </p>
                  </Link>
                  {l.inventory?.status && (
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {l.inventory.status}
                    </Badge>
                  )}
                  {l.activityDescription && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      {l.activityDescription}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() =>
                      onUnlink(l.id, l.inventory?.serviceName ?? "este processo")
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers — Plano de Ação (Checkpoint 14 G4)
// ============================================================
// Detectam pendências do operador pra exibir o botão "Adicionar ao
// Plano" e construir o conteúdo da ação. Mesma lógica do import em
// `app/api/plano-acao/import/route.ts`, mas resumida pra UI.

function operatorIssues(op: OperatorDTO): string[] {
  const out: string[] = [];
  const expired =
    op.contractStatus === "VENCIDO" ||
    (op.contractExpiresAt && new Date(op.contractExpiresAt).getTime() < Date.now());
  const noContract = op.contractStatus === "SEM_CONTRATO";
  if (expired) out.push("Contrato VENCIDO — renovar urgente.");
  else if (noContract) out.push("Sem contrato cadastrado — formalizar.");
  if (op.relationType === "OPERADOR") {
    const missing: string[] = [];
    if (!op.hasPrivacyClause) missing.push("privacidade");
    if (!op.hasIncidentClause) missing.push("notificação de incidente");
    if (missing.length > 0) {
      out.push(`Faltam cláusulas obrigatórias: ${missing.join(", ")}.`);
    }
  }
  if (op.contractRiskClass === "ALTO") {
    out.push("Contrato classificado como risco ALTO pela régua ANPD.");
  }
  return out;
}

function hasOperatorIssues(op: OperatorDTO): boolean {
  return operatorIssues(op).length > 0;
}

function buildOperatorActionTitle(op: OperatorDTO): string {
  const issues = operatorIssues(op);
  if (issues.length === 0) return `Revisar operador "${op.name}"`;
  const first = issues[0].split(" — ")[0].split(":")[0];
  return `Operador "${op.name}": ${first}`;
}

function buildOperatorActionDescription(op: OperatorDTO): string {
  const issues = operatorIssues(op);
  if (issues.length === 0) return "Operador sem pendências críticas.";
  return `Pontos identificados na Gestão de Terceiros:\n\n• ${issues.join("\n• ")}`;
}

function operatorActionPriority(op: OperatorDTO): "ALTA" | "MEDIA" | "BAIXA" {
  if (
    op.contractStatus === "VENCIDO" ||
    op.contractStatus === "SEM_CONTRATO" ||
    op.contractRiskClass === "ALTO"
  ) {
    return "ALTA";
  }
  return "MEDIA";
}
