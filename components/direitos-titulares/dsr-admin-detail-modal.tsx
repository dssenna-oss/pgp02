/**
 * Modal de detalhe e atendimento de uma Requisição de Direitos do Titular.
 *
 * Mostra todos os dados da requisição em seções colapsáveis e expõe o
 * workflow de atendimento (mudar status, registrar decisão + texto de
 * resposta + providências adotadas).
 */
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User,
  FileText,
  ExternalLink,
  Save,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  DSR_RIGHTS,
  DSR_STATUS_LABELS,
  DSR_STATUS_COLORS,
  DSR_STATUSES,
  DSR_DECISIONS,
  DSR_DECISION_LABELS,
  DSR_RESPONSE_CHANNELS,
  DSR_RESPONSE_CHANNEL_LABELS,
  DSR_TITULAR_CATEGORY_LABELS,
  daysUntilDue,
  deadlineUrgency,
  type DsrStatus,
  type DsrDecision,
  type DsrResponseChannel,
  type DsrRightCode,
  type DsrTitularCategory,
} from "@/lib/data-subject-requests";

type DsrFull = {
  id: string;
  protocolNumber: string;
  titularName: string;
  titularCpf: string;
  titularDocType: string | null;
  titularDocNumber: string | null;
  titularBirthDate: string | null;
  titularPhone: string;
  titularEmail: string;
  titularAddress: string | null;
  titularCategory: string;
  titularCategoryOther: string | null;
  hasRepresentative: boolean;
  representativeName: string | null;
  representativeCpf: string | null;
  representativeType: string | null;
  representativeTypeOther: string | null;
  representativeEmail: string | null;
  representativePhone: string | null;
  requestedRights: string[];
  detailedRequest: string;
  responseChannel: string;
  responseChannelOther: string | null;
  identityDocUrl: string | null;
  representationDocUrl: string | null;
  additionalDocs: Array<{ name: string; url: string }> | null;
  status: DsrStatus;
  decision: DsrDecision | null;
  responseText: string | null;
  responseActions: string | null;
  responseDate: string | null;
  responseChannelUsed: DsrResponseChannel | null;
  respondedByUser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  authenticityAccepted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

const URG_TEXT: Record<ReturnType<typeof deadlineUrgency>, string> = {
  overdue: "Prazo vencido",
  critical: "Prazo crítico (≤ 3 dias)",
  warning: "Atenção ao prazo (≤ 7 dias)",
  normal: "Dentro do prazo",
  concluded: "Concluído",
};
const URG_BG: Record<ReturnType<typeof deadlineUrgency>, string> = {
  overdue: "bg-red-50 border-red-200 text-red-900",
  critical: "bg-orange-50 border-orange-200 text-orange-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  normal: "bg-blue-50 border-blue-200 text-blue-900",
  concluded: "bg-green-50 border-green-200 text-green-900",
};

export function DsrAdminDetailModal({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dsr, setDsr] = useState<DsrFull | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Estado editável do workflow
  const [newStatus, setNewStatus] = useState<DsrStatus | "">("");
  const [decision, setDecision] = useState<DsrDecision | "">("");
  const [responseText, setResponseText] = useState("");
  const [responseActions, setResponseActions] = useState("");
  const [responseChannelUsed, setResponseChannelUsed] = useState<
    DsrResponseChannel | ""
  >("");

  // Fetch detalhe
  useEffect(() => {
    if (!requestId || !open) return;
    setLoading(true);
    setShowWorkflow(false);
    fetch(`/api/direitos-titulares/${requestId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setDsr(data);
        // Pré-popular workflow com valores atuais
        setNewStatus(data.status);
        setDecision(data.decision || "");
        setResponseText(data.responseText || "");
        setResponseActions(data.responseActions || "");
        setResponseChannelUsed(data.responseChannelUsed || "");
      })
      .catch((e) => {
        console.error(e);
        toast.error("Erro ao carregar detalhes.");
      })
      .finally(() => setLoading(false));
  }, [requestId, open]);

  async function saveWorkflow() {
    if (!dsr) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (newStatus && newStatus !== dsr.status) payload.status = newStatus;
      if (decision && decision !== dsr.decision) payload.decision = decision;
      if (responseText !== (dsr.responseText || ""))
        payload.responseText = responseText;
      if (responseActions !== (dsr.responseActions || ""))
        payload.responseActions = responseActions;
      if (responseChannelUsed && responseChannelUsed !== dsr.responseChannelUsed)
        payload.responseChannelUsed = responseChannelUsed;

      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração para salvar.");
        return;
      }

      const res = await fetch(`/api/direitos-titulares/${dsr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar.");
        return;
      }
      toast.success("Atendimento atualizado.");
      setDsr(json.request);
      setShowWorkflow(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro de rede.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : dsr ? (
              <>
                <span className="font-mono text-base">
                  {dsr.protocolNumber}
                </span>
                {dsr.status && (
                  <span
                    className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${DSR_STATUS_COLORS[dsr.status].bg} ${DSR_STATUS_COLORS[dsr.status].fg} ${DSR_STATUS_COLORS[dsr.status].ring}`}
                  >
                    {DSR_STATUS_LABELS[dsr.status]}
                  </span>
                )}
              </>
            ) : (
              "Carregando…"
            )}
          </DialogTitle>
          {dsr && (
            <DialogDescription>
              Recebida em{" "}
              {new Date(dsr.createdAt).toLocaleString("pt-BR")} ·{" "}
              {dsr.titularName}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading || !dsr ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Banner de prazo */}
            <PrazoBanner dueDate={dsr.dueDate} status={dsr.status} />

            {/* Identificação do titular */}
            <Section title="Identificação do titular" icon={<User className="h-4 w-4" />}>
              <Grid>
                <Info label="Nome" value={dsr.titularName} />
                <Info label="CPF" value={dsr.titularCpf} />
                <Info
                  label="Documento"
                  value={
                    dsr.titularDocType
                      ? `${dsr.titularDocType} ${dsr.titularDocNumber || ""}`
                      : "—"
                  }
                />
                <Info
                  label="Data de nascimento"
                  value={
                    dsr.titularBirthDate
                      ? new Date(dsr.titularBirthDate).toLocaleDateString("pt-BR")
                      : "—"
                  }
                />
                <Info label="E-mail" value={dsr.titularEmail} icon={<Mail className="h-3 w-3" />} />
                <Info label="Telefone" value={dsr.titularPhone} icon={<Phone className="h-3 w-3" />} />
                <Info
                  label="Endereço"
                  value={dsr.titularAddress || "—"}
                  icon={<MapPin className="h-3 w-3" />}
                  fullRow
                />
                <Info
                  label="Categoria"
                  value={
                    dsr.titularCategory === "outro"
                      ? dsr.titularCategoryOther || "Outro"
                      : DSR_TITULAR_CATEGORY_LABELS[
                          dsr.titularCategory as DsrTitularCategory
                        ] || dsr.titularCategory
                  }
                  fullRow
                />
              </Grid>
            </Section>

            {/* Representante */}
            {dsr.hasRepresentative && (
              <Section title="Representante legal / procurador">
                <Grid>
                  <Info label="Nome" value={dsr.representativeName || "—"} />
                  <Info label="CPF" value={dsr.representativeCpf || "—"} />
                  <Info label="E-mail" value={dsr.representativeEmail || "—"} />
                  <Info label="Telefone" value={dsr.representativePhone || "—"} />
                  <Info
                    label="Tipo de representação"
                    value={
                      dsr.representativeType === "outro"
                        ? dsr.representativeTypeOther || "Outro"
                        : dsr.representativeType || "—"
                    }
                    fullRow
                  />
                </Grid>
              </Section>
            )}

            {/* Direitos a exercer */}
            <Section title="Direitos a exercer" icon={<FileText className="h-4 w-4" />}>
              <ul className="space-y-1.5">
                {dsr.requestedRights.map((code) => {
                  const r = DSR_RIGHTS[code as DsrRightCode];
                  return (
                    <li
                      key={code}
                      className="flex items-start gap-2 rounded-md bg-blue-50/50 px-3 py-2 text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700" />
                      <div>
                        <span className="font-mono text-xs text-slate-500 mr-2">
                          {code}
                        </span>
                        <span className="font-medium">{r?.label || code}</span>
                        {r?.legal && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({r.legal}, LGPD)
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            {/* Detalhamento */}
            <Section title="Detalhamento do pedido">
              <p className="rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                {dsr.detailedRequest}
              </p>
            </Section>

            {/* Canal preferido */}
            <Section title="Canal preferido para resposta">
              <p className="text-sm">
                {dsr.responseChannel === "outro"
                  ? dsr.responseChannelOther || "Outro"
                  : DSR_RESPONSE_CHANNEL_LABELS[
                      dsr.responseChannel as DsrResponseChannel
                    ] || dsr.responseChannel}
              </p>
            </Section>

            {/* Anexos */}
            <Section title="Anexos">
              <div className="space-y-2">
                {dsr.identityDocUrl ? (
                  <AnexoLink
                    label="Documento de identidade"
                    url={dsr.identityDocUrl}
                  />
                ) : (
                  <p className="text-sm text-red-700">
                    ⚠ Nenhum documento de identidade anexado.
                  </p>
                )}
                {dsr.representationDocUrl && (
                  <AnexoLink
                    label="Documento de representação"
                    url={dsr.representationDocUrl}
                  />
                )}
                {dsr.additionalDocs?.map((doc, i) => (
                  <AnexoLink key={i} label={doc.name} url={doc.url} />
                ))}
              </div>
            </Section>

            {/* Resposta anterior (se houver) */}
            {(dsr.decision || dsr.responseText) && (
              <Section
                title="Resposta anterior"
                icon={<CheckCircle2 className="h-4 w-4 text-green-700" />}
              >
                <div className="space-y-2 rounded-md border border-green-200 bg-green-50/40 p-3 text-sm">
                  {dsr.decision && (
                    <p>
                      <strong>Decisão:</strong> {DSR_DECISION_LABELS[dsr.decision]}
                    </p>
                  )}
                  {dsr.responseText && (
                    <p className="whitespace-pre-wrap">
                      <strong>Resposta:</strong> {dsr.responseText}
                    </p>
                  )}
                  {dsr.responseActions && (
                    <p className="whitespace-pre-wrap">
                      <strong>Providências:</strong> {dsr.responseActions}
                    </p>
                  )}
                  {dsr.responseDate && (
                    <p className="text-xs text-slate-600">
                      Respondida em{" "}
                      {new Date(dsr.responseDate).toLocaleString("pt-BR")}
                      {dsr.respondedByUser?.name &&
                        ` por ${dsr.respondedByUser.name}`}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {/* Workflow editável */}
            <Separator />

            {!showWorkflow ? (
              <Button onClick={() => setShowWorkflow(true)} variant="outline">
                Atualizar atendimento →
              </Button>
            ) : (
              <div className="space-y-4 rounded-md border border-blue-200 bg-blue-50/30 p-4">
                <h3 className="font-medium">Workflow de atendimento</h3>

                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Status
                  </Label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as DsrStatus)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    {DSR_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {DSR_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Decisão
                  </Label>
                  <select
                    value={decision}
                    onChange={(e) =>
                      setDecision(e.target.value as DsrDecision | "")
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— Selecione —</option>
                    {DSR_DECISIONS.map((d) => (
                      <option key={d} value={d}>
                        {DSR_DECISION_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Texto da resposta ao titular
                  </Label>
                  <Textarea
                    rows={5}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Resposta institucional ao titular, em linguagem clara."
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Providências adotadas (interno)
                  </Label>
                  <Textarea
                    rows={3}
                    value={responseActions}
                    onChange={(e) => setResponseActions(e.target.value)}
                    placeholder="Registro interno das ações tomadas (não enviado ao titular)."
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-medium">
                    Canal usado para responder
                  </Label>
                  <select
                    value={responseChannelUsed}
                    onChange={(e) =>
                      setResponseChannelUsed(
                        e.target.value as DsrResponseChannel | "",
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— Selecione —</option>
                    {DSR_RESPONSE_CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {DSR_RESPONSE_CHANNEL_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Ao mudar o status para <strong>Respondida</strong> ou{" "}
                    <strong>Indeferida</strong>, a data de resposta e o nome do
                    DPO serão registrados automaticamente.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowWorkflow(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveWorkflow} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Auditoria */}
            <Separator />
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer">Auditoria técnica</summary>
              <div className="mt-2 space-y-1 rounded-md bg-slate-50 p-2 font-mono">
                <p>IP: {dsr.ipAddress || "—"}</p>
                <p>
                  User-Agent:{" "}
                  <span className="break-all">{dsr.userAgent || "—"}</span>
                </p>
                <p>
                  Aceite da declaração:{" "}
                  {dsr.authenticityAccepted ? "✓ sim" : "✗ não"}
                </p>
              </div>
            </details>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {dsr && (
            <Button asChild variant="outline" size="sm">
              <a
                href={`/api/direitos-titulares/${dsr.id}/export-docx`}
                download={`Resposta_${dsr.protocolNumber}.docx`}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar DOCX da resposta
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- componentes auxiliares ----------
function PrazoBanner({
  dueDate,
  status,
}: {
  dueDate: string;
  status: DsrStatus;
}) {
  const urg = deadlineUrgency(dueDate, status);
  const days = daysUntilDue(dueDate);
  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-4 py-3 ${URG_BG[urg]}`}
    >
      <Clock className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">{URG_TEXT[urg]}</p>
        <p className="text-xs">
          Prazo legal:{" "}
          {new Date(dueDate).toLocaleDateString("pt-BR")}
          {urg !== "concluded" && (
            <>
              {" · "}
              {days >= 0
                ? `${days} dia${days === 1 ? "" : "s"} restantes`
                : `${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"} em atraso`}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>;
}

function Info({
  label,
  value,
  icon,
  fullRow,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  fullRow?: boolean;
}) {
  return (
    <div className={fullRow ? "sm:col-span-2" : ""}>
      <dt className="flex items-center gap-1 text-xs text-slate-500">
        {icon} {label}
      </dt>
      <dd className="text-sm font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function AnexoLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      <FileText className="h-4 w-4 text-slate-600" />
      <span className="flex-1">{label}</span>
      <ExternalLink className="h-3 w-3 text-slate-400" />
    </a>
  );
}
