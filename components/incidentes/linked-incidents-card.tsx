"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Card compacto que mostra "X incidentes envolveram este [recurso]"
 * com lista clicável dos incidentes vinculados.
 *
 * D2 (2026-05-10) — caminho inverso da M:N que já existia entre
 * IncidentDataInventory / IncidentOperator. Plugar em:
 *   - Inventário detail (analise-riscos page do processo)
 *   - Operador detail (terceiros/[id])
 *
 * Apenas DPO vê. Se o user não for DPO, retorna null silenciosamente
 * (a API já bloqueia com 403, então fetch falha; tratamos isso).
 */
interface IncidentSummary {
  id: string;
  title: string;
  detectedAt: string;
  severity: string;
  status: string;
}

interface Props {
  /** Filtro: passar APENAS UM dos dois IDs */
  inventoryId?: string;
  operatorId?: string;
  /** Tom do banner — "process" pra inventário, "operator" pra terceiro. */
  context: "process" | "operator";
}

const SEVERITY_LABEL: Record<string, string> = {
  ALTO: "Alto",
  MEDIO: "Médio",
  BAIXO: "Baixo",
};

const SEVERITY_CLS: Record<string, string> = {
  ALTO: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800",
  MEDIO: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
  BAIXO:
    "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
};

const STATUS_LABEL: Record<string, string> = {
  DETECTADO: "Detectado",
  EM_AVALIACAO: "Em avaliação",
  EM_RESPOSTA: "Em resposta",
  ENCERRADO: "Encerrado",
  FALSO_POSITIVO: "Falso positivo",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LinkedIncidentsCard({
  inventoryId,
  operatorId,
  context,
}: Props) {
  const [incidents, setIncidents] = useState<IncidentSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!inventoryId && !operatorId) {
        setLoading(false);
        return;
      }
      try {
        const param = inventoryId
          ? `inventoryId=${inventoryId}`
          : `operatorId=${operatorId}`;
        const r = await fetch(`/api/incidents?${param}`);
        if (!r.ok) {
          // 403 = user não é DPO. Silencia (return null).
          setIncidents([]);
          return;
        }
        const j = await r.json();
        setIncidents((j.items ?? []) as IncidentSummary[]);
      } catch {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [inventoryId, operatorId]);

  // Não renderiza nada enquanto carrega ou se não há incidentes (mantém
  // a UI limpa — só aparece quando tem informação útil).
  if (loading) return null;
  if (!incidents || incidents.length === 0) return null;

  const contextLabel =
    context === "process" ? "este processo" : "este operador";
  const headerColor =
    context === "process"
      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
      : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";

  return (
    <Card
      className={cn("border-l-4 border-l-red-500 dark:border-l-red-700", headerColor)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {incidents.length}{" "}
              {incidents.length === 1 ? "incidente envolveu" : "incidentes envolveram"}{" "}
              {contextLabel}
            </h3>
          </div>
          <Link
            href="/dashboard/incidentes"
            className="text-xs text-red-700 dark:text-red-300 hover:underline inline-flex items-center gap-1"
          >
            Ver todos os incidentes
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="space-y-1.5">
          {incidents.slice(0, 5).map((inc) => (
            <li key={inc.id}>
              <Link
                href={`/dashboard/incidentes/${inc.id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-red-400 dark:hover:border-red-700 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-red-700 dark:group-hover:text-red-300">
                    {inc.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Detectado em {fmtDate(inc.detectedAt)} ·{" "}
                    {STATUS_LABEL[inc.status] ?? inc.status}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs flex-shrink-0", SEVERITY_CLS[inc.severity] ?? "")}
                >
                  {SEVERITY_LABEL[inc.severity] ?? inc.severity}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
        {incidents.length > 5 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
            + {incidents.length - 5} incidente(s) adicional(is) — veja todos na lista de Incidentes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
