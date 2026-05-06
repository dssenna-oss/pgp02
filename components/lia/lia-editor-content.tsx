"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  AlertTriangle,
  History,
  GitCompare,
  FileDown,
  Printer,
  Trash2,
  Archive,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { isDPO } from "@/lib/auth-helpers";
import { notifySidebarRefresh } from "@/lib/sidebar-events";
import {
  type LiaDTO,
  type LiaData,
  liaStatusLabel,
  liaStatusBadgeClass,
  liaIsBlocked,
  liaCompleteness,
  canEditLia,
  canSubmitLia,
  canApproveLia,
  canRejectLia,
  canDeleteLia,
  canArchiveLia,
  type LiaAuthUser,
} from "@/lib/lia-helpers";
import { LIA_TEMPLATE, type LiaQuestion } from "@/lib/lia-templates";
import LiaVersionsModal from "./lia-versions-modal";
import LiaDiffModal from "./lia-diff-modal";

interface LiaEditorContentProps {
  liaId: string;
}

export default function LiaEditorContent({ liaId }: LiaEditorContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userIsDPO = isDPO(session?.user?.role);
  const userId = (session?.user as any)?.id ?? "";

  const [lia, setLia] = useState<LiaDTO | null>(null);
  const [data, setData] = useState<LiaData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  // Modais
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveChangelog, setApproveChangelog] = useState("");
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);

  // Carrega LIA
  useEffect(() => {
    fetch(`/api/lia/${liaId}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "LIA não encontrada");
          return null;
        }
        const j = await r.json();
        return j.lia as LiaDTO;
      })
      .then((l) => {
        if (l) {
          setLia(l);
          setData(l.data);
          setTitle(l.title);
        }
      })
      .finally(() => setLoading(false));
  }, [liaId]);

  // Auto-save: dispara um save 1.2s depois da última edição
  useEffect(() => {
    if (!dirty || !lia || !data) return;
    const t = setTimeout(() => {
      void doSave({ silent: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, data, title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aviso de saída sem salvar
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
        Carregando LIA…
      </div>
    );
  }

  if (!lia || !data) {
    return (
      <div className="container mx-auto py-6 max-w-3xl space-y-4">
        <Link href="/dashboard/lia">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            LIA não encontrada ou sem permissão de acesso.
          </CardContent>
        </Card>
      </div>
    );
  }

  const authUser: LiaAuthUser = {
    id: userId,
    companyId: "",
    role: session?.user?.role ?? "",
    isDPO: userIsDPO,
  };
  const liaForCheck = { createdById: lia.createdBy?.id ?? "", status: lia.status };
  const canEdit = canEditLia(authUser, liaForCheck);
  const canSubmit = canSubmitLia(authUser, liaForCheck);
  const canApprove = canApproveLia(authUser, liaForCheck);
  const canReject = canRejectLia(authUser, liaForCheck);
  const canDelete = canDeleteLia(authUser, liaForCheck);
  const canArchive = canArchiveLia(authUser, liaForCheck);

  const blocked = liaIsBlocked(data);
  const completeness = liaCompleteness(data);

  function updatePath(path: string, value: unknown) {
    if (!canEdit) return;
    setData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as any;
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  }

  async function doSave(opts: { silent?: boolean } = {}) {
    if (!data || !lia) return;
    if (!canEdit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/lia/${liaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || lia.title,
          data,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        if (!opts.silent) toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      const j = await r.json();
      setLia(j.lia);
      setData(j.lia.data);
      setDirty(false);
      if (!opts.silent) toast.success("LIA salva");
    } finally {
      setSaving(false);
    }
  }

  async function doSubmit() {
    if (dirty) await doSave({ silent: true });
    const r = await fetch(`/api/lia/${liaId}/submit`, { method: "POST" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao enviar pra revisão");
      return;
    }
    const j = await r.json();
    setLia(j.lia);
    setData(j.lia.data);
    toast.success("LIA enviada pra revisão do DPO");
    notifySidebarRefresh();
  }

  async function doApprove() {
    if (dirty) await doSave({ silent: true });
    const r = await fetch(`/api/lia/${liaId}/approve`, {
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
    setLia(j.lia);
    setData(j.lia.data);
    setShowApproveModal(false);
    setApproveChangelog("");
    toast.success(
      `LIA aprovada — versão v${j.lia.publishedVersionNum} congelada`
    );
    notifySidebarRefresh();
  }

  async function doReject() {
    if (rejectionNote.trim().length < 5) {
      toast.error("Informe o motivo (mínimo 5 caracteres)");
      return;
    }
    const r = await fetch(`/api/lia/${liaId}/reject`, {
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
    setLia(j.lia);
    setData(j.lia.data);
    setShowRejectModal(false);
    setRejectionNote("");
    toast.success("LIA devolvida pro autor com motivo");
    notifySidebarRefresh();
  }

  async function doArchive() {
    if (!confirm("Arquivar esta LIA? Ela ficará imutável até desarquivar.")) return;
    const r = await fetch(`/api/lia/${liaId}`, {
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
    setLia(j.lia);
    setData(j.lia.data);
    toast.success("LIA arquivada");
  }

  async function doDelete() {
    if (!confirm(`Excluir "${lia!.title}"? Versões aprovadas também serão removidas.`)) {
      return;
    }
    const r = await fetch(`/api/lia/${liaId}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao excluir");
      return;
    }
    toast.success("LIA excluída");
    notifySidebarRefresh();
    router.push("/dashboard/lia");
  }

  function downloadDocx(source: "current" | "published") {
    window.open(`/api/lia/${liaId}/export?source=${source}`, "_blank");
  }

  function openPdf() {
    window.open(`/dashboard/lia/${liaId}/pdf?autoprint=1`, "_blank");
  }

  const sec = LIA_TEMPLATE[activeSection];
  const completenessOf = (idx: number) => {
    if (idx === 0) return completeness.s1;
    if (idx === 1) return completeness.s2;
    return completeness.s3;
  };
  const sectionStatus = (idx: number) => {
    const c = completenessOf(idx);
    if (c >= 0.99) return "complete" as const;
    if (idx === activeSection) return "active" as const;
    return "pending" as const;
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard/lia">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            LIA
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground truncate">{lia.title}</span>
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
                <h1 className="text-xl font-bold">{lia.title}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span
                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${liaStatusBadgeClass(
                    lia.status
                  )}`}
                >
                  {liaStatusLabel(lia.status)}
                </span>
                {blocked && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-300">
                    <AlertTriangle className="h-3 w-3" />
                    Bloqueada (Art. 11/14)
                  </span>
                )}
                {lia.publishedVersionNum && (
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-300">
                    v{lia.publishedVersionNum}
                  </span>
                )}
                {lia.inventory && (
                  <Link
                    href={`/dashboard/inventario/${lia.inventory.id}`}
                    className="text-xs text-violet-700 hover:underline"
                  >
                    Processo: {lia.inventory.serviceName}
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Última edição{" "}
                {new Date(lia.updatedAt).toLocaleString("pt-BR")} ·{" "}
                {lia.createdBy?.name ?? "—"}
                {saving && <span className="ml-2 text-violet-600">💾 Salvando…</span>}
                {!saving && dirty && (
                  <span className="ml-2 text-amber-600">● não salvo</span>
                )}
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
                disabled={!lia.publishedContent && !dirty}
                className="gap-1"
              >
                <GitCompare className="h-4 w-4" />
                Comparar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadDocx(lia.publishedContent ? "published" : "current")
                }
                className="gap-1"
              >
                <FileDown className="h-4 w-4" />
                DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openPdf}
                className="gap-1"
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Devolução do DPO */}
          {lia.rejectionNote && lia.status === "RASCUNHO" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 mb-3">
              <strong>Devolvida pelo DPO:</strong> {lia.rejectionNote}
            </div>
          )}

          {/* Stepper */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
            {LIA_TEMPLATE.map((s, i) => {
              const status = sectionStatus(i);
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(i)}
                  className="flex items-center gap-2 text-left"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                      status === "complete"
                        ? "bg-emerald-500 text-white"
                        : status === "active"
                        ? "bg-violet-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {status === "complete" ? "✓" : i + 1}
                  </div>
                  <div className="text-xs hidden sm:block">
                    <div
                      className={cn(
                        "font-medium",
                        status === "active"
                          ? "text-violet-700"
                          : status === "complete"
                          ? "text-emerald-700"
                          : "text-slate-500"
                      )}
                    >
                      {s.title.replace(/^Teste de /, "")}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round(completenessOf(i) * 100)}% completa
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bloqueio estrutural — banner principal */}
      {blocked && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-red-900 dark:text-red-200">
                Bloqueio estrutural detectado
              </p>
              <p className="text-red-800 dark:text-red-300 mt-1">
                A Etapa 2 indica que o tratamento envolve dados sensíveis
                (Art. 11) ou de crianças/adolescentes (Art. 14). Nesses casos,
                <strong> o legítimo interesse não se aplica</strong>. Mude a
                base legal do processo no Inventário antes de submeter ou
                aprovar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg overflow-x-auto">
        {LIA_TEMPLATE.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(i)}
            className={cn(
              "px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-colors",
              i === activeSection
                ? "border-violet-600 text-violet-700 font-semibold bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            {i + 1}. {s.title.replace(/^Teste de /, "")}
            {sectionStatus(i) === "complete" && (
              <span className="ml-2 text-emerald-500 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* SECTION CONTENT */}
      <Card className="rounded-t-none -mt-px">
        <CardContent className="p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Scale className="h-5 w-5 text-violet-600" />
              Etapa {activeSection + 1}: {sec.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{sec.subtitle}</p>
          </div>

          {sec.questions.map((q, idx) => (
            <QuestionField
              key={q.path}
              q={q}
              index={idx + 1}
              data={data}
              disabled={!canEdit}
              onChange={(value) => updatePath(q.path, value)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Footer das tabs (Anterior/Próximo) */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
          disabled={activeSection === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Etapa anterior
        </Button>
        <Button
          onClick={() =>
            setActiveSection((s) => Math.min(LIA_TEMPLATE.length - 1, s + 1))
          }
          disabled={activeSection === LIA_TEMPLATE.length - 1}
          className="gap-2"
        >
          Próxima etapa
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Workflow actions */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-sm font-semibold">Ações de fluxo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lia.status === "RASCUNHO" &&
                  (canSubmit
                    ? "Termine de preencher e envie pra revisão do DPO."
                    : userIsDPO
                    ? "Você é DPO — pode aprovar diretamente, sem revisão intermediária."
                    : "Esta LIA está em rascunho.")}
                {lia.status === "EM_REVISAO" &&
                  (userIsDPO
                    ? "Avalie e aprove ou devolva pro autor."
                    : "Aguardando revisão do DPO.")}
                {lia.status === "APROVADO" &&
                  "LIA aprovada. Edições posteriores criarão nova versão ao re-aprovar."}
                {lia.status === "ARQUIVADO" && "LIA arquivada (imutável)."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {canSubmit && (
                <Button
                  onClick={doSubmit}
                  disabled={blocked}
                  className="gap-1"
                  variant="default"
                  title={blocked ? "Bloqueada por Art. 11/14" : undefined}
                >
                  <Send className="h-4 w-4" />
                  Enviar pra revisão
                </Button>
              )}
              {canReject && (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(true)}
                  className="gap-1 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              )}
              {canApprove && (
                <Button
                  onClick={() => setShowApproveModal(true)}
                  disabled={blocked}
                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                  title={blocked ? "Bloqueada por Art. 11/14" : undefined}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprovar
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
                  variant="ghost"
                  onClick={doDelete}
                  className="gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => doSave()}
                  disabled={saving || !dirty}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  Salvar agora
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL — Aprovar */}
      <Dialog
        open={showApproveModal}
        onOpenChange={(o) => !o && setShowApproveModal(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar LIA</DialogTitle>
            <DialogDescription>
              A LIA vai virar versão v{(lia.publishedVersionNum ?? 0) + 1}{" "}
              imutável. Você pode descrever brevemente o que mudou.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="changelog">Changelog (opcional)</Label>
            <Textarea
              id="changelog"
              value={approveChangelog}
              onChange={(e) => setApproveChangelog(e.target.value)}
              placeholder="Ex.: Revisão anual; ajustada redação da Etapa 3."
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={doApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Aprovar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL — Rejeitar */}
      <Dialog
        open={showRejectModal}
        onOpenChange={(o) => !o && setShowRejectModal(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar LIA</DialogTitle>
            <DialogDescription>
              A LIA volta pra rascunho. O autor vê o motivo escrito aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Motivo (mínimo 5 caracteres) *</Label>
            <Textarea
              id="reason"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Ex.: A justificativa da Etapa 1 está genérica; especifique o interesse pretendido."
              rows={4}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={doReject}
              disabled={rejectionNote.trim().length < 5}
              className="bg-red-600 hover:bg-red-700"
            >
              Devolver pro autor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Versões + Diff modais */}
      <LiaVersionsModal
        open={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        liaId={liaId}
        currentVersionNum={lia.publishedVersionNum}
      />
      <LiaDiffModal
        open={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        liaId={liaId}
        hasPublished={!!lia.publishedContent}
      />
    </div>
  );
}

// ============================================================
// QuestionField — renderiza 1 pergunta conforme o tipo
// ============================================================

function QuestionField({
  q,
  index,
  data,
  disabled,
  onChange,
}: {
  q: LiaQuestion;
  index: number;
  data: LiaData;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  const value = useMemo(() => getValue(data, q.path), [data, q.path]);
  const isBlockingFlagged = q.blocking;
  const containerClass = isBlockingFlagged
    ? "rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 space-y-2"
    : "space-y-2";

  return (
    <div className={containerClass}>
      <label className="text-sm font-medium flex items-start gap-2">
        <span
          className={cn(
            "text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5",
            isBlockingFlagged
              ? "bg-red-200 text-red-800"
              : "bg-violet-100 text-violet-700"
          )}
        >
          {index}
        </span>
        <span className={isBlockingFlagged ? "text-red-900" : ""}>
          {q.label}
          {q.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {q.hint && (
        <p
          className={cn(
            "text-xs ml-7",
            isBlockingFlagged
              ? "text-red-800"
              : "text-muted-foreground"
          )}
        >
          {q.hint}
        </p>
      )}

      <div className="ml-7">
        {q.type === "textarea" && (
          <Textarea
            disabled={disabled}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="text-sm"
          />
        )}

        {q.type === "radio" && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {q.options?.map((opt) => {
              const checked = value === opt.value;
              const tone =
                opt.tone === "danger"
                  ? "border-red-300 text-red-800 has-[:checked]:bg-red-50 has-[:checked]:border-red-500"
                  : opt.tone === "warning"
                  ? "border-amber-300 text-amber-800 has-[:checked]:bg-amber-50 has-[:checked]:border-amber-500"
                  : opt.tone === "ok"
                  ? "border-emerald-300 text-emerald-800 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500"
                  : "border-slate-200 has-[:checked]:bg-violet-50 has-[:checked]:border-violet-500";
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors",
                    tone,
                    disabled && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <input
                    type="radio"
                    name={q.path}
                    disabled={disabled}
                    checked={checked}
                    onChange={() => onChange(opt.value)}
                    className="accent-violet-600"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {q.type === "checkbox-group" && (
          <div className="space-y-2">
            {q.checkboxes?.map((cb) => {
              const obj = (value as Record<string, boolean>) ?? {};
              const checked = !!obj[cb.key];
              return (
                <label
                  key={cb.key}
                  className="flex items-start gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={checked}
                    onChange={(e) =>
                      onChange({ ...obj, [cb.key]: e.target.checked })
                    }
                    className="mt-0.5 accent-violet-600 rounded"
                  />
                  <span>{cb.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getValue(data: LiaData, path: string): unknown {
  const parts = path.split(".");
  let cur: any = data;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
