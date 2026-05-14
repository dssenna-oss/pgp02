"use client";

/**
 * Tela /dashboard/avisos-privacidade — lista de Avisos de Privacidade
 * por serviço da org. Inclui:
 *  - KPIs (publicados / rascunho / desatualizados / sem aviso)
 *  - Filtros por estado
 *  - 1 card por processo do Inventário (APROVADO ou com Aviso existente)
 *  - Ações por card: gerar, editar, publicar, regenerar, ver público
 *
 * Acesso: DPO-only (page.tsx já gateia). Reusa estética da tela Sugerir
 * processos da Carta (chips, cards, banner de desatualização).
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FileText,
  Loader2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListNotice {
  id: string;
  slug: string;
  status: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  currentVersion: number;
  publishedAt: string | null;
  lastSyncedFromInventoryAt: string;
  forcedDespiteNotApproved: boolean;
  outdated: boolean;
}

interface ListItem {
  inventoryId: string;
  serviceName: string;
  setor: string | null;
  inventoryStatus: string;
  inventoryUpdatedAt: string;
  notice: ListNotice | null;
}

type FilterMode = "all" | "published" | "draft" | "outdated" | "missing";

const FILTER_LABELS: Record<FilterMode, string> = {
  all: "Tudo",
  published: "🟢 Publicados",
  draft: "🟡 Rascunho",
  outdated: "🔴 Desatualizados",
  missing: "⚪ Sem aviso",
};

export default function AvisosPrivacidadeContent() {
  const router = useRouter();
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/avisos-privacidade");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Erro ao carregar");
        if (!cancelled) {
          setItems(json.items ?? []);
          setCompanySlug(json.companySlug ?? null);
        }
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Erro ao carregar Avisos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // KPIs
  const stats = useMemo(() => {
    if (!items) return { approved: 0, published: 0, draft: 0, outdated: 0, missing: 0 };
    let approved = 0,
      published = 0,
      draft = 0,
      outdated = 0,
      missing = 0;
    for (const it of items) {
      if (it.inventoryStatus === "APROVADO") approved++;
      if (it.notice) {
        if (it.notice.status === "PUBLICADO") published++;
        if (it.notice.status === "RASCUNHO") draft++;
        if (it.notice.outdated) outdated++;
      } else if (it.inventoryStatus === "APROVADO") {
        missing++;
      }
    }
    return { approved, published, draft, outdated, missing };
  }, [items]);

  // Aplica filtro
  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((it) => {
      switch (filter) {
        case "all":
          return true;
        case "published":
          return it.notice?.status === "PUBLICADO";
        case "draft":
          return it.notice?.status === "RASCUNHO";
        case "outdated":
          return it.notice?.outdated === true;
        case "missing":
          return !it.notice && it.inventoryStatus === "APROVADO";
      }
    });
  }, [items, filter]);

  async function handleGenerate(item: ListItem, force = false) {
    if (actingId) return;
    setActingId(item.inventoryId);
    try {
      const res = await fetch("/api/avisos-privacidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataInventoryId: item.inventoryId,
          forceDespiteNotApproved: force,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 422 && !force) {
          // Inventário não aprovado — pergunta override
          if (confirm("Este processo ainda não foi APROVADO no Inventário. Gerar o Aviso assim mesmo? (recomendado: aprovar antes)")) {
            await handleGenerate(item, true);
            return;
          }
          return;
        }
        toast.error(json?.error ?? "Erro ao gerar Aviso");
        return;
      }
      toast.success("Aviso gerado em rascunho.");
      router.push(`/dashboard/avisos-privacidade/${json.notice.id}/editar`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setActingId(null);
    }
  }

  async function handleSync(item: ListItem) {
    if (!item.notice || actingId) return;
    setActingId(item.inventoryId);
    try {
      const res = await fetch(
        `/api/avisos-privacidade/${item.notice.id}/sync-from-inventory`,
        { method: "POST" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? "Erro ao re-sincronizar");
        return;
      }
      toast.success("Aviso re-sincronizado com o Inventário. Lembre de publicar pra propagar.");
      // Refaz a lista pra atualizar lastSync
      const reload = await fetch("/api/avisos-privacidade");
      const json = await reload.json();
      if (reload.ok) setItems(json.items ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro inesperado");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <nav className="text-sm text-gray-500 mb-3">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Avisos de Privacidade por Serviço</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <FileText className="h-6 w-6 text-violet-600" />
          Avisos de Privacidade por Serviço
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          Documento público, em linguagem acessível, que cada serviço entrega ao cidadão pra
          cumprir o Art. 9º da LGPD. Gerado automaticamente a partir do Inventário; você ajusta
          as seções e adiciona observações antes de publicar.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Inventários aprovados" value={stats.approved} tone="slate" />
        <KpiCard label="Avisos publicados" value={stats.published} tone="emerald" />
        <KpiCard label="Em rascunho" value={stats.draft} tone="amber" />
        <KpiCard label="Desatualizados" value={stats.outdated} tone="red" />
        <KpiCard label="Sem aviso ainda" value={stats.missing} tone="slate" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 font-medium mr-1">Mostrar:</span>
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

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando processos...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <CircleDashed className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
            Nenhum processo neste filtro.
          </p>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Os Avisos só ficam disponíveis pra processos do Inventário com status APROVADO.
            Aprove no editor do Inventário pra liberar a geração.
          </p>
        </div>
      )}

      {/* Lista */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((it) => (
            <NoticeCard
              key={it.inventoryId}
              item={it}
              acting={actingId === it.inventoryId}
              companySlug={companySlug}
              onGenerate={() => handleGenerate(it, false)}
              onSync={() => handleSync(it)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "red";
}) {
  const borderCls: Record<typeof tone, string> = {
    slate: "border-gray-200 dark:border-gray-700",
    emerald: "border-emerald-200 dark:border-emerald-900",
    amber: "border-amber-200 dark:border-amber-900",
    red: "border-red-200 dark:border-red-900",
  };
  const valueCls: Record<typeof tone, string> = {
    slate: "text-gray-900 dark:text-gray-100",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
  };
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-3 border", borderCls[tone])}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={cn("text-2xl font-bold", valueCls[tone])}>{value}</div>
    </div>
  );
}

function NoticeCard({
  item,
  acting,
  companySlug,
  onGenerate,
  onSync,
}: {
  item: ListItem;
  acting: boolean;
  companySlug: string | null;
  onGenerate: () => void;
  onSync: () => void;
}) {
  const notice = item.notice;
  const isAprovado = item.inventoryStatus === "APROVADO";
  const outdated = notice?.outdated === true;
  const isPub = notice?.status === "PUBLICADO";
  const isDraft = notice?.status === "RASCUNHO";

  const stripeColor = outdated
    ? "bg-red-500"
    : isPub
      ? "bg-emerald-500"
      : isDraft
        ? "bg-amber-500"
        : isAprovado
          ? "bg-slate-300"
          : "bg-slate-300";

  const cardBg = outdated
    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900"
    : !notice && isAprovado
      ? "bg-slate-50 dark:bg-gray-900/40 border-dashed border-gray-300 dark:border-gray-700"
      : !isAprovado && !notice
        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 border",
        cardBg,
      )}
    >
      <div className={cn("w-1 h-12 rounded shrink-0 hidden sm:block", stripeColor)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {item.serviceName ?? "(sem nome)"}
          </h3>
          {isPub && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              🟢 Publicado v{notice!.currentVersion}
            </span>
          )}
          {isDraft && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              🟡 Rascunho
            </span>
          )}
          {outdated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" /> Inventário mudou
            </span>
          )}
          {notice?.forcedDespiteNotApproved && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
              <ShieldAlert className="h-3 w-3" /> Override DPO
            </span>
          )}
          {!notice && isAprovado && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              ⚪ Sem aviso
            </span>
          )}
          {!notice && !isAprovado && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Inventário em {item.inventoryStatus}
            </span>
          )}
          {item.setor && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {item.setor}
            </span>
          )}
        </div>
        {outdated && (
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Inventário atualizado em{" "}
            {new Date(item.inventoryUpdatedAt).toLocaleDateString("pt-BR")} (depois da última
            sincronização). Re-sincronize pra incorporar as mudanças.
          </p>
        )}
        {!outdated && notice && (
          <p className="text-xs text-gray-500">
            {isPub && notice.publishedAt && (
              <>
                Publicado em {new Date(notice.publishedAt).toLocaleDateString("pt-BR")} · Última
                sync: {new Date(notice.lastSyncedFromInventoryAt).toLocaleDateString("pt-BR")}
              </>
            )}
            {isDraft && (
              <>
                Última sync: {new Date(notice.lastSyncedFromInventoryAt).toLocaleDateString("pt-BR")}{" "}
                · ainda não publicado
              </>
            )}
          </p>
        )}
        {!notice && (
          <p className="text-xs text-gray-500">
            Inventário aprovado em{" "}
            {new Date(item.inventoryUpdatedAt).toLocaleDateString("pt-BR")} · Aviso ainda não foi
            gerado.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {isPub && companySlug && (
          <a
            href={`/p/${companySlug}/aviso-servico/${notice!.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-600 hover:underline inline-flex items-center gap-1"
          >
            Ver público <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {outdated && notice && (
          <Button
            size="sm"
            onClick={onSync}
            disabled={acting}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
          >
            {acting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
            )}
            Re-sincronizar
          </Button>
        )}
        {notice && (
          <Link
            href={`/dashboard/avisos-privacidade/${notice.id}/editar`}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isDraft ? "Editar e publicar" : "Editar"}
          </Link>
        )}
        {!notice && (
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={acting}
            className={cn(
              "text-xs",
              isAprovado
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50",
            )}
            variant={isAprovado ? "default" : "outline"}
          >
            {acting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : isAprovado ? (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 mr-1" />
            )}
            {isAprovado ? "Gerar Aviso" : "Gerar mesmo assim"}
          </Button>
        )}
      </div>
    </div>
  );
}

// Indicador read-only não-usado (placeholder pra evitar tree-shake warnings)
const _checkmark = CheckCircle2;
void _checkmark;
