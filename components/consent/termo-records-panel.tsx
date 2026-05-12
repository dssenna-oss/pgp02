"use client";

/**
 * Painel de registros (ConsentRecord) de um Termo. Mostra:
 *   - Lista paginada de aceites com data, identificação, IP, UA truncado
 *   - Filtros: ativo / revogado / todos
 *   - Stats globais
 *
 * Por design não permite editar — registros são evidência imutável.
 * Revogação acontece via URL pública (titular) ou suporte da Ouvidoria
 * (que orientaria o titular a usar a URL).
 */

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  ListChecks,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Record {
  id: string;
  titularName: string | null;
  titularEmail: string | null;
  titularCpfMasked: string | null;
  ip: string;
  userAgent: string;
  contentChecksum: string;
  acceptedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  version: number;
}

interface Stats {
  active: number;
  revoked: number;
  total: number;
}

type FilterMode = "active" | "revoked" | "all";

export default function TermoRecordsPanel({ termId }: { termId: string }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [stats, setStats] = useState<Stats>({ active: 0, revoked: 0, total: 0 });
  const [filter, setFilter] = useState<FilterMode>("active");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/consent-terms/${termId}/records?status=${filter}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Erro");
      setRecords(j.records ?? []);
      setStats(j.stats ?? { active: 0, revoked: 0, total: 0 });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termId, filter]);

  const visibleStats = useMemo(
    () => [
      { label: "Ativos", value: stats.active, tone: "emerald" as const, icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Revogados", value: stats.revoked, tone: "amber" as const, icon: <ShieldX className="h-4 w-4" /> },
      { label: "Total", value: stats.total, tone: "slate" as const, icon: <ListChecks className="h-4 w-4" /> },
    ],
    [stats],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {visibleStats.map((s) => (
          <div
            key={s.label}
            className={cn(
              "rounded-lg p-3 border",
              s.tone === "emerald"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
                : s.tone === "amber"
                  ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
            )}
          >
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              {s.icon}
              {s.label}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(["active", "revoked", "all"] as FilterMode[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={cn(
              "px-3 py-1 text-xs rounded-md font-medium",
              filter === k
                ? "bg-violet-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
            )}
          >
            {k === "active" ? "Ativos" : k === "revoked" ? "Revogados" : "Todos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600 mx-auto mb-2" />
          Carregando registros...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          {filter === "active"
            ? "Nenhum aceite ativo ainda. Compartilhe a URL pública com os titulares."
            : filter === "revoked"
              ? "Nenhuma revogação registrada."
              : "Nenhum registro coletado."}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-semibold">Titular</th>
                <th className="text-left px-3 py-2 font-semibold">Aceito em</th>
                <th className="text-left px-3 py-2 font-semibold">Versão</th>
                <th className="text-left px-3 py-2 font-semibold">IP</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {r.titularName ?? "(sem nome)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.titularEmail ?? r.titularCpfMasked ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    {new Date(r.acceptedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                    v{r.version}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">
                    {r.ip}
                  </td>
                  <td className="px-3 py-2">
                    {r.revokedAt ? (
                      <div>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                          Revogado
                        </span>
                        <div className="text-xs text-gray-500 mt-0.5">
                          em {new Date(r.revokedAt).toLocaleDateString("pt-BR")}
                        </div>
                        {r.revocationReason && (
                          <div className="text-xs italic text-gray-500 max-w-xs truncate" title={r.revocationReason}>
                            "{r.revocationReason}"
                          </div>
                        )}
                      </div>
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
          <div className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            Mostrando {records.length} registros mais recentes · checksum SHA-256 e User-Agent
            completo disponíveis no banco para auditoria
          </div>
        </div>
      )}
    </div>
  );
}
