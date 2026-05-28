"use client";

// Painel do Facilitador — Atividades ao vivo (Modalidade C, Onda 2).
// Seleciona turma + atividade, mostra o agregado em tempo real (polling 4s) e
// quantos de cada grupo já responderam. Link pro cartaz (telão).

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Projector, LayoutGrid, Users } from "lucide-react";
import { Select } from "@/components/ui/select";
import { ATIVIDADES_C, type AgregadoAtividade } from "@/lib/atividades-c";
import { AgregadoView } from "./agregado-view";

type Turma = {
  id: string;
  nome: string;
  cidade: string;
  slug: string;
  proximoCurso: boolean;
};

type Dados = {
  atividade: { id: string; titulo: string; fase: string; emoji: string };
  agregado: AgregadoAtividade;
  porGrupo: { numero: number; orgao: string; respondentes: number }[];
  geradoEm: string;
};

export function PainelAtividades({ turmas }: { turmas: Turma[] }) {
  const inicial = turmas.find((t) => t.proximoCurso)?.id ?? turmas[0]?.id ?? "";
  const [turmaId, setTurmaId] = useState(inicial);
  const [atividadeId, setAtividadeId] = useState(ATIVIDADES_C[0]?.id ?? "");
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(false);

  const turmaSel = turmas.find((t) => t.id === turmaId);

  useEffect(() => {
    if (!turmaId || !atividadeId) return;
    let cancelado = false;
    setDados(null);
    async function load() {
      try {
        if (!cancelado) setCarregando(true);
        const res = await fetch(
          `/api/curso/atividade-c/painel?turmaId=${turmaId}&atividadeId=${atividadeId}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setDados(data);
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
  }, [turmaId, atividadeId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-5">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Atividades ao vivo</h1>
        </div>
        <p className="mt-1 text-gray-600">
          Modalidade C · Onda 2. Os participantes respondem no celular; o resultado do grupo
          aparece aqui e no telão (cartaz).
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
          <Select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.proximoCurso ? "🎯 " : ""}
                {t.nome} · {t.cidade}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Atividade</label>
          <Select value={atividadeId} onChange={(e) => setAtividadeId(e.target.value)}>
            {ATIVIDADES_C.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.titulo}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          {carregando && <RefreshCw className="h-4 w-4 animate-spin" />}
          {dados ? `${dados.agregado.respondentes} respostas` : "carregando…"}
        </div>
        {turmaSel && (
          <Link
            href={`/facilitador/atividades/cartaz/${turmaSel.slug}?a=${atividadeId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Projector className="h-4 w-4" /> Abrir cartaz (telão)
          </Link>
        )}
      </div>

      {dados && <AgregadoView agregado={dados.agregado} />}

      {dados && dados.porGrupo.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-3">
            <Users className="h-4 w-4" /> Respostas por grupo
          </p>
          <div className="flex flex-wrap gap-2">
            {dados.porGrupo.map((g) => (
              <span
                key={`${g.numero}-${g.orgao}`}
                className={`text-sm px-2.5 py-1 rounded-full border ${
                  g.respondentes > 0
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                Grupo {g.numero} ({g.orgao}): {g.respondentes}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
