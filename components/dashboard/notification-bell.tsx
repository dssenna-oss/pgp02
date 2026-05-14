"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, AlertCircle, FileCheck2, Handshake, ClipboardList, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { onSidebarRefresh } from "@/lib/sidebar-events";
import { useAdaptivePolling } from "@/lib/use-adaptive-polling";

/**
 * Sino de notificações agregadas (Checkpoint 16 / H).
 *
 * Agrega contadores críticos de:
 *   - Incidentes em prazo crítico (Art. 48 LGPD · 72h ANPD)
 *   - RIPDs aguardando revisão (DPO)
 *   - Operadores com pendências (régua ANPD)
 *
 * Estado visível: vermelho pulsante quando incidentes críticos > 0,
 * âmbar quando há outros pendentes, cinza quando zero.
 *
 * Polling 60s + refresh imediato via notifySidebarRefresh().
 */
export default function NotificationBell() {
  const [counts, setCounts] = useState<{
    incidents: number;
    ripds: number;
    operators: number;
    inventarios: number;
  }>({ incidents: 0, ripds: 0, operators: 0, inventarios: 0 });
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const [rInc, rRipd, rOp, rInv] = await Promise.all([
          fetch("/api/incidents/pending-count").catch(() => null),
          fetch("/api/ripd/pending-count").catch(() => null),
          fetch("/api/operadores/pending-count").catch(() => null),
          fetch("/api/inventario/pending-count").catch(() => null),
        ]);
        if (canceled) return;
        const inc = rInc?.ok ? (await rInc.json()).count ?? 0 : 0;
        const ripd = rRipd?.ok ? (await rRipd.json()).count ?? 0 : 0;
        const op = rOp?.ok ? (await rOp.json()).count ?? 0 : 0;
        const inv = rInv?.ok ? (await rInv.json()).count ?? 0 : 0;
        setCounts({ incidents: inc, ripds: ripd, operators: op, inventarios: inv });
      } catch {
        // silencioso
      }
    }

    load();
    loadRef.current = load;
    // Refresh imediato quando outras telas disparam notifySidebarRefresh()
    const offRefresh = onSidebarRefresh(load);
    return () => {
      canceled = true;
      loadRef.current = null;
      offRefresh();
    };
  }, []);

  // Polling adaptativo (substitui setInterval fixo de 60s).
  // 30s ativo · 60s sem foco · pausa quando a aba some.
  useAdaptivePolling(() => loadRef.current?.(), {
    activeMs: 30_000,
    inactiveMs: 60_000,
    refetchOnFocus: true,
  });

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const total =
    counts.incidents + counts.ripds + counts.operators + counts.inventarios;
  const hasCritical = counts.incidents > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          total > 0
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400",
        )}
        title={total === 0 ? "Sem notificações" : `${total} pendência(s)`}
        aria-label="Notificações"
      >
        <Bell
          className={cn(
            "h-5 w-5",
            hasCritical && "animate-pulse",
          )}
        />
        {total > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold text-white",
              hasCritical
                ? "bg-red-600 animate-pulse"
                : "bg-amber-500",
            )}
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[60]">
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Notificações
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y dark:divide-gray-700 max-h-96 overflow-y-auto">
            <NotificationItem
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              title="Incidentes em prazo crítico"
              count={counts.incidents}
              description="Severidade ALTO/MEDIO sem comunicação à ANPD em até 24h ou já vencido"
              href="/dashboard/incidentes"
              critical
              onClick={() => setOpen(false)}
            />
            <NotificationItem
              icon={<FileCheck2 className="h-5 w-5 text-blue-600" />}
              title="RIPDs aguardando revisão"
              count={counts.ripds}
              description="Relatórios enviados pelo Contribuidor pra aprovação do DPO"
              href="/dashboard/ripd"
              onClick={() => setOpen(false)}
            />
            <NotificationItem
              icon={<ClipboardList className="h-5 w-5 text-blue-600" />}
              title="Inventários aguardando revisão"
              count={counts.inventarios}
              description="Mapeamentos submetidos pelo Contribuidor (ou devolvidos pra ajuste)"
              href="/dashboard/inventario"
              onClick={() => setOpen(false)}
            />
            <NotificationItem
              icon={<Handshake className="h-5 w-5 text-amber-600" />}
              title="Operadores com pendências"
              count={counts.operators}
              description="Contratos vencidos, sem cláusulas LGPD ou em processo de adequação"
              href="/dashboard/terceiros"
              onClick={() => setOpen(false)}
            />
          </div>
          {total === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Tudo em dia. ✨
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  icon,
  title,
  count,
  description,
  href,
  critical,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  description: string;
  href: string;
  critical?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
        count === 0 && "opacity-50",
      )}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h4>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              count === 0
                ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                : critical
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
            )}
          >
            {count}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
    </Link>
  );
}
