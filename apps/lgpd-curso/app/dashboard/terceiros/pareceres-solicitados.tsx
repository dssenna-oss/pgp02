"use client";

// Seção "O DPO pediu seu parecer" — aparece pro membro de um setor de apoio
// (TI, Jurídico, etc.) quando o DPO tramitou um terceiro pro papel dele.
// Fica FORA do FaseReadOnlyWrapper de propósito: a Gestão de Terceiros é
// DPO-only (contribuidor entra em modo leitura), mas o setor de apoio precisa
// poder responder o parecer. Opção B — o setor opina, o DPO ajusta.

import { useState } from "react";
import { ClipboardList, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { enviarParecerOperador } from "./actions";
import toast from "react-hot-toast";

type Op = {
  id: string;
  nome: string;
  tramitadoPara: string | null;
  tramitacaoNota: string | null;
  tramitacaoParecer: string | null;
};

export function PareceresSolicitados({
  operadores,
  role,
  papel,
}: {
  operadores: Op[];
  role: string | null;
  papel: string | null;
}) {
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);

  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";
  // Operadores tramitados pro meu papel que ainda não receberam parecer.
  const pendentes =
    isDpoOuAdmin || !papel
      ? []
      : operadores.filter((o) => o.tramitadoPara === papel && !o.tramitacaoParecer);

  if (pendentes.length === 0) return null;

  async function enviar(operatorId: string) {
    const texto = (textos[operatorId] || "").trim();
    if (texto.length < 10) {
      toast.error("Escreva um parecer com ao menos 10 caracteres.");
      return;
    }
    setEnviando(operatorId);
    try {
      await enviarParecerOperador(operatorId, texto);
      toast.success("Parecer enviado ao DPO");
      setTextos((t) => ({ ...t, [operatorId]: "" }));
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar parecer");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="mb-6 border border-violet-300 rounded-lg bg-violet-50/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 border-b border-violet-200">
        <ClipboardList className="h-4 w-4 text-violet-700 flex-shrink-0" />
        <span className="text-sm font-semibold text-violet-900">
          O DPO pediu seu parecer ({pendentes.length})
        </span>
      </div>
      <div className="p-3 space-y-3">
        {pendentes.map((o) => (
          <div key={o.id} className="rounded-md border border-violet-200 bg-white p-3">
            <div className="text-sm font-semibold text-gray-800">{o.nome}</div>
            <div className="mt-1.5 text-xs bg-violet-50 border-l-2 border-violet-400 px-2.5 py-1.5 rounded">
              <span className="font-medium text-violet-800">Pedido do DPO:</span>{" "}
              <span className="text-violet-900 italic">&quot;{o.tramitacaoNota}&quot;</span>
            </div>
            <Textarea
              rows={3}
              className="mt-2 text-sm"
              placeholder="Escreva seu parecer técnico/jurídico sobre este terceiro…"
              value={textos[o.id] || ""}
              onChange={(e) => setTextos((t) => ({ ...t, [o.id]: e.target.value }))}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={() => enviar(o.id)} disabled={enviando === o.id}>
                <Send className="h-3.5 w-3.5" />
                {enviando === o.id ? "Enviando…" : "Enviar parecer ao DPO"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
