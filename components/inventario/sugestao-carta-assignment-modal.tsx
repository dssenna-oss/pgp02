"use client";

/**
 * Modal de atribuição de processos sugeridos a Contribuidores.
 *
 * Plugado no fluxo de "Sugerir processos da Carta de Serviços" (Fase 3):
 * após o DPO selecionar quais serviços virar rascunho, em vez de chamar
 * `/materialize` direto, abre este modal pra distribuir cada um pra um
 * Contribuidor (ou deixar sem atribuir = vai pra ele mesmo, comportamento
 * histórico).
 *
 * Pré-seleção automática via `suggestContributorForCategory` (match
 * categoria-IA → setor do Contribuidor). DPO pode trocar manualmente.
 *
 * Toggle "Notificar por email" default ON — respeita por sua vez o
 * `emailNotifyAnnouncements` de cada Contribuidor server-side.
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Loader2,
  Mail,
  UserCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  suggestContributorForCategory,
  type ContributorLite,
} from "@/lib/sugestao-carta-match";

export interface ServiceToAssign {
  /** Nome literal (chave do mapa `assignments` no POST /materialize). */
  name: string;
  /** Categoria que o LLM deu (pra pré-seleção). Opcional. */
  category: string | null;
}

interface AssignmentModalProps {
  open: boolean;
  onClose: () => void;
  services: ServiceToAssign[];
  /** Disparada quando o DPO confirma. Caller chama /materialize. */
  onConfirm: (args: {
    assignments: Record<string, string | null>;
    notifyByEmail: boolean;
  }) => Promise<void> | void;
}

export default function SugestaoCartaAssignmentModal({
  open,
  onClose,
  services,
  onConfirm,
}: AssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contributors, setContributors] = useState<ContributorLite[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    {},
  );
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Carrega Contribuidores quando o modal abre; faz pré-seleção uma vez.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch("/api/dpo/contribuidores");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const list: ContributorLite[] = Array.isArray(json?.contribuidores)
          ? json.contribuidores.map((c: any) => ({
              id: String(c.id),
              name: c.name ?? null,
              email: String(c.email ?? ""),
              setor: c.setor ?? null,
              isActive: Boolean(c.isActive),
            }))
          : [];
        if (cancelled) return;
        setContributors(list);

        // Pré-seleção via match categoria→setor
        const initial: Record<string, string | null> = {};
        for (const s of services) {
          const hit = suggestContributorForCategory(s.category, list);
          initial[s.name] = hit?.id ?? null;
        }
        setAssignments(initial);
      } catch (e: any) {
        if (cancelled) return;
        setLoadError(e?.message ?? "Não consegui carregar Contribuidores.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // services é estável durante o ciclo do modal (caller passa snapshot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeContributors = useMemo(
    () => contributors.filter((c) => c.isActive),
    [contributors],
  );

  function setAssignment(serviceName: string, contributorId: string | null) {
    setAssignments((prev) => ({ ...prev, [serviceName]: contributorId }));
  }

  function assignAllToContributor(contributorId: string | null) {
    setAssignments((prev) => {
      const next: Record<string, string | null> = { ...prev };
      for (const s of services) {
        next[s.name] = contributorId;
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm({ assignments, notifyByEmail });
    } finally {
      setSubmitting(false);
    }
  }

  const assignedCount = Object.values(assignments).filter(
    (v) => typeof v === "string" && v.length > 0,
  ).length;
  const unassignedCount = services.length - assignedCount;
  const hasContributors = activeContributors.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Atribuir processos a Contribuidores
          </DialogTitle>
          <DialogDescription>
            Escolha quem vai revisar cada rascunho. Os campos já vêm
            pré-preenchidos pela IA — o Contribuidor confirma e completa.
          </DialogDescription>
        </DialogHeader>

        {/* Loading state */}
        {loading && (
          <div className="p-8 flex flex-col items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            Carregando Contribuidores da organização...
          </div>
        )}

        {/* Erro ao carregar */}
        {!loading && loadError && (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                Não consegui carregar a lista de Contribuidores ({loadError}).
                Você ainda pode criar os rascunhos sem atribuir — eles ficam
                com você.
              </div>
            </div>
          </div>
        )}

        {/* Sem Contribuidores cadastrados */}
        {!loading && !loadError && !hasContributors && (
          <div className="p-6">
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3">
              <UserCircle2 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                Sua organização ainda não tem Contribuidores ativos cadastrados.
                Os rascunhos serão criados com você como responsável (você
                preenche). Pra distribuir o trabalho, cadastre Contribuidores
                em <strong>Configurações → Contribuidores</strong> e tente de
                novo.
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        {!loading && !loadError && hasContributors && (
          <>
            {/* Atalho "atribuir todos a..." */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Atalho:
              </span>
              <button
                type="button"
                onClick={() => assignAllToContributor(null)}
                className="text-xs px-2.5 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Desatribuir tudo
              </button>
              {activeContributors.length <= 6 && (
                <>
                  {activeContributors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => assignAllToContributor(c.id)}
                      className="text-xs px-2.5 py-1 rounded-md border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800"
                      title={c.setor ? `Setor: ${c.setor}` : "Sem setor"}
                    >
                      Atribuir tudo a {c.name?.split(" ")[0] ?? c.email}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Lista de serviços com select de Contribuidor */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {services.map((s) => {
                const selected = assignments[s.name] ?? null;
                return (
                  <div
                    key={s.name}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {s.name}
                      </div>
                      {s.category && (
                        <div className="text-[11px] text-gray-500">
                          Categoria sugerida pela IA:{" "}
                          <span className="font-medium">{s.category}</span>
                        </div>
                      )}
                    </div>
                    <div className="sm:w-64 shrink-0">
                      <select
                        value={selected ?? ""}
                        onChange={(e) =>
                          setAssignment(s.name, e.target.value || null)
                        }
                        className={cn(
                          "w-full text-sm rounded-md border bg-white dark:bg-gray-900 px-2.5 py-1.5",
                          selected
                            ? "border-violet-300 dark:border-violet-700"
                            : "border-gray-300 dark:border-gray-700 text-gray-500",
                        )}
                      >
                        <option value="">— Sem responsável (fica com você) —</option>
                        {activeContributors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name ?? c.email}
                            {c.setor ? ` · ${c.setor}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toggle de email */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyByEmail}
                  onChange={(e) => setNotifyByEmail(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-600" />
                    Notificar por email os Contribuidores atribuídos
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Cada Contribuidor recebe 1 email com a lista de processos
                    atribuídos. Quem desligou notificações nas configurações
                    pessoais não recebe.
                  </div>
                </div>
              </label>
            </div>
          </>
        )}

        <DialogFooter className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex-row sm:justify-between gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {services.length} processo{services.length === 1 ? "" : "s"} ·{" "}
            {assignedCount} atribuído{assignedCount === 1 ? "" : "s"}
            {unassignedCount > 0 ? ` · ${unassignedCount} sem responsável` : ""}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || loading}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {submitting
                ? "Criando..."
                : `Criar e atribuir ${services.length} rascunho${services.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
