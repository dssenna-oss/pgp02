"use client";

// Editor do documento institucional do PRI (Frente 3). Espelha o editor do
// Aviso de Privacidade, em versão enxuta: markdown + preview, salvar/publicar/
// reabrir/auto-preencher. Sem erros plantados nem pré-requisitos travados.

import { useState, useTransition, useMemo } from "react";
import { Send, CheckCircle2, Sparkles, AlertTriangle, Unlock, Eye, EyeOff } from "lucide-react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { savePri, publicarPri, autoPreencherPri, reabrirPri } from "./actions";
import { PRI_SECOES, gerarRascunhoPri } from "@/lib/pri-secoes";
import { detectarPlaceholders } from "@/lib/aviso-auto-preencher";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Pri = {
  id: string;
  conteudoMd: string;
  status: string;
  publicSlug: string | null;
} | null;

export function PriEditor({ pri }: { pri: Pri }) {
  const initial = pri?.conteudoMd ?? gerarRascunhoPri();
  const [conteudo, setConteudo] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(true);
  const publicado = pri?.status === "PUBLICADO";

  const htmlPreview = useMemo(() => {
    try {
      return marked.parse(conteudo || "", { async: false }) as string;
    } catch {
      return "<p><em>Erro ao renderizar preview</em></p>";
    }
  }, [conteudo]);

  const placeholders = useMemo(() => detectarPlaceholders(conteudo), [conteudo]);

  function salvar() {
    startTransition(async () => {
      try {
        const r = await savePri(conteudo);
        if (handlePhaseSkipResult(r)) return;
        toast.success("Rascunho salvo");
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function publicar() {
    if (!pri) {
      toast.error("Salve um rascunho primeiro");
      return;
    }
    if (placeholders.length > 0) {
      toast.error(`Publicação bloqueada: ${placeholders.length} placeholder(s) ainda no texto.`);
      return;
    }
    startTransition(async () => {
      try {
        const r = await publicarPri();
        if (handlePhaseSkipResult(r)) return;
        if (r && "ok" in r && r.ok === false) {
          toast.error(r.error);
          return;
        }
        toast.success("PRI publicado!");
      } catch (e: any) {
        toast.error(e?.message || "Erro ao publicar");
      }
    });
  }

  function autoPreencher() {
    const tinhaTexto = conteudo.trim().length > 0 && conteudo !== gerarRascunhoPri();
    if (
      tinhaTexto &&
      !confirm(
        "Isso vai substituir o texto atual pelo PRI montado a partir dos dados do app (órgão, Encarregado, Equipe do PRI). Continuar?",
      )
    )
      return;
    startTransition(async () => {
      try {
        const r = await autoPreencherPri();
        if (r.ok === false) {
          toast.error(r.error);
          return;
        }
        setConteudo(r.md);
        toast.success("PRI preenchido — revise os trechos [entre colchetes] antes de publicar");
      } catch (e: any) {
        toast.error(e?.message || "Erro ao auto-preencher");
      }
    });
  }

  function reabrir() {
    if (!confirm("Voltar este PRI pra rascunho? A URL pública vai parar de funcionar até nova publicação."))
      return;
    startTransition(async () => {
      try {
        const r = await reabrirPri();
        if (handlePhaseSkipResult(r)) return;
        if (r && "ok" in r && r.ok === false) {
          toast.error(r.error);
          return;
        }
        toast.success("PRI reaberto como rascunho");
      } catch (e: any) {
        toast.error(e?.message || "Erro ao reabrir");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg bg-white">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Documento do Plano de Resposta a Incidentes</h3>
            <Badge variant={publicado ? "success" : "default"}>{pri?.status || "RASCUNHO"}</Badge>
            {placeholders.length > 0 && (
              <Badge
                variant="destructive"
                title={placeholders.slice(0, 5).map((p) => `[${p}]`).join("\n")}
              >
                <AlertTriangle className="h-3 w-3 mr-1" /> {placeholders.length} placeholder(s)
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={autoPreencher}
              disabled={pending}
              title="Monta o texto a partir do órgão, do Encarregado e da Equipe do PRI"
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto-preencher
            </Button>
            {publicado && (
              <Button
                size="sm"
                variant="outline"
                onClick={reabrir}
                disabled={pending}
                className="border-orange-400 text-orange-700 hover:bg-orange-50"
              >
                <Unlock className="h-3.5 w-3.5" /> Reabrir como rascunho
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={salvar} disabled={pending}>
              Salvar rascunho
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={publicar}
              disabled={pending || publicado || placeholders.length > 0}
              title={
                placeholders.length > 0
                  ? `Substitua os ${placeholders.length} placeholder(s) [...] antes de publicar`
                  : undefined
              }
            >
              <Send className="h-3.5 w-3.5" />{" "}
              {publicado ? "Já publicado" : placeholders.length > 0 ? "🔒 Publicar" : "Publicar"}
            </Button>
          </div>
        </header>

        {placeholders.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 mb-1">
                  O documento ainda tem {placeholders.length} placeholder(s) do template
                </div>
                <p className="text-amber-900">
                  Substitua todos os textos [entre colchetes] por informações reais — use o botão{" "}
                  <strong>Auto-preencher</strong> ou edite manualmente. A publicação fica bloqueada
                  até lá.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <Label>Conteúdo (Markdown)</Label>
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
            >
              {previewOpen ? (
                <><EyeOff className="h-3 w-3" /> Esconder preview</>
              ) : (
                <><Eye className="h-3 w-3" /> Mostrar preview</>
              )}
            </button>
          </div>
          <Textarea
            rows={20}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="font-mono text-xs"
          />
          {publicado && pri?.publicSlug && (
            <div className="mt-3 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Publicado em:{" "}
              <code className="text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">{pri.publicSlug}</code>
              <a
                href={`/p/${pri.publicSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline hover:text-emerald-900"
              >
                Abrir URL pública →
              </a>
            </div>
          )}

          {previewOpen && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 border-b text-[11px] uppercase font-semibold text-gray-600 flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> Preview · como o documento fica publicado
              </div>
              <div
                className="pri-preview p-5 bg-white"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .pri-preview h1 { font-size: 1.75rem; font-weight: 800; margin: 0.5rem 0 1rem; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        .pri-preview h2 { font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #1f2937; }
        .pri-preview h3 { font-size: 1rem; font-weight: 600; margin: 1rem 0 0.4rem; color: #374151; }
        .pri-preview p { margin: 0.5rem 0; line-height: 1.6; color: #374151; font-size: 0.875rem; }
        .pri-preview ul, .pri-preview ol { margin: 0.5rem 0 0.5rem 1.5rem; }
        .pri-preview li { margin: 0.25rem 0; line-height: 1.5; color: #374151; font-size: 0.875rem; }
        .pri-preview strong { font-weight: 700; color: #111827; }
        .pri-preview em { font-style: italic; color: #4b5563; }
      `}</style>

      {/* Cardápio das 8 seções */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-medium mb-3">As 8 seções do PRI</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRI_SECOES.map((s) => (
            <div key={s.numero} className="text-xs p-2 border rounded">
              <div className="flex items-center gap-1">
                <Badge variant="ghost">{s.numero}</Badge>
                <strong>{s.titulo}</strong>
                {s.alimentadoPor && (
                  <Badge variant="primary" className="ml-auto">{s.alimentadoPor}</Badge>
                )}
              </div>
              <div className="text-gray-500 mt-1">{s.hint}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
