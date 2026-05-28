"use client";

import { useState } from "react";
import { MessagesSquare, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/select";
import { ForumTurma } from "@/components/forum/forum-turma";

type Turma = {
  id: string;
  nome: string;
  cidade: string;
  proximoCurso: boolean;
  forumAberto: boolean;
  acessoFim: string | Date | null;
};

export function ForumFacilitador({ turmas: turmasIniciais }: { turmas: Turma[] }) {
  const [turmas, setTurmas] = useState(turmasIniciais);
  const inicial = turmas.find((t) => t.proximoCurso)?.id ?? turmas[0]?.id ?? "";
  const [turmaId, setTurmaId] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  const turma = turmas.find((t) => t.id === turmaId);

  async function toggleForum() {
    if (!turma) return;
    const novo = !turma.forumAberto;
    setSalvando(true);
    try {
      const res = await fetch("/api/curso/forum-aberto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId: turma.id, ativo: novo }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setTurmas((ts) => ts.map((t) => (t.id === turma.id ? { ...t, forumAberto: novo } : t)));
      toast.success(novo ? "Fórum aberto para a turma" : "Fórum fechado");
    } catch (e: any) {
      toast.error(e.message || "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-5">
        <div className="flex items-center gap-2.5">
          <MessagesSquare className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Fórum da turma</h1>
        </div>
        <p className="mt-1 text-gray-600">
          Canal de dúvidas e ajuda mútua depois do curso. Você participa e modera (pode fixar
          avisos e marcar dúvidas como resolvidas).
        </p>
      </header>

      <div className="mb-4">
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

      {turma && (
        <div
          className={`mb-5 rounded-xl border p-4 ${
            turma.forumAberto
              ? "border-green-300 bg-green-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                {turma.forumAberto ? (
                  <Unlock className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}
                {turma.forumAberto ? "Fórum aberto" : "Fórum fechado"}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {turma.forumAberto
                  ? "Os participantes conseguem entrar e usar o fórum mesmo depois da data limite do curso."
                  : "Abra o fórum para liberar o acesso pós-curso. Importante: ao abrir, os participantes voltam a entrar no app inteiro (não só no fórum)."}
              </p>
            </div>
            <button
              onClick={toggleForum}
              disabled={salvando}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
                turma.forumAberto ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {turma.forumAberto ? "Fechar fórum" : "Abrir fórum"}
            </button>
          </div>
        </div>
      )}

      {turmaId && <ForumTurma turmaId={turmaId} souFacilitador />}
    </div>
  );
}
