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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, GitCompare, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { PsiDiff, PsiFieldDiff } from "@/lib/psi-diff";

interface VersionItem {
  version: number;
  approvedAt: string;
}

interface DiffApiResponse {
  a: { ref: string; label: string; snapshotAt: string | null };
  b: { ref: string; label: string; snapshotAt: string | null };
  diff: PsiDiff;
}

interface PsiDiffModalProps {
  psiId: string;
  publishedVersionNum: number | null;
  onClose: () => void;
}

export default function PsiDiffModal({
  psiId,
  publishedVersionNum,
  onClose,
}: PsiDiffModalProps) {
  const hasPublished = publishedVersionNum != null;
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [refA, setRefA] = useState<string>(hasPublished ? "published" : "current");
  const [refB, setRefB] = useState<string>("current");
  const [diff, setDiff] = useState<DiffApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/psi/${psiId}/versions`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => {
        if (cancelled) return;
        setVersions(
          (j.items ?? []).map((v: any) => ({
            version: v.version,
            approvedAt: v.approvedAt,
          }))
        );
      });
    return () => {
      cancelled = true;
    };
  }, [psiId]);

  const options = useMemo(() => {
    const out: { ref: string; label: string }[] = [];
    out.push({ ref: "current", label: "Rascunho atual" });
    if (hasPublished) out.push({ ref: "published", label: "Última publicada" });
    for (const v of versions) {
      out.push({
        ref: String(v.version),
        label: `Versão ${v.version} — ${new Date(v.approvedAt).toLocaleDateString("pt-BR")}`,
      });
    }
    return out;
  }, [versions, hasPublished]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/psi/${psiId}/diff?a=${encodeURIComponent(refA)}&b=${encodeURIComponent(refB)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "Erro ao calcular diff");
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        if (j) setDiff(j);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [psiId, refA, refB]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-cyan-600" />
            Comparar versões
          </DialogTitle>
          <DialogDescription>
            Vê o que mudou entre 2 momentos da PSI — campo a campo, com
            destaque de palavras alteradas em textos.
          </DialogDescription>
        </DialogHeader>

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
              <div className="rounded-lg border bg-cyan-50 dark:bg-cyan-950/30 dark:border-cyan-900 p-3 text-sm">
                <strong className="text-cyan-900 dark:text-cyan-200">
                  {diff.diff.stats.fieldsChanged}
                </strong>{" "}
                de <strong>{diff.diff.stats.totalFields}</strong> campos com
                alterações.
              </div>
              {diff.diff.sections
                .filter((s) => s.hasChanges)
                .map((sec) => (
                  <Card key={sec.key}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-cyan-600 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold">
                          {sec.number}
                        </span>
                        <h3 className="font-semibold">{sec.title}</h3>
                      </div>
                      {sec.fields
                        .filter((f) => f.status === "changed")
                        .map((f) => (
                          <FieldDiffView key={f.path} field={f} />
                        ))}
                    </CardContent>
                  </Card>
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

function FieldDiffView({ field }: { field: PsiFieldDiff }) {
  const isWordDiff = field.parts && field.parts.length > 0;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
      {isWordDiff ? (
        <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md p-2.5">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {field.parts!.map((part, i) => (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-2">
            <p className="text-[10px] uppercase font-semibold text-red-700 dark:text-red-300 mb-0.5">
              Antes
            </p>
            <p className="break-words whitespace-pre-wrap">{field.oldText}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-2">
            <p className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">
              Depois
            </p>
            <p className="break-words whitespace-pre-wrap">{field.newText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
