"use client";

// Widget "🔑 Senha de acesso" — fica na seção FACILITADOR da sidebar.
// Lista as turmas com a senha de login dos participantes, oculta por padrão
// (Exibir/Ocultar), com copiar e Definir/Alterar senha.
// Útil pro facilitador relembrar/divulgar a senha à turma.

import { useState } from "react";
import {
  KeyRound, Eye, EyeOff, Copy, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type TurmaSenha = {
  id: string;
  nome: string;
  cidade: string;
  senhaExibicao: string | null;
  proximoCurso: boolean;
};

export function SenhaTurmasWidget() {
  const [aberto, setAberto] = useState(false);
  const [turmas, setTurmas] = useState<TurmaSenha[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [visiveis, setVisiveis] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await fetch("/api/curso/turmas-senhas", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setTurmas(data.turmas);
      else toast.error(data.error || "Erro ao carregar turmas");
    } catch {
      toast.error("Erro de rede ao carregar turmas");
    } finally {
      setCarregando(false);
    }
  }

  function toggleAberto() {
    const novo = !aberto;
    setAberto(novo);
    if (novo && turmas === null) carregar();
  }

  function toggleVisivel(id: string) {
    setVisiveis((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function copiar(senha: string) {
    try {
      await navigator.clipboard.writeText(senha);
      toast.success("Senha copiada");
    } catch {
      toast.error("Não consegui copiar — copie manualmente");
    }
  }

  function abrirEdicao(id: string) {
    setEditando(id);
    setNovaSenha("");
  }

  async function salvarSenha(turmaId: string) {
    const senha = novaSenha.trim();
    if (senha.length < 4) {
      toast.error("A senha precisa de ao menos 4 caracteres");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/curso/redefinir-senha-turma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaId, novaSenha: senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar senha");
        return;
      }
      toast.success(`Senha alterada · ${data.usuariosAtualizados} login(s)`);
      setEditando(null);
      setNovaSenha("");
      setVisiveis((s) => new Set(s).add(turmaId));
      carregar();
    } catch {
      toast.error("Erro de rede ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggleAberto}
        aria-expanded={aberto}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        <KeyRound className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Senha de acesso</span>
        {aberto
          ? <ChevronDown className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-gray-500 shrink-0" />}
      </button>

      {aberto && (
        <div className="mt-1 mx-1 space-y-2">
          {carregando && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Carregando…
            </div>
          )}

          {!carregando && turmas && turmas.length === 0 && (
            <div className="px-2 py-1 text-[11px] text-gray-400">
              Nenhuma turma criada ainda.
            </div>
          )}

          {!carregando && turmas && turmas.map((t) => {
            const emEdicao = editando === t.id;
            const visivel = visiveis.has(t.id);
            return (
              <div key={t.id} className="rounded-md border border-gray-200 bg-white p-2">
                <div className="text-[12px] font-medium text-gray-800 truncate">
                  {t.proximoCurso && <span title="Próximo curso">🎯 </span>}
                  {t.nome} · {t.cidade}
                </div>

                {emEdicao ? (
                  <div className="mt-1.5 space-y-1.5">
                    <input
                      type="text"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Nova senha"
                      autoFocus
                      className="w-full text-[12px] border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-brand-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => salvarSenha(t.id)}
                        disabled={salvando}
                        className="flex-1 text-[11px] font-medium bg-brand-600 text-white rounded py-1.5 hover:bg-brand-700 disabled:opacity-60"
                      >
                        {salvando ? "Salvando…" : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditando(null); setNovaSenha(""); }}
                        disabled={salvando}
                        className="text-[11px] text-gray-600 border border-gray-300 rounded py-1.5 px-2 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-1 flex items-center gap-1">
                      {t.senhaExibicao ? (
                        <>
                          <code className="flex-1 text-[12px] font-mono bg-gray-50 rounded px-1.5 py-1 truncate">
                            {visivel ? t.senhaExibicao : "••••••••"}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleVisivel(t.id)}
                            title={visivel ? "Ocultar" : "Exibir"}
                            aria-label={visivel ? "Ocultar senha" : "Exibir senha"}
                            className="h-7 w-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 shrink-0"
                          >
                            {visivel ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copiar(t.senhaExibicao!)}
                            title="Copiar senha"
                            aria-label="Copiar senha"
                            className="h-7 w-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 shrink-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="flex-1 text-[11px] text-gray-400 italic">
                          senha não definida
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(t.id)}
                      className="mt-1 text-[11px] text-brand-600 hover:underline"
                    >
                      {t.senhaExibicao ? "Alterar senha" : "Definir senha"}
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {!carregando && turmas && turmas.length > 0 && (
            <p className="px-1 text-[10px] text-gray-400 leading-snug">
              Alterar a senha aqui muda o login de todos os participantes da turma.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
