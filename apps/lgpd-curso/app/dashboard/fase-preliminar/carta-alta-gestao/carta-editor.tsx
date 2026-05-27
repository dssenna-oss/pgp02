"use client";

// Carta para a Alta Gestão — Fase Preliminar (PC).
// 5 campos com TEMPLATES institucionais auto-preenchidos. Grupo aceita ou
// personaliza, salva como rascunho, finaliza e baixa DOCX formal.

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Send, Sparkles, FileDown, Check } from "lucide-react";
import type { CartaAltaGestaoData, CartaAltaGestaoSalva } from "@/lib/carta-alta-gestao";
import { salvarCarta } from "./actions";

export function CartaEditor({
  salva,
  templateSugerido,
}: {
  salva: CartaAltaGestaoSalva | null;
  templateSugerido: CartaAltaGestaoData;
}) {
  // Estado inicial: se já salvo, usa; senão, vazio (NÃO pré-preenche
  // automaticamente — botão Auto-preencher é explícito pro grupo decidir).
  const [data, setData] = useState<CartaAltaGestaoData>(() =>
    salva
      ? {
          destinatario: salva.destinatario,
          justificativa: salva.justificativa,
          riscosNaoFazer: salva.riscosNaoFazer,
          pedido: salva.pedido,
          assinatura: salva.assinatura,
        }
      : {
          destinatario: "",
          justificativa: "",
          riscosNaoFazer: "",
          pedido: "",
          assinatura: "",
        },
  );
  const [salvando, setSalvando] = useState(false);
  const finalizada = !!salva?.finalizadaEm;

  function aplicarTemplate() {
    if (
      data.destinatario.trim() ||
      data.justificativa.trim() ||
      data.riscosNaoFazer.trim() ||
      data.pedido.trim()
    ) {
      const ok = confirm(
        "Você já tem texto preenchido. Aplicar o template vai SOBRESCREVER tudo. Continuar?",
      );
      if (!ok) return;
    }
    setData(templateSugerido);
    toast.success("Template institucional aplicado nos 5 campos. Revise e personalize se quiser.");
  }

  function set<K extends keyof CartaAltaGestaoData>(campo: K, valor: CartaAltaGestaoData[K]) {
    setData((prev) => ({ ...prev, [campo]: valor }));
  }

  async function salvar(finalizar: boolean) {
    // Valida: todos os campos preenchidos pra finalizar
    if (finalizar) {
      const vazios: string[] = [];
      if (!data.destinatario.trim()) vazios.push("Destinatário");
      if (!data.justificativa.trim()) vazios.push("Justificativa");
      if (!data.riscosNaoFazer.trim()) vazios.push("Riscos");
      if (!data.pedido.trim()) vazios.push("Pedido");
      if (!data.assinatura.trim()) vazios.push("Assinatura");
      if (vazios.length > 0) {
        toast.error(`Preencha antes de finalizar: ${vazios.join(", ")}.`);
        return;
      }
    }
    setSalvando(true);
    try {
      const r = await salvarCarta(data, finalizar);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(finalizar ? "✅ Carta finalizada — pode baixar o DOCX." : "Rascunho salvo.");
    } finally {
      setSalvando(false);
    }
  }

  function baixarDocx() {
    window.open("/api/curso/carta-alta-gestao/docx", "_blank");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/dashboard/fase-preliminar"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar à Fase Preliminar
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Fase Preliminar · Prática PC
          </div>
          <h1 className="text-2xl font-bold text-gray-900">📜 Carta para a Alta Gestão</h1>
          <p className="text-sm text-gray-600 mt-1">
            Documento institucional formal solicitando apoio para a implementação do PGP.
            5 campos com templates auto-preenchidos — revise, personalize e gere o DOCX para
            impressão e assinatura.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <button
            type="button"
            onClick={aplicarTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-300 bg-blue-50 text-blue-800 text-xs font-medium hover:bg-blue-100"
            title="Aplica os 5 campos com texto institucional padrão — sobrescreve o atual"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto-preencher
          </button>
        </div>
      </div>

      {finalizada && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <span className="font-semibold">✅ Carta finalizada</span> em{" "}
          {new Date(salva!.finalizadaEm!).toLocaleString("pt-BR")}. Você pode regerar o DOCX ou
          continuar editando para uma nova versão.
        </div>
      )}

      <div className="mt-5 space-y-4">
        <CampoCarta
          numero={1}
          rotulo="Destinatário"
          hint="Cabeçalho de tratamento — quem recebe a carta formalmente."
          tipo="input"
          valor={data.destinatario}
          onChange={(v) => set("destinatario", v)}
          placeholder='Ex: Excelentíssimo(a) Senhor(a) Prefeito(a) Municipal de Vegas'
        />
        <CampoCarta
          numero={2}
          rotulo="Justificativa principal"
          hint="Por que LGPD agora? Contextualiza a obrigação legal e a aplicabilidade ao órgão."
          tipo="textarea"
          valor={data.justificativa}
          onChange={(v) => set("justificativa", v)}
          minRows={6}
          placeholder="A Lei nº 13.709/2018 (LGPD) está em vigor desde..."
        />
        <CampoCarta
          numero={3}
          rotulo="Riscos do não-fazer"
          hint="Consequências institucionais de não se adequar — sanções ANPD, responsabilidade civil, imagem."
          tipo="textarea"
          valor={data.riscosNaoFazer}
          onChange={(v) => set("riscosNaoFazer", v)}
          minRows={8}
          placeholder="O não-cumprimento expõe o órgão a..."
        />
        <CampoCarta
          numero={4}
          rotulo="Pedido específico ao gestor"
          hint="O que se solicita formalmente — apoio, designação do DPO, recursos, agenda institucional."
          tipo="textarea"
          valor={data.pedido}
          onChange={(v) => set("pedido", v)}
          minRows={8}
          placeholder="Solicitamos formalmente o apoio..."
        />
        <CampoCarta
          numero={5}
          rotulo="Assinatura"
          hint="Encerramento + identificação do(a) Encarregado(a) designado(a)."
          tipo="textarea"
          valor={data.assinatura}
          onChange={(v) => set("assinatura", v)}
          minRows={3}
          placeholder="Respeitosamente,&#10;&#10;Nome do(a) DPO&#10;Encarregado(a) pelo Tratamento de Dados Pessoais"
        />
      </div>

      {/* Footer com ações */}
      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap sticky bottom-0 bg-white/95 backdrop-blur border-t pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="text-xs text-gray-500">
          {salva?.atualizadoEm ? (
            <>Última gravação: {new Date(salva.atualizadoEm).toLocaleString("pt-BR")}</>
          ) : (
            <>Sem gravação ainda. Use o botão Auto-preencher pra começar rápido.</>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => salvar(false)}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => salvar(true)}
            disabled={salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {finalizada ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {finalizada ? "Atualizar versão final" : "Finalizar"}
          </button>
          <button
            type="button"
            onClick={baixarDocx}
            disabled={!finalizada}
            title={finalizada ? "Baixar DOCX da carta finalizada" : "Finalize antes de baixar"}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="h-3.5 w-3.5" /> Baixar DOCX
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoCarta({
  numero,
  rotulo,
  hint,
  tipo,
  valor,
  onChange,
  placeholder,
  minRows,
}: {
  numero: number;
  rotulo: string;
  hint: string;
  tipo: "input" | "textarea";
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start gap-3 mb-2">
        <span className="shrink-0 h-7 w-7 rounded-full bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center">
          {numero}
        </span>
        <div className="flex-1 min-w-0">
          <label className="block text-base font-bold text-gray-900 leading-tight">{rotulo}</label>
          <p className="text-xs text-gray-600 mt-0.5">{hint}</p>
        </div>
      </div>
      {tipo === "input" ? (
        <input
          type="text"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ml-10 w-[calc(100%-2.5rem)] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      ) : (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows || 4}
          className="ml-10 w-[calc(100%-2.5rem)] px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono leading-relaxed"
        />
      )}
    </div>
  );
}
