"use client";

/**
 * Tela /dashboard/termos-consentimento — painel dos Termos de
 * Consentimento (Checkpoint Consentimento — S3).
 *
 * Inclui:
 *  - KPIs (total / publicados / rascunho / processos Consentimento sem termo)
 *  - Filtros por status
 *  - Botão "Criar termo" abre modal com picker dos 5 templates
 *  - 1 card por termo com estado visual + ações (Editar / Ver público / Records)
 *
 * Acesso: DPO-only (page.tsx já gateia).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FileSignature,
  Loader2,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Cookie,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TermoCreateDialog from "./termo-create-dialog";
import CookiesStatsPanel from "./cookies-stats-panel";

interface ListTerm {
  id: string;
  slug: string;
  title: string;
  status: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  templateType: string;
  currentVersion: number;
  allowsPhysical: boolean;
  allowsDigital: boolean;
  publishedAt: string | null;
  linkedInventories: number;
  acceptedCount: number;
  updatedAt: string;
}

interface ConsentStatusItem {
  inventoryId: string;
  serviceName: string;
  setor: string | null;
  missingTerm: boolean;
  isCookieRelated: boolean;
}

type FilterMode = "all" | "published" | "draft" | "archived";
type TemplateFilter = "all" | "GERAL" | "SENSIVEIS" | "MENOR" | "IMAGEM_VOZ" | "COMUNICACAO";
type TabKey = "termos" | "cookies";

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "Tudo",
  published: "🟢 Publicados",
  draft: "🟡 Rascunho",
  archived: "📦 Arquivados",
};

const TEMPLATE_LABEL: Record<string, string> = {
  GERAL: "Geral",
  SENSIVEIS: "Sensíveis",
  MENOR: "Menor",
  IMAGEM_VOZ: "Imagem/Voz",
  COMUNICACAO: "Comunicação",
};

const TEMPLATE_FILTER_OPTIONS: Array<{ key: TemplateFilter; label: string }> = [
  { key: "all", label: "Todos os modelos" },
  { key: "GERAL", label: "Geral" },
  { key: "SENSIVEIS", label: "Sensíveis" },
  { key: "MENOR", label: "Menor" },
  { key: "IMAGEM_VOZ", label: "Imagem/Voz" },
  { key: "COMUNICACAO", label: "Comunicação" },
];

export default function TermosConsentimentoContent() {
  const router = useRouter();
  const [terms, setTerms] = useState<ListTerm[] | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [missingItems, setMissingItems] = useState<ConsentStatusItem[]>([]);
  const [cookieCovered, setCookieCovered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<TabKey>("termos");

  // Debounce client-side da busca (200ms).
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function reload() {
    setLoading(true);
    try {
      const [listRes, consentRes] = await Promise.all([
        fetch("/api/consent-terms"),
        fetch("/api/inventario/consent-status").catch(() => null),
      ]);
      const lj = await listRes.json();
      if (!listRes.ok) throw new Error(lj?.error ?? "Erro");
      setTerms(lj.items ?? []);
      setCompanySlug(lj.companySlug ?? null);
      if (consentRes && consentRes.ok) {
        const cj = await consentRes.json();
        setMissingItems((cj.items ?? []).filter((i: any) => i.missingTerm));
        setCookieCovered(cj.stats?.cookieRelated ?? 0);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const t = terms ?? [];
    return {
      total: t.length,
      published: t.filter((x) => x.status === "PUBLICADO").length,
      draft: t.filter((x) => x.status === "RASCUNHO").length,
      archived: t.filter((x) => x.status === "ARQUIVADO").length,
      accepts: t.reduce((s, x) => s + x.acceptedCount, 0),
      missing: missingItems.length,
    };
  }, [terms, missingItems]);

  const filtered = useMemo(() => {
    const t = terms ?? [];
    return t.filter((x) => {
      // Status
      if (filter === "published" && x.status !== "PUBLICADO") return false;
      if (filter === "draft" && x.status !== "RASCUNHO") return false;
      if (filter === "archived" && x.status !== "ARQUIVADO") return false;
      // Tipo de modelo
      if (templateFilter !== "all" && x.templateType !== templateFilter) return false;
      // Busca por título (case-insensitive, contém)
      if (searchDebounced && !x.title.toLowerCase().includes(searchDebounced)) {
        return false;
      }
      return true;
    });
  }, [terms, filter, templateFilter, searchDebounced]);

  function handleCreated(newId: string) {
    setShowCreate(false);
    router.push(`/dashboard/termos-consentimento/${newId}/editar`);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Termos de Consentimento</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-violet-600" />
            Consentimento do Titular
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            Painel único do DPO pra acompanhar o consentimento formal exigido pelo Art. 8º
            (Termos do titular) e o consentimento granular de cookies coletado pelo banner
            público (Resolução CD/ANPD 2/2022).
          </p>
        </div>
        {tab === "termos" && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar termo
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={tab === "termos"}
          onClick={() => setTab("termos")}
          icon={<FileSignature className="h-4 w-4" />}
        >
          Termos (Art. 8º)
        </TabButton>
        <TabButton
          active={tab === "cookies"}
          onClick={() => setTab("cookies")}
          icon={<Cookie className="h-4 w-4" />}
        >
          Cookies (CP26)
        </TabButton>
      </div>

      {tab === "cookies" && <CookiesStatsPanel />}

      {tab === "termos" && (
        <>
          {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Total" value={stats.total} tone="slate" />
        <KpiCard label="Publicados" value={stats.published} tone="emerald" />
        <KpiCard label="Em rascunho" value={stats.draft} tone="amber" />
        <KpiCard label="Aceites coletados" value={stats.accepts} tone="violet" />
        <KpiCard
          label="Processos sem termo"
          value={stats.missing}
          tone={stats.missing > 0 ? "red" : "slate"}
          hint={stats.missing > 0 ? "Inventário com Consentimento sem termo" : undefined}
        />
      </div>

      {/* Alerta processos sem termo */}
      {missingItems.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
                {missingItems.length} processo{missingItems.length === 1 ? "" : "s"} aprovado
                {missingItems.length === 1 ? "" : "s"} com base = Consentimento, mas sem termo:
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc pl-5 space-y-0.5">
                {missingItems.slice(0, 5).map((i) => (
                  <li key={i.inventoryId}>
                    <strong>{i.serviceName}</strong>
                    {i.setor ? <span className="text-xs"> · {i.setor}</span> : null}
                  </li>
                ))}
                {missingItems.length > 5 && (
                  <li className="italic">... e mais {missingItems.length - 5}</li>
                )}
              </ul>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                Clique em "Criar termo" acima e vincule ao processo correspondente.
              </p>
              {cookieCovered > 0 && (
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1.5 italic">
                  🍪 {cookieCovered} processo{cookieCovered === 1 ? "" : "s"} relacionado{cookieCovered === 1 ? "" : "s"} a cookies/analytics foi
                  {cookieCovered === 1 ? "" : "ram"} excluído{cookieCovered === 1 ? "" : "s"} desta lista — já {cookieCovered === 1 ? "é tratado" : "são tratados"} pelo Sistema de Cookies.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nota standalone quando NÃO há pendência mas há cookie-related */}
      {missingItems.length === 0 && cookieCovered > 0 && !loading && (
        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            🍪 {cookieCovered} processo{cookieCovered === 1 ? "" : "s"} do Inventário com base = Consentimento {cookieCovered === 1 ? "está" : "estão"} relacionado{cookieCovered === 1 ? "" : "s"} a cookies/analytics — coleta de consentimento é feita pelo Sistema de Cookies (banner público), sem precisar de termo dedicado aqui.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium mr-1">Status:</span>
          {(Object.keys(FILTER_LABELS) as FilterMode[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                filter === k
                  ? "bg-violet-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
              )}
            >
              {FILTER_LABELS[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium mr-1">Modelo:</span>
          {TEMPLATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTemplateFilter(opt.key)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                templateFilter === opt.key
                  ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por título do termo..."
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando termos...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <FileSignature className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
            {terms && terms.length === 0
              ? "Nenhum termo cadastrado ainda"
              : "Nenhum termo neste filtro"}
          </p>
          {terms && terms.length === 0 && (
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Clique em <strong>Criar termo</strong> pra começar a partir de um dos 5 modelos.
            </p>
          )}
        </div>
      )}

      {/* Lista */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TermoCard key={t.id} term={t} companySlug={companySlug} />
          ))}
        </div>
      )}
        </>
      )}

      <TermoCreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-violet-600 text-violet-700 dark:text-violet-300"
          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function KpiCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "violet" | "red";
  hint?: string;
}) {
  const borderCls: Record<typeof tone, string> = {
    slate: "border-gray-200 dark:border-gray-700",
    emerald: "border-emerald-200 dark:border-emerald-900",
    amber: "border-amber-200 dark:border-amber-900",
    violet: "border-violet-200 dark:border-violet-900",
    red: "border-red-200 dark:border-red-900",
  };
  const valueCls: Record<typeof tone, string> = {
    slate: "text-gray-900 dark:text-gray-100",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    red: "text-red-600 dark:text-red-400",
  };
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-3 border", borderCls[tone])}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={cn("text-2xl font-bold", valueCls[tone])}>{value}</div>
      {hint && <div className="text-[11px] text-gray-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function TermoCard({
  term,
  companySlug,
}: {
  term: ListTerm;
  companySlug: string | null;
}) {
  const isPub = term.status === "PUBLICADO";
  const isDraft = term.status === "RASCUNHO";
  const isArchived = term.status === "ARQUIVADO";
  const stripe = isPub
    ? "bg-emerald-500"
    : isDraft
      ? "bg-amber-500"
      : "bg-gray-300";

  const cardCls = isArchived
    ? "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 opacity-70"
    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

  return (
    <div className={cn("rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 border", cardCls)}>
      <div className={cn("w-1 h-12 rounded shrink-0 hidden sm:block", stripe)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {term.title}
          </h3>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {TEMPLATE_LABEL[term.templateType] ?? term.templateType}
          </span>
          {isPub && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              🟢 Publicado v{term.currentVersion}
            </span>
          )}
          {isDraft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              🟡 Rascunho
            </span>
          )}
          {isArchived && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              📦 Arquivado
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          {term.linkedInventories > 0 && (
            <span>{term.linkedInventories} processo{term.linkedInventories === 1 ? "" : "s"} vinculado{term.linkedInventories === 1 ? "" : "s"}</span>
          )}
          {term.allowsDigital && term.allowsPhysical && <span>Físico + Digital</span>}
          {term.allowsDigital && !term.allowsPhysical && <span>Só Digital</span>}
          {!term.allowsDigital && term.allowsPhysical && <span>Só Físico</span>}
          {isPub && term.acceptedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              {term.acceptedCount} aceite{term.acceptedCount === 1 ? "" : "s"}
            </span>
          )}
          {isPub && term.publishedAt && (
            <span>Publicado em {new Date(term.publishedAt).toLocaleDateString("pt-BR")}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {isPub && companySlug && (
          <a
            href={`/p/${companySlug}/termo/${term.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-600 hover:underline inline-flex items-center gap-1"
          >
            Ver público <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <Link
          href={`/dashboard/termos-consentimento/${term.id}/editar`}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isDraft ? "Editar e publicar" : "Abrir"}
        </Link>
      </div>
    </div>
  );
}
