"use client";

// Cartaz (telão) de uma Atividade ao vivo. Polling 4s. Fontes grandes pra
// projeção. Mostra o agregado da turma em tempo real.

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { AgregadoAtividade } from "@/lib/atividades-c";
import { AgregadoView } from "../../agregado-view";
import { TermometroView, type GrupoTermometro } from "../../termometro-view";

type Turma = { id: string; nome: string; cidade: string; slug: string };
type Atividade = { id: string; titulo: string; fase: string; emoji: string; contexto?: string };

export function CartazAtividade({ turma, atividade }: { turma: Turma; atividade: Atividade }) {
  const ehTermometro = atividade.id === "termometro";

  const [agregado, setAgregado] = useState<AgregadoAtividade | null>(null);
  const [gruposTermometro, setGruposTermometro] = useState<GrupoTermometro[] | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function load() {
      try {
        if (!cancelado) setCarregando(true);

        if (ehTermometro) {
          const res = await fetch(
            `/api/curso/termometro/painel?turmaId=${turma.id}`,
            { cache: "no-store" },
          );
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelado) setGruposTermometro(data.grupos ?? []);
        } else {
          const res = await fetch(
            `/api/curso/atividade-c/painel?turmaId=${turma.id}&atividadeId=${atividade.id}`,
            { cache: "no-store" },
          );
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelado) setAgregado(data.agregado);
        }
      } catch {
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    load();
    const id = setInterval(load, 4000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [turma.id, atividade.id, ehTermometro]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 text-center">
          <p className="text-lg font-medium text-indigo-600">{atividade.fase}</p>
          <h1 className="text-4xl font-bold text-gray-900">
            {atividade.emoji} {atividade.titulo}
          </h1>
          {atividade.contexto && (
            <p className="mt-1 text-xl text-gray-600">{atividade.contexto}</p>
          )}
          <p className="mt-2 text-base text-gray-400">
            {turma.nome} · {turma.cidade}
            {carregando && (
              <RefreshCw className="inline h-4 w-4 ml-2 animate-spin align-text-bottom" />
            )}
          </p>
        </header>

        {ehTermometro ? (
          gruposTermometro ? (
            <TermometroView grupos={gruposTermometro} grande />
          ) : (
            <p className="text-center text-gray-500 text-xl">Carregando…</p>
          )
        ) : agregado ? (
          <AgregadoView agregado={agregado} grande />
        ) : (
          <p className="text-center text-gray-500 text-xl">Carregando…</p>
        )}
      </div>
    </div>
  );
}
