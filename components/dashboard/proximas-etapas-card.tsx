/**
 * Card "Próximas etapas" — substitui DesdeUltimaVisitaCard +
 * ContinueOndeParouCard (decisão 1A).
 *
 * Mostra top 3 ações priorizadas + botão "Ver todas" expandindo o resto.
 * Engine híbrida (workflow + diagnóstico) em lib/proximas-etapas-helpers.ts.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  ClipboardList,
  FileCheck2,
  FileText,
  AlertCircle,
  Scale,
  Handshake,
  ShieldAlert,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "alta" | "media" | "baixa";
type Source = "workflow" | "diagnostico";

interface Etapa {
  id: string;
  title: string;
  description?: string;
  href: string;
  priority: Priority;
  source: Source;
  icon: string;
}

/** Mapa string→component pra ícones lucide. */
const ICONS: Record<string, LucideIcon> = {
  ClipboardList,
  FileCheck2,
  FileText,
  AlertCircle,
  Scale,
  Handshake,
  ShieldAlert,
  ListChecks,
  Sparkles,
};

const PRIORITY_STYLES: Record<
  Priority,
  { dot: string; badge: string; label: string }
> = {
  alta: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    label: "Alta",
  },
  media: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    label: "Média",
  },
  baixa: {
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    label: "Baixa",
  },
};

const VISIBLE_LIMIT = 3;

export default function ProximasEtapasCard() {
  const [etapas, setEtapas] = useState<Etapa[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/proximas-etapas", { cache: "no-store" });
        if (!r.ok) {
          setLoading(false);
          return;
        }
        const j = await r.json();
        if (cancelled) return;
        setEtapas(j.etapas ?? []);
      } catch (err) {
        console.error("[proximas-etapas] erro:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Próximas etapas
          </h3>
        </div>
        <p className="text-sm text-gray-500">Calculando…</p>
      </div>
    );
  }

  // Lista vazia → estado positivo "tudo em dia"
  if (!etapas || etapas.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 p-5 bg-emerald-50/60 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
            Próximas etapas
          </h3>
        </div>
        <p className="text-sm text-emerald-800 dark:text-emerald-200/90">
          Nada urgente agora. Todos os fluxos estão fechados, parabéns! ✨
        </p>
        <Link
          href="/dashboard/minha-atividade"
          className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline"
        >
          Ver minha atividade dos últimos 30 dias
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const visible = expanded ? etapas : etapas.slice(0, VISIBLE_LIMIT);
  const hidden = Math.max(0, etapas.length - VISIBLE_LIMIT);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Próximas etapas
          </h3>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium">
            {etapas.length}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {visible.map((e) => (
          <EtapaItem key={e.id} etapa={e} />
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Ver todas ({etapas.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}

function EtapaItem({ etapa }: { etapa: Etapa }) {
  const Icon = ICONS[etapa.icon] ?? ClipboardList;
  const ps = PRIORITY_STYLES[etapa.priority];

  return (
    <Link
      href={etapa.href}
      className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
    >
      <div
        className={cn(
          "flex-shrink-0 h-9 w-9 rounded-md flex items-center justify-center",
          etapa.priority === "alta"
            ? "bg-red-50 dark:bg-red-950/40"
            : etapa.priority === "media"
              ? "bg-amber-50 dark:bg-amber-950/40"
              : "bg-blue-50 dark:bg-blue-950/40",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            etapa.priority === "alta"
              ? "text-red-600 dark:text-red-400"
              : etapa.priority === "media"
                ? "text-amber-600 dark:text-amber-400"
                : "text-blue-600 dark:text-blue-400",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {etapa.title}
          </p>
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", ps.badge)}>
            {ps.label}
          </span>
          {etapa.source === "diagnostico" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              Diagnóstico
            </span>
          )}
        </div>
        {etapa.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {etapa.description}
          </p>
        )}
      </div>
      <ArrowRight className="flex-shrink-0 h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-2 transition-colors" />
    </Link>
  );
}
