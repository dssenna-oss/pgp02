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
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
  Archive,
  Trash2,
  Clock,
  History,
  GitCompare,
  FileDown,
  Printer,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  type RipdDTO,
  type RipdData,
  ripdStatusLabel,
  ripdStatusBadgeClass,
  canEditRipd,
  canSubmitRipd,
  canApproveRipd,
  canRejectRipd,
  canDeleteRipd,
  canArchiveRipd,
  type RipdAuthUser,
} from "@/lib/ripd-helpers";
import {
  RIPD_SECTIONS,
  type SectionDef,
  type SectionField,
  getFieldValue,
  setFieldValue,
} from "./ripd-section-fields";
import RipdVersionsModal from "./ripd-versions-modal";
import RipdDiffModal from "./ripd-diff-modal";

interface RipdEditorContentProps {
  ripdId: string;
}

export default function RipdEditorContent({ ripdId }: RipdEditorContentProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const userIsDPO = isDPO(session?.user?.role);
  const userId = (session?.user as any)?.id ?? "";

  const [ripd, setRipd] = useState<RipdDTO | null>(null);
  const [data, setData] = useState<RipdData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [dirty, setDirty] = useState(false);

  // Modais
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveChangelog, setApproveChangelog] = useState("");
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  // Lista de versões (carregada lazy ao abrir modais)
  const [versions, setVersions] = useState<
    ReadonlyArray<{ version: number; approvedAt: string }>
  >([]);

  // Carrega lista de versões pra alimentar o dropdown do modal de
  // comparação (compartilhada com modal de histórico via fetch único).
  const loadVersions = async () => {
    try {
      const r = await fetch(`/api/ripd/${ripdId}/versions`, {
        cache: "no-store",
      });
      if (r.ok) {
        const j = await r.json();
        setVersions(
          (j.items as any[]).map((v) => ({
            version: v.version,
            approvedAt: v.approvedAt,
          }))
        );
      }
    } catch {
      /* silent — modais lidam com erros próprios */
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/ripd/${ripdId}`, { cache: "no-store" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao carregar RIPD");
        router.push("/dashboard/ripd");
        return;
      }
      const j = await r.json();
      setRipd(j.ripd);
      setData(j.ripd.data);
      setTitle(j.ripd.title);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ripdId]);

  // Permission helpers
  const authUser: RipdAuthUser | null = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: userId,
      companyId: "",
      role: session.user.role ?? "",
      isDPO: userIsDPO,
    };
  }, [session, userId, userIsDPO]);

  const canEdit =
    authUser && ripd
      ? canEditRipd(authUser, {
          createdById: ripd.createdBy?.id ?? "",
          status: ripd.status,
        })
      : false;
  const canSubmit =
    authUser && ripd
      ? canSubmitRipd(authUser, {
          createdById: ripd.createdBy?.id ?? "",
          status: ripd.status,
        })
      : false;
  const canApprove =
    authUser && ripd ? canApproveRipd(authUser, ripd) : false;
  const canReject = authUser && ripd ? canRejectRipd(authUser, ripd) : false;
  const canDelete =
    authUser && ripd
      ? canDeleteRipd(authUser, {
          createdById: ripd.createdBy?.id ?? "",
          status: ripd.status,
        })
      : false;
  const canArchive =
    authUser && ripd ? canArchiveRipd(authUser, ripd) : false;

  // ============== Handlers ==============
  const handleFieldChange = (path: string, value: string) => {
    if (!data) return;
    setData(setFieldValue(data, path, value));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!ripd || !data) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/ripd/${ripd.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, data }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      const j = await r.json();
      setRipd(j.ripd);
      setData(j.ripd.data);
      setTitle(j.ripd.title);
      setDirty(false);
      toast.success("Salvo");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!ripd) return;
    if (
      dirty &&
      !confirm("Há alterações não salvas. Salvar antes de enviar?")
    ) {
      return;
    }
    if (dirty) await handleSave();
    setSubmitting(true);
    try {
      const r = await fetch(`/api/ripd/${ripd.id}/submit`, { method: "POST" });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao enviar");
        return;
      }
      const j = await r.json();
      setRipd(j.ripd);
      notifySidebarRefresh();
      toast.success("RIPD enviado pra revisão do DPO");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!ripd) return;
    if (
      dirty &&
      !confirm(
        "Há alterações não salvas. Aprovar com elas? (Será salvo + aprovado.)"
      )
    ) {
      return;
    }
    if (dirty) await handleSave();
    setApproving(true);
    try {
      const r = await fetch(`/api/ripd/${ripd.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          approveChangelog.trim() ? { changeLog: approveChangelog.trim() } : {}
        ),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao aprovar");
        return;
      }
      const j = await r.json();
      setRipd(j.ripd);
      setShowApproveModal(false);
      setApproveChangelog("");
      notifySidebarRefresh();
      toast.success("RIPD aprovado");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!ripd) return;
    if (rejectionNote.trim().length < 5) {
      toast.error("Motivo precisa ter pelo menos 5 caracteres");
      return;
    }
    setRejecting(true);
    try {
      const r = await fetch(`/api/ripd/${ripd.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionNote: rejectionNote.trim() }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao rejeitar");
        return;
      }
      const j = await r.json();
      setRipd(j.ripd);
      setShowRejectModal(false);
      setRejectionNote("");
      notifySidebarRefresh();
      toast.success("RIPD devolvido com motivo");
    } finally {
      setRejecting(false);
    }
  };

  const handleArchive = async () => {
    if (!ripd) return;
    if (!confirm("Arquivar este RIPD? Ele não aparecerá mais nos filtros padrão.")) return;
    const r = await fetch(`/api/ripd/${ripd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARQUIVADO" }),
    });
    if (!r.ok) {
      toast.error("Erro ao arquivar");
      return;
    }
    const j = await r.json();
    setRipd(j.ripd);
    toast.success("RIPD arquivado");
  };

  const handleDelete = async () => {
    if (!ripd) return;
    if (
      !confirm(
        `Excluir "${ripd.title}"? Versões aprovadas também serão removidas. Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    const r = await fetch(`/api/ripd/${ripd.id}`, { method: "DELETE" });
    if (!r.ok) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("RIPD excluído");
    router.push("/dashboard/ripd");
  };

  // ============== Render ==============
  if (loading || !ripd || !data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando RIPD…
      </div>
    );
  }

  const section = RIPD_SECTIONS[activeSection];
  const isRejected = ripd.status === "RASCUNHO" && !!ripd.rejectionNote;
  const isApproved = ripd.status === "APROVADO";

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/ripd">
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
              className={cn("text-xs", ripdStatusBadgeClass(ripd.status))}
            >
              {ripdStatusLabel(ripd.status)}
            </Badge>
            {ripd.publishedVersionNum != null && (
              <Badge variant="outline" className="text-xs">
                v{ripd.publishedVersionNum} publicada
                {ripd.publishedAt && (
                  <> · {new Date(ripd.publishedAt).toLocaleDateString("pt-BR")}</>
                )}
              </Badge>
            )}
            {ripd.inventory && (
              <Badge variant="outline" className="text-xs gap-1">
                <FileText className="h-3 w-3" />
                {ripd.inventory.serviceName}
              </Badge>
            )}
          </div>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            disabled={!canEdit}
            className="text-xl font-semibold border-none px-0 h-auto py-1 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Título do RIPD"
          />
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {ripd.versionCount > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await loadVersions();
                  setShowVersionsModal(true);
                }}
                title="Ver histórico de versões aprovadas"
              >
                <History className="h-4 w-4 mr-1.5" />
                Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await loadVersions();
                  setShowDiffModal(true);
                }}
                title="Comparar duas versões"
              >
                <GitCompare className="h-4 w-4 mr-1.5" />
                Comparar
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const source = ripd.publishedContent ? "published" : "current";
              window.open(
                `/api/ripd/${ripd.id}/export?source=${source}`,
                "_blank"
              );
            }}
            title={
              ripd.publishedContent
                ? "Baixar versão publicada (.docx)"
                : "Baixar rascunho atual (.docx)"
            }
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            DOCX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const source = ripd.publishedContent ? "published" : "current";
              window.open(
                `/dashboard/ripd/${ripd.id}/pdf?source=${source}&autoprint=1`,
                "_blank"
              );
            }}
            title={
              ripd.publishedContent
                ? "Imprimir / salvar versão publicada (PDF)"
                : "Imprimir / salvar rascunho atual (PDF)"
            }
          >
            <Printer className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
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
          {canSubmit && (
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar pra revisão
            </Button>
          )}
          {canApprove && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowApproveModal(true)}
              disabled={approving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          )}
          {canReject && (
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          )}
          {canArchive && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Arquivar
            </Button>
          )}
          {canDelete && !canEdit && (
            // Botão excluir só quando não tem outro destaque (caso APROVADO, etc)
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Banners de status */}
      {isRejected && (
        <Card className="mb-4 border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="p-4 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-300">
                Devolvido pra ajustes
              </p>
              <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                {ripd.rejectionNote}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {isApproved && (
        <Card className="mb-4 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardContent className="p-4 flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Aprovado
                {ripd.approvedBy?.name && <> por {ripd.approvedBy.name}</>}
                {ripd.approvedAt && (
                  <>
                    {" "}
                    em{" "}
                    {new Date(ripd.approvedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </>
                )}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                A versão publicada está congelada no histórico. Você pode
                continuar editando o rascunho e clicar em "Aprovar"
                novamente pra publicar uma nova versão (v
                {(ripd.publishedVersionNum ?? 0) + 1}).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout 2 colunas: nav lateral + form */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Nav lateral das 8 seções */}
        <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
          {RIPD_SECTIONS.map((s, idx) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(idx)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-start gap-2.5",
                activeSection === idx
                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <span
                className={cn(
                  "h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold",
                  activeSection === idx
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {s.number}
              </span>
              <span className="text-sm leading-tight font-medium pt-0.5">
                {s.shortTitle}
              </span>
            </button>
          ))}
        </nav>

        {/* Conteúdo da seção ativa */}
        <div className="min-w-0">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="border-b pb-4 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
                  Seção {section.number} de {RIPD_SECTIONS.length}
                </p>
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {section.intro}
                </p>
              </div>

              <SectionForm
                section={section}
                ripd={ripd}
                data={data}
                disabled={!canEdit}
                onChange={handleFieldChange}
              />

              {/* Navegação entre seções */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeSection === 0}
                  onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
                >
                  ← Seção anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeSection === RIPD_SECTIONS.length - 1}
                  onClick={() =>
                    setActiveSection((s) =>
                      Math.min(RIPD_SECTIONS.length - 1, s + 1)
                    )
                  }
                >
                  Próxima seção →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Aprovar */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Aprovar RIPD
            </DialogTitle>
            <DialogDescription>
              A aprovação congela o conteúdo atual como nova versão (v
              {(ripd.publishedVersionNum ?? 0) + 1}). Versões anteriores
              ficam preservadas no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-changelog">
              Resumo da versão (opcional)
            </Label>
            <Textarea
              id="approve-changelog"
              value={approveChangelog}
              onChange={(e) => setApproveChangelog(e.target.value)}
              placeholder="Ex: revisão pós-mudança de operador; ajuste na seção 4 após sugestão jurídica."
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={approving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aprovando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar aprovação
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Histórico */}
      <RipdVersionsModal
        ripdId={ripd.id}
        open={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
      />

      {/* Modal: Comparar */}
      <RipdDiffModal
        ripdId={ripd.id}
        open={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        hasPublished={!!ripd.publishedContent}
        publishedVersionNum={ripd.publishedVersionNum}
        versions={versions}
      />

      {/* Modal: Rejeitar */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Devolver pra ajustes
            </DialogTitle>
            <DialogDescription>
              O RIPD volta pra rascunho. O criador verá o motivo e poderá
              ajustar e reenviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-note">Motivo da devolução *</Label>
            <Textarea
              id="rejection-note"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Explique o que precisa ser ajustado pra que o autor consiga corrigir."
              rows={5}
              minLength={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 5 caracteres. Será visível pro criador no banner do
              RIPD.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={rejecting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting || rejectionNote.trim().length < 5}
            >
              {rejecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Devolver com motivo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// SectionForm — renderiza campos da seção declarativamente
// ============================================================

function SectionForm({
  section,
  ripd,
  data,
  disabled,
  onChange,
}: {
  section: SectionDef;
  ripd: RipdDTO;
  data: RipdData;
  disabled: boolean;
  onChange: (path: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Lista anexa (Seção 6: riscos / Seção 7: controles + ações) */}
      {section.hasList === "risks" && (
        <RisksList risks={data.s6.risks} />
      )}
      {section.hasList === "existingControls" && (
        <ControlsAndActionsList
          controls={data.s7.existingControls}
          actions={data.s7.plannedActions}
        />
      )}

      {/* Campos editáveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section.fields.map((f) => (
          <FieldRenderer
            key={f.path}
            field={f}
            value={getFieldValue(data, f.path)}
            disabled={disabled}
            onChange={(v) => onChange(f.path, v)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  disabled,
  onChange,
}: {
  field: SectionField;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const colSpanClass = field.width === "half" ? "md:col-span-1" : "md:col-span-2";
  return (
    <div className={cn("space-y-1.5", colSpanClass)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={field.path} className="text-sm">
          {field.label}
        </Label>
        {field.prepop && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800"
            title="Pré-preenchido a partir de dados existentes (Inventário/Riscos/GAP/Plano). Você pode editar."
          >
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            auto
          </Badge>
        )}
      </div>
      {field.kind === "textarea" ? (
        <Textarea
          id={field.path}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={field.rows ?? 3}
          placeholder={field.placeholder ?? "—"}
        />
      ) : (
        <Input
          id={field.path}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.placeholder ?? "—"}
        />
      )}
      {field.hint && (
        <p className="text-xs text-muted-foreground">{field.hint}</p>
      )}
    </div>
  );
}

// ============================================================
// Listas anexas (riscos da S6 / controles+ações da S7)
// ============================================================

function RisksList({ risks }: { risks: RipdData["s6"]["risks"] }) {
  if (risks.length === 0) {
    return (
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Nenhum risco identificado pra este processo. Volte pra Análise
            de Riscos do processo no Inventário pra detalhar antes de
            aprovar este RIPD.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        Riscos identificados ({risks.length})
        <span className="text-xs font-normal text-muted-foreground">
          — vêm da Análise de Riscos do processo
        </span>
      </p>
      <div className="grid gap-2">
        {risks.map((r) => (
          <Card key={r.code} className="border-l-4 border-l-amber-400">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-[10px]">
                  {r.code}
                </Badge>
                {r.severityLevel && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.severityLevel === "ALTO" &&
                        "bg-red-50 text-red-700 border-red-300",
                      r.severityLevel === "MEDIO" &&
                        "bg-amber-50 text-amber-700 border-amber-300",
                      r.severityLevel === "BAIXO" &&
                        "bg-emerald-50 text-emerald-700 border-emerald-300"
                    )}
                  >
                    {r.severityLevel}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {r.status}
                </Badge>
              </div>
              <p className="font-medium text-sm">{r.label}</p>
              {r.severityDetail && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.severityDetail}
                </p>
              )}
              {r.description && (
                <p className="text-sm mt-1.5">{r.description}</p>
              )}
              {r.mitigationSummary && (
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  Mitigação: {r.mitigationSummary}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ControlsAndActionsList({
  controls,
  actions,
}: {
  controls: RipdData["s7"]["existingControls"];
  actions: RipdData["s7"]["plannedActions"];
}) {
  return (
    <div className="space-y-4">
      {/* Controles aderentes */}
      <div className="space-y-2">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Controles aderentes ({controls.length})
          <span className="text-xs font-normal text-muted-foreground">
            — do GAP Analysis
          </span>
        </p>
        {controls.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum controle marcado como aderente no GAP. Considere
            preencher o GAP Analysis antes de aprovar este RIPD.
          </p>
        ) : (
          <Card>
            <CardContent className="p-3 max-h-48 overflow-y-auto">
              <ul className="space-y-1.5 text-sm">
                {controls.slice(0, 20).map((c) => (
                  <li key={c.code} className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                      {c.code}
                    </Badge>
                    <span className="text-muted-foreground">{c.label}</span>
                  </li>
                ))}
                {controls.length > 20 && (
                  <li className="text-xs text-muted-foreground italic">
                    + {controls.length - 20} controles…
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ações abertas */}
      <div className="space-y-2">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Ações planejadas ({actions.length})
          <span className="text-xs font-normal text-muted-foreground">
            — do Plano de Ação
          </span>
        </p>
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma ação aberta ligada a este processo no Plano de Ação.
          </p>
        ) : (
          <div className="grid gap-1.5">
            {actions.map((a) => (
              <Card key={a.id} className="border-l-4 border-l-blue-400">
                <CardContent className="p-2.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {a.priority}
                  </Badge>
                  <span className="text-sm flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.status}
                  </span>
                  {a.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
