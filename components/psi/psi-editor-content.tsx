"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  History,
  GitCompare,
  FileDown,
  Printer,
  Trash2,
  Archive,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  type PsiDTO,
  type PsiData,
  PSI_SECTION_LABELS,
  psiStatusLabel,
  psiStatusBadgeClass,
  psiCompleteness,
  canEditPsi,
  canSubmitPsi,
  canApprovePsi,
  canRejectPsi,
  canDeletePsi,
  canArchivePsi,
  type PsiAuthUser,
} from "@/lib/psi-helpers";
import { TEXTAREA_FIELDS, CONTROL_LABELS } from "@/lib/psi-diff";
import PsiVersionsModal from "./psi-versions-modal";
import PsiDiffModal from "./psi-diff-modal";

interface PsiEditorContentProps {
  psiId: string;
}

export default function PsiEditorContent({ psiId }: PsiEditorContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userIsDPO = isDPO(session?.user?.role);
  const userId = (session?.user as any)?.id ?? "";

  const [psi, setPsi] = useState<PsiDTO | null>(null);
  const [data, setData] = useState<PsiData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0=cabeçalho, 1..7=seções
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveChangelog, setApproveChangelog] = useState("");
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);

  useEffect(() => {
    fetch(`/api/psi/${psiId}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "PSI não encontrada");
          return null;
        }
        const j = await r.json();
        return j.psi as PsiDTO;
      })
      .then((p) => {
        if (p) {
          setPsi(p);
          setData(p.data);
          setTitle(p.title);
        }
      })
      .finally(() => setLoading(false));
  }, [psiId]);

  // Auto-save 1.2s após edit
  useEffect(() => {
    if (!dirty || !psi || !data) return;
    const t = setTimeout(() => {
      void doSave({ silent: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, data, title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aviso ao sair sem salvar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando PSI…
      </div>
    );
  }

  if (!psi || !data) {
    return (
      <div className="container mx-auto py-6 max-w-3xl space-y-4">
        <Link href="/dashboard/psi">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            PSI não encontrada ou sem permissão de acesso.
          </CardContent>
        </Card>
      </div>
    );
  }

  const authUser: PsiAuthUser = {
    id: userId,
    companyId: "",
    role: session?.user?.role ?? "",
    isDPO: userIsDPO,
  };
  const psiForCheck = { createdById: psi.createdBy?.id ?? "", status: psi.status };
  const canEdit = canEditPsi(authUser, psiForCheck);
  const canSubmit = canSubmitPsi(authUser, psiForCheck);
  const canApprove = canApprovePsi(authUser, psiForCheck);
  const canReject = canRejectPsi(authUser, psiForCheck);
  const canDelete = canDeletePsi(authUser, psiForCheck);
  const canArchive = canArchivePsi(authUser, psiForCheck);

  const completeness = psiCompleteness(data);

  function updateTextarea(sectionKey: string, fieldKey: string, value: string) {
    if (!canEdit) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as any;
      next[sectionKey][fieldKey] = value;
      return next;
    });
    setDirty(true);
  }

  function updateControl(sectionKey: string, ctrlKey: string, value: boolean) {
    if (!canEdit) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as any;
      next[sectionKey].controles[ctrlKey] = value;
      return next;
    });
    setDirty(true);
  }

  function updateHeader(fieldKey: string, value: string) {
    if (!canEdit) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as any;
      next.header[fieldKey] = value;
      return next;
    });
    setDirty(true);
  }

  async function doSave(opts: { silent?: boolean } = {}) {
    if (!data || !psi || !canEdit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/psi/${psiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || psi.title,
          data,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        if (!opts.silent) toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      const j = await r.json();
      setPsi(j.psi);
      setData(j.psi.data);
      setDirty(false);
      if (!opts.silent) toast.success("PSI salva");
    } finally {
      setSaving(false);
    }
  }

  async function doSubmit() {
    if (dirty) await doSave({ silent: true });
    const r = await fetch(`/api/psi/${psiId}/submit`, { method: "POST" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao enviar pra revisão");
      return;
    }
    const j = await r.json();
    setPsi(j.psi);
    setData(j.psi.data);
    toast.success("PSI enviada pra revisão do DPO");
    notifySidebarRefresh();
  }

  async function doApprove() {
    if (dirty) await doSave({ silent: true });
    const r = await fetch(`/api/psi/${psiId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeLog: approveChangelog.trim() || null }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao aprovar");
      return;
    }
    const j = await r.json();
    setPsi(j.psi);
    setData(j.psi.data);
    setShowApproveModal(false);
    setApproveChangelog("");
    toast.success(`PSI aprovada — versão v${j.psi.publishedVersionNum} congelada`);
    notifySidebarRefresh();
  }

  async function doReject() {
    if (rejectionNote.trim().length < 5) {
      toast.error("Informe o motivo (mínimo 5 caracteres)");
      return;
    }
    const r = await fetch(`/api/psi/${psiId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectionNote.trim() }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao rejeitar");
      return;
    }
    const j = await r.json();
    setPsi(j.psi);
    setData(j.psi.data);
    setShowRejectModal(false);
    setRejectionNote("");
    toast.success("PSI devolvida pro autor");
    notifySidebarRefresh();
  }

  async function doArchive() {
    if (!confirm("Arquivar esta PSI? Ela ficará imutável até desarquivar.")) return;
    const r = await fetch(`/api/psi/${psiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ARQUIVADO" }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao arquivar");
      return;
    }
    const j = await r.json();
    setPsi(j.psi);
    setData(j.psi.data);
    toast.success("PSI arquivada");
  }

  async function doDelete() {
    if (!confirm(`Excluir "${psi!.title}"? Versões aprovadas também serão removidas.`)) return;
    const r = await fetch(`/api/psi/${psiId}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao excluir");
      return;
    }
    toast.success("PSI excluída");
    notifySidebarRefresh();
    router.push("/dashboard/psi");
  }

  function downloadDocx(source: "current" | "published") {
    window.open(`/api/psi/${psiId}/export?source=${source}`, "_blank");
  }

  function openPdf() {
    window.open(`/dashboard/psi/${psiId}/pdf?autoprint=1`, "_blank");
  }

  // Tabs: 0=Cabeçalho, 1..7=seções S1..S7
  const tabs = [
    { idx: 0, label: "Cabeçalho", icon: "📋", completeness: undefined },
    ...PSI_SECTION_LABELS.map((s, i) => ({
      idx: i + 1,
      label: s.short,
      icon: s.icon,
      completeness: completeness[s.key as keyof typeof completeness] as number,
    })),
  ];

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/psi">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            PSI
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground truncate">{psi.title}</span>
      </div>

      {/* HEADER */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div className="flex-1 min-w-0">
              {canEdit ? (
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                  className="text-xl font-bold h-auto py-1 border-none shadow-none focus-visible:ring-1 -ml-2 px-2"
                />
              ) : (
                <h1 className="text-xl font-bold">{psi.title}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span
                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${psiStatusBadgeClass(
                    psi.status
                  )}`}
                >
                  {psiStatusLabel(psi.status)}
                </span>
                {psi.publishedVersionNum && (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    v{psi.publishedVersionNum}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Completa <strong>{Math.round(completeness.overall * 100)}%</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Última edição {new Date(psi.updatedAt).toLocaleString("pt-BR")} ·{" "}
                {psi.createdBy?.name ?? "—"}
                {saving && <span className="ml-2 text-cyan-600">💾 Salvando…</span>}
                {!saving && dirty && <span className="ml-2 text-amber-600">● não salvo</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionsModal(true)}
                className="gap-1"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiffModal(true)}
                disabled={!psi.publishedContent && !dirty}
                className="gap-1"
              >
                <GitCompare className="h-4 w-4" />
                Comparar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadDocx(psi.publishedContent ? "published" : "current")}
                className="gap-1"
              >
                <FileDown className="h-4 w-4" />
                DOCX
              </Button>
              <Button variant="outline" size="sm" onClick={openPdf} className="gap-1">
                <Printer className="h-4 w-4" />
                PDF
              </Button>
              {psi.publicUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(psi.publicUrl!, "_blank")}
                  className="gap-1 border-cyan-300 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300"
                  title="URL pública sem auth — copie e divulgue pra colaboradores"
                >
                  <ExternalLink className="h-4 w-4" />
                  Página pública
                </Button>
              )}
            </div>
          </div>

          {/* Banner devolução */}
          {psi.rejectionNote && psi.status === "RASCUNHO" && (
            <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3 mb-3 text-sm">
              <div className="font-semibold text-red-900 dark:text-red-200 mb-1 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Devolvida pelo DPO
              </div>
              <p className="text-red-800 dark:text-red-300">{psi.rejectionNote}</p>
            </div>
          )}

          {/* Workflow buttons */}
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <Button onClick={doSubmit} className="gap-1 bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
                Enviar pra revisão
              </Button>
            )}
            {canApprove && (
              <Button
                onClick={() => setShowApproveModal(true)}
                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
                {psi.publishedVersionNum ? ` (v${psi.publishedVersionNum + 1})` : ""}
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </Button>
            )}
            {canArchive && (
              <Button variant="outline" onClick={doArchive} className="gap-1">
                <Archive className="h-4 w-4" />
                Arquivar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={doDelete}
                className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                onClick={() => doSave()}
                disabled={!dirty || saving}
                className="gap-1 ml-auto"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
          const isActive = t.idx === activeTab;
          const c = t.completeness;
          return (
            <button
              key={t.idx}
              type="button"
              onClick={() => setActiveTab(t.idx)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-cyan-600 text-cyan-700 dark:text-cyan-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {c !== undefined && c >= 0.99 && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo da tab ativa */}
      <Card>
        <CardContent className="p-5 space-y-5">
          {activeTab === 0 ? (
            <HeaderTab data={data} canEdit={canEdit} onChange={updateHeader} />
          ) : (
            <SectionTab
              sectionKey={PSI_SECTION_LABELS[activeTab - 1].key}
              sectionLabel={PSI_SECTION_LABELS[activeTab - 1].label}
              sectionIcon={PSI_SECTION_LABELS[activeTab - 1].icon}
              data={data}
              canEdit={canEdit}
              onTextChange={updateTextarea}
              onControlChange={updateControl}
            />
          )}

          {/* Navegação tabs */}
          <div className="flex justify-between pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeTab === 0}
              onClick={() => setActiveTab((i) => Math.max(0, i - 1))}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={activeTab === tabs.length - 1}
              onClick={() => setActiveTab((i) => Math.min(tabs.length - 1, i + 1))}
              className="gap-1"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <Dialog open={showApproveModal} onOpenChange={(o) => !o && setShowApproveModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar PSI</DialogTitle>
            <DialogDescription>
              Cria uma nova versão congelada (v{(psi.publishedVersionNum ?? 0) + 1}).
              Opcionalmente descreva o que mudou.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Changelog (opcional)</Label>
            <Textarea
              value={approveChangelog}
              onChange={(e) => setApproveChangelog(e.target.value)}
              placeholder="Ex.: Atualização anual; reforço de MFA em sistemas críticos."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancelar
            </Button>
            <Button onClick={doApprove} className="bg-emerald-600 hover:bg-emerald-700">
              Aprovar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectModal} onOpenChange={(o) => !o && setShowRejectModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar PSI</DialogTitle>
            <DialogDescription>
              A PSI volta pro autor com este motivo. Mín. 5 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Motivo *</Label>
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Ex.: Falta detalhar o procedimento de backup offsite."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button onClick={doReject} className="bg-red-600 hover:bg-red-700">
              Devolver pro autor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showVersionsModal && (
        <PsiVersionsModal
          psiId={psiId}
          publishedVersionNum={psi.publishedVersionNum}
          onClose={() => setShowVersionsModal(false)}
        />
      )}
      {showDiffModal && (
        <PsiDiffModal
          psiId={psiId}
          publishedVersionNum={psi.publishedVersionNum}
          onClose={() => setShowDiffModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Tab cabeçalho
// ============================================================
function HeaderTab({
  data,
  canEdit,
  onChange,
}: {
  data: PsiData;
  canEdit: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Cabeçalho institucional</h2>
        <p className="text-sm text-muted-foreground">
          Identifica vigência, escopo e ritmo de revisão da política.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Vigência</Label>
          <Input
            value={data.header.vigencia}
            onChange={(e) => onChange("vigencia", e.target.value)}
            placeholder="2026–2027"
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-1">
          <Label>Última revisão</Label>
          <Input
            type="date"
            value={data.header.ultimaRevisao}
            onChange={(e) => onChange("ultimaRevisao", e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Frequência de revisão</Label>
          <Input
            value={data.header.frequenciaRevisao}
            onChange={(e) => onChange("frequenciaRevisao", e.target.value)}
            placeholder="Anual ou após incidentes críticos."
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Aplicabilidade (escopo)</Label>
          <Textarea
            value={data.header.aplicabilidade}
            onChange={(e) => onChange("aplicabilidade", e.target.value)}
            placeholder="Esta política se aplica a todos os colaboradores, terceiros…"
            rows={4}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab seção (S1..S7)
// ============================================================
function SectionTab({
  sectionKey,
  sectionLabel,
  sectionIcon,
  data,
  canEdit,
  onTextChange,
  onControlChange,
}: {
  sectionKey: string;
  sectionLabel: string;
  sectionIcon: string;
  data: PsiData;
  canEdit: boolean;
  onTextChange: (sectionKey: string, fieldKey: string, value: string) => void;
  onControlChange: (sectionKey: string, ctrlKey: string, value: boolean) => void;
}) {
  const fields = TEXTAREA_FIELDS[sectionKey] ?? [];
  const controlMap = CONTROL_LABELS[sectionKey] ?? {};
  const sectionData = (data as any)[sectionKey] ?? {};
  const controles = sectionData.controles ?? {};

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>{sectionIcon}</span>
          {sectionLabel}
        </h2>
      </div>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label>{f.label}</Label>
          <Textarea
            value={String(sectionData[f.key] ?? "")}
            onChange={(e) => onTextChange(sectionKey, f.key, e.target.value)}
            rows={f.key === "declaracao" || f.key === "responsabilidades" ? 6 : 4}
            disabled={!canEdit}
          />
        </div>
      ))}
      {Object.keys(controlMap).length > 0 && (
        <div className="space-y-2 pt-3 border-t">
          <Label className="text-base font-medium">Controles aplicados</Label>
          <p className="text-xs text-muted-foreground">
            Marque os controles efetivamente implementados. Servem de evidência
            pra fiscalização e geram completude da seção.
          </p>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {Object.entries(controlMap).map(([key, label]) => (
              <label
                key={key}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors",
                  controles[key]
                    ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800",
                  !canEdit && "cursor-not-allowed opacity-70"
                )}
              >
                <Checkbox
                  checked={Boolean(controles[key])}
                  onCheckedChange={(v) => onControlChange(sectionKey, key, Boolean(v))}
                  disabled={!canEdit}
                  className="mt-0.5"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
