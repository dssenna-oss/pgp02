"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Camera,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GAP_DOMAINS } from "@/lib/gap-catalog";
import {
  type GapAnswerDTO,
  type GapStats,
  gapMapeamentoLabel,
  gapAderenciaLabel,
  gapMapeamentoBadgeClass,
  gapAderenciaBadgeClass,
} from "@/lib/gap-helpers";

interface SnapshotPayload {
  answers: GapAnswerDTO[];
  stats: GapStats;
  generatedAt: string;
  generatedBy: { id: string; name: string | null; email: string };
}

interface SnapshotResp {
  snapshot: {
    id: string;
    label: string;
    notes: string | null;
    createdAt: string;
    payload: SnapshotPayload;
    createdBy: { name: string | null; email: string } | null;
  };
}

interface Props {
  snapshotId: string;
}

export default function GapSnapshotDetail({ snapshotId }: Props) {
  const [data, setData] = useState<SnapshotResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/gap/snapshot/${snapshotId}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error ?? "Erro ao carregar snapshot");
        return;
      }
      setData(await r.json());
    })();
  }, [snapshotId]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center space-y-4">
        <p className="text-red-600">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/gap-analysis">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar pro GAP
          </Link>
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-gray-500">
        Carregando snapshot...
      </div>
    );
  }

  const { snapshot } = data;
  const { stats, answers, generatedAt, generatedBy } = snapshot.payload;
  const answersByCode = new Map(answers.map((a) => [a.controlCode, a]));
  const pctAnswered = Math.round((stats.answered / stats.total) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href="/dashboard/gap-analysis">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5 mt-1">
          <Camera className="h-7 w-7 text-gray-600 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {snapshot.label}
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] bg-gray-100 dark:bg-gray-800"
            >
              <Lock className="h-2.5 w-2.5 mr-1" />
              Somente leitura
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Capturado em{" "}
            {new Date(generatedAt).toLocaleString("pt-BR")} por{" "}
            {generatedBy.name ?? generatedBy.email}
          </p>
          {snapshot.notes && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">
              "{snapshot.notes}"
            </p>
          )}
        </div>
      </div>

      {/* KPIs do snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SimpleStat
          icon={<ClipboardList className="h-5 w-5" />}
          label="Respondidos"
          value={`${stats.answered} / ${stats.total}`}
          extra={`${pctAnswered}%`}
        />
        <SimpleStat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Confirmados pelo DPO"
          value={stats.confirmed}
        />
        <SimpleStat
          icon={<Clock className="h-5 w-5" />}
          label="Em andamento"
          value={stats.byMapeamento.EM_ANDAMENTO}
        />
        <SimpleStat
          icon={<AlertCircle className="h-5 w-5" />}
          label="Não aderentes"
          value={stats.byAderencia.NAO_ADERENTE}
        />
      </div>

      {/* Lista de respostas por domínio */}
      <div className="space-y-4">
        {GAP_DOMAINS.map((dom) => {
          const ds = stats.byDomain.find((d) => d.domainCode === dom.code);
          if (!ds || ds.answered === 0) return null;
          const ctrlsAnswered = dom.controls.filter((c) =>
            answersByCode.has(c.code),
          );
          return (
            <Card key={dom.code}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {dom.name}
                  </h2>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {ds.answered} / {ds.total} respondidos
                  </Badge>
                </div>
                <div className="space-y-2">
                  {ctrlsAnswered.map((ctrl) => {
                    const a = answersByCode.get(ctrl.code)!;
                    return (
                      <div
                        key={ctrl.code}
                        className="border-l-2 border-gray-200 dark:border-gray-800 pl-3 py-1 space-y-1"
                      >
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-mono text-[10px] text-gray-500 mr-1.5">
                            #{ctrl.code}
                          </span>
                          {ctrl.question}
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {a.mapeamento && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0",
                                gapMapeamentoBadgeClass(a.mapeamento),
                              )}
                            >
                              {gapMapeamentoLabel(a.mapeamento)}
                            </Badge>
                          )}
                          {a.aderencia && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0",
                                gapAderenciaBadgeClass(a.aderencia),
                              )}
                            >
                              {gapAderenciaLabel(a.aderencia)}
                            </Badge>
                          )}
                          {a.autoSuggested && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                            >
                              Sugestão automática
                            </Badge>
                          )}
                        </div>
                        {a.cenarioAtual && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            <span className="font-medium">Cenário:</span>{" "}
                            {a.cenarioAtual}
                          </p>
                        )}
                        {a.pontoMelhoria && (
                          <p className="text-xs text-amber-800 dark:text-amber-300 whitespace-pre-line">
                            <span className="font-medium">Melhoria:</span>{" "}
                            {a.pontoMelhoria}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {stats.answered === 0 && (
          <p className="text-center py-12 text-sm text-gray-500 italic">
            Esse snapshot foi tirado quando o GAP estava 100% vazio.
          </p>
        )}
      </div>
    </div>
  );
}

function SimpleStat({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  extra?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
          {extra && <p className="text-[11px] text-gray-500">{extra}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
