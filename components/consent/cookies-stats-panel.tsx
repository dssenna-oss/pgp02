"use client";

/**
 * Painel de estatísticas do Sistema de Cookies (CP26).
 *
 * Lê `/api/cookies/stats` e renderiza KPIs + evolução mensal + lista dos
 * 10 últimos consentimentos. Não permite editar — é só visão consolidada
 * pro DPO ter painel único ao lado dos Termos de Consentimento.
 *
 * Aceitação de cookies analytics/marketing/preferences é coletada pelo
 * banner público (não há fluxo DPO pra "criar consentimento"). Toda
 * mudança vem do titular pela URL pública.
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Cookie,
  ShieldCheck,
  ShieldX,
  BarChart3,
  Loader2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ByMonth {
  ym: string;
  created: number;
  revoked: number;
}

interface LatestRow {
  id: string;
  createdAt: string;
  revokedAt: string | null;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentMethod: string;
}

interface StatsResponse {
  total: number;
  active: number;
  revoked: number;
  analyticsRate: number;
  marketingRate: number;
  preferencesRate: number;
  byMonth: ByMonth[];
  latest: LatestRow[];
}

export default function CookiesStatsPanel() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/cookies/stats", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Erro");
        if (!cancelled) setData(j);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Erro ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxBar = useMemo(() => {
    if (!data) return 0;
    return Math.max(1, ...data.byMonth.map((m) => Math.max(m.created, m.revoked)));
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Carregando estatísticas...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <Cookie className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Sem dados disponíveis.</p>
      </div>
    );
  }

  const hasData = data.total > 0;

  return (
    <div className="space-y-5">
      {/* Cabeçalho contextual — explica de onde vem o dado */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <Cookie className="h-4 w-4 inline mr-1 -mt-0.5" />
        Consentimentos coletados pelo <strong>banner público de cookies</strong> (Checkpoint 26).
        Diferente dos Termos do titular (Art. 8º), aqui é o consentimento granular
        de Analytics/Marketing/Preferências previsto na Resolução CD/ANPD 2/2022.
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Total coletados"
          value={data.total}
          tone="slate"
        />
        <KpiCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Ativos"
          value={data.active}
          tone="emerald"
        />
        <KpiCard
          icon={<ShieldX className="h-4 w-4" />}
          label="Revogados"
          value={data.revoked}
          tone="amber"
        />
      </div>

      {/* Distribuição por categoria (% dos ativos) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          Aceitação por categoria
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          % dos consentimentos ATIVOS que aceitou cada tipo de cookie opcional.
          {data.active === 0 && " Nenhum consentimento ativo ainda."}
        </p>
        <div className="space-y-2.5">
          <RateBar label="Analytics (métricas de uso)" rate={data.analyticsRate} color="blue" />
          <RateBar label="Marketing (remarketing, pixels)" rate={data.marketingRate} color="pink" />
          <RateBar label="Preferências (tema, idioma, layout)" rate={data.preferencesRate} color="violet" />
        </div>
      </div>

      {/* Evolução mensal */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          Evolução nos últimos 12 meses
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Verde = novos consentimentos · Âmbar = revogações no mês.
        </p>
        {!hasData ? (
          <div className="text-center py-6 text-xs text-gray-500 italic">
            Sem dados pra mostrar — banner ainda não coletou consentimentos.
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {data.byMonth.map((m) => {
              const hCreated = (m.created / maxBar) * 100;
              const hRevoked = (m.revoked / maxBar) * 100;
              return (
                <div
                  key={m.ym}
                  className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  title={`${m.ym} · ${m.created} novos · ${m.revoked} revogações`}
                >
                  <div className="w-full flex items-end gap-0.5 h-24">
                    <div
                      className="flex-1 bg-emerald-500 rounded-t min-w-0"
                      style={{ height: `${hCreated}%`, minHeight: m.created > 0 ? "2px" : 0 }}
                    />
                    <div
                      className="flex-1 bg-amber-500 rounded-t min-w-0"
                      style={{ height: `${hRevoked}%`, minHeight: m.revoked > 0 ? "2px" : 0 }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 leading-tight font-mono">
                    {m.ym.slice(5)}/{m.ym.slice(2, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Últimos consentimentos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Últimos 10 consentimentos
          </h3>
          <span className="text-xs text-gray-500">{data.latest.length} mostrados</span>
        </div>
        {data.latest.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 italic">
            <Inbox className="h-6 w-6 text-gray-300 mx-auto mb-2" />
            Nenhum consentimento coletado ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Data</th>
                <th className="text-left px-3 py-2 font-semibold">Origem</th>
                <th className="text-center px-2 py-2 font-semibold">Analytics</th>
                <th className="text-center px-2 py-2 font-semibold">Marketing</th>
                <th className="text-center px-2 py-2 font-semibold">Preferências</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.latest.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {r.consentMethod}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Checkmark on={r.analytics} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Checkmark on={r.marketing} />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Checkmark on={r.preferences} />
                  </td>
                  <td className="px-3 py-2">
                    {r.revokedAt ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                        Revogado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                        Ativo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber";
}) {
  const border: Record<typeof tone, string> = {
    slate: "border-gray-200 dark:border-gray-700",
    emerald: "border-emerald-200 dark:border-emerald-900",
    amber: "border-amber-200 dark:border-amber-900",
  };
  const valueCls: Record<typeof tone, string> = {
    slate: "text-gray-900 dark:text-gray-100",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-3 border", border[tone])}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </div>
      <div className={cn("text-2xl font-bold mt-0.5", valueCls[tone])}>{value}</div>
    </div>
  );
}

function RateBar({
  label,
  rate,
  color,
}: {
  label: string;
  rate: number;
  color: "blue" | "pink" | "violet";
}) {
  const bg: Record<typeof color, string> = {
    blue: "bg-blue-500",
    pink: "bg-pink-500",
    violet: "bg-violet-500",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{rate}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-900/40 rounded-full overflow-hidden">
        <div
          className={cn("h-2 rounded-full transition-all", bg[color])}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}

function Checkmark({ on }: { on: boolean }) {
  return on ? (
    <span className="text-emerald-600 font-bold">✓</span>
  ) : (
    <span className="text-gray-300">—</span>
  );
}
