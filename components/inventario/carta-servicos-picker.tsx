"use client";

/**
 * Modal "Pré-preencher por Carta de Serviços" (Fatia "b" — 2026-05-11).
 *
 * O user cola 1-5 URLs (carta de serviços, página do serviço, ato
 * normativo) e o sistema:
 *   1. faz scrape com Firecrawl
 *   2. manda pro Gemini com o schema como contrato
 *   3. retorna `Partial<FormAnswers>` + resumo
 *
 * Aplica o resultado na próxima sessão do wizard via callback
 * `onApply(next, summary)` — quem chama é responsável por mesclar
 * em `answers` e marcar provenance.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Globe2,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { FormAnswers } from "@/lib/inventario-form-schema";

const MAX_URLS = 5;

export interface AiPrefillSummary {
  urlsOk: string[];
  urlsErr: { url: string; error: string }[];
  applied: string[];
  rejected: string[];
  summary: string;
}

interface CartaServicosPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Respostas atuais — vão pro endpoint pra mesclagem server-side. */
  currentAnswers: FormAnswers;
  /** Callback quando IA termina e o user aceita aplicar. */
  onApply: (next: FormAnswers, summary: AiPrefillSummary) => void;
}

export default function CartaServicosPicker({
  open,
  onOpenChange,
  currentAnswers,
  onApply,
}: CartaServicosPickerProps) {
  const [urls, setUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    next: FormAnswers;
    summary: AiPrefillSummary;
  } | null>(null);

  const validUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);

  const close = () => {
    if (loading) return; // não fecha durante request
    setUrls([""]);
    setResult(null);
    onOpenChange(false);
  };

  const updateUrl = (idx: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
  };

  const addUrlRow = () => {
    if (urls.length >= MAX_URLS) return;
    setUrls((prev) => [...prev, ""]);
  };

  const removeUrlRow = (idx: number) => {
    setUrls((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx),
    );
  };

  const runPrefill = async () => {
    if (validUrls.length === 0) {
      toast.error("Cole pelo menos 1 URL.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/inventario/ai-prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formAnswers: currentAnswers,
          urls: validUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao pré-preencher");
        return;
      }
      setResult(json);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro de rede");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.next, result.summary);
    close();
  };

  // ============= RENDER =============

  if (result) {
    // Tela de resultado — mostra resumo + permite aplicar ou descartar
    const { summary } = result;
    const hasApplied = summary.applied.length > 0;
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => (v ? onOpenChange(v) : close())}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Resultado da extração
            </DialogTitle>
            <DialogDescription>{summary.summary}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2 -mr-2">
            {summary.urlsOk.length > 0 && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  URLs lidas com sucesso ({summary.urlsOk.length})
                </div>
                <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-0.5">
                  {summary.urlsOk.map((u) => (
                    <li key={u} className="break-all">
                      • {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.urlsErr.length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300 mb-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  URLs com falha ({summary.urlsErr.length})
                </div>
                <ul className="text-xs text-red-700 dark:text-red-400 space-y-0.5">
                  {summary.urlsErr.map((e) => (
                    <li key={e.url} className="break-all">
                      • {e.url} — <em>{e.error}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3 text-sm">
              <div className="font-medium text-violet-900 dark:text-violet-200 mb-1.5">
                Campos pré-preenchidos: {summary.applied.length}
              </div>
              {hasApplied ? (
                <ul className="text-xs text-violet-800 dark:text-violet-300 space-y-0.5 max-h-40 overflow-y-auto">
                  {summary.applied.map((path) => (
                    <li key={path}>• {path}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-violet-800 dark:text-violet-300">
                  Nenhum campo novo foi preenchido (campos relevantes já
                  tinham valor, ou o conteúdo das URLs não casa com o
                  formulário).
                </p>
              )}
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-snug">
                Os campos pré-preenchidos vão receber um selo{" "}
                <strong>🤖 IA</strong> no formulário. Você pode editar tudo
                livremente — ao editar um campo, o selo desaparece.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" onClick={() => setResult(null)}>
              Tentar com outras URLs
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={close}>
                Descartar
              </Button>
              <Button onClick={handleApply} disabled={!hasApplied}>
                Aplicar {summary.applied.length} campo
                {summary.applied.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Tela de input — coletar URLs
  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-violet-600" />
            Pré-preencher por Carta de Serviços
          </DialogTitle>
          <DialogDescription>
            Cole até {MAX_URLS} URLs públicas com informação sobre o processo:
            carta de serviços, página do serviço, ato normativo, política de
            privacidade. O sistema lê e preenche os campos do formulário que
            conseguir extrair.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          {urls.map((u, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={u}
                onChange={(e) => updateUrl(idx, e.target.value)}
                placeholder="https://www.exemplo.gov.br/carta-de-servicos/..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeUrlRow(idx)}
                disabled={loading || (urls.length === 1 && !u)}
                title="Remover URL"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addUrlRow}
            disabled={loading || urls.length >= MAX_URLS}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar mais uma URL
          </Button>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-200 leading-snug">
          <strong>Observação honesta:</strong> sites institucionais costumam
          declarar bem a finalidade do serviço, dados básicos coletados e
          base legal — esses campos preenchem bem. Já campos internos
          (volume de titulares, local de armazenamento, medidas de segurança
          técnica) raramente estão no texto público e ficam para o seu input
          manual depois.
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={close} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={runPrefill}
            disabled={loading || validUrls.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Lendo URLs e preenchendo…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                Pré-preencher
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
