"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { saveInventario } from "./actions";
import { LgpdHelp } from "@/components/lgpd-help";
import { sugestoesDoProcesso, type SugestoesProcesso } from "@/lib/lgpd-refs";
import toast from "react-hot-toast";

type Inv = Awaited<ReturnType<typeof import("./actions").listInventario>>[number];

export function InventarioForm({
  inv,
  open,
  onOpenChange,
}: {
  inv: Inv | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isEdit = !!inv;
  const [loading, setLoading] = useState(false);

  // Form controlado pra permitir botão "Sugerir" preencher os campos
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [baseLegal, setBaseLegal] = useState("");
  const [tiposDados, setTiposDados] = useState("");
  const [dadosSensiveis, setDadosSensiveis] = useState(false);
  const [retencao, setRetencao] = useState("");
  const [compartilhamento, setCompartilhamento] = useState("");
  const [medidasSeguranca, setMedidasSeguranca] = useState("");

  // Sincroniza estado quando o `inv` muda (abre o modal em outro processo).
  useEffect(() => {
    if (open) {
      setNome(inv?.nome || "");
      setSetor(inv?.setor || "");
      setFinalidade(inv?.finalidade || "");
      setBaseLegal(inv?.baseLegal || "");
      setTiposDados(inv?.tiposDados || "");
      setDadosSensiveis(inv?.dadosSensiveis ?? false);
      setRetencao(inv?.retencao || "");
      setCompartilhamento(inv?.compartilhamento || "");
      setMedidasSeguranca(inv?.medidasSeguranca || "");
    }
  }, [open, inv]);

  const sugestoes = sugestoesDoProcesso(nome);

  function aplicarSugestao(campo: keyof SugestoesProcesso) {
    if (!sugestoes) return;
    const v = sugestoes[campo];
    if (v === undefined) return;
    switch (campo) {
      case "baseLegal":         setBaseLegal(String(v)); break;
      case "tiposDados":        setTiposDados(String(v)); break;
      case "dadosSensiveis":    setDadosSensiveis(Boolean(v)); break;
      case "retencao":          setRetencao(String(v)); break;
      case "compartilhamento":  setCompartilhamento(String(v)); break;
      case "medidasSeguranca":  setMedidasSeguranca(String(v)); break;
    }
    toast("Sugestão aplicada — REVISE antes de salvar", { icon: "✨" });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveInventario({
        id: inv?.id,
        nome,
        setor,
        finalidade,
        baseLegal,
        tiposDados,
        dadosSensiveis,
        retencao,
        compartilhamento,
        medidasSeguranca,
      });
      toast.success(isEdit ? "Processo atualizado" : "Processo criado");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar processo" : "Novo processo no Inventário"}</DialogTitle>
          <DialogDescription>
            Preencha na ordem: titulares → dados coletados → finalidade → base legal → retenção → compartilhamentos.
            {sugestoes && (
              <span className="block mt-1 text-brand-700">
                💡 Este processo tem sugestões. Use o botão ✨ ao lado de cada campo pra preencher (revise antes de salvar).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Callout pedagógico — 3 caminhos válidos pra completar este Inventário.
            Reflete cenários reais de implementação da LGPD: DPO sozinho · workflow
            Contribuidor→DPO · edição colaborativa. Aparece SEMPRE (não condicional),
            pra reforçar que o app suporta os 3 e que a escolha é institucional. */}
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
          <div className="font-semibold text-slate-800 mb-1">
            💼 3 caminhos válidos pra completar este Inventário:
          </div>
          <ul className="space-y-1 ml-1">
            <li>
              <strong className="text-slate-900">DPO sozinho</strong> — útil em processos simples ou quando o
              Encarregado tem domínio técnico-informacional do tema.
            </li>
            <li>
              <strong className="text-slate-900">Contribuidor → DPO</strong> — Dono do processo (ex: Sec. de
              Saúde, RH) preenche, clica em <em>Submeter ao DPO</em>, e o DPO aprova ou devolve
              com observações. <em>Mais comum em órgãos públicos com áreas técnicas especializadas.</em>
            </li>
            <li>
              <strong className="text-slate-900">DPO + Contribuidor juntos</strong> — edição
              colaborativa em qualquer ordem (este modal pode ser aberto pelos dois papéis).
              Bom pra processos com dados sensíveis ou risco alto.
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do processo / serviço</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex: Atendimento no Posto Dr. Joaquim Bento" />
            </div>
            <div>
              <Label>Setor responsável</Label>
              <Input value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: Secretaria de Saúde" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="mb-0 flex items-center gap-1">
                  Base legal (Art. 7º / 11)
                  <LgpdHelp campoKey="baseLegal" />
                </Label>
                {sugestoes?.baseLegal && (
                  <BotaoSugerir onClick={() => aplicarSugestao("baseLegal")} />
                )}
              </div>
              <Select value={baseLegal} onChange={(e) => setBaseLegal(e.target.value)}>
                <option value="">— escolha —</option>
                <optgroup label="Art. 7º — Dados pessoais comuns">
                  <option value="art7-i">I — Consentimento</option>
                  <option value="art7-ii">II — Cumprimento de obrigação legal/regulatória</option>
                  <option value="art7-iii">III — Execução de políticas públicas (Adm. Pública)</option>
                  <option value="art7-iv">IV — Estudos por órgão de pesquisa</option>
                  <option value="art7-v">V — Execução de contrato</option>
                  <option value="art7-vi">VI — Exercício regular de direitos</option>
                  <option value="art7-vii">VII — Proteção da vida ou incolumidade física</option>
                  <option value="art7-viii">VIII — Tutela da saúde</option>
                  <option value="art7-ix">IX — Legítimo interesse do controlador</option>
                  <option value="art7-x">X — Proteção do crédito</option>
                </optgroup>
                <optgroup label="Art. 11 — Dados sensíveis">
                  <option value="art11-a">a — Consentimento específico</option>
                  <option value="art11-b-ii">b.II — Obrigação legal/regulatória</option>
                  <option value="art11-b-iii">b.III — Adm. Pública (políticas públicas)</option>
                  <option value="art11-b-iv">b.IV — Estudos por órgão de pesquisa</option>
                  <option value="art11-b-v">b.V — Exercício regular de direitos</option>
                  <option value="art11-b-vi">b.VI — Proteção da vida</option>
                  <option value="art11-b-vii">b.VII — Tutela da saúde</option>
                </optgroup>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Finalidade do tratamento</Label>
              <Textarea value={finalidade} onChange={(e) => setFinalidade(e.target.value)} rows={2} placeholder="Para que esses dados são tratados? Qual o resultado esperado?" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="mb-0 flex items-center gap-1">
                  Tipos de dados coletados
                  <LgpdHelp campoKey="tiposDados" />
                </Label>
                {sugestoes?.tiposDados && (
                  <BotaoSugerir onClick={() => aplicarSugestao("tiposDados")} />
                )}
              </div>
              <Textarea value={tiposDados} onChange={(e) => setTiposDados(e.target.value)} rows={3} placeholder="Ex: nome, CPF, endereço, dados de saúde, prontuário..." />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="dadosSensiveis"
                checked={dadosSensiveis}
                onChange={(e) => setDadosSensiveis(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="dadosSensiveis" className="mb-0 flex items-center gap-1">
                Contém dados pessoais sensíveis (saúde, origem, religião, biométricos...)
                <LgpdHelp campoKey="dadosSensiveis" />
              </Label>
              {sugestoes?.dadosSensiveis !== undefined && (
                <BotaoSugerir onClick={() => aplicarSugestao("dadosSensiveis")} />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="mb-0 flex items-center gap-1">
                  Prazo de retenção
                  <LgpdHelp campoKey="retencao" />
                </Label>
                {sugestoes?.retencao && (
                  <BotaoSugerir onClick={() => aplicarSugestao("retencao")} />
                )}
              </div>
              <Input value={retencao} onChange={(e) => setRetencao(e.target.value)} placeholder="Ex: 5 anos após encerramento" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="mb-0 flex items-center gap-1">
                  Compartilhamentos
                  <LgpdHelp campoKey="compartilhamento" />
                </Label>
                {sugestoes?.compartilhamento && (
                  <BotaoSugerir onClick={() => aplicarSugestao("compartilhamento")} />
                )}
              </div>
              <Input value={compartilhamento} onChange={(e) => setCompartilhamento(e.target.value)} placeholder="Ex: Laboratório terceirizado, Sec. Estadual de Saúde" />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Label className="mb-0 flex items-center gap-1">
                  Medidas de segurança
                  <LgpdHelp campoKey="medidasSeguranca" />
                </Label>
                {sugestoes?.medidasSeguranca && (
                  <BotaoSugerir onClick={() => aplicarSugestao("medidasSeguranca")} />
                )}
              </div>
              <Textarea value={medidasSeguranca} onChange={(e) => setMedidasSeguranca(e.target.value)} rows={3} placeholder="Controles de acesso, criptografia, backup, logs..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (isEdit ? "Atualizar" : "Criar processo")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BotaoSugerir({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-brand-600 hover:text-brand-700 hover:underline"
      title="Preenche com sugestão típica pra este processo (revise antes de salvar)"
    >
      <Sparkles className="h-3 w-3" /> Sugerir
    </button>
  );
}
