"use client";

// Modal pra preencher inline a Carta aos Titulares (Art. 48 §1º LGPD).
// Linguagem amigável pro cidadão comum — em vez de juridiquês.
//
// Mais simples que o ANPD: só 2 seções (Dados afetados + O que fizemos).

import { useState, useTransition, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Save, Copy, CheckCircle2 } from "lucide-react";
import {
  OPCOES_DADOS_AFETADOS, OPCOES_O_QUE_FIZEMOS,
  completudeTitulares, type FormularioTitulares,
} from "@/lib/incidente-formulario";
import { salvarFormularioTitulares, gerarTextoTitularesParaPreview } from "./actions";
import toast from "react-hot-toast";

type Props = {
  incidenteId: string;
  incidenteTitulo: string;
  initial: FormularioTitulares | null;
  open: boolean;
  onClose: () => void;
};

export function FormularioTitularesModal({ incidenteId, incidenteTitulo, initial, open, onClose }: Props) {
  const [form, setForm] = useState<FormularioTitulares>(initial || {});
  const [pending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTexto, setPreviewTexto] = useState("");

  const completude = useMemo(() => completudeTitulares(form), [form]);

  function toggleItem(campo: keyof FormularioTitulares, id: string) {
    setForm((f) => {
      const arr = (f[campo] as string[] | undefined) || [];
      const novo = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...f, [campo]: novo };
    });
  }

  function salvar() {
    startTransition(async () => {
      const r = await salvarFormularioTitulares(incidenteId, form);
      if (r.ok === false) { toast.error(r.error); return; }
      toast.success("Carta aos Titulares salva");
    });
  }

  async function gerarPreview() {
    startTransition(async () => {
      const r = await salvarFormularioTitulares(incidenteId, form);
      if (r.ok === false) { toast.error(r.error); return; }
      const texto = await gerarTextoTitularesParaPreview(incidenteId);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            💌 Carta aos Titulares
          </DialogTitle>
          <DialogDescription>
            <div className="text-xs text-gray-700">
              {incidenteTitulo} · {completude.preenchidos}/{completude.total} seções preenchidas
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Art. 48 §1º LGPD · Linguagem clara, sem juridiquês, pro cidadão comum.
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <Secao titulo="QUAIS DADOS SEUS PODEM TER SIDO AFETADOS" obrigatorio>
            <p className="text-[11px] text-gray-500 mb-2 italic">
              Marque APENAS os dados que de fato podem ter sido comprometidos no incidente.
              Honestidade é melhor que minimização — falsa segurança vira processo na ANPD.
            </p>
            <ListaCheckbox
              opcoes={OPCOES_DADOS_AFETADOS}
              selecionados={form.dadosAfetados || []}
              onToggle={(id) => toggleItem("dadosAfetados", id)}
            />
          </Secao>

          <Secao titulo="O QUE FIZEMOS" obrigatorio>
            <p className="text-[11px] text-gray-500 mb-2 italic">
              Marque APENAS as medidas que JÁ foram efetivamente adotadas.
              Não prometa o que não está em andamento — credibilidade vale mais.
            </p>
            <ListaCheckbox
              opcoes={OPCOES_O_QUE_FIZEMOS}
              selecionados={form.oQueFizemos || []}
              onToggle={(id) => toggleItem("oQueFizemos", id)}
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
              <DialogTitle>Texto final · Carta aos Titulares</DialogTitle>
              <DialogDescription className="text-[11px]">
                Texto pronto pra envio aos titulares (e-mail, SMS, correios, site).
                Use linguagem que sua avó entenderia.
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

function Secao({ titulo, obrigatorio, children }: {
  titulo: string; obrigatorio?: boolean; children: React.ReactNode;
}) {
  return (
    <details open className="border rounded-lg overflow-hidden">
      <summary className="cursor-pointer px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center gap-2 select-none border-b">
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
  opcoes: Array<{ id: string; rotulo: string }>;
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
            <span className="flex-1">{op.rotulo}</span>
            {checked && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />}
          </label>
        );
      })}
    </div>
  );
}
