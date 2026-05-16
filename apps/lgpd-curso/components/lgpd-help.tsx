"use client";

// Botão "?" ao lado do label de um campo. Click abre Dialog com:
//   - Artigo LGPD relevante
//   - O que diz a lei
//   - Pergunta-chave pra resposta
//   - Pegadinha pedagógica
//   - Exemplos do mundo Vegas
//   - Link pra Guia/Resolução ANPD
//
// Filosofia: ensina, não dá gabarito.

import { useState } from "react";
import { HelpCircle, BookOpen, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HELP_POR_CAMPO } from "@/lib/lgpd-refs";

export function LgpdHelp({ campoKey }: { campoKey: string }) {
  const [open, setOpen] = useState(false);
  const help = HELP_POR_CAMPO[campoKey];
  if (!help) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Ajuda LGPD — ${help.titulo}`}
        className="inline-flex items-center justify-center h-5 w-5 rounded-full text-brand-600 hover:bg-brand-50 transition-colors"
        aria-label="Abrir ajuda LGPD"
      >
        <HelpCircle className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600" />
              {help.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            {help.artigo && (
              <div className="bg-brand-50 border-l-4 border-brand-500 px-3 py-2 rounded text-xs font-medium text-brand-900">
                📖 {help.artigo}
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-0.5">O que a lei diz</div>
              <p className="text-gray-700 leading-relaxed">{help.oQueDiz}</p>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-0.5">Pergunta-chave</div>
              <p className="text-gray-900 font-medium leading-relaxed">{help.perguntaChave}</p>
            </div>

            {help.pegadinha && (
              <div className="bg-amber-50 border-l-4 border-amber-400 px-3 py-2 rounded">
                <div className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold mb-0.5">⚠ Pegadinha</div>
                <p className="text-amber-900 leading-relaxed text-xs">{help.pegadinha}</p>
              </div>
            )}

            {help.exemplos && help.exemplos.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Exemplos do mundo Vegas</div>
                <ul className="space-y-1">
                  {help.exemplos.map((ex, i) => (
                    <li key={i} className="text-xs text-gray-700 border-l-2 border-gray-300 pl-2">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {help.linkAnpd && (
              <a
                href={help.linkAnpd.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {help.linkAnpd.texto}
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
