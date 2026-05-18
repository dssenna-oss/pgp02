"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2, AlertCircle, XCircle, HandHelping,
  CalendarClock, Download, ListTodo,
} from "lucide-react";
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
import { saveAnswer, importarResultado, criarAcaoPlanejada } from "./actions";
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

  const isApoio = resposta === "APOIO_PENDENTE";
  const isPlanejada = resposta === "ACAO_PLANEJADA";
  const setorInfo = isApoio ? getSetorById(setorAtual) : null;
  const podeImportar = !!controle.importavel;
  const podeCriarAcao = isPlanejada;

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
        } else if (novaResposta === "ACAO_PLANEJADA") {
          toast.success(`Controle ${controle.id} marcado como ação planejada`);
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

  function importar() {
    startTransition(async () => {
      try {
        const r = await importarResultado(controle.id);
        setResposta(r.resposta);
        setJustificativa(r.justificativa || "");
        setSetorAtual("");
        toast.success(`Resultado importado: ${labelResposta(r.resposta)}`);
      } catch (e: any) {
        toast.error(e.message || "Erro ao importar");
      }
    });
  }

  function criarNoPlano() {
    startTransition(async () => {
      try {
        const r = await criarAcaoPlanejada(controle.id);
        if (r.criada) toast.success("Ação criada no Plano de Ação (Fase 5)");
        else toast(`Já existe ação no Plano pra este controle`, { icon: "ℹ️" });
      } catch (e: any) {
        toast.error(e.message || "Erro");
      }
    });
  }

  function salvarJust() {
    if (resposta) save(resposta, justificativa, isApoio ? setorAtual : null);
  }

  // Cor do contêiner segundo a resposta
  const containerCor =
    resposta === "ADERENTE"     ? "border-emerald-300 bg-emerald-50/30" :
    resposta === "PARCIAL"      ? "border-amber-300 bg-amber-50/30" :
    resposta === "NAO_ADERENTE" ? "border-red-300 bg-red-50/30" :
    isPlanejada                 ? "border-slate-300 bg-slate-50/40" :
    isApoio                     ? "border-sky-300 bg-sky-50/40" :
    "border-gray-200 bg-white";

  return (
    <div className={cn("border rounded-lg p-4", containerCor)}>
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
            {isPlanejada && (
              <Badge variant="default" className="bg-slate-100 text-slate-700">
                <CalendarClock className="h-3 w-3" /> Ação planejada
              </Badge>
            )}
            {podeImportar && (
              <Badge variant="default" className="bg-purple-50 text-purple-700">
                <Download className="h-3 w-3" /> Importável
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Linha 1: 4 botões de resposta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
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
          variant={isPlanejada ? "primary" : "outline"}
          size="sm"
          className={isPlanejada ? "bg-slate-600 hover:bg-slate-700" : ""}
          onClick={() => escolher("ACAO_PLANEJADA")}
          disabled={pending}
          title="Está no roadmap mas ainda não foi feito — diferencia de NÃO ADERENTE"
        >
          <CalendarClock className="h-3.5 w-3.5" /> Ação planejada
        </Button>
      </div>

      {/* Linha 2: Solicitar apoio + Importar (se aplicável) + Criar no Plano (se planejada) */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          variant={isApoio ? "primary" : "outline"}
          size="sm"
          className={isApoio ? "bg-sky-600 hover:bg-sky-700" : ""}
          onClick={() => escolher("APOIO_PENDENTE")}
          disabled={pending}
          title="Preciso do apoio de outro setor pra avaliar"
        >
          <HandHelping className="h-3.5 w-3.5" /> Solicitar apoio
        </Button>
        {podeImportar && (
          <Button
            variant="outline"
            size="sm"
            onClick={importar}
            disabled={pending}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
            title="Calcula a aderência automaticamente baseado no que já está no Inventário/Riscos/RIPD/Aviso/Operadores/DSR/Incidentes"
          >
            <Download className="h-3.5 w-3.5" /> Importar resultados
          </Button>
        )}
        {podeCriarAcao && (
          <Button
            variant="outline"
            size="sm"
            onClick={criarNoPlano}
            disabled={pending}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            title="Cria uma entrada correspondente no Plano de Ação (Fase 5)"
          >
            <ListTodo className="h-3.5 w-3.5" /> Criar no Plano de Ação
          </Button>
        )}
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
                : isPlanejada
                ? "Quando pretende implementar? Há alguma dependência?"
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

function labelResposta(r: string): string {
  return ({
    ADERENTE: "Aderente",
    PARCIAL: "Parcial",
    NAO_ADERENTE: "Não aderente",
    ACAO_PLANEJADA: "Ação planejada",
    APOIO_PENDENTE: "Apoio pendente",
  } as Record<string, string>)[r] || r;
}
