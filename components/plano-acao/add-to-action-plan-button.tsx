"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ListPlus, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

/**
 * Botão reusável "Adicionar ao Plano de Ação" (Checkpoint 11 / D3).
 *
 * Usado em Diagnóstico, GAP e Riscos pra plugar uma recomendação/risco
 * direto no Plano de Ação institucional. O servidor garante
 * idempotência (`POST /api/plano-acao` devolve 409 se já existe).
 *
 * Quando 409, o botão muda pra "Já no Plano" + link pro item.
 *
 * Props:
 *   - title (string): título da ação a criar
 *   - description (string): descrição
 *   - origin: GAP | RISCO | BASES
 *   - refGapCode | refRiskId | refInventoryId: refs polimórficas
 *   - priority: ALTA | MEDIA | BAIXA (default MEDIA)
 *   - size: sm (default) | xs
 *   - variant: outline (default) | ghost
 */
interface Props {
  title: string;
  description?: string;
  origin: "GAP" | "RISCO" | "BASES";
  refGapCode?: string;
  refRiskId?: string;
  refInventoryId?: string;
  priority?: "ALTA" | "MEDIA" | "BAIXA";
  size?: "sm" | "xs";
  variant?: "outline" | "ghost";
  className?: string;
}

export default function AddToActionPlanButton({
  title,
  description,
  origin,
  refGapCode,
  refRiskId,
  refInventoryId,
  priority = "MEDIA",
  size = "sm",
  variant = "outline",
  className,
}: Props) {
  const [state, setState] = useState<"idle" | "loading" | "added" | "exists">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === "loading") return;
    setState("loading");
    try {
      const r = await fetch("/api/plano-acao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          origin,
          refGapCode,
          refRiskId,
          refInventoryId,
          priority,
        }),
      });
      if (r.status === 409) {
        setState("exists");
        toast("Já existe uma ação no Plano pra esse item.", { icon: "ℹ️" });
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        toast.error(j.error ?? "Erro ao adicionar");
        setState("idle");
        return;
      }
      setState("added");
      toast.success("Adicionado ao Plano de Ação");
    } catch {
      toast.error("Erro de rede");
      setState("idle");
    }
  };

  // Estado: já adicionado nessa sessão OU já existia (mesmo visual)
  if (state === "added" || state === "exists") {
    return (
      <Button
        variant="ghost"
        size={size === "xs" ? "sm" : size}
        disabled
        className={cn(
          "text-emerald-700 dark:text-emerald-400 cursor-default",
          size === "xs" && "h-6 text-[10px] px-1.5",
          className,
        )}
        title="Esta ação já está no Plano de Ação"
      >
        <CheckCircle2 className={cn("mr-1", size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        No Plano
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size === "xs" ? "sm" : size}
      onClick={handleClick}
      disabled={state === "loading"}
      className={cn(
        size === "xs" && "h-6 text-[10px] px-1.5",
        className,
      )}
      title="Adicionar ao Plano de Ação institucional"
    >
      {state === "loading" ? (
        <Loader2 className={cn("mr-1 animate-spin", size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      ) : (
        <ListPlus className={cn("mr-1", size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      )}
      Plano de Ação
    </Button>
  );
}
