/**
 * UI da timeline "Minha atividade".
 *
 * Decisões:
 *  · 3C: filtros por TIPO de ação + por ENTIDADE (chips toggláveis)
 *  · 4A: agrupado por dia (cabeçalho "Hoje", "Ontem", "Sábado — 03/05")
 *  · 5A: item compacto — ícone + frase + tempo + link
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Plus,
  Edit3,
  CheckCircle2,
  Send,
  Lock,
  Eye,
  ListChecks,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { format, formatDistanceToNow, isSameDay, isYesterday, isThisYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ENTITY_GROUPS,
  ENTITY_LABEL,
  groupByDay,
  type ActivityActionType,
  type ActivityEntityType,
  type ActivityEvent,
} from "@/lib/atividade-helpers";

/** Mapa ação → ícone + verbo PT-BR + cor. */
const ACTION_META: Record<
  ActivityActionType,
  { icon: typeof Plus; verb: string; color: string }
> = {
  criou: { icon: Plus, verb: "Criou", color: "text-emerald-600 dark:text-emerald-400" },
  editou: { icon: Edit3, verb: "Editou", color: "text-blue-600 dark:text-blue-400" },
  revisou: { icon: Eye, verb: "Revisou", color: "text-blue-600 dark:text-blue-400" },
  aprovou: { icon: CheckCircle2, verb: "Aprovou", color: "text-emerald-700 dark:text-emerald-400" },
  publicou: { icon: Send, verb: "Publicou", color: "text-violet-600 dark:text-violet-400" },
  encerrou: { icon: Lock, verb: "Encerrou", color: "text-slate-600 dark:text-slate-400" },
  enviou: { icon: Send, verb: "Enviou", color: "text-amber-600 dark:text-amber-400" },
  respondeu: { icon: ListChecks, verb: "Respondeu", color: "text-blue-600 dark:text-blue-400" },
};

const ACTIONS_FILTRO: ActivityActionType[] = [
  "criou",
  "editou",
  "revisou",
  "aprovou",
  "publicou",
  "encerrou",
  "enviou",
  "respondeu",
];

interface Props {
  initialEvents: ActivityEvent[];
  userName: string;
}

export function AtividadeContent({ initialEvents, userName }: Props) {
  const [activeActions, setActiveActions] = useState<Set<ActivityActionType>>(
    new Set()
  );
  const [activeGroups, setActiveGroups] = useState<Set<string>>(new Set());

  /** Eventos filtrados pelas seleções atuais. */
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((ev) => {
      if (activeActions.size > 0 && !activeActions.has(ev.action)) {
        return false;
      }
      if (activeGroups.size > 0) {
        const groupOfEv = ENTITY_GROUPS.find((g) =>
          g.key.includes(ev.entityType as ActivityEntityType)
        );
        if (!groupOfEv || !activeGroups.has(groupOfEv.label)) {
          return false;
        }
      }
      return true;
    });
  }, [initialEvents, activeActions, activeGroups]);

  const grouped = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

  function toggleAction(a: ActivityActionType) {
    setActiveActions((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  function toggleGroup(label: string) {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function clearFilters() {
    setActiveActions(new Set());
    setActiveGroups(new Set());
  }

  const hasFilters = activeActions.size > 0 || activeGroups.size > 0;
  const totalEvents = initialEvents.length;
  const filteredCount = filteredEvents.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Minha atividade
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tudo que {userName === "você" ? "você fez" : `${userName} fez`} nos últimos 30 dias —{" "}
          {totalEvents > 0
            ? `${totalEvents} ${totalEvents === 1 ? "ação registrada" : "ações registradas"}`
            : "nenhuma ação registrada ainda"}
          .
        </p>
      </div>

      {/* Filtros */}
      {totalEvents > 0 && (
        <Card className="p-4 space-y-4">
          {/* Filtro por tipo de ação */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Filtrar por tipo de ação
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS_FILTRO.map((a) => {
                const meta = ACTION_META[a];
                const Icon = meta.icon;
                const active = activeActions.has(a);
                return (
                  <button
                    key={a}
                    onClick={() => toggleAction(a)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {meta.verb}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por entidade */}
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Filtrar por área
            </div>
            <div className="flex flex-wrap gap-2">
              {ENTITY_GROUPS.map((g) => {
                const active = activeGroups.has(g.label);
                return (
                  <button
                    key={g.label}
                    onClick={() => toggleGroup(g.label)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {filteredCount === 0
                  ? "Nenhum evento bate com os filtros"
                  : `Mostrando ${filteredCount} de ${totalEvents}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      {totalEvents === 0 ? (
        <Card className="p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Nada por aqui ainda
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Quando você criar inventários, riscos, políticas, RIPDs ou outros
            documentos, suas ações vão aparecer aqui em ordem cronológica.
          </p>
        </Card>
      ) : filteredCount === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum evento bate com os filtros aplicados.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.dayKey}>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 -mx-1 px-1 z-10">
                {labelOfDay(group.date)}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  · {group.events.length}{" "}
                  {group.events.length === 1 ? "ação" : "ações"}
                </span>
              </h2>
              <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-2 pl-4 space-y-2">
                {group.events.map((ev) => (
                  <ActivityItem key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Item compacto da timeline. */
function ActivityItem({ event }: { event: ActivityEvent }) {
  const meta = ACTION_META[event.action];
  const Icon = meta.icon;
  const date = new Date(event.timestamp);
  const time = format(date, "HH:mm", { locale: ptBR });
  const relative = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  const entityLabel = ENTITY_LABEL[event.entityType];

  return (
    <Link
      href={event.href}
      className="group flex items-start gap-3 -ml-[26px] py-2 px-2 rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
    >
      {/* Ícone na timeline */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="absolute -inset-0.5 bg-gray-50 dark:bg-gray-900 rounded-full" />
        <div className="relative h-9 w-9 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors">
          <Icon className={`h-4 w-4 ${meta.color}`} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <span className="font-medium">{meta.verb}</span>{" "}
          <Badge variant="outline" className="ml-0.5 text-[10px] py-0 px-1.5 align-middle">
            {entityLabel}
          </Badge>{" "}
          <span className="font-medium">{event.title}</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {time} · {relative}
        </div>
      </div>

      <ArrowUpRight className="flex-shrink-0 h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-2 transition-colors" />
    </Link>
  );
}

/** "Hoje", "Ontem", ou "Sábado — 03/05" / "12 jan 2026". */
function labelOfDay(date: Date): string {
  const now = new Date();
  if (isSameDay(date, now)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  if (isThisYear(date)) {
    return format(date, "EEEE — dd 'de' MMMM", { locale: ptBR });
  }
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}
