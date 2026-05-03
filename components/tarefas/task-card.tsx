"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Tag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Pencil,
  ClipboardList,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseMarkers,
  dueDateState,
  dueDateLabel,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_CLS,
  TASK_STATUS_BORDER,
  CHIP_CLS_BY_COLOR,
  type TaskDTO,
  type TaskStatus,
  type MarkerDTO,
} from "@/lib/tarefas-types";

interface Props {
  task: TaskDTO;
  markers: MarkerDTO[];
  onEdit: (task: TaskDTO) => void;
  onDelete: (id: string) => Promise<void>;
  onChangeStatus: (id: string, status: TaskStatus) => Promise<void>;
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  A_FAZER: "EM_ANDAMENTO",
  EM_ANDAMENTO: "CONCLUIDA",
  CONCLUIDA: null,
};

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  A_FAZER: null,
  EM_ANDAMENTO: "A_FAZER",
  CONCLUIDA: "EM_ANDAMENTO",
};

export default function TaskCard({
  task,
  markers,
  onEdit,
  onDelete,
  onChangeStatus,
}: Props) {
  const tags = parseMarkers(task.markers);
  const prio = TASK_PRIORITY_CLS[task.priority];
  const dueState = dueDateState(task.dueDate, task.status);

  const next = NEXT_STATUS[task.status];
  const prev = PREV_STATUS[task.status];

  return (
    <TooltipProvider>
      <div
        className={cn(
          "border rounded-lg p-4 bg-white dark:bg-gray-950 transition-colors",
          "hover:bg-gray-50/60 dark:hover:bg-gray-900/40",
          "border-l-4",
          TASK_STATUS_BORDER[task.status],
          task.status === "CONCLUIDA" && "opacity-70"
        )}
      >
        {/* Linha 1: título + ações */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "font-semibold text-base text-gray-900 dark:text-white break-words",
                task.status === "CONCLUIDA" && "line-through text-gray-500"
              )}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-wrap">
            {prev && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => onChangeStatus(task.id, prev)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voltar pra "A fazer"</TooltipContent>
              </Tooltip>
            )}
            {next && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      task.status === "EM_ANDAMENTO"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    )}
                    onClick={() => onChangeStatus(task.id, next)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {next === "EM_ANDAMENTO"
                    ? "Iniciar"
                    : next === "CONCLUIDA"
                    ? "Concluir"
                    : "Avançar"}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400"
                  onClick={() => {
                    if (confirm(`Remover "${task.title}"?`)) {
                      void onDelete(task.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Linha 2: badges (prioridade, prazo, processo, marcadores) */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn("text-xs", prio)}>
            <Flag className="h-3 w-3 mr-1" />
            {TASK_PRIORITY_LABEL[task.priority]}
          </Badge>

          {dueState !== "none" && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                dueState === "overdue"
                  ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  : dueState === "today"
                  ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
              )}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {dueDateLabel(task.dueDate)}
            </Badge>
          )}

          {task.dataInventory && (
            <Badge
              variant="outline"
              className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50 truncate max-w-[200px]"
              title={`Vinculada ao processo: ${task.dataInventory.serviceName}`}
            >
              <ClipboardList className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {task.dataInventory.serviceName === "[Em preenchimento]"
                  ? "Processo (sem nome)"
                  : task.dataInventory.serviceName}
              </span>
            </Badge>
          )}

          {tags.map((t) => {
            const m = markers.find((mk) => mk.name === t);
            const cls = m
              ? CHIP_CLS_BY_COLOR[m.color as keyof typeof CHIP_CLS_BY_COLOR]
              : CHIP_CLS_BY_COLOR.slate;
            return (
              <Badge key={t} variant="outline" className={cn("text-xs", cls)}>
                <Tag className="h-3 w-3 mr-1" />
                {t}
              </Badge>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
