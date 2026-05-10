"use client";

/**
 * Modal "Pré-preencher por Carta de Serviços".
 *
 * 2026-05-11 — Versão original (Fatia b): input livre de URLs.
 * 2026-05-11 — Reforço: 3 caminhos pra reduzir fricção:
 *   (3) Botão "Buscar no Google" pré-formatado pelo `institutionalDomain`
 *   (4) Inputs nomeados específicos por template aplicado (vem do
 *       `suggestedUrlInputs` em `lib/inventario-templates-publicos.ts`)
 *   (5) Auto-descobrir URLs via Firecrawl /v1/map a partir do domínio
 *       cadastrado em `Company.institutionalDomain` — agrupa por
 *       categoria com checkboxes
 *
 * Fluxo: 3 seções verticais
 *   ┌─────────────────────────────────────┐
 *   │ 🪄 Auto-descobrir do meu site       │
 *   ├─────────────────────────────────────┤
 *   │ 📌 URLs sugeridas pra esse modelo   │
 *   │   (se há template aplicado)         │
 *   ├─────────────────────────────────────┤
 *   │ ✏️  Outras URLs (manual)             │
 *   │  + 🔍 Buscar no Google               │
 *   └─────────────────────────────────────┘
 *   [ Pré-preencher com N URLs ]
 *
 * Após clicar "Pré-preencher", entra em loading → tela de resultado
 * (igual antes).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe2,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Wand2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { FormAnswers } from "@/lib/inventario-form-schema";
import {
  getTemplateById,
  type SuggestedUrlInput,
} from "@/lib/inventario-templates-publicos";

const MAX_URLS = 5;

export interface AiPrefillSummary {
  urlsOk: string[];
  urlsErr: { url: string; error: string }[];
  applied: string[];
  rejected: string[];
  summary: string;
}

interface DiscoverGroup {
  category: string;
  label: string;
  urls: string[];
}

interface CartaServicosPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Respostas atuais — vão pro endpoint pra mesclagem server-side. */
  currentAnswers: FormAnswers;
  /**
   * Template aplicado (se houver). Determina os inputs sugeridos da
   * seção (4). Quando ausente, modal só mostra input manual + auto.
   */
  appliedTemplateId?: string | null;
  /** Callback quando IA termina e o user aceita aplicar. */
  onApply: (next: FormAnswers, summary: AiPrefillSummary) => void;
}

export default function CartaServicosPicker({
  open,
  onOpenChange,
  currentAnswers,
  appliedTemplateId,
  onApply,
}: CartaServicosPickerProps) {
  // ============ Estado ============

  /** URLs em edição manual (campo livre). Sempre tem ao menos 1 input. */
  const [manualUrls, setManualUrls] = useState<string[]>([""]);
  /**
   * URLs preenchidas nos campos sugeridos pelo template — chave =
   * label do input pra preservar mesmo se o user editar.
   */
  const [suggestedUrls, setSuggestedUrls] = useState<Record<string, string>>(
    {},
  );

  /** Domínio do órgão (vem da Empresa, alimenta auto-discover + Google). */
  const [companyDomain, setCompanyDomain] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  /** Estado do auto-descobrir. */
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverGroups, setDiscoverGroups] = useState<DiscoverGroup[] | null>(
    null,
  );
  /** URLs marcadas (checkbox) na lista do auto-descobrir. */
  const [discoveredSelected, setDiscoveredSelected] = useState<Set<string>>(
    new Set(),
  );

  /** Estado da chamada principal de pré-preenchimento. */
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    next: FormAnswers;
    summary: AiPrefillSummary;
  } | null>(null);

  // ============ Setup ============

  const template = appliedTemplateId
    ? getTemplateById(appliedTemplateId)
    : undefined;
  const suggestedInputs: SuggestedUrlInput[] = template?.suggestedUrlInputs ?? [];

  // Carrega domínio + companyName ao abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await fetch("/api/company/institutional-domain", {
          cache: "no-store",
        });
        if (r.ok) {
          const j = await r.json();
          setCompanyDomain(j?.institutionalDomain ?? null);
          setCompanyName(j?.companyName ?? null);
        }
      } catch {
        // silencioso
      }
    })();
  }, [open]);

  // ============ URLs consolidadas ============

  /**
   * URLs únicas resultantes da soma de:
   *   - inputs sugeridos preenchidos
   *   - inputs manuais preenchidos
   *   - selecionadas no auto-descobrir
   * Preserva ordem de inserção e remove duplicatas.
   */
  const consolidatedUrls = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (u: string) => {
      const t = u.trim();
      if (!t || seen.has(t)) return;
      seen.add(t);
      out.push(t);
    };
    // 1. Sugeridas
    for (const inp of suggestedInputs) {
      const v = suggestedUrls[inp.label];
      if (v) push(v);
    }
    // 2. Auto-descobertas selecionadas
    for (const u of discoveredSelected) push(u);
    // 3. Manuais
    for (const u of manualUrls) push(u);
    return out;
  }, [suggestedInputs, suggestedUrls, discoveredSelected, manualUrls]);

  const tooMany = consolidatedUrls.length > MAX_URLS;

  // ============ Handlers ============

  const close = () => {
    if (loading) return;
    setManualUrls([""]);
    setSuggestedUrls({});
    setDiscoverGroups(null);
    setDiscoveredSelected(new Set());
    setDiscoverError(null);
    setResult(null);
    onOpenChange(false);
  };

  const updateManualUrl = (idx: number, value: string) => {
    setManualUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));
  };
  const addManualRow = () => {
    if (manualUrls.length >= MAX_URLS) return;
    setManualUrls((prev) => [...prev, ""]);
  };
  const removeManualRow = (idx: number) => {
    setManualUrls((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx),
    );
  };

  const updateSuggestedUrl = (label: string, value: string) => {
    setSuggestedUrls((prev) => ({ ...prev, [label]: value }));
  };

  const toggleDiscovered = (url: string) => {
    setDiscoveredSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const runDiscover = async () => {
    setDiscovering(true);
    setDiscoverError(null);
    setDiscoverGroups(null);
    setDiscoveredSelected(new Set());
    try {
      const r = await fetch("/api/inventario/discover-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // server lê institutionalDomain
      });
      const j = await r.json();
      if (!r.ok) {
        setDiscoverError(j?.error ?? "Erro ao mapear o site");
        return;
      }
      setDiscoverGroups(j?.groups ?? []);
      // Pré-marca categorias mais importantes (carta_servicos +
      // ouvidoria/sic se existirem) — UX assume os palpites óbvios.
      const auto = new Set<string>();
      for (const g of j?.groups ?? []) {
        if (g.category === "carta_servicos" && g.urls.length > 0) {
          auto.add(g.urls[0]); // só 1 carta tipicamente
        }
      }
      setDiscoveredSelected(auto);
    } catch (e: any) {
      setDiscoverError(e?.message ?? "Erro de rede");
    } finally {
      setDiscovering(false);
    }
  };

  const openGoogleSearch = (category: string) => {
    if (!companyDomain) {
      toast.info(
        "Cadastre o domínio institucional em /dashboard/empresa pra usar busca direcionada.",
      );
      return;
    }
    const queryByCategory: Record<string, string> = {
      carta_servicos: "carta de serviços",
      ouvidoria: "ouvidoria",
      sic: "acesso à informação e-SIC",
      lgpd: "lgpd política de privacidade",
      atos_normativos: "resolução portaria ato normativo",
      edital: "edital",
      transparencia: "portal da transparência",
      rh: "recursos humanos",
      licitacao: "licitações contratos",
    };
    const term = queryByCategory[category] ?? "";
    const q = encodeURIComponent(`site:${companyDomain} ${term}`.trim());
    window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener");
  };

  const runPrefill = async () => {
    if (consolidatedUrls.length === 0) {
      toast.error("Adicione pelo menos 1 URL.");
      return;
    }
    if (tooMany) {
      toast.error(
        `Máximo ${MAX_URLS} URLs por vez. Remova ${consolidatedUrls.length - MAX_URLS} antes.`,
      );
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/inventario/ai-prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formAnswers: currentAnswers,
          urls: consolidatedUrls,
        }),
      });
      const json = await r.json();
      if (!r.ok) {
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

  // ============ Render ============

  // ---- Tela de RESULTADO ----
  if (result) {
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

  // ---- Tela de INPUT ----
  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-violet-600" />
            Pré-preencher por Carta de Serviços
          </DialogTitle>
          <DialogDescription>
            O sistema lê páginas públicas do seu órgão e preenche os campos
            extraíveis. Use as 3 vias abaixo — todas viram uma lista única
            de URLs (máx {MAX_URLS}) que vai pra IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1 -mr-1 flex-1">
          {/* ========================================================
              SEÇÃO 1 — Auto-descobrir do site
              ======================================================== */}
          <section className="rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/20 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Wand2 className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                    Auto-descobrir do meu site
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
                    {companyDomain ? (
                      <>
                        Vamos mapear{" "}
                        <code className="font-mono">{companyDomain}</code> e
                        listar URLs candidatas agrupadas por categoria.
                      </>
                    ) : (
                      <>
                        Cadastre o{" "}
                        <a
                          href="/dashboard/empresa"
                          target="_blank"
                          rel="noopener"
                          className="text-violet-700 underline"
                        >
                          domínio institucional
                        </a>{" "}
                        em /dashboard/empresa pra usar essa opção.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={runDiscover}
                disabled={discovering || !companyDomain}
                className="flex-shrink-0"
              >
                {discovering ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Mapeando…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                    Auto-descobrir
                  </>
                )}
              </Button>
            </div>

            {discoverError && (
              <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded p-2">
                {discoverError}
              </div>
            )}

            {discoverGroups && discoverGroups.length === 0 && (
              <div className="text-xs text-gray-500 italic">
                Site mapeado, mas nenhuma URL caiu nas categorias conhecidas.
                Use a busca no Google ou cole URLs manualmente abaixo.
              </div>
            )}

            {discoverGroups && discoverGroups.length > 0 && (
              <div className="space-y-2">
                {discoverGroups.map((g) => (
                  <details
                    key={g.category}
                    className="text-xs bg-white dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800"
                    open={
                      g.category === "carta_servicos" ||
                      g.category === "ouvidoria"
                    }
                  >
                    <summary className="cursor-pointer px-2 py-1.5 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 list-none">
                      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                      {g.label} ({g.urls.length})
                    </summary>
                    <ul className="px-2 py-1 space-y-1 max-h-32 overflow-y-auto">
                      {g.urls.map((u) => {
                        const checked = discoveredSelected.has(u);
                        return (
                          <li key={u} className="flex items-start gap-1.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDiscovered(u)}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <code className="text-[11px] text-gray-600 dark:text-gray-400 break-all leading-tight">
                              {u}
                            </code>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* ========================================================
              SEÇÃO 2 — Inputs sugeridos por template
              ======================================================== */}
          {suggestedInputs.length > 0 && (
            <section className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    URLs sugeridas pra esse modelo
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
                    Modelo aplicado:{" "}
                    <strong>{template?.nome}</strong>. Preencha o que tiver
                    em mãos — o que faltar, deixe em branco.
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {suggestedInputs.map((inp) => (
                  <div key={inp.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {inp.label}
                      </label>
                      {companyDomain && (
                        <button
                          type="button"
                          onClick={() => openGoogleSearch(inp.category)}
                          className="text-[11px] text-violet-700 hover:text-violet-900 dark:text-violet-400 hover:underline flex items-center gap-1"
                          title="Abrir Google com busca direcionada pro seu site"
                        >
                          <Search className="h-3 w-3" />
                          Buscar
                        </button>
                      )}
                    </div>
                    <Input
                      value={suggestedUrls[inp.label] ?? ""}
                      onChange={(e) =>
                        updateSuggestedUrl(inp.label, e.target.value)
                      }
                      placeholder={inp.placeholder}
                      disabled={loading}
                      className="text-sm"
                    />
                    {inp.hint && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                        {inp.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================
              SEÇÃO 3 — Outras URLs (manual)
              ======================================================== */}
          <section className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Outras URLs (manual)
              </h3>
              {companyDomain && (
                <button
                  type="button"
                  onClick={() => openGoogleSearch("carta_servicos")}
                  className="text-[11px] text-violet-700 hover:text-violet-900 dark:text-violet-400 hover:underline flex items-center gap-1"
                  title="Abrir Google com busca direcionada pro seu site"
                >
                  <Search className="h-3 w-3" />
                  Buscar no meu site
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {manualUrls.map((u, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Input
                    value={u}
                    onChange={(e) => updateManualUrl(idx, e.target.value)}
                    placeholder="https://www.exemplo.gov.br/..."
                    disabled={loading}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeManualRow(idx)}
                    disabled={loading || (manualUrls.length === 1 && !u)}
                    title="Remover URL"
                    className="h-9 w-9 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addManualRow}
                disabled={loading || manualUrls.length >= MAX_URLS}
                className="text-xs h-7"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar URL
              </Button>
            </div>
          </section>

          {/* Honest disclaimer */}
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
            <strong>Observação honesta:</strong> sites institucionais cobrem
            bem finalidade, dados básicos coletados e base legal. Já campos
            internos (volume, local de armazenamento, segurança técnica)
            raramente estão no texto público — ficam pra input manual depois.
          </div>
        </div>

        {/* Footer fixo */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs">
            {consolidatedUrls.length === 0 ? (
              <span className="text-gray-500">
                Nenhuma URL adicionada ainda.
              </span>
            ) : (
              <span className={tooMany ? "text-red-600" : "text-gray-700 dark:text-gray-300"}>
                <Badge variant="outline" className="mr-1">
                  {consolidatedUrls.length}
                </Badge>
                URL{consolidatedUrls.length === 1 ? "" : "s"} pronta
                {consolidatedUrls.length === 1 ? "" : "s"} pra extração
                {tooMany && ` (excede ${MAX_URLS})`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={close} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={runPrefill}
              disabled={loading || consolidatedUrls.length === 0 || tooMany}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
