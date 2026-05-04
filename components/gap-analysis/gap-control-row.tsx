"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Sparkles,
  ListChecks,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { GapControl } from "@/lib/gap-catalog";
import {
  GAP_MAPEAMENTO,
  GAP_ADERENCIA,
  type GapAnswerDTO,
  type GapMapeamento,
  type GapAderencia,
  gapMapeamentoLabel,
  gapAderenciaLabel,
  gapMapeamentoBadgeClass,
  gapAderenciaBadgeClass,
} from "@/lib/gap-helpers";
import type { GapSuggestion } from "@/lib/gap-suggest";

interface Props {
  control: GapControl;
  answer: GapAnswerDTO | null;
  suggestion?: GapSuggestion;
  onSaved: () => void;
}

const INSTRUCTION_BADGE: Record<GapControl["instruction"], { label: string; cls: string }> = {
  DESCREVER: {
    label: "Descrever",
    cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800",
  },
  SN: {
    label: "Sim/Não",
    cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  },
  CHECKBOX_ITEM: {
    label: "Item de lista",
    cls: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
  CONDICIONAL: {
    label: "Condicional",
    cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  },
};

export default function GapControlRow({
  control,
  answer,
  suggestion,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);

  // Estado local dos 4 campos (inicializa com answer ou suggestion)
  const initialCenario =
    answer?.cenarioAtual ?? suggestion?.cenarioAtual ?? "";
  const initialMap =
    (answer?.mapeamento as GapMapeamento | null) ??
    (suggestion?.mapeamento ?? null);
  const initialAde =
    (answer?.aderencia as GapAderencia | null) ?? (suggestion?.aderencia ?? null);
  const initialPM = answer?.pontoMelhoria ?? "";

  const [cenario, setCenario] = useState(initialCenario);
  const [mapeamento, setMapeamento] = useState<GapMapeamento | null>(initialMap);
  const [aderencia, setAderencia] = useState<GapAderencia | null>(initialAde);
  const [pontoMelhoria, setPontoMelhoria] = useState(initialPM);
  const [notes, setNotes] = useState(answer?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  // Quando o answer muda externamente (refresh após save), sincroniza
  useEffect(() => {
    if (answer) {
      setCenario(answer.cenarioAtual ?? "");
      setMapeamento((answer.mapeamento as GapMapeamento | null) ?? null);
      setAderencia((answer.aderencia as GapAderencia | null) ?? null);
      setPontoMelhoria(answer.pontoMelhoria ?? "");
      setNotes(answer.notes ?? "");
    }
  }, [answer]);

  // Sugestão mostra-se como tag quando os campos atuais ainda batem com ela
  const isSuggestionShown =
    !!suggestion &&
    !answer &&
    cenario === (suggestion.cenarioAtual ?? "") &&
    mapeamento === (suggestion.mapeamento ?? null) &&
    aderencia === (suggestion.aderencia ?? null);

  // Resumo no header colapsado
  const hasAnyContent =
    !!cenario.trim() ||
    !!pontoMelhoria.trim() ||
    !!notes.trim() ||
    !!mapeamento ||
    !!aderencia;

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/gap/answer/${control.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cenarioAtual: cenario,
          mapeamento,
          aderencia,
          pontoMelhoria,
          notes,
          // applySuggestion: false (default) — salvar manualmente vira resposta confirmada
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Salvo");
      onSaved();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!answer) {
      // só estado local
      setCenario("");
      setMapeamento(null);
      setAderencia(null);
      setPontoMelhoria("");
      setNotes("");
      return;
    }
    if (!confirm("Apagar a resposta deste controle?")) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/gap/answer/${control.code}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        toast.error("Erro ao apagar");
        return;
      }
      toast.success("Resposta limpa");
      onSaved();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async () => {
    if (!pontoMelhoria.trim()) {
      toast.error("Preencha o Ponto de Melhoria antes.");
      return;
    }
    if (!answer) {
      toast.error("Salve a resposta antes de virar tarefa.");
      return;
    }
    setCreatingTask(true);
    try {
      const r = await fetch(`/api/gap/answer/${control.code}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error ?? "Erro ao criar tarefa");
        return;
      }
      toast.success("Tarefa criada em Minhas Tarefas");
    } catch {
      toast.error("Erro de rede");
    } finally {
      setCreatingTask(false);
    }
  };

  const instruction = INSTRUCTION_BADGE[control.instruction];

  return (
    <div
      className={cn(
        "border rounded-md transition-colors",
        answer && !answer.autoSuggested
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
          : isSuggestionShown
            ? "border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
      )}
    >
      {/* Header colapsado */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          <Badge
            variant="outline"
            className="font-mono text-[10px] px-1.5 py-0"
          >
            #{control.code}
          </Badge>
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", instruction.cls)}
            >
              {instruction.label}
            </Badge>
            {isSuggestionShown && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800"
              >
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Sugestão
              </Badge>
            )}
            {answer && !answer.autoSuggested && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                Salvo
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
            {control.question}
          </p>
          {hasAnyContent && !open && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {mapeamento && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    gapMapeamentoBadgeClass(mapeamento),
                  )}
                >
                  {gapMapeamentoLabel(mapeamento)}
                </Badge>
              )}
              {aderencia && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    gapAderenciaBadgeClass(aderencia),
                  )}
                >
                  {gapAderenciaLabel(aderencia)}
                </Badge>
              )}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 shrink-0 mt-1 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Corpo expandido */}
      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-3">
          {/* Sugestão (banner laranja) */}
          {isSuggestionShown && suggestion && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 p-2 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-medium">Sugestão automática:</span>{" "}
                {suggestion.reason} Salve manualmente pra confirmar como sua
                resposta.
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCenario("");
                  setMapeamento(null);
                  setAderencia(null);
                }}
                className="shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                title="Desfazer sugestão"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Texto do artigo (referência LGPD) */}
          {control.article && (
            <details className="text-xs text-gray-600 dark:text-gray-400">
              <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 select-none">
                📖 Referência LGPD ({control.chapter ?? "ver artigo"})
              </summary>
              <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800/50 whitespace-pre-line leading-relaxed">
                {control.article}
              </div>
            </details>
          )}

          {/* Cenário Atual */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Cenário Atual
            </label>
            <Textarea
              value={cenario}
              onChange={(e) => setCenario(e.target.value)}
              rows={3}
              placeholder="Descreva como a organização está em relação a esse controle hoje..."
              className="text-sm"
            />
          </div>

          {/* Mapeamento + Aderência (lado a lado) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Mapeamento
              </label>
              <Select
                value={mapeamento ?? "_unset"}
                onValueChange={(v) =>
                  setMapeamento(v === "_unset" ? null : (v as GapMapeamento))
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unset">— sem resposta —</SelectItem>
                  <SelectItem value={GAP_MAPEAMENTO.NAO_INICIADO}>
                    Não iniciado
                  </SelectItem>
                  <SelectItem value={GAP_MAPEAMENTO.EM_ANDAMENTO}>
                    Em andamento
                  </SelectItem>
                  <SelectItem value={GAP_MAPEAMENTO.FINALIZADO}>
                    Finalizado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Aderência
              </label>
              <Select
                value={aderencia ?? "_unset"}
                onValueChange={(v) =>
                  setAderencia(v === "_unset" ? null : (v as GapAderencia))
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_unset">— sem resposta —</SelectItem>
                  <SelectItem value={GAP_ADERENCIA.ADERENTE}>
                    Aderente
                  </SelectItem>
                  <SelectItem value={GAP_ADERENCIA.PARCIAL}>
                    Parcialmente aderente
                  </SelectItem>
                  <SelectItem value={GAP_ADERENCIA.NAO_ADERENTE}>
                    Não aderente
                  </SelectItem>
                  <SelectItem value={GAP_ADERENCIA.NA}>
                    N/A (não se aplica)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ponto de Melhoria */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Ponto de Melhoria
            </label>
            <Textarea
              value={pontoMelhoria}
              onChange={(e) => setPontoMelhoria(e.target.value)}
              rows={2}
              placeholder="O que precisa ser feito pra ficar aderente? (vira tarefa pessoal se você quiser)"
              className="text-sm"
            />
          </div>

          {/* Notas livres (5º campo — polimento C5) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Notas / observações
              <span className="text-[10px] font-normal text-gray-500">
                (interno — não vai pro Excel exportado)
              </span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Links pra políticas, decisões em andamento, contexto pra próxima revisão..."
              className="text-sm"
            />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 justify-end pt-1 border-t border-gray-100 dark:border-gray-800">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              disabled={saving}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateTask}
              disabled={creatingTask || !pontoMelhoria.trim() || !answer}
              title={
                !answer
                  ? "Salve a resposta primeiro"
                  : !pontoMelhoria.trim()
                    ? "Preencha o Ponto de Melhoria"
                    : "Cria uma tarefa pessoal a partir do Ponto de Melhoria"
              }
            >
              {creatingTask ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <ListChecks className="h-3.5 w-3.5 mr-1" />
              )}
              Virar tarefa
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
