"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { saveAnswer } from "./actions";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Controle } from "@/lib/gap-pacote";

type Answer = {
  controleId: number;
  resposta: string;
  justificativa: string | null;
} | null;

export function GapControl({ controle, answer }: { controle: Controle; answer: Answer }) {
  const [resposta, setResposta] = useState<string>(answer?.resposta || "");
  const [justificativa, setJustificativa] = useState<string>(answer?.justificativa || "");
  const [pending, startTransition] = useTransition();

  function save(novaResposta: string, novaJust: string) {
    startTransition(async () => {
      try {
        await saveAnswer({
          controleId: controle.id,
          resposta: novaResposta as any,
          justificativa: novaJust,
        });
        toast.success(`Controle ${controle.id} salvo`);
      } catch (e: any) {
        toast.error(e.message || "Erro");
      }
    });
  }

  function escolher(novaResposta: string) {
    setResposta(novaResposta);
    save(novaResposta, justificativa);
  }

  function salvarJust() {
    if (resposta) save(resposta, justificativa);
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start gap-3 mb-3">
        <Badge variant="ghost" className="mt-0.5 flex-shrink-0">#{controle.id}</Badge>
        <div className="flex-1">
          <div className="text-sm font-medium">{controle.texto}</div>
          {controle.hint && <div className="text-xs text-gray-500 mt-1">{controle.hint}</div>}
          <Badge variant="primary" className="mt-2">{controle.area}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          variant={resposta === "ADERENTE" ? "success" : "outline"}
          size="sm"
          onClick={() => escolher("ADERENTE")}
          disabled={pending}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Aderente
        </Button>
        <Button
          variant={resposta === "PARCIAL" ? "primary" : "outline"}
          size="sm"
          className={resposta === "PARCIAL" ? "bg-amber-500 hover:bg-amber-600" : ""}
          onClick={() => escolher("PARCIAL")}
          disabled={pending}
        >
          <AlertCircle className="h-3.5 w-3.5" /> Parcial
        </Button>
        <Button
          variant={resposta === "NAO_ADERENTE" ? "destructive" : "outline"}
          size="sm"
          onClick={() => escolher("NAO_ADERENTE")}
          disabled={pending}
        >
          <XCircle className="h-3.5 w-3.5" /> Não aderente
        </Button>
      </div>

      {resposta && (
        <div>
          <Textarea
            rows={2}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            onBlur={salvarJust}
            placeholder="Uma linha justificando a resposta (ex: 'Portaria publicada em 2024, mas não testada.')"
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
}
