/**
 * Card "Continue de onde parou" (CP27 Fatia 4)
 *
 * Mostra até 3 itens não-finalizados que o user editou nos últimos 14 dias.
 * Cada card linka direto pra rota de retomada da entidade.
 *
 * Comportamento:
 *   - Se não tem itens, o componente não renderiza nada (some)
 *   - Cor da borda muda por refType (Inventário/RIPD/LIA azul · Política
 *     violeta · Incidente vermelho · Plano de Ação âmbar)
 *   - Barra de progresso aparece quando completeness != null
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, FileText, Scale, Shield, AlertTriangle, Target, BookText } from "lucide-react";

interface ContinueItem {
  id: string;
  refType: "INVENTARIO" | "RIPD" | "POLITICA" | "INCIDENTE" | "LIA" | "PLANO_ACAO";
  refId: string;
  route: string;
  label: string;
  completeness: number | null;
  openedAt: string;
  whenLabel: string;
}

interface ContinueResponse {
  items: ContinueItem[];
}

const REF_TYPE_META: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  INVENTARIO: {
    label: "Inventário de Dados",
    tone: "blue",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  RIPD: {
    label: "RIPD",
    tone: "blue",
    icon: <BookText className="w-3.5 h-3.5" />,
  },
  POLITICA: {
    label: "Política",
    tone: "violet",
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  INCIDENTE: {
    label: "Incidente",
    tone: "red",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  LIA: {
    label: "LIA",
    tone: "blue",
    icon: <Scale className="w-3.5 h-3.5" />,
  },
  PLANO_ACAO: {
    label: "Plano de Ação",
    tone: "violet",
    icon: <Target className="w-3.5 h-3.5" />,
  },
};

const TONE_COLORS: Record<string, { border: string; bg: string; text: string; bar: string }> = {
  blue: {
    border: "border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-700",
    bg: "from-blue-50/40 to-white dark:from-blue-950/20 dark:to-gray-900",
    text: "text-blue-700 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  violet: {
    border: "border-violet-100 hover:border-violet-300 dark:border-violet-900/40 dark:hover:border-violet-700",
    bg: "from-violet-50/40 to-white dark:from-violet-950/20 dark:to-gray-900",
    text: "text-violet-700 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  red: {
    border: "border-red-100 hover:border-red-300 dark:border-red-900/40 dark:hover:border-red-700",
    bg: "from-red-50/40 to-white dark:from-red-950/20 dark:to-gray-900",
    text: "text-red-700 dark:text-red-300",
    bar: "bg-red-500",
  },
};

export default function ContinueOndeParouCard() {
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const r = await fetch("/api/painel-retomada/continue");
        if (!r.ok) {
          setLoading(false);
          return;
        }
        const json: ContinueResponse = await r.json();
        if (!cancelled) setItems(json.items || []);
      } catch (err) {
        console.error("[continue-onde-parou] erro:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50/60 to-transparent dark:from-violet-950/20">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Continue de onde parou
          </h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {items.length} {items.length === 1 ? "item" : "itens"} que você não terminou
        </p>
      </header>

      <div className="p-5 space-y-3">
        {items.map((item) => {
          const meta = REF_TYPE_META[item.refType] ?? REF_TYPE_META.INVENTARIO;
          const colors = TONE_COLORS[meta.tone] ?? TONE_COLORS.blue;
          return (
            <Link
              key={item.id}
              href={item.route}
              className={`block bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-4 hover:shadow-sm transition-all group`}
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${colors.text} mb-0.5`}>
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>
                  <div className={`text-[15px] font-medium text-gray-900 dark:text-gray-100 group-hover:${colors.text} truncate`}>
                    {item.label}
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap mt-1">
                  {item.whenLabel}
                </span>
              </div>
              {item.completeness !== null && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${colors.bar} h-2 transition-[width] duration-500`}
                      style={{ width: `${item.completeness}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {item.completeness}% preenchido
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
