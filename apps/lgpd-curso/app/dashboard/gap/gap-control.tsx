"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, XCircle, HandHelping } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { saveAnswer } from "./actions";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Controle } from "@/lib/gap-pacote";
import { SETORES_APOIO, sugerirSetor, getSetorById } from "@/lib/setores-apoio";

type Answer = {
  controleId: number;
  resposta: string;
  justificativa: string | null;
  setorApoio?: string | null;
} | null;

export function GapControl({ controle, answer }: { controle: Controle; answer: Answer }) {
  const [resposta, setResposta] = useState<string>(answer?.resposta || "");
  const [justificativa, setJustificativa] = useState<string>(answer?.justificativa || "");
  const [setorAtual, setSetorAtual] = useState<string>(answer?.setorApoio || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [setorDialog, setSetorDialog] = useState<string>(
    answer?.setorApoio || sugerirSetor(controle.id) || "",
  );
  const [pending, startTransition] = useTransition();

  function save(novaResposta: string, novaJust: string, novoSetor: string | null) {
    startTransition(async () => {
      try {
        await saveAnswer({
          controleId: controle.id,
          resposta: novaResposta as any,
          justificativa: novaJust,
          setorApoio: novoSetor,
        });
        if (novaResposta === "APOIO_PENDENTE") {
          const setor = getSetorById(novoSetor || "");
          toast.success(`Apoio do setor "${setor?.nome || novoSetor}" solicitado`);
        } else {
          toast.success(`Controle ${controle.id} salvo`);
        }
      } catch (e: any) {
        toast.error(e.message || "Erro");
      }
    });
  }

  function escolher(novaResposta: string) {
    if (novaResposta === "APOIO_PENDENTE") {
      // Não salva direto — abre Dialog pra escolher setor
      setDialogOpen(true);
      return;
    }
    setResposta(novaResposta);
    setSetorAtual("");
    save(novaResposta, justificativa, null);
  }

  function confirmarApoio() {
    if (!setorDialog) {
      toast.error("Escolha um setor");
      return;
    }
    setResposta("APOIO_PENDENTE");
    setSetorAtual(setorDialog);
    setDialogOpen(false);
    save("APOIO_PENDENTE", justificativa, setorDialog);
  }

  function salvarJust() {
    if (resposta) save(resposta, justificativa, resposta === "APOIO_PENDENTE" ? setorAtual : null);
  }

  const isApoio = resposta === "APOIO_PENDENTE";
  const setorInfo = isApoio ? getSetorById(setorAtual) : null;

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-white",
      isApoio && "border-sky-300 bg-sky-50/40",
    )}>
      <div className="flex items-start gap-3 mb-3">
        <Badge variant="ghost" className="mt-0.5 flex-shrink-0">#{controle.id}</Badge>
        <div className="flex-1">
          <div className="text-sm font-medium">{controle.texto}</div>
          {controle.hint && <div className="text-xs text-gray-500 mt-1">{controle.hint}</div>}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Badge variant="primary">{controle.area}</Badge>
            {isApoio && setorInfo && (
              <Badge variant="default" className="bg-sky-100 text-sky-800">
                {setorInfo.emoji} Apoio: {setorInfo.nome}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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
        <Button
          variant={isApoio ? "primary" : "outline"}
          size="sm"
          className={isApoio ? "bg-sky-600 hover:bg-sky-700" : ""}
          onClick={() => escolher("APOIO_PENDENTE")}
          disabled={pending}
          title="Não consigo avaliar sozinho — preciso do apoio de outro setor"
        >
          <HandHelping className="h-3.5 w-3.5" /> Solicitar apoio
        </Button>
      </div>

      {resposta && (
        <div>
          <Textarea
            rows={2}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            onBlur={salvarJust}
            placeholder={
              isApoio
                ? "Detalhe pro setor — o que exatamente precisa ser confirmado?"
                : "Uma linha justificando a resposta (ex: 'Portaria publicada em 2024, mas não testada.')"
            }
            className="text-xs"
          />
        </div>
      )}

      {/* Dialog de seleção do setor de apoio */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandHelping className="h-5 w-5 text-sky-600" />
              Solicitar apoio pra avaliar este controle
            </DialogTitle>
            <DialogDescription>
              <strong>{controle.texto}</strong>
              <br />
              <span className="text-gray-500 italic">
                O DPO sozinho não avalia tudo. Escolha o setor que tem o conhecimento técnico/jurídico
                pra confirmar este controle — depois você retoma a resposta.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Setor de apoio</label>
              <Select value={setorDialog} onChange={(e) => setSetorDialog(e.target.value)}>
                <option value="">— escolha o setor —</option>
                {SETORES_APOIO.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.nome}
                  </option>
                ))}
              </Select>
              {setorDialog && (
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {getSetorById(setorDialog)?.competencias}
                </p>
              )}
            </div>

            {sugerirSetor(controle.id) && (
              <div className="text-[11px] bg-gray-50 border rounded p-2 text-gray-600">
                💡 <strong>Sugestão pra este controle:</strong>{" "}
                {getSetorById(sugerirSetor(controle.id)!)?.emoji}{" "}
                {getSetorById(sugerirSetor(controle.id)!)?.nome}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarApoio} disabled={!setorDialog || pending}>
              <HandHelping className="h-3.5 w-3.5" /> Confirmar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
