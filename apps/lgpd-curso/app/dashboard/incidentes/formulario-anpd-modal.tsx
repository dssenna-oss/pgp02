"use client";

// Modal pra preencher inline a Comunicação ANPD (itens 4-9 da Res. nº 15/2024).
// Mobile-first: full-screen em telas pequenas, com seções colapsáveis pra
// navegar fácil sem rolagem cega.
//
// Padrão pedagógico: checkboxes pré-mapeados em vez de texto livre, pra
// acelerar preenchimento sob pressão. Lição: equipe DEVE estar preparada
// COM ANTECEDÊNCIA — esse formulário é a "ficha pronta da gaveta".

import { useState, useTransition, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff, Save, Copy, CheckCircle2 } from "lucide-react";
import {
  OPCOES_NATUREZA_DADOS, OPCOES_CATEGORIAS_TITULARES, OPCOES_MEDIDAS_TECNICAS,
  OPCOES_RISCOS, OPCOES_MEDIDAS_MITIGACAO,
  completudeAnpd, type FormularioAnpd,
} from "@/lib/incidente-formulario";
import { salvarFormularioAnpd, gerarTextoAnpdParaPreview } from "./actions";
import toast from "react-hot-toast";

type Props = {
  incidenteId: string;
  incidenteTitulo: string;
  initial: FormularioAnpd | null;
  open: boolean;
  onClose: () => void;
};

export function FormularioAnpdModal({ incidenteId, incidenteTitulo, initial, open, onClose }: Props) {
  const [form, setForm] = useState<FormularioAnpd>(initial || {});
  const [pending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTexto, setPreviewTexto] = useState("");

  const completude = useMemo(() => completudeAnpd(form), [form]);

  function toggleItem(campo: keyof FormularioAnpd, id: string) {
    setForm((f) => {
      const arr = (f[campo] as string[] | undefined) || [];
      const novo = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...f, [campo]: novo };
    });
  }

  function setTexto(campo: keyof FormularioAnpd, v: string) {
    setForm((f) => ({ ...f, [campo]: v }));
  }

  function salvar() {
    startTransition(async () => {
      const r = await salvarFormularioAnpd(incidenteId, form);
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success("Comunicação ANPD salva");
    });
  }

  async function gerarPreview() {
    startTransition(async () => {
      // Salva primeiro pra garantir que o preview reflete o estado atual
      const r = await salvarFormularioAnpd(incidenteId, form);
      if (r.ok === false) { toast.error(r.error); return; }
      const texto = await gerarTextoAnpdParaPreview(incidenteId);
      setPreviewTexto(texto);
      setPreviewOpen(true);
    });
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(previewTexto);
      toast.success("Texto copiado pra área de transferência");
    } catch {
      toast.error("Falha ao copiar. Selecione e Ctrl+C manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            📨 Comunicação à ANPD
          </DialogTitle>
          <DialogDescription>
            <div className="text-xs text-gray-700">
              {incidenteTitulo} · {completude.preenchidos}/{completude.total} seções preenchidas
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Art. 48 LGPD + Res. CD/ANPD nº 15/2024 · Marque as opções que se aplicam.
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Item 4 — Natureza dos dados */}
          <Secao numero={4} titulo="Natureza dos dados pessoais afetados" obrigatorio>
            <ListaCheckbox
              opcoes={OPCOES_NATUREZA_DADOS}
              selecionados={form.naturezaDados || []}
              onToggle={(id) => toggleItem("naturezaDados", id)}
            />
          </Secao>

          {/* Item 5 — Titulares */}
          <Secao numero={5} titulo="Informações sobre os titulares" obrigatorio>
            <div>
              <Label className="text-xs">Número estimado de titulares afetados</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={form.titularesNumero || ""}
                onChange={(e) => setTexto("titularesNumero", e.target.value)}
                placeholder="Ex: 2.300"
                className="mb-2"
              />
              <Label className="text-xs">Categorias de titulares</Label>
              <ListaCheckbox
                opcoes={OPCOES_CATEGORIAS_TITULARES}
                selecionados={form.titularesCategorias || []}
                onToggle={(id) => toggleItem("titularesCategorias", id)}
              />
            </div>
          </Secao>

          {/* Item 6 — Medidas técnicas existentes */}
          <Secao numero={6} titulo="Medidas técnicas e administrativas existentes" obrigatorio>
            <ListaCheckbox
              opcoes={OPCOES_MEDIDAS_TECNICAS}
              selecionados={form.medidasTecnicas || []}
              onToggle={(id) => toggleItem("medidasTecnicas", id)}
            />
          </Secao>

          {/* Item 7 — Riscos */}
          <Secao numero={7} titulo="Riscos relacionados ao incidente" obrigatorio>
            <ListaCheckbox
              opcoes={OPCOES_RISCOS}
              selecionados={form.riscos || []}
              onToggle={(id) => toggleItem("riscos", id)}
            />
          </Secao>

          {/* Item 8 — Medidas de mitigação */}
          <Secao numero={8} titulo="Medidas adotadas pra reverter/mitigar o dano" obrigatorio>
            <ListaCheckbox
              opcoes={OPCOES_MEDIDAS_MITIGACAO}
              selecionados={form.medidasMitigacao || []}
              onToggle={(id) => toggleItem("medidasMitigacao", id)}
            />
          </Secao>

          {/* Item 9 — Motivo de atraso (opcional) */}
          <Secao numero={9} titulo="Motivo de eventual atraso na comunicação (opcional)">
            <Textarea
              rows={3}
              value={form.motivoAtraso || ""}
              onChange={(e) => setTexto("motivoAtraso", e.target.value)}
              placeholder="Se houver atraso na comunicação, explique aqui. Em branco = sem atraso."
            />
          </Secao>
        </div>

        <DialogFooter className="flex-wrap gap-2 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button variant="outline" onClick={salvar} disabled={pending}>
            <Save className="h-4 w-4" /> {pending ? "Salvando..." : "Salvar"}
          </Button>
          <Button onClick={gerarPreview} disabled={pending}>
            <Eye className="h-4 w-4" /> Salvar + Ver texto final
          </Button>
        </DialogFooter>

        {/* Sub-modal: preview do texto gerado */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Texto final · Comunicação ANPD</DialogTitle>
              <DialogDescription className="text-[11px]">
                Esse texto pode ser copiado e enviado pra ANPD (e-mail, sistema, ofício).
                Lembre que comunicação é em até 3 dias úteis (Res. CD/ANPD nº 15/2024).
              </DialogDescription>
            </DialogHeader>
            <pre className="flex-1 overflow-y-auto text-[11px] font-mono whitespace-pre-wrap bg-gray-50 border rounded p-3">
              {previewTexto}
            </pre>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar preview</Button>
              <Button onClick={copiarTexto}>
                <Copy className="h-4 w-4" /> Copiar texto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function Secao({ numero, titulo, obrigatorio, children }: {
  numero: number; titulo: string; obrigatorio?: boolean; children: React.ReactNode;
}) {
  return (
    <details open className="border rounded-lg overflow-hidden group">
      <summary className="cursor-pointer px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center gap-2 select-none border-b">
        <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded">{numero}</span>
        <span className="flex-1 text-sm font-medium">{titulo}</span>
        {obrigatorio && <span className="text-[10px] text-red-600 font-medium">obrigatório</span>}
      </summary>
      <div className="p-3 bg-white">
        {children}
      </div>
    </details>
  );
}

function ListaCheckbox({ opcoes, selecionados, onToggle }: {
  opcoes: Array<{ id: string; rotulo: string; sensivel?: boolean }>;
  selecionados: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {opcoes.map((op) => {
        const checked = selecionados.includes(op.id);
        return (
          <label
            key={op.id}
            className={`flex items-start gap-2 p-2 rounded cursor-pointer text-xs transition-colors ${
              checked ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(op.id)}
              className="h-4 w-4 mt-0.5 shrink-0"
            />
            <span className="flex-1">
              {op.rotulo}
              {op.sensivel && (
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  ⚠ sensível
                </span>
              )}
            </span>
            {checked && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />}
          </label>
        );
      })}
    </div>
  );
}
