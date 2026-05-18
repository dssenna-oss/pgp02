"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, AlertTriangle, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type ControleCatalogo = {
  id: number;
  fase: string;
  area: string;
  texto: string;
  hint?: string;
};

type FaseOrdem = {
  id: string;
  nome: string;
  cor: string;
  emoji: string;
};

type Payload = {
  turma: { id: string; nome: string; cidade: string };
  pacoteAtual: number[];
  customizado: boolean;
  catalogo: ControleCatalogo[];
  fasesOrdem: FaseOrdem[];
  pacoteDefaultIds: number[];
  tamanhoFixo: number;
  qtdRespostas: number;
};

export function PacoteGapEditor({ turmaId }: { turmaId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/curso/turma/${turmaId}/pacote-gap`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Payload) => {
        setData(d);
        setSelecionados(new Set(d.pacoteAtual));
      })
      .catch(() => toast.error("Falha ao carregar catálogo"));
  }, [turmaId]);

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 p-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando catálogo de 30 controles...
      </div>
    );
  }

  const { catalogo, fasesOrdem, pacoteDefaultIds, tamanhoFixo, qtdRespostas, customizado } = data;
  const total = selecionados.size;
  const pronto = total === tamanhoFixo && !salvando;

  function toggle(id: number) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        if (novo.size >= tamanhoFixo) {
          toast(`Já tem ${tamanhoFixo} marcados — desmarque um antes`, { icon: "ℹ️" });
          return prev;
        }
        novo.add(id);
      }
      return novo;
    });
  }

  function carregarPadrao() {
    setSelecionados(new Set(pacoteDefaultIds));
    toast.success(`${tamanhoFixo} controles do pacote padrão carregados`);
  }

  function limpar() {
    setSelecionados(new Set());
  }

  async function salvar() {
    if (selecionados.size !== tamanhoFixo) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/curso/turma/${turmaId}/pacote-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selecionados] }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error || "Erro");
        return;
      }
      toast.success(j.customizado ? "Pacote customizado salvo" : "Pacote padrão aplicado");
      router.push("/admin/pacote-gap");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  }

  // Agrupa catálogo por fase
  const porFase = new Map<string, ControleCatalogo[]>();
  for (const c of catalogo) {
    const arr = porFase.get(c.fase) || [];
    arr.push(c);
    porFase.set(c.fase, arr);
  }

  return (
    <div>
      {/* Toolbar fixa */}
      <div className="sticky top-0 z-10 bg-white border rounded-lg p-3 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 flex items-center gap-3">
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              total === tamanhoFixo ? "text-emerald-600" : total > tamanhoFixo ? "text-red-600" : "text-amber-600",
            )}>
              {total} / {tamanhoFixo}
            </span>
            <span className="text-xs text-gray-600">
              {total < tamanhoFixo && `marque mais ${tamanhoFixo - total}`}
              {total === tamanhoFixo && "✓ pronto pra salvar"}
              {total > tamanhoFixo && "passou do limite"}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded ${customizado ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"}`}>
              Atualmente: {customizado ? "customizado" : "padrão"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={carregarPadrao}>
            <RotateCcw className="h-3.5 w-3.5" /> Carregar padrão
          </Button>
          <Button variant="ghost" size="sm" onClick={limpar}>
            Limpar
          </Button>
          <Button onClick={salvar} disabled={!pronto}>
            {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar pacote
          </Button>
        </div>

        {qtdRespostas > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Atenção: já há <strong>{qtdRespostas} respostas registradas</strong> na turma. Trocar o pacote
              agora pode invalidar respostas anteriores (elas ficam no banco mas não aparecem mais na tela do GAP).
            </span>
          </div>
        )}
      </div>

      {/* Lista de fases */}
      <div className="space-y-5">
        {fasesOrdem.map((fase) => {
          const controles = porFase.get(fase.id) || [];
          if (controles.length === 0) return null;
          const marcadosNaFase = controles.filter((c) => selecionados.has(c.id)).length;
          return (
            <section key={fase.id}>
              <h2 className={cn(
                "flex items-center gap-2 text-sm font-semibold text-gray-800 border-l-4 pl-3 py-1 mb-2 bg-gray-50/60",
                fase.cor,
              )}>
                <Flag className="h-4 w-4 text-gray-500" />
                <span>{fase.emoji} {fase.nome}</span>
                <span className="text-[11px] font-normal text-gray-500 ml-auto tabular-nums">
                  {marcadosNaFase}/{controles.length} marcados
                </span>
              </h2>

              <div className="space-y-2">
                {controles.map((c) => {
                  const checked = selecionados.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors",
                        checked
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white hover:bg-gray-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{c.id}</span>
                          <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">{c.area}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 leading-snug">{c.texto}</div>
                        {c.hint && <div className="text-xs text-gray-500 mt-1 leading-relaxed">{c.hint}</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
