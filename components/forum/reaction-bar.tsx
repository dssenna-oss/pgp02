"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  FORUM_REACTION_EMOJIS,
  type ForumReactionEmoji,
  type ReactionCount,
} from "@/lib/forum-types";
import { toast } from "sonner";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Barra de reações de um post do fórum.
 *
 * Comportamento:
 * - Mostra os emojis que JÁ TÊM reações (com count + estado meReacted)
 * - Botão "+" abre popover com os 5 emojis permitidos pra adicionar
 * - Click num emoji existente → toggle (adiciona/remove a do user)
 * - Click num emoji do popover → adiciona (substitui se user já tinha
 *   reagido com outro emoji)
 *
 * Update otimista: atualiza a UI antes da resposta da API; reverte se
 * a API falhar.
 */
interface Props {
  postId: string;
  reactions: ReactionCount[];
  /** Callback chamado após a API confirmar (pra parent refetch se quiser). */
  onChange?: (next: ReactionCount[]) => void;
  /** Tamanho dos botões — sm pra cards de listagem, md pra detalhe. */
  size?: "sm" | "md";
}

export default function ReactionBar({
  postId,
  reactions: initial,
  onChange,
  size = "md",
}: Props) {
  const [reactions, setReactions] = useState<ReactionCount[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Mantém em sync caso o parent receba novo array (refetch)
  // (não usa useEffect pra evitar overrides durante optimistic updates)

  const apply = async (emoji: ForumReactionEmoji) => {
    // Otimista: simula a transição localmente
    const prev = reactions;
    const myCurrent = prev.find((r) => r.meReacted);
    let next: ReactionCount[];
    if (myCurrent && myCurrent.emoji === emoji) {
      // Estava nesse emoji — remover
      next = prev
        .map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count - 1, meReacted: false }
            : r,
        )
        .filter((r) => r.count > 0);
    } else if (myCurrent) {
      // Estava em outro emoji — substituir
      next = prev
        .map((r) => {
          if (r.emoji === myCurrent.emoji) {
            return { ...r, count: r.count - 1, meReacted: false };
          }
          if (r.emoji === emoji) {
            return { ...r, count: r.count + 1, meReacted: true };
          }
          return r;
        })
        .filter((r) => r.count > 0);
      // Adiciona se ainda não existia
      if (!next.find((r) => r.emoji === emoji)) {
        next.push({ emoji, count: 1, meReacted: true });
      }
    } else {
      // Não tinha reagido — adicionar
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        next = prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, meReacted: true }
            : r,
        );
      } else {
        next = [...prev, { emoji, count: 1, meReacted: true }];
      }
    }
    // Reordena pelo canonical (FORUM_REACTION_EMOJIS)
    next.sort(
      (a, b) =>
        FORUM_REACTION_EMOJIS.indexOf(a.emoji) -
        FORUM_REACTION_EMOJIS.indexOf(b.emoji),
    );
    setReactions(next);
    onChange?.(next);
    setPopoverOpen(false);

    startTransition(async () => {
      try {
        const r = await fetch(`/api/forum/${postId}/reacoes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!r.ok) {
          // Reverte
          setReactions(prev);
          onChange?.(prev);
          const err = await r.json().catch(() => ({}));
          toast.error(err.error ?? "Erro ao reagir");
        }
      } catch {
        setReactions(prev);
        onChange?.(prev);
        toast.error("Erro de rede");
      }
    });
  };

  const btnSize =
    size === "sm"
      ? "h-7 text-xs px-2 gap-1"
      : "h-8 text-sm px-2.5 gap-1.5";

  // Lista dos emojis que ainda NÃO têm reação (pra mostrar no popover)
  const reactedEmojis = new Set(reactions.map((r) => r.emoji));
  const availableEmojis = FORUM_REACTION_EMOJIS.filter(
    (e) => !reactedEmojis.has(e),
  );

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap"
      onClick={(e) => e.stopPropagation()}
    >
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => apply(r.emoji)}
          disabled={isPending}
          className={cn(
            "inline-flex items-center rounded-full border transition-colors",
            btnSize,
            r.meReacted
              ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700"
              : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-750",
          )}
          title={
            r.meReacted
              ? "Você reagiu com este emoji — clique pra remover"
              : "Reagir com este emoji"
          }
        >
          <span className="text-base leading-none">{r.emoji}</span>
          <span className="font-semibold tabular-nums">{r.count}</span>
        </button>
      ))}

      {/* Botão "+" pra abrir popover com emojis disponíveis */}
      {availableEmojis.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className={cn(
                "inline-flex items-center rounded-full border border-dashed transition-colors",
                btnSize,
                "border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
              title="Adicionar reação"
            >
              <Smile className="h-3.5 w-3.5" />
              {reactions.length === 0 && (
                <span className="text-xs font-medium">Reagir</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-1.5 flex gap-1"
            side="top"
            align="start"
          >
            {availableEmojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => apply(e)}
                disabled={isPending}
                className="h-9 w-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-xl leading-none flex items-center justify-center transition-colors"
                title={`Reagir com ${e}`}
              >
                {e}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
