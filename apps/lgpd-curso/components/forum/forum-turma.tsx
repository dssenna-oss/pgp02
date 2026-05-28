"use client";

// Fórum da turma — UI compartilhada entre participante (/dashboard/forum) e
// facilitador (/facilitador/forum). Lista de tópicos + detalhe com respostas,
// reação 👍 "útil", marcar resolvida e (só facilitador) fixar no topo.
// Polling simples: lista a cada 8s, detalhe a cada 5s.

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Pin,
  CheckCircle2,
  ThumbsUp,
  MessageCircle,
  Send,
  Plus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type Uteis = { total: number; eu: boolean };
type Autor = {
  autorNome: string;
  autorPapel: string | null;
  autorGrupoNumero: number | null;
  autorOrgao: string | null;
  autorEhFacilitador: boolean;
};
type Thread = Autor & {
  id: string;
  titulo: string;
  corpo: string;
  resolvido: boolean;
  fixado: boolean;
  createdAt: string;
  respostas: number;
  uteis: number;
};
type Mensagem = Autor & { id: string; corpo: string; createdAt: string; uteis: Uteis };
type Detalhe = {
  thread: Thread & { uteis: Uteis };
  mensagens: Mensagem[];
  souAutorThread: boolean;
  souFacilitador: boolean;
};

function autorLabel(a: Autor) {
  if (a.autorEhFacilitador) return `${a.autorNome} · Facilitador`;
  const partes = [a.autorNome];
  if (a.autorPapel) partes.push(a.autorPapel);
  if (a.autorGrupoNumero) partes.push(`Grupo ${a.autorGrupoNumero}${a.autorOrgao ? ` (${a.autorOrgao})` : ""}`);
  return partes.join(" · ");
}

function quando(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function ForumTurma({ turmaId, souFacilitador }: { turmaId?: string; souFacilitador: boolean }) {
  const qs = turmaId ? `?turmaId=${encodeURIComponent(turmaId)}` : "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(true);

  // form nova dúvida
  const [novaAberta, setNovaAberta] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoCorpo, setNovoCorpo] = useState("");
  // form resposta
  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregarLista = useCallback(async () => {
    try {
      const res = await fetch(`/api/curso/forum${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads ?? []);
    } finally {
      setCarregando(false);
    }
  }, [qs]);

  const carregarDetalhe = useCallback(async (id: string) => {
    const sep = qs ? "&" : "?";
    const res = await fetch(`/api/curso/forum${qs}${sep}threadId=${id}`, { cache: "no-store" });
    if (!res.ok) return;
    setDetalhe(await res.json());
  }, [qs]);

  // polling lista
  useEffect(() => {
    if (abertoId) return;
    carregarLista();
    const t = setInterval(carregarLista, 8000);
    return () => clearInterval(t);
  }, [abertoId, carregarLista]);

  // polling detalhe
  useEffect(() => {
    if (!abertoId) return;
    carregarDetalhe(abertoId);
    const t = setInterval(() => carregarDetalhe(abertoId), 5000);
    return () => clearInterval(t);
  }, [abertoId, carregarDetalhe]);

  async function post(body: any) {
    const res = await fetch("/api/curso/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, turmaId }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || "Erro");
    }
    return res.json();
  }

  async function criarThread() {
    if (!novoTitulo.trim() || !novoCorpo.trim()) {
      toast.error("Preencha o título e a mensagem");
      return;
    }
    setEnviando(true);
    try {
      const { threadId } = await post({ acao: "nova-thread", titulo: novoTitulo, corpo: novoCorpo });
      setNovoTitulo("");
      setNovoCorpo("");
      setNovaAberta(false);
      await carregarLista();
      if (threadId) setAbertoId(threadId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function responder() {
    if (!resposta.trim() || !abertoId) return;
    setEnviando(true);
    try {
      await post({ acao: "responder", threadId: abertoId, corpo: resposta });
      setResposta("");
      await carregarDetalhe(abertoId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function util(alvoTipo: "THREAD" | "MENSAGEM", alvoId: string) {
    try {
      await post({ acao: "util", alvoTipo, alvoId });
      if (abertoId) await carregarDetalhe(abertoId);
      else await carregarLista();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function resolver() {
    if (!abertoId) return;
    try {
      const { resolvido } = await post({ acao: "resolver", threadId: abertoId });
      toast.success(resolvido ? "Marcada como resolvida" : "Reaberta");
      await carregarDetalhe(abertoId);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function fixar() {
    if (!abertoId) return;
    try {
      const { fixado } = await post({ acao: "fixar", threadId: abertoId });
      toast.success(fixado ? "Fixada no topo" : "Desafixada");
      await carregarDetalhe(abertoId);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  // ---------- DETALHE ----------
  if (abertoId && detalhe) {
    const t = detalhe.thread;
    return (
      <div>
        <button
          onClick={() => { setAbertoId(null); setDetalhe(null); }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a lista
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {t.fixado && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Pin className="h-3 w-3" /> Fixado
              </span>
            )}
            {t.resolvido && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Resolvida
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{t.titulo}</h2>
          <p className="text-xs text-gray-500 mb-2">{autorLabel(t)} · {quando(t.createdAt)}</p>
          <p className="text-gray-800 whitespace-pre-wrap">{t.corpo}</p>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => util("THREAD", t.id)}
              className={`inline-flex items-center gap-1.5 text-sm rounded-full border px-2.5 py-1 ${
                t.uteis.eu ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Útil {t.uteis.total > 0 ? `· ${t.uteis.total}` : ""}
            </button>
            {(detalhe.souAutorThread || souFacilitador) && (
              <button onClick={resolver} className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900">
                <CheckCircle2 className="h-4 w-4" /> {t.resolvido ? "Reabrir" : "Marcar resolvida"}
              </button>
            )}
            {souFacilitador && (
              <button onClick={fixar} className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900">
                <Pin className="h-4 w-4" /> {t.fixado ? "Desafixar" : "Fixar"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {detalhe.mensagens.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl border p-3 ${m.autorEhFacilitador ? "border-indigo-200 bg-indigo-50/40" : "border-gray-200 bg-white"}`}
            >
              <p className="text-xs text-gray-500 mb-1">{autorLabel(m)} · {quando(m.createdAt)}</p>
              <p className="text-gray-800 whitespace-pre-wrap">{m.corpo}</p>
              <button
                onClick={() => util("MENSAGEM", m.id)}
                className={`mt-2 inline-flex items-center gap-1.5 text-xs rounded-full border px-2 py-0.5 ${
                  m.uteis.eu ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ThumbsUp className="h-3 w-3" /> Útil {m.uteis.total > 0 ? `· ${m.uteis.total}` : ""}
              </button>
            </div>
          ))}
          {detalhe.mensagens.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Ainda sem respostas. Seja o primeiro a ajudar.</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
          <textarea
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Escreva uma resposta…"
            rows={3}
            className="w-full resize-y rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={responder}
              disabled={enviando || !resposta.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Responder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- LISTA ----------
  return (
    <div>
      {!novaAberta ? (
        <button
          onClick={() => setNovaAberta(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 mb-4"
        >
          <Plus className="h-4 w-4" /> Nova dúvida
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4 mb-5">
          <input
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            placeholder="Título da dúvida"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-2"
          />
          <textarea
            value={novoCorpo}
            onChange={(e) => setNovoCorpo(e.target.value)}
            placeholder="Descreva sua dúvida ou o que quer compartilhar…"
            rows={4}
            className="w-full resize-y rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => { setNovaAberta(false); setNovoTitulo(""); setNovoCorpo(""); }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={criarThread}
              disabled={enviando}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar
            </button>
          </div>
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-gray-400 text-center py-8">Carregando…</p>
      ) : threads.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhuma dúvida ainda. Comece o primeiro tópico da turma.
        </p>
      ) : (
        <div className="space-y-2.5">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setAbertoId(t.id)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-3.5 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {t.fixado && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <Pin className="h-3 w-3" /> Fixado
                  </span>
                )}
                {t.resolvido && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Resolvida
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900">{t.titulo}</p>
              <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{t.corpo}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{autorLabel(t)}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {t.respostas}</span>
                {t.uteis > 0 && <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> {t.uteis}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
