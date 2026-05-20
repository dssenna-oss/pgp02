"use client";

// Card colapsável "📚 Base legal desta fase" — fica no topo de cada mini-app.
// Recolhido por padrão (mobile-first: não rouba altura da tela). Ao tocar numa
// referência, abre um modal com texto da norma + linguagem simples + porquê.

import { useState } from "react";
import {
  BookOpen,
  BookMarked,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Scale,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  referenciasDaFase,
  type ReferenciaResolvida,
  type TipoReferencia,
} from "@/lib/referencias-por-fase";

const TIPO_META: Record<TipoReferencia, { Icon: typeof Scale; cor: string }> = {
  lei: { Icon: Scale, cor: "text-brand-600" },
  resolucao: { Icon: FileText, cor: "text-amber-600" },
  guia: { Icon: BookMarked, cor: "text-emerald-600" },
};

function ConteudoReferencia({ r }: { r: ReferenciaResolvida }) {
  return (
    <div className="space-y-3 text-sm">
      {r.textoBase && (
        <div className="bg-brand-50 border-l-4 border-brand-500 px-3 py-2 rounded">
          <div className="text-[10px] uppercase tracking-wide text-brand-700 font-semibold mb-0.5">
            📖 Texto da norma
          </div>
          <p className="text-brand-900 leading-relaxed text-xs">{r.textoBase}</p>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-0.5">
          💬 Em linguagem simples
        </div>
        <p className="text-gray-700 leading-relaxed">{r.emMiudos}</p>
      </div>

      <div className="bg-emerald-50 border-l-4 border-emerald-400 px-3 py-2 rounded">
        <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-0.5">
          🎯 Por que importa nesta fase
        </div>
        <p className="text-emerald-900 leading-relaxed text-xs">{r.porQueImporta}</p>
      </div>

      {r.link && (
        <a
          href={r.link.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {r.link.texto}
        </a>
      )}
    </div>
  );
}

export function BaseLegalCard({ faseKey }: { faseKey: string }) {
  const data = referenciasDaFase(faseKey);
  const [aberto, setAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<ReferenciaResolvida | null>(null);

  if (!data || data.refs.length === 0) return null;
  const n = data.refs.length;

  return (
    <div className="mb-6 border border-brand-500/30 rounded-lg bg-brand-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-brand-50 transition-colors"
      >
        <BookOpen className="h-4 w-4 text-brand-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-brand-900 flex-1">
          📚 Base legal desta fase
        </span>
        <span className="text-[11px] text-brand-700 hidden sm:inline">
          {n} referência{n > 1 ? "s" : ""}
        </span>
        {aberto ? (
          <ChevronDown className="h-4 w-4 text-brand-600 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-brand-600 flex-shrink-0" />
        )}
      </button>

      {aberto && (
        <div className="px-3 pb-3 space-y-1.5">
          <p className="text-[11px] text-brand-700 px-1 pb-0.5">
            {data.nome} · toque numa referência para ler a explicação.
          </p>
          {data.refs.map((r) => {
            const Icon = TIPO_META[r.tipo].Icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelecionada(r)}
                className="w-full flex items-center gap-2.5 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-brand-500 hover:bg-brand-50 transition-colors"
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${TIPO_META[r.tipo].cor}`} />
                <span className="text-sm text-gray-800 flex-1 leading-snug">{r.rotulo}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!selecionada} onOpenChange={(o) => !o && setSelecionada(null)}>
        <DialogContent className="max-w-lg">
          {selecionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-2 leading-snug">
                  <BookOpen className="h-4 w-4 mt-0.5 text-brand-600 flex-shrink-0" />
                  <span>{selecionada.rotulo}</span>
                </DialogTitle>
              </DialogHeader>
              <ConteudoReferencia r={selecionada} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
