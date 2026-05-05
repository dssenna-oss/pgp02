"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  Activity,
  Send,
  Mail,
  MessageSquare,
  Target,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type IncidentDTO,
  commTargetLabel,
} from "@/lib/incidentes-helpers";

/**
 * Timeline visual do ciclo de vida do incidente (Checkpoint 16 / E3).
 *
 * Agrega eventos de várias fontes em ordem cronológica decrescente:
 *   - Detectado (detectedAt)
 *   - Ocorrência (occurredAt, se preenchido — pode ser anterior à detecção)
 *   - Comunicação à ANPD (anpdNotifiedAt)
 *   - Comunicação aos titulares (subjectsNotifiedAt)
 *   - Cada IncidentCommunication.createdAt
 *   - Cada ActionPlan vinculado (refIncidentId === id)
 *   - Encerrado (closedAt)
 *
 * Não há schema novo — só visualização agregada do que já existe.
 */

interface ActionPlanLite {
  id: string;
  title: string;
  status: string;
  priority: string;
  refIncidentId: string | null;
  createdAt: string;
}

interface TimelineEvent {
  /** Chave única na lista */
  key: string;
  /** Timestamp ISO pra ordenação */
  at: string;
  /** Ícone à esquerda da bolinha */
  icon: React.ReactNode;
  /** Cor de destaque da bolinha (Tailwind classes) */
  dotClass: string;
  /** Título resumido do evento */
  title: string;
  /** Descrição/contexto opcional */
  description?: string;
  /** Link interno opcional (ex: ação do plano) */
  href?: string;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  incident: IncidentDTO;
}

export default function IncidentTimeline({ incident }: Props) {
  const [actionPlans, setActionPlans] = useState<ActionPlanLite[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/plano-acao", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          const items: ActionPlanLite[] = (j.items ?? []).filter(
            (a: ActionPlanLite) => a.refIncidentId === incident.id,
          );
          setActionPlans(items);
        }
      } catch {
        // silencioso
      } finally {
        setLoadingActions(false);
      }
    })();
  }, [incident.id]);

  const events = useMemo<TimelineEvent[]>(() => {
    const evs: TimelineEvent[] = [];

    if (incident.occurredAt) {
      evs.push({
        key: "occurred",
        at: incident.occurredAt,
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        dotClass: "bg-orange-500 text-white",
        title: "Incidente ocorreu",
        description: "Data/hora estimada do evento (preenchida pelo DPO).",
      });
    }

    evs.push({
      key: "detected",
      at: incident.detectedAt,
      icon: <Search className="h-3.5 w-3.5" />,
      dotClass: "bg-amber-500 text-white",
      title: "Detectado pela organização",
      description: "Início do prazo regressivo de 72h pra notificação à ANPD (Art. 48 §1º LGPD).",
    });

    evs.push({
      key: "created",
      at: incident.createdAt,
      icon: <Activity className="h-3.5 w-3.5" />,
      dotClass: "bg-blue-500 text-white",
      title: "Registrado no PGP",
      description: incident.createdBy
        ? `Por ${incident.createdBy.name ?? incident.createdBy.email}`
        : undefined,
    });

    if (incident.anpdNotifiedAt) {
      evs.push({
        key: "anpd",
        at: incident.anpdNotifiedAt,
        icon: <Send className="h-3.5 w-3.5" />,
        dotClass: "bg-indigo-600 text-white",
        title: "ANPD notificada",
        description: "Comunicação formal enviada à Autoridade Nacional de Proteção de Dados.",
      });
    }

    if (incident.subjectsNotifiedAt) {
      evs.push({
        key: "subjects",
        at: incident.subjectsNotifiedAt,
        icon: <Mail className="h-3.5 w-3.5" />,
        dotClass: "bg-violet-600 text-white",
        title: "Titulares notificados",
        description: "Carta de comunicação aos titulares emitida (Art. 48 §1º).",
      });
    }

    for (const c of incident.communications) {
      // Evita duplicar com os marcos anpd/subjects (mesma data, tipo já listado)
      const dupAnpd =
        c.target === "ANPD" &&
        incident.anpdNotifiedAt &&
        Math.abs(new Date(c.createdAt).getTime() - new Date(incident.anpdNotifiedAt).getTime()) < 60_000;
      const dupSubjects =
        c.target === "TITULARES" &&
        incident.subjectsNotifiedAt &&
        Math.abs(new Date(c.createdAt).getTime() - new Date(incident.subjectsNotifiedAt).getTime()) < 60_000;
      if (dupAnpd || dupSubjects) continue;

      evs.push({
        key: `comm-${c.id}`,
        at: c.createdAt,
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        dotClass: c.target === "ANPD"
          ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
          : "bg-violet-100 text-violet-700 border border-violet-300",
        title: `Comunicação gerada — ${commTargetLabel(c.target)}`,
        description: c.createdBy
          ? `Por ${c.createdBy.name ?? c.createdBy.email}`
          : undefined,
      });
    }

    for (const a of actionPlans) {
      evs.push({
        key: `action-${a.id}`,
        at: a.createdAt,
        icon: <Target className="h-3.5 w-3.5" />,
        dotClass: "bg-emerald-100 text-emerald-700 border border-emerald-300",
        title: "Ação do Plano criada",
        description: `${a.title} — ${a.priority} · ${a.status}`,
        href: "/dashboard/plano-acao",
      });
    }

    if (incident.closedAt) {
      evs.push({
        key: "closed",
        at: incident.closedAt,
        icon: incident.status === "FALSO_POSITIVO" ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ),
        dotClass: incident.status === "FALSO_POSITIVO"
          ? "bg-gray-500 text-white"
          : "bg-emerald-600 text-white",
        title: incident.status === "FALSO_POSITIVO"
          ? "Marcado como falso positivo"
          : "Encerrado",
        description: incident.closedBy
          ? `Por ${incident.closedBy.name ?? incident.closedBy.email}`
          : undefined,
      });
    }

    // Ordena do mais recente pro mais antigo
    return evs.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [incident, actionPlans]);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhum evento registrado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 mb-3">
        {events.length} evento{events.length !== 1 ? "s" : ""} no ciclo de vida deste incidente
        {loadingActions && " (carregando ações do plano...)"}
      </div>
      <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-4 pt-1">
        {events.map((ev) => (
          <li key={ev.key} className="ml-6">
            <span
              className={cn(
                "absolute -left-[14px] flex items-center justify-center w-7 h-7 rounded-full shadow-sm",
                ev.dotClass,
              )}
            >
              {ev.icon}
            </span>
            <div className="bg-white dark:bg-gray-950 rounded-md border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {ev.href ? (
                    <a href={ev.href} className="hover:underline">
                      {ev.title}
                    </a>
                  ) : (
                    ev.title
                  )}
                </h4>
                <time className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {fmtDateTime(ev.at)}
                </time>
              </div>
              {ev.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {ev.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
