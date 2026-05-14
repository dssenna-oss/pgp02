"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, GitCompare, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { RipdDiff, FieldDiff, ListItemDiff } from "@/lib/ripd-diff";

interface VersionOption {
  ref: string;
  label: string;
}

interface DiffApiResponse {
  a: { ref: string; label: string; snapshotAt: string | null };
  b: { ref: string; label: string; snapshotAt: string | null };
  diff: RipdDiff;
}

interface RipdDiffModalProps {
  ripdId: string;
  open: boolean;
  onClose: () => void;
  /** Tem `publishedContent`? (controla se "published" aparece no dropdown) */
  hasPublished: boolean;
  publishedVersionNum: number | null;
  /** Lista de versões disponíveis (já carregada pelo editor). */
  versions: ReadonlyArray<{ version: number; approvedAt: string }>;
  /** Refs default (a, b) — opcional. Default: a="published", b="current". */
  defaultRefA?: string;
  defaultRefB?: string;
}

export default function RipdDiffModal({
  ripdId,
  open,
  onClose,
  hasPublished,
  publishedVersionNum,
  versions,
  defaultRefA,
  defaultRefB,
}: RipdDiffModalProps) {
  // Opções de versão pra dropdowns
  const options: VersionOption[] = useMemo(() => {
    const out: VersionOption[] = [];
    out.push({ ref: "current", label: "Rascunho atual" });
    if (hasPublished) {
      out.push({
        ref: "published",
        label: `Última publicada${publishedVersionNum ? ` (v${publishedVersionNum})` : ""}`,
      });
    }
    for (const v of versions) {
      out.push({
        ref: String(v.version),
        label: `Versão ${v.version} — ${new Date(v.approvedAt).toLocaleDateString("pt-BR")}`,
      });
    }
    return out;
  }, [hasPublished, publishedVersionNum, versions]);

  const [refA, setRefA] = useState<string>(
    defaultRefA ?? (hasPublished ? "published" : "current")
  );
  const [refB, setRefB] = useState<string>(defaultRefB ?? "current");
  const [diff, setDiff] = useState<DiffApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/ripd/${ripdId}/diff?a=${encodeURIComponent(refA)}&b=${encodeURIComponent(refB)}`,
          { cache: "no-store" }
        );
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "Erro ao calcular diff");
          return;
        }
        const j = await r.json();
        if (!cancelled) setDiff(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, ripdId, refA, refB]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-600" />
            Comparar versões
          </DialogTitle>
          <DialogDescription>
            Vê o que mudou entre 2 momentos do RIPD — campo a campo, com
            destaque de palavras alteradas.
          </DialogDescription>
        </DialogHeader>

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b">
          <div className="space-y-1.5">
            <Label className="text-xs">Versão A (anterior)</Label>
            <select
              value={refA}
              onChange={(e) => setRefA(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              {options.map((o) => (
                <option key={`a-${o.ref}`} value={o.ref}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Versão B (mais recente)</Label>
            <select
              value={refB}
              onChange={(e) => setRefB(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
            >
              {options.map((o) => (
                <option key={`b-${o.ref}`} value={o.ref}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo + body */}
        <div className="flex-1 overflow-y-auto space-y-3 -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Calculando…
            </div>
          ) : !diff ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">
              Selecione as 2 versões pra comparar.
            </p>
          ) : refA === refB ? (
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
              <CardContent className="py-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Você selecionou a mesma versão dos dois lados.
                </p>
              </CardContent>
            </Card>
          ) : !diff.diff.hasChanges ? (
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
              <CardContent className="py-6 text-center">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  ✓ Nenhuma diferença entre as 2 versões selecionadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <DiffStats diff={diff.diff} />
              {diff.diff.sections
                .filter((s) => s.hasChanges)
                .map((sec) => (
                  <SectionDiffView key={sec.key} section={sec} />
                ))}
            </>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Sub-componentes
// ============================================================

function DiffStats({ diff }: { diff: RipdDiff }) {
  const { fieldsChanged, listItemsAdded, listItemsRemoved, listItemsChanged } =
    diff.stats;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
      <StatPill
        label="Campos alterados"
        value={fieldsChanged}
        tone="amber"
      />
      <StatPill label="Itens adicionados" value={listItemsAdded} tone="emerald" />
      <StatPill label="Itens removidos" value={listItemsRemoved} tone="red" />
      <StatPill
        label="Itens alterados"
        value={listItemsChanged}
        tone="blue"
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red" | "blue";
}) {
  const cls = {
    amber: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
    emerald:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    red: "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    blue: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  }[tone];
  return (
    <Card className={cn("border", cls)}>
      <CardContent className="p-2.5">
        <p className="text-xs opacity-80">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function SectionDiffView({
  section,
}: {
  section: RipdDiff["sections"][number];
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {section.number}
          </span>
          <h3 className="font-semibold">{section.title}</h3>
        </div>

        {/* Campos com mudança */}
        {section.fields
          .filter((f) => f.status === "changed")
          .map((f) => (
            <FieldDiffView key={f.path} field={f} />
          ))}

        {/* Mudanças em listas anexas */}
        {section.listChanges &&
          section.listChanges.filter((l) => l.status !== "unchanged").length >
            0 && (
            <div className="space-y-1.5 pt-2 border-t">
              {section.listChanges
                .filter((l) => l.status !== "unchanged")
                .map((l) => (
                  <ListItemDiffView key={l.itemKey} item={l} />
                ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function FieldDiffView({ field }: { field: FieldDiff }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">
        {field.label}
      </p>
      <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md p-2.5">
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {(field.parts ?? []).map((part, i) => (
            <span
              key={i}
              className={cn(
                part.added &&
                  "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
                part.removed &&
                  "bg-red-100 text-red-900 line-through dark:bg-red-950/60 dark:text-red-200"
              )}
            >
              {part.value}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

function ListItemDiffView({ item }: { item: ListItemDiff }) {
  const tone =
    item.status === "added"
      ? "emerald"
      : item.status === "removed"
      ? "red"
      : item.status === "changed"
      ? "blue"
      : "gray";
  const toneClass = {
    emerald:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    red: "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    blue: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    gray: "bg-gray-50 text-gray-800 border-gray-300",
  }[tone];
  const statusLabel = {
    added: "+ Adicionado",
    removed: "− Removido",
    changed: "Alterado",
    unchanged: "",
  }[item.status];
  return (
    <div className="flex items-start gap-2 text-sm">
      <Badge variant="outline" className={cn("text-[10px] flex-shrink-0", toneClass)}>
        {statusLabel}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.label}</p>
        {item.detail && (
          <p className="text-xs text-muted-foreground italic">{item.detail}</p>
        )}
      </div>
    </div>
  );
}
