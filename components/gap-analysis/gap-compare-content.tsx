"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  GitCompareArrows,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import {
  type DiffChangeType,
  type GapDiff,
  changeTypeLabel,
  changeTypeBadgeClass,
} from "@/lib/gap-compare";
import { gapAderenciaLabel, gapMapeamentoLabel } from "@/lib/gap-helpers";

interface SnapshotSummary {
  id: string;
  label: string;
  createdAt: string;
}

interface CompareResponse {
  a: { ref: string; label: string; generatedAt: string | null };
  b: { ref: string; label: string; generatedAt: string | null };
  diff: GapDiff;
}

interface Props {
  initialA: string | null;
  initialB: string;
}

const TYPE_ICON: Record<DiffChangeType, React.ReactNode> = {
  IMPROVED: <TrendingUp className="h-3 w-3 mr-1" />,
  WORSENED: <TrendingDown className="h-3 w-3 mr-1" />,
  CHANGED:  <Edit className="h-3 w-3 mr-1" />,
  NEW:      <Plus className="h-3 w-3 mr-1" />,
  REMOVED:  <Minus className="h-3 w-3 mr-1" />,
};

export default function GapCompareContent({ initialA, initialB }: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [a, setA] = useState<string | null>(initialA);
  const [b, setB] = useState<string>(initialB);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<DiffChangeType | "ALL">("ALL");

  // Carrega snapshots disponíveis pra preencher os dropdowns
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/gap/snapshot", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setSnapshots(j.snapshots ?? []);
        // Se A não foi pré-selecionado e há snapshots, usa o mais antigo
        // como default (faz sentido comparar "primeiro snapshot" vs "atual")
        if (!a && j.snapshots && j.snapshots.length > 0) {
          const oldest = [...j.snapshots].sort((x: any, y: any) =>
            x.createdAt.localeCompare(y.createdAt),
          )[0];
          setA(oldest.id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sempre que A ou B mudar, refaz o diff
  useEffect(() => {
    if (!a || !b) return;
    if (a === b) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/gap/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => setData(j))
      .catch(async (r) => {
        const msg = r?.json ? (await r.json().catch(() => ({})))?.error : "Erro";
        toast.error(msg ?? "Erro ao comparar");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [a, b]);

  const visibleChanges = useMemo(() => {
    if (!data) return [];
    if (filterType === "ALL") return data.diff.changes;
    return data.diff.changes.filter((c) => c.type === filterType);
  }, [data, filterType]);

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
        <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5 mt-1">
          <GitCompareArrows className="h-7 w-7 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparar versões do GAP
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Veja o que mudou entre 2 momentos do GAP — qualquer combinação
            de snapshots ou estado atual.
          </p>
        </div>
      </div>

      {/* Seletores A vs B */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Versão A (antes)
            </label>
            <Select value={a ?? ""} onValueChange={setA}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atual">Estado atual</SelectItem>
                {snapshots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} ({new Date(s.createdAt).toLocaleDateString("pt-BR")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center text-gray-500 pb-2">
            <ArrowRight className="h-5 w-5 mx-auto" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Versão B (depois)
            </label>
            <Select value={b} onValueChange={setB}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atual">Estado atual</SelectItem>
                {snapshots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label} ({new Date(s.createdAt).toLocaleDateString("pt-BR")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estados de loading/empty */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Comparando...
        </div>
      )}
      {!loading && !data && a === b && a && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-gray-500">
            Escolha duas versões diferentes pra comparar.
          </CardContent>
        </Card>
      )}
      {!loading && !data && (!a || !b) && snapshots.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              Você ainda não tem snapshots salvos.
            </p>
            <p className="text-sm text-gray-500">
              Volte pro GAP, clique em <strong>Histórico</strong>, salve um
              snapshot e depois volte aqui.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/gap-analysis">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar pro GAP
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {!loading && data && (
        <>
          {/* Hero — comparação de scores */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <ScoreBlock
                  title={data.a.label}
                  score={data.diff.scoreA}
                  answered={data.diff.answeredA}
                  date={data.a.generatedAt}
                />
                <DeltaArrow delta={data.diff.scoreDelta} />
                <ScoreBlock
                  title={data.b.label}
                  score={data.diff.scoreB}
                  answered={data.diff.answeredB}
                  date={data.b.generatedAt}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <CountPill type="IMPROVED" value={data.diff.counts.improved} />
                <CountPill type="WORSENED" value={data.diff.counts.worsened} />
                <CountPill type="CHANGED" value={data.diff.counts.changed} />
                <CountPill type="NEW" value={data.diff.counts.added} />
                <CountPill type="REMOVED" value={data.diff.counts.removed} />
                <div className="rounded-md border p-2 text-center bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
                  <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {data.diff.counts.unchanged}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-500">
                    Inalterados
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros + lista de mudanças */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mudanças entre as versões
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {data.diff.changes.length}
                </Badge>
              </h2>
              <div className="flex gap-1.5 flex-wrap">
                <FilterChip
                  active={filterType === "ALL"}
                  onClick={() => setFilterType("ALL")}
                >
                  Todas
                </FilterChip>
                {(["IMPROVED", "WORSENED", "CHANGED", "NEW", "REMOVED"] as const).map((t) => {
                  const count = countByType(data.diff, t);
                  if (count === 0) return null;
                  return (
                    <FilterChip
                      key={t}
                      active={filterType === t}
                      onClick={() => setFilterType(t)}
                    >
                      {changeTypeLabel(t)} {count}
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            {data.diff.changes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-sm text-gray-600 dark:text-gray-400">
                  Nenhuma mudança entre essas versões.
                </CardContent>
              </Card>
            ) : visibleChanges.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-sm text-gray-500">
                  Sem mudanças do tipo "{changeTypeLabel(filterType as DiffChangeType)}".
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="text-left p-2 w-32">Tipo</th>
                      <th className="text-left p-2 w-20">Controle</th>
                      <th className="text-left p-2">Pergunta / Domínio</th>
                      <th className="text-left p-2 w-1/4">Versão A</th>
                      <th className="text-left p-2 w-1/4">Versão B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleChanges.map((c) => (
                      <tr
                        key={c.controlCode}
                        className="border-t dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                      >
                        <td className="p-2 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              changeTypeBadgeClass(c.type),
                            )}
                          >
                            {TYPE_ICON[c.type]}
                            {changeTypeLabel(c.type)}
                          </Badge>
                        </td>
                        <td className="p-2 align-top">
                          <span className="font-mono text-[10px] text-gray-500">
                            #{c.controlCode}
                          </span>
                        </td>
                        <td className="p-2 align-top text-xs">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {c.question.slice(0, 100)}
                            {c.question.length > 100 ? "…" : ""}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {c.domain}
                          </div>
                        </td>
                        <td className="p-2 align-top">
                          <AnswerSnippet a={c.from} />
                        </td>
                        <td className="p-2 align-top">
                          <AnswerSnippet a={c.to} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function countByType(diff: GapDiff, t: DiffChangeType): number {
  switch (t) {
    case "IMPROVED": return diff.counts.improved;
    case "WORSENED": return diff.counts.worsened;
    case "CHANGED":  return diff.counts.changed;
    case "NEW":      return diff.counts.added;
    case "REMOVED":  return diff.counts.removed;
  }
}

// ============================================================
// Sub-componentes
// ============================================================

function ScoreBlock({
  title,
  score,
  answered,
  date,
}: {
  title: string;
  score: number | null;
  answered: number;
  date: string | null;
}) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </div>
      <div className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white">
        {score == null ? "—" : score}
        {score != null && (
          <span className="text-xl font-normal text-gray-500">/100</span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {answered} controle(s) respondido(s)
      </div>
      {date && (
        <div className="text-[10px] text-gray-400 mt-0.5">
          {new Date(date).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}

function DeltaArrow({ delta }: { delta: number | null }) {
  if (delta == null) {
    return (
      <div className="text-center">
        <ArrowRight className="h-6 w-6 text-gray-400 mx-auto" />
        <div className="text-[10px] text-gray-400">delta</div>
      </div>
    );
  }
  const isUp = delta > 0;
  const isDown = delta < 0;
  return (
    <div className="text-center">
      <div
        className={cn(
          "text-2xl font-bold",
          isUp && "text-emerald-600 dark:text-emerald-400",
          isDown && "text-red-600 dark:text-red-400",
          delta === 0 && "text-gray-500",
        )}
      >
        {delta > 0 ? "+" : ""}
        {delta}
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">
        delta
      </div>
    </div>
  );
}

function CountPill({
  type,
  value,
}: {
  type: DiffChangeType;
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-2 text-center",
        changeTypeBadgeClass(type),
      )}
    >
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide font-medium">
        {changeTypeLabel(type)}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      onClick={onClick}
      className={cn(
        "cursor-pointer px-2.5 py-1 text-xs whitespace-nowrap",
        active
          ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
          : "hover:bg-gray-100 dark:hover:bg-gray-800",
      )}
    >
      {children}
    </Badge>
  );
}

function AnswerSnippet({ a }: { a: import("@/lib/gap-compare").CompareAnswer | null }) {
  if (!a) {
    return <span className="text-[10px] text-gray-400 italic">—</span>;
  }
  return (
    <div className="space-y-1 text-[11px]">
      {a.aderencia && (
        <div>
          <span className="text-gray-500">Aderência:</span>{" "}
          <strong>{gapAderenciaLabel(a.aderencia)}</strong>
        </div>
      )}
      {a.mapeamento && (
        <div>
          <span className="text-gray-500">Mapeamento:</span>{" "}
          <strong>{gapMapeamentoLabel(a.mapeamento)}</strong>
        </div>
      )}
      {a.cenarioAtual && (
        <div className="text-gray-700 dark:text-gray-300 line-clamp-2">
          {a.cenarioAtual}
        </div>
      )}
      {a.pontoMelhoria && (
        <div className="text-amber-700 dark:text-amber-300 line-clamp-2">
          PM: {a.pontoMelhoria}
        </div>
      )}
    </div>
  );
}
