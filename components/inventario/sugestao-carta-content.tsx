"use client";

/**
 * Sugerir processos a partir da Carta de Serviços (Fase 3).
 *
 * Fluxo:
 *  1. Domain input (default: Company.institutionalDomain) + botão "Sugerir"
 *  2. POST /api/inventario/sugerir-da-carta → recebe lista classificada
 *  3. UI mostra cards com filtros (Sugeridos+Talvez por default)
 *  4. User marca quais materializar
 *  5. Sticky bar dispara POST /materialize → cria N rascunhos no Inventário
 *  6. Redireciona pra /dashboard/inventario com toast
 *
 * Reutiliza patterns:
 *  - lib/sugestao-carta.ts (engine + tipos)
 *  - Mockup mockups/sugestao-processos-carta-mockup.html (aprovado)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ChevronDown,
  ListChecks,
  X,
  Globe,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ====== Tipos espelhando lib/sugestao-carta.ts ======

type Classification = "SUGERIDO" | "TALVEZ" | "NAO";

interface ServicePrefill {
  process_name?: string;
  process_purpose?: string;
  data_subjects?: string[];
  legalBasis?: string;
  share_targets?: string[];
  share_with_whom?: string;
}

interface SuggestedService {
  id: string;
  name: string;
  description: string;
  classification: Classification;
  classificationReason: string;
  sourceUrl: string;
  category: string | null;
  prefill: ServicePrefill;
  alreadyMapped?: { inventoryId: string; mappedAt: string };
}

interface SuggestionStats {
  totalServicesExtracted: number;
  bySuggested: number;
  byMaybe: number;
  byNo: number;
  corpusChars: number;
}

interface SuggestionResponse {
  services: SuggestedService[];
  stats: SuggestionStats;
  blockingError: string | null;
  warnings: string[];
  /** Identificador da fonte: URL http(s) ou "pdf:<filename>". */
  source?: string;
  pdfPagesRead?: number;
  pdfTotalPages?: number;
}

type SourceMode = "url" | "pdf";

type FilterMode =
  | "suggested_or_maybe"
  | "suggested"
  | "maybe"
  | "no"
  | "mapped"
  | "all";

const FILTER_LABELS: Record<FilterMode, string> = {
  suggested_or_maybe: "Sugeridos + Talvez",
  suggested: "🟢 Só sugeridos",
  maybe: "🟡 Só talvez",
  no: "⚪ Não sugeridos",
  mapped: "✓ Já mapeados",
  all: "📋 Tudo",
};

// ====== Componente principal ======

const LS_KEY_LAST_URL = "pgp:sugestao-carta:last-url";

export default function SugestaoCartaContent() {
  const router = useRouter();
  const [mode, setMode] = useState<SourceMode>("url");
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDragActive, setPdfDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [result, setResult] = useState<SuggestionResponse | null>(null);
  const [filter, setFilter] = useState<FilterMode>("suggested_or_maybe");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Recupera última URL usada pra economizar digitação
  useEffect(() => {
    try {
      const last = localStorage.getItem(LS_KEY_LAST_URL);
      if (last) setUrl(last);
    } catch {
      // ignora SSR / privacy mode
    }
  }, []);

  async function handleSuggest(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;
    if (mode === "pdf" && !pdfFile) {
      toast.error("Selecione um arquivo PDF antes de continuar.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      toast.error("Cole a URL da Carta de Serviços.");
      return;
    }
    if (mode === "url" && !/^https?:\/\//i.test(url.trim())) {
      toast.error("URL inválida — use endereço completo com http:// ou https://");
      return;
    }
    setLoading(true);
    setResult(null);
    setSelected(new Set());
    try {
      let res: Response;
      if (mode === "pdf" && pdfFile) {
        const fd = new FormData();
        fd.append("file", pdfFile);
        res = await fetch("/api/inventario/sugerir-da-carta/from-pdf", {
          method: "POST",
          body: fd,
        });
      } else {
        const trimmed = url.trim();
        try {
          localStorage.setItem(LS_KEY_LAST_URL, trimmed);
        } catch {
          // ignora privacy mode
        }
        res = await fetch("/api/inventario/sugerir-da-carta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
      }
      // Parse robusto: server pode retornar HTML em caso de timeout/crash
      // do runtime Vercel. Lemos como texto e tentamos JSON.parse com
      // fallback amigável.
      const rawText = await res.text();
      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch {
        const snippet = rawText.replace(/<[^>]+>/g, " ").trim().slice(0, 200);
        const reason =
          res.status === 504 || res.status === 408
            ? "O servidor demorou demais (timeout). Páginas muito pesadas podem exceder o limite. Tente outra URL ou faça upload do PDF."
            : `Resposta inválida do servidor (status ${res.status})${snippet ? `: ${snippet}` : ""}`;
        toast.error(reason);
        return;
      }
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao sugerir processos");
        return;
      }
      setResult(json as SuggestionResponse);
      // Por default, marca todos os SUGERIDO que não estão mapeados ainda
      const initial = new Set<string>();
      for (const s of json.services as SuggestedService[]) {
        if (s.classification === "SUGERIDO" && !s.alreadyMapped) {
          initial.add(s.id);
        }
      }
      setSelected(initial);
      if (json.blockingError) {
        toast.error(json.blockingError);
      } else if (json.services.length === 0) {
        toast("Nenhum serviço encontrado pra classificar.", { icon: "🤔" });
      } else {
        toast.success(
          `${json.stats.bySuggested} sugeridos, ${json.stats.byMaybe} talvez · revise abaixo.`,
        );
      }
    } catch (err: any) {
      toast.error(`Erro: ${err?.message ?? "desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  function handlePdfSelect(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Máximo: 10MB.`);
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Apenas PDFs (.pdf) são aceitos.");
      return;
    }
    setPdfFile(file);
    setResult(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    if (!filtered) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of filtered) {
        if (!s.alreadyMapped && s.classification !== "NAO") next.add(s.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleMaterialize() {
    if (!result || selected.size === 0 || materializing) return;
    setMaterializing(true);
    try {
      const toCreate = result.services
        .filter((s) => selected.has(s.id) && !s.alreadyMapped)
        .map((s) => ({
          name: s.name,
          description: s.description,
          sourceUrl: s.sourceUrl,
          prefill: s.prefill,
        }));
      if (toCreate.length === 0) {
        toast.error("Nenhum serviço selecionado pra criar.");
        return;
      }
      const res = await fetch("/api/inventario/sugerir-da-carta/materialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: toCreate }),
      });
      const rawText = await res.text();
      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch {
        toast.error(`Resposta inválida do servidor (status ${res.status}).`);
        return;
      }
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao criar rascunhos");
        return;
      }
      const createdN = json.created?.length ?? 0;
      const skippedN = json.skipped?.length ?? 0;
      if (createdN > 0) {
        toast.success(
          `Criei ${createdN} rascunho${createdN === 1 ? "" : "s"} no Inventário${skippedN > 0 ? ` (${skippedN} pulado${skippedN === 1 ? "" : "s"})` : ""}.`,
        );
        router.push("/dashboard/inventario");
      } else if (skippedN > 0) {
        toast.error(
          `Todos os ${skippedN} foram pulados (já existiam ou inválidos).`,
        );
      }
    } catch (err: any) {
      toast.error(`Erro: ${err?.message ?? "desconhecido"}`);
    } finally {
      setMaterializing(false);
    }
  }

  // Filtra serviços pelo modo escolhido
  const filtered = useMemo(() => {
    if (!result) return null;
    return result.services.filter((s) => {
      switch (filter) {
        case "suggested_or_maybe":
          return (
            (s.classification === "SUGERIDO" || s.classification === "TALVEZ") &&
            !s.alreadyMapped
          );
        case "suggested":
          return s.classification === "SUGERIDO" && !s.alreadyMapped;
        case "maybe":
          return s.classification === "TALVEZ" && !s.alreadyMapped;
        case "no":
          return s.classification === "NAO";
        case "mapped":
          return !!s.alreadyMapped;
        case "all":
          return true;
      }
    });
  }, [result, filter]);

  const mappedCount = result?.services.filter((s) => s.alreadyMapped).length ?? 0;
  const selectedCount = selected.size;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/dashboard/fase-3" className="hover:text-gray-700">
          Fase 3 — Mapeamento de Dados
        </Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">
          Sugerir processos da Carta de Serviços
        </span>
      </nav>

      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-600" />
          Sugerir processos a partir da Carta de Serviços
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl text-sm leading-relaxed">
          A Lei 13.460/2017 (Art. 7º) obriga sua organização a publicar uma
          Carta de Serviços com todos os serviços oferecidos ao cidadão. A IA
          varre essa Carta e sugere quais processos envolvem dados pessoais —
          você revisa e cria os Inventários em rascunho com 1 clique.
        </p>
      </div>

      {/* Bloco de busca */}
      <form
        onSubmit={handleSuggest}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 shadow-sm"
      >
        {/* Toggle de modo: URL vs PDF */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setResult(null);
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "url"
                ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900",
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            Por URL
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("pdf");
              setResult(null);
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "pdf"
                ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900",
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Upload de PDF
          </button>
        </div>

        {/* Variante: por URL */}
        {mode === "url" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex-1">
              <Label htmlFor="url" className="text-xs font-medium mb-1 block">
                URL da Carta de Serviços
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.exemplo.gov.br/carta-de-servicos/"
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole o endereço público da página da Carta de Serviços da sua instituição.
                A IA lê o conteúdo e identifica os serviços que envolvem dados pessoais.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 self-end sm:self-auto whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {loading ? "Analisando..." : "Sugerir processos"}
            </Button>
          </div>
        )}

        {/* Variante: upload PDF */}
        {mode === "pdf" && (
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-xs font-medium mb-1 block">
                Arquivo PDF da Carta de Serviços
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePdfSelect(f);
                }}
                className="hidden"
              />
              {!pdfFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setPdfDragActive(true);
                  }}
                  onDragLeave={() => setPdfDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPdfDragActive(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handlePdfSelect(f);
                  }}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    pdfDragActive
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-900/40",
                  )}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                    Clique pra escolher ou arraste o PDF aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    Apenas PDFs com texto pesquisável · até 10MB · 50 primeiras páginas
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20">
                  <FileText className="h-8 w-8 text-violet-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {pdfFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(pdfFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="Remover arquivo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Útil quando a Carta é publicada como PDF ou o site institucional bloqueia scraping.
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !pdfFile}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 self-start whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {loading ? "Analisando..." : "Sugerir processos do PDF"}
            </Button>
          </div>
        )}
      </form>

      {/* Loading State */}
      {loading && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded-lg p-6 mb-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            Mapeando o site, escaneando a Carta de Serviços e classificando processos...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Pode levar de 20s a 60s. Mantenha esta aba aberta.
          </p>
        </div>
      )}

      {/* Banner de erro bloqueante */}
      {result?.blockingError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200 text-sm mb-1">
              Não foi possível sugerir processos
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300">{result.blockingError}</p>
          </div>
        </div>
      )}

      {/* Banner de stats — só quando há resultado válido */}
      {result && !result.blockingError && result.services.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-900 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                Análise concluída
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Encontrei{" "}
                <span className="font-semibold">
                  {result.stats.totalServicesExtracted} serviço{result.stats.totalServicesExtracted === 1 ? "" : "s"}
                </span>{" "}
                em{" "}
                <span className="font-mono text-xs bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border break-all">
                  {result.source?.startsWith("pdf:")
                    ? result.source.replace(/^pdf:/, "")
                    : result.source ?? "fonte fornecida"}
                </span>
                {result.pdfPagesRead != null && result.pdfTotalPages != null && (
                  <>
                    {" "}
                    ({result.pdfPagesRead} de {result.pdfTotalPages} páginas lidas)
                  </>
                )}
                .
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard label="Sugeridos" value={result.stats.bySuggested} hint="trata dado pessoal claro" tone="emerald" />
                <StatCard label="Talvez" value={result.stats.byMaybe} hint="ambíguo, revisar" tone="amber" />
                <StatCard label="Provável que não" value={result.stats.byNo} hint="serviço anônimo" tone="gray" />
                <StatCard label="Já mapeado" value={mappedCount} hint="sem duplicar" tone="blue" />
              </div>
              {result.warnings.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {result.warnings.join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filtros + controles — só quando há serviços */}
      {result && result.services.length > 0 && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 font-medium mr-1">Mostrar:</span>
              <FilterChip
                active={filter === "suggested_or_maybe"}
                onClick={() => setFilter("suggested_or_maybe")}
                label={`${FILTER_LABELS.suggested_or_maybe} (${result.services.filter((s) => (s.classification === "SUGERIDO" || s.classification === "TALVEZ") && !s.alreadyMapped).length})`}
                variant="primary"
              />
              <FilterChip
                active={filter === "suggested"}
                onClick={() => setFilter("suggested")}
                label={`🟢 Sugeridos (${result.stats.bySuggested - result.services.filter((s) => s.classification === "SUGERIDO" && s.alreadyMapped).length})`}
                variant="emerald"
              />
              <FilterChip
                active={filter === "maybe"}
                onClick={() => setFilter("maybe")}
                label={`🟡 Talvez (${result.stats.byMaybe - result.services.filter((s) => s.classification === "TALVEZ" && s.alreadyMapped).length})`}
                variant="amber"
              />
              <FilterChip
                active={filter === "no"}
                onClick={() => setFilter("no")}
                label={`⚪ Não (${result.stats.byNo})`}
                variant="gray"
              />
              {mappedCount > 0 && (
                <FilterChip
                  active={filter === "mapped"}
                  onClick={() => setFilter("mapped")}
                  label={`✓ Já mapeados (${mappedCount})`}
                  variant="blue"
                />
              )}
              <FilterChip
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={`📋 Tudo (${result.services.length})`}
                variant="gray"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllVisible}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline-offset-2 hover:underline"
              >
                Selecionar visíveis
              </button>
              <span className="text-gray-300">·</span>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline-offset-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Lista de serviços */}
          <div className={cn("space-y-3", selectedCount > 0 && "mb-24")}>
            {filtered && filtered.length === 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-sm text-gray-500">
                Nenhum serviço neste filtro.
              </div>
            )}
            {filtered?.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                selected={selected.has(s.id)}
                onToggle={() => toggleSelect(s.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Estado vazio inicial — antes de rodar */}
      {!result && !loading && (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Pronto pra começar?
          </p>
          <p className="text-xs text-gray-500">
            {mode === "url"
              ? 'Cole a URL da Carta de Serviços e clique em "Sugerir processos" — a IA lê a página e devolve a lista pra você revisar.'
              : 'Envie o PDF da Carta e clique em "Sugerir processos do PDF" — a IA extrai o texto e devolve a lista pra você revisar.'}
          </p>
        </div>
      )}

      {/* Sticky bar de ação */}
      {selectedCount > 0 && result && !materializing && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 rounded-full px-3 py-1 text-sm font-semibold">
                {selectedCount} selecionado{selectedCount === 1 ? "" : "s"}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                vão virar rascunhos no Inventário com selo{" "}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                  🤖 IA
                </span>{" "}
                nos campos preenchidos.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={clearSelection}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleMaterialize}
                disabled={materializing}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Criar {selectedCount} rascunho{selectedCount === 1 ? "" : "s"} no Inventário
              </Button>
            </div>
          </div>
        </div>
      )}

      {materializing && (
        <div className="fixed bottom-0 left-0 right-0 bg-violet-600 text-white py-4 z-50">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Criando rascunhos...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Subcomponentes ======

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "emerald" | "amber" | "gray" | "blue";
}) {
  const toneClasses: Record<typeof tone, string> = {
    emerald: "border-emerald-200 dark:border-emerald-900",
    amber: "border-amber-200 dark:border-amber-900",
    gray: "border-gray-200 dark:border-gray-700",
    blue: "border-blue-200 dark:border-blue-900",
  };
  const toneText: Record<typeof tone, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    gray: "text-gray-500 dark:text-gray-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-md p-2.5 border", toneClasses[tone])}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={cn("text-xl font-bold", toneText[tone])}>{value}</div>
      <div className="text-[10px] text-gray-500">{hint}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  variant: "primary" | "emerald" | "amber" | "gray" | "blue";
}) {
  const base = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap";
  const activeCls: Record<typeof variant, string> = {
    primary: "bg-violet-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
    gray: "bg-gray-700 text-white",
    blue: "bg-blue-600 text-white",
  };
  const idleCls: Record<typeof variant, string> = {
    primary: "bg-white border border-violet-300 text-violet-700 hover:bg-violet-50",
    emerald: "bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    amber: "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50",
    gray: "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50",
    blue: "bg-white border border-blue-300 text-blue-700 hover:bg-blue-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, active ? activeCls[variant] : idleCls[variant])}
    >
      {label}
    </button>
  );
}

function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: SuggestedService;
  selected: boolean;
  onToggle: () => void;
}) {
  const isMapped = !!service.alreadyMapped;
  const isNo = service.classification === "NAO";
  const isMaybe = service.classification === "TALVEZ";
  const isSuggested = service.classification === "SUGERIDO";

  // Faixa lateral colorida
  const stripeStyle: React.CSSProperties = isMapped
    ? { background: "linear-gradient(90deg, #3b82f6 4px, transparent 4px)", paddingLeft: "12px" }
    : isNo
    ? { background: "linear-gradient(90deg, #9ca3af 4px, transparent 4px)", paddingLeft: "12px" }
    : isMaybe
    ? { background: "linear-gradient(90deg, #f59e0b 4px, transparent 4px)", paddingLeft: "12px" }
    : { background: "linear-gradient(90deg, #10b981 4px, transparent 4px)", paddingLeft: "12px" };

  const containerCls = cn(
    "rounded-lg shadow-sm hover:shadow transition-shadow",
    isMapped
      ? "bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 opacity-80"
      : isNo
      ? "bg-gray-50/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 opacity-70"
      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
  );

  const prefillChips = useMemo(() => {
    const chips: { icon: string; label: string }[] = [];
    if (service.prefill.process_purpose) chips.push({ icon: "📝", label: "Finalidade" });
    if (service.prefill.data_subjects?.length) chips.push({ icon: "👥", label: "Público" });
    if (service.prefill.legalBasis) chips.push({ icon: "⚖️", label: "Base legal" });
    if (service.prefill.share_targets?.length) chips.push({ icon: "🔄", label: "Compartilhamento" });
    if (service.prefill.share_with_whom) chips.push({ icon: "🤝", label: "Com quem" });
    return chips;
  }, [service.prefill]);

  const dot = isSuggested ? "🟢" : isMaybe ? "🟡" : isNo ? "🔴" : "🟢";
  const classBadge = isMapped
    ? null
    : isSuggested
    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Sugerido</span>
    : isMaybe
    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Talvez</span>
    : <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Provável que não</span>;

  return (
    <details className={containerCls} style={stripeStyle}>
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {/* Checkbox / "Já mapeado" */}
        {isMapped ? (
          <span className="mt-1.5 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center flex-shrink-0">
            ✓
          </span>
        ) : isNo ? (
          <input
            type="checkbox"
            disabled
            className="mt-1.5 h-4 w-4 rounded border-gray-300 cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="mt-1.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <span className="text-lg leading-none mt-0.5">{dot}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className={cn("font-semibold", isMapped || isNo ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100")}>
              {service.name}
            </h3>
            {isMapped ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                Já mapeado
              </span>
            ) : (
              classBadge
            )}
            {service.category && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {service.category}
              </span>
            )}
          </div>
          <p className={cn("text-sm mt-1 line-clamp-2", isMapped || isNo ? "text-gray-500" : "text-gray-600 dark:text-gray-400")}>
            {service.description}
          </p>

          {/* Pré-preencher chips */}
          {!isMapped && prefillChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              <span className="text-gray-500">Pré-preencherá:</span>
              {prefillChips.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  <span>{c.icon}</span>
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {/* Link já mapeado */}
          {isMapped && service.alreadyMapped && (
            <Link
              href={`/dashboard/inventario/${service.alreadyMapped.inventoryId}/editar`}
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Abrir Inventário existente →
            </Link>
          )}
        </div>

        {!isMapped && <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />}
      </summary>

      {/* Conteúdo expandido — só pra não-mapeados */}
      {!isMapped && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Fonte</div>
              {service.sourceUrl.startsWith("pdf:") ? (
                <span className="text-xs text-gray-700 dark:text-gray-300 inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {service.sourceUrl.replace(/^pdf:/, "")}
                </span>
              ) : service.sourceUrl ? (
                <a
                  href={service.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all inline-flex items-center gap-1"
                >
                  {service.sourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-gray-500 italic">não informada</span>
              )}
              {service.classificationReason && (
                <>
                  <div className="text-xs font-medium text-gray-500 mt-3 mb-1">
                    Por que foi classificado como {isSuggested ? "Sugerido" : isMaybe ? "Talvez" : "Não"}?
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {service.classificationReason}
                  </p>
                </>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                Pré-visualização do rascunho
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-2.5 border border-gray-200 dark:border-gray-700 text-xs space-y-1.5">
                <div>
                  <b>Nome:</b> {service.prefill.process_name ?? service.name}
                </div>
                {service.prefill.process_purpose && (
                  <div>
                    <b>Finalidade:</b> {service.prefill.process_purpose}
                  </div>
                )}
                {service.prefill.data_subjects && service.prefill.data_subjects.length > 0 && (
                  <div>
                    <b>Público:</b> {service.prefill.data_subjects.join(", ")}
                  </div>
                )}
                {service.prefill.legalBasis && (
                  <div>
                    <b>Base legal:</b> {service.prefill.legalBasis}
                  </div>
                )}
                {service.prefill.share_targets && service.prefill.share_targets.length > 0 && (
                  <div>
                    <b>Compartilhamento:</b> {service.prefill.share_targets.join(" · ")}
                  </div>
                )}
                {prefillChips.length === 0 && (
                  <div className="text-gray-500 italic">
                    Nada extraído com confiança — você preenche tudo manualmente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </details>
  );
}
