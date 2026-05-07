/**
 * Card "Desde sua última visita" (CP27 Fatia 2)
 *
 * Aparece no Dashboard logo abaixo do hero, nas primeiras 24h após o
 * login. Mostra 3 baldes (🔴 Crítico · 🟠 Suas coisas · ⚪ Geral) com
 * itens calculados pelo engine em lib/painel-retomada-helpers.ts.
 *
 * Comportamento:
 *   - Se o user já dispensou o card hoje (localStorage), não mostra
 *   - Se previousLoginAt é null (primeiro login), não mostra
 *   - Se total de itens = 0, não mostra
 *   - Botão ✓ no canto marca como visto e some até o próximo login
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Check, ChevronDown, ChevronUp, AlertCircle, Building2, Sparkles } from "lucide-react";

interface RetomadaItem {
  label: string;
  detail?: string;
  href: string;
  whenLabel: string;
  when: string;
}

interface RetomadaResponse {
  previousLoginAt: string | null;
  windowLabel: string | null;
  showCard: boolean;
  totalCount: number;
  buckets: {
    critico: RetomadaItem[];
    suasCoisas: RetomadaItem[];
    geral: RetomadaItem[];
  };
}

const DISMISS_STORAGE_KEY = "pgp:retomada-dismissed-at";

/**
 * Verifica se o user dispensou o card depois do previousLoginAt.
 * Se sim, esconde — só volta a aparecer quando ele logar de novo
 * (porque previousLoginAt vai mudar).
 */
function isDismissed(previousLoginAt: string | null): boolean {
  if (!previousLoginAt || typeof window === "undefined") return false;
  const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissedAt) return false;
  // Só vale o dismiss se foi feito DEPOIS do previousLoginAt
  // (caso contrário, é dismiss de visita antiga — ignora).
  return new Date(dismissedAt) > new Date(previousLoginAt);
}

export default function DesdeUltimaVisitaCard() {
  const [data, setData] = useState<RetomadaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [geralOpen, setGeralOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const r = await fetch("/api/painel-retomada/since-last-visit");
        if (!r.ok) {
          setLoading(false);
          return;
        }
        const json: RetomadaResponse = await r.json();
        if (cancelled) return;
        setData(json);
        setDismissed(isDismissed(json.previousLoginAt));
      } catch (err) {
        console.error("[retomada] erro ao buscar:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    setDismissed(true);
  }

  // Estados de não-render: loading silencioso, sem dados, dispensado, ou
  // backend disse pra esconder
  if (loading) return null;
  if (!data) return null;
  if (!data.showCard) return null;
  if (dismissed) return null;

  const { critico, suasCoisas, geral } = data.buckets;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Desde sua última visita
            </h2>
            {data.totalCount > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                {data.totalCount} {data.totalCount === 1 ? "novidade" : "novidades"}
              </span>
            )}
          </div>
          {data.windowLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Há <span className="font-medium text-gray-700 dark:text-gray-300">{data.windowLabel}</span>
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Marcar como visto — esconde o card até o próximo login"
        >
          <Check className="w-4 h-4" />
        </button>
      </header>

      <div className="p-5 space-y-4">
        {/* 🔴 Crítico */}
        {critico.length > 0 && (
          <Bucket
            tone="red"
            icon={<AlertCircle className="w-4 h-4" />}
            label="Crítico — precisa da sua ação"
            items={critico}
            initiallyOpen
          />
        )}

        {/* 🟠 Suas coisas */}
        {suasCoisas.length > 0 && (
          <Bucket
            tone="orange"
            icon={<Sparkles className="w-4 h-4" />}
            label="Suas coisas"
            items={suasCoisas}
            initiallyOpen
          />
        )}

        {/* ⚪ Geral — colapsado por padrão (decisão #1) */}
        {geral.length > 0 && (
          <div>
            <button
              onClick={() => setGeralOpen(!geralOpen)}
              className="w-full flex items-center gap-2 mb-2 select-none hover:opacity-80 transition-opacity"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <Building2 className="w-3 h-3" />
              </span>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Geral — resto da organização
              </h3>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                {geral.length}
              </span>
              {geralOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
            {geralOpen && (
              <ul className="space-y-1.5 pl-7 pt-1">
                {geral.map((it, i) => (
                  <li key={i}>
                    <Link
                      href={it.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 group"
                    >
                      <span className="text-gray-400">•</span>
                      <span className="group-hover:underline" dangerouslySetInnerHTML={{ __html: highlightItem(it.label) }} />
                      <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                        {it.whenLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

interface BucketProps {
  tone: "red" | "orange";
  icon: React.ReactNode;
  label: string;
  items: RetomadaItem[];
  initiallyOpen?: boolean;
}

function Bucket({ tone, icon, label, items }: BucketProps) {
  const colors = {
    red: {
      iconBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      heading: "text-red-700 dark:text-red-300",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      hover: "hover:text-red-700 dark:hover:text-red-300",
      pulse: "animate-pulse",
    },
    orange: {
      iconBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
      heading: "text-orange-700 dark:text-orange-300",
      badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
      hover: "hover:text-orange-700 dark:hover:text-orange-300",
      pulse: "",
    },
  }[tone];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${colors.iconBg} ${colors.pulse}`}>
          {icon}
        </span>
        <h3 className={`text-sm font-semibold ${colors.heading}`}>{label}</h3>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${colors.badge} font-medium`}>
          {items.length}
        </span>
      </div>
      <ul className="space-y-1.5 pl-7">
        {items.map((it, i) => (
          <li key={i}>
            <Link
              href={it.href}
              className={`text-sm text-gray-700 dark:text-gray-300 ${colors.hover} flex items-start gap-2 group`}
            >
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="flex-1">
                <span className="group-hover:underline" dangerouslySetInnerHTML={{ __html: highlightItem(it.label) }} />
                {it.detail && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {it.detail}
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{it.whenLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Destaca trechos entre aspas duplas em <strong> pra dar peso visual
 * a nomes de entidades (RIPD "X", Política "Y").
 */
function highlightItem(text: string): string {
  // Escape básico de HTML antes de processar (XSS hardening)
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/&quot;([^&]+?)&quot;/g, '<strong>"$1"</strong>')
                .replace(/"([^"]+)"/g, '<strong>"$1"</strong>');
}
