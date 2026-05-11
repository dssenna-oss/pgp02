"use client";

/**
 * Modal de histórico de versões do Aviso de Privacidade.
 *
 * Mostra a lista de versões publicadas + diff word-level entre 2 escolhas.
 * Reusa o pattern de diff das Políticas (jsdiff `diffWords`).
 *
 * Disparado pelo botão "Histórico (vN)" no editor do Aviso.
 */

import { useEffect, useMemo, useState } from "react";
import { diffWords, type Change } from "diff";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionItem {
  id: string;
  version: number;
  content: string;
  changeLog: string | null;
  publishedAt: string;
  publishedBy: { id: string; name: string | null; email: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  noticeId: string;
  currentContent: string;
  currentVersion: number;
}

export default function AvisoHistoryModal({
  open,
  onClose,
  noticeId,
  currentContent,
  currentVersion,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  // diffA é a versão "antes", diffB é "depois". Por padrão diffA = penúltima,
  // diffB = "current" (rascunho atual). Strings reservadas: "current".
  const [diffA, setDiffA] = useState<string>("");
  const [diffB, setDiffB] = useState<string>("current");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/avisos-privacidade/${noticeId}/versions`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Erro ao carregar histórico");
        if (!cancelled) {
          const vs: VersionItem[] = json.versions ?? [];
          setVersions(vs);
          // Defaults: A = penúltima publicada (se existir); B = rascunho atual
          if (vs.length >= 2) {
            setDiffA(String(vs[1].version));
            setDiffB("current");
          } else if (vs.length === 1) {
            setDiffA(String(vs[0].version));
            setDiffB("current");
          } else {
            setDiffA("");
            setDiffB("current");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, noticeId]);

  function contentFor(key: string): string {
    if (key === "current") return currentContent;
    const v = versions.find((x) => String(x.version) === key);
    return v?.content ?? "";
  }

  function labelFor(key: string): string {
    if (key === "current") return `Rascunho atual${currentVersion > 0 ? ` (após v${currentVersion})` : ""}`;
    return `Versão ${key}`;
  }

  const diffParts: ReadonlyArray<Change> = useMemo(() => {
    if (!diffA || !diffB) return [];
    const a = contentFor(diffA);
    const b = contentFor(diffB);
    if (!a || !b) return [];
    try {
      return diffWords(a, b);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffA, diffB, versions, currentContent]);

  const stats = useMemo(() => {
    let added = 0,
      removed = 0;
    for (const p of diffParts) {
      if (p.added) added += p.value.split(/\s+/).filter(Boolean).length;
      else if (p.removed) removed += p.value.split(/\s+/).filter(Boolean).length;
    }
    return { added, removed };
  }, [diffParts]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-violet-600" />
            Histórico de versões
          </DialogTitle>
          <DialogDescription>
            Compare 2 versões pra ver o que mudou. Palavras em verde foram adicionadas, em
            vermelho foram removidas.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="p-8 flex flex-col items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            Carregando versões...
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            Este Aviso ainda não foi publicado — nenhuma versão no histórico.
          </div>
        )}

        {!loading && versions.length > 0 && (
          <>
            {/* Lista compacta de versões */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
              <div className="text-xs font-semibold text-gray-500 mb-1.5">
                Versões publicadas
              </div>
              <ul className="space-y-1">
                {versions.map((v) => (
                  <li
                    key={v.id}
                    className="text-sm flex items-start gap-3 py-1"
                  >
                    <span className="font-mono text-xs bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                      v{v.version}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-700 dark:text-gray-200">
                        {new Date(v.publishedAt).toLocaleDateString("pt-BR")} ·{" "}
                        {v.publishedBy.name ?? v.publishedBy.email}
                      </div>
                      {v.changeLog && (
                        <div className="text-xs text-gray-500 italic">"{v.changeLog}"</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comparador */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Comparar:</span>
              <select
                value={diffA}
                onChange={(e) => setDiffA(e.target.value)}
                className="text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              >
                <option value="">— escolha —</option>
                {versions.map((v) => (
                  <option key={v.id} value={String(v.version)}>
                    Versão {v.version}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">→</span>
              <select
                value={diffB}
                onChange={(e) => setDiffB(e.target.value)}
                className="text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
              >
                <option value="current">Rascunho atual</option>
                {versions.map((v) => (
                  <option key={v.id} value={String(v.version)}>
                    Versão {v.version}
                  </option>
                ))}
              </select>
              {diffA && diffB && diffA !== diffB && (
                <span className="text-xs text-gray-600 dark:text-gray-300 ml-auto">
                  <span className="text-emerald-700 font-medium">+{stats.added}</span> palavras
                  · <span className="text-red-700 font-medium">-{stats.removed}</span> palavras
                </span>
              )}
            </div>

            {/* Diff viewer */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 dark:bg-gray-900/30">
              {!diffA || !diffB ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Escolha 2 versões pra ver as diferenças.
                </p>
              ) : diffA === diffB ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Escolha 2 versões diferentes pra comparar.
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 mb-2 font-medium">
                    {labelFor(diffA)} → {labelFor(diffB)}
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 max-h-[400px] overflow-y-auto">
                    {diffParts.map((part, i) => (
                      <span
                        key={i}
                        className={cn(
                          part.added &&
                            "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
                          part.removed &&
                            "bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200 line-through",
                        )}
                      >
                        {part.value}
                      </span>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}

        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
