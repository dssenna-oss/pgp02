"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Send, AlertCircle, CheckCircle2, Lock, ArrowRight, Sparkles, AlertTriangle, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveAviso, publicarAviso, autoPreencherAviso, reabrirAviso } from "./actions";
import { AVISO_SECOES } from "@/lib/aviso-secoes";
import { detectarPlaceholders } from "@/lib/aviso-auto-preencher";
import toast from "react-hot-toast";
import { handlePhaseSkipResult } from "@/lib/phase-skip-handler";

type Aviso = {
  id: string;
  conteudoMd: string;
  status: string;
  publicSlug: string | null;
} | null;

type Prereq = {
  inventariosAprovados: number;
  ripds: number;
  ripdsAprovados: number;
  operadores: number;
  operadoresComClausula: number;
  dsr: number;
};

export function AvisoEditor({ aviso, prereq }: { aviso: Aviso; prereq: Prereq }) {
  const initial = aviso?.conteudoMd ?? gerarRascunho();
  const [conteudo, setConteudo] = useState(initial);
  const [pending, startTransition] = useTransition();
  const publicado = aviso?.status === "PUBLICADO";

  // Pré-requisito legal HARD — Art. 9 LGPD exige descrição clara do que é
  // tratado. Sem Inventário aprovado, o Aviso não tem matéria-prima.
  const bloqueadoPublicar = prereq.inventariosAprovados === 0;

  function salvar() {
    startTransition(async () => {
      try {
        const r = await saveAviso(conteudo);
        if (handlePhaseSkipResult(r)) return;
        toast.success("Rascunho salvo");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function publicar() {
    if (!aviso) { toast.error("Salve um rascunho primeiro"); return; }
    if (bloqueadoPublicar) {
      toast.error("Aprove ao menos 1 processo no Inventário antes de publicar");
      return;
    }
    if (placeholders.length > 0) {
      toast.error(`Publicação bloqueada: ${placeholders.length} placeholder(s) ainda no texto. Use "Auto-preencher" ou edite manualmente.`);
      return;
    }
    if (prereq.ripds === 0 || prereq.operadores === 0 || prereq.dsr === 0) {
      if (!confirm("Pré-requisitos da Missão 4a incompletos. Publicar mesmo assim?")) return;
    }
    startTransition(async () => {
      try {
        const r = await publicarAviso();
        if (handlePhaseSkipResult(r)) return;
        toast.success("Aviso publicado!");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function autoPreencher() {
    const tinhaTexto = conteudo.trim().length > 0 && conteudo !== gerarRascunho();
    if (tinhaTexto && !confirm("Isso vai substituir o texto atual pelo Aviso montado a partir dos dados do PGP (Encarregado, Inventário, Terceiros, DSR). Continuar?")) return;
    startTransition(async () => {
      try {
        const r = await autoPreencherAviso();
        setConteudo(r.md);
        toast.success("Aviso preenchido com dados do PGP — revise antes de salvar/publicar");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  function reabrir() {
    if (!confirm("Voltar este Aviso pra rascunho? A URL pública vai parar de funcionar até nova publicação.")) return;
    startTransition(async () => {
      try {
        const r = await reabrirAviso();
        if (handlePhaseSkipResult(r)) return;
        toast.success("Aviso reaberto como rascunho — edite e publique de novo");
      } catch (e: any) { toast.error(e.message); }
    });
  }

  // Detecta placeholders no texto atual (em tempo real)
  const placeholders = useMemo(() => detectarPlaceholders(conteudo), [conteudo]);

  const prereqM4aOk = prereq.ripds > 0 && prereq.operadores > 0 && prereq.dsr > 0;

  return (
    <div className="space-y-6">
      {/* Bloqueio FIRME quando falta Inventário aprovado (Art. 9 LGPD) */}
      {bloqueadoPublicar && (
        <div className="border-l-4 border-red-500 bg-red-50 rounded p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-900 mb-1 text-sm">
                Pré-requisito legal do Aviso não atendido
              </div>
              <p className="text-red-900 text-xs leading-relaxed mb-2">
                O <strong>Art. 9 da LGPD</strong> exige que o Aviso descreva claramente: finalidade, forma e duração do tratamento, identificação do controlador, uso compartilhado com terceiros, direitos do titular. Sem Inventário aprovado, esses dados não existem.
              </p>
              <Link
                href="/dashboard/inventario"
                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-2 rounded"
              >
                Ir pro Inventário (Missão 1) <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <div className="text-[11px] text-red-700 mt-2">
                ❌ Inventário — 0 processo(s) aprovado(s) (mínimo: 1) · Você pode editar o rascunho do Aviso, mas <strong>publicar fica bloqueado</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quadro de pré-requisitos da M4a (RIPD, Terceiros, DSR — soft) */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          Pré-requisitos da Missão 4a (recomendados, não bloqueiam)
          {prereqM4aOk
            ? <Badge variant="success">Completos</Badge>
            : <Badge variant="warning">Incompletos</Badge>
          }
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <PrereqCard ok={prereq.ripds > 0} label="RIPDs criados" value={`${prereq.ripds} (${prereq.ripdsAprovados} aprovados)`} href="/dashboard/ripd" />
          <PrereqCard ok={prereq.operadores > 0} label="Operadores listados" value={`${prereq.operadores} (${prereq.operadoresComClausula} com cláusula)`} href="/dashboard/terceiros" />
          <PrereqCard ok={prereq.dsr > 0} label="Canal DSR estruturado" value={`${prereq.dsr} solicitações registradas`} href="/dashboard/dsr" />
        </div>
      </div>

      {/* Editor */}
      <div className="border rounded-lg bg-white">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Texto do Aviso de Privacidade</h3>
            <Badge variant={publicado ? "success" : "default"}>{aviso?.status || "RASCUNHO"}</Badge>
            {placeholders.length > 0 && (
              <Badge variant="destructive" title={placeholders.slice(0, 5).map((p) => `[${p}]`).join("\n")}>
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
              title="Substitui os textos [entre colchetes] pelos dados reais do Encarregado, Inventário, Terceiros e DSR"
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto-preencher do PGP
            </Button>
            {publicado && (
              <Button
                size="sm"
                variant="outline"
                onClick={reabrir}
                disabled={pending}
                title="Volta este Aviso pra rascunho. A URL pública deixa de funcionar até nova publicação."
                className="border-orange-400 text-orange-700 hover:bg-orange-50"
              >
                <Unlock className="h-3.5 w-3.5" /> 🔓 Reabrir como rascunho
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={salvar} disabled={pending}>Salvar rascunho</Button>
            <Button
              size="sm"
              variant="success"
              onClick={publicar}
              disabled={pending || publicado || bloqueadoPublicar || placeholders.length > 0}
              title={
                bloqueadoPublicar
                  ? "Aprove ao menos 1 processo no Inventário antes de publicar"
                  : placeholders.length > 0
                  ? `Substitua os ${placeholders.length} placeholder(s) [...] antes de publicar`
                  : undefined
              }
            >
              <Send className="h-3.5 w-3.5" /> {
                publicado ? "Já publicado"
                : bloqueadoPublicar ? "🔒 Publicar"
                : placeholders.length > 0 ? "🔒 Publicar"
                : "Publicar"
              }
            </Button>
          </div>
        </header>

        {/* Alerta VERMELHO — aviso publicado com placeholders (compliance fake já no ar!) */}
        {placeholders.length > 0 && publicado && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-300 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-red-900 mb-1 text-sm">
                  🚨 Aviso publicado com {placeholders.length} placeholder(s) — &quot;compliance fake&quot; no ar!
                </div>
                <p className="text-red-900 mb-2">
                  A URL pública está servindo um Aviso com textos-modelo entre colchetes (ex: <em>[Identifique o controlador]</em>).
                  Qualquer cidadão que abrir vê &quot;compliance fake&quot;. <strong>Aja agora:</strong>
                </p>
                <ol className="ml-5 list-decimal space-y-0.5 mb-2 text-red-900">
                  <li>Clique em <strong>🔓 Reabrir como rascunho</strong> (URL pública para de funcionar)</li>
                  <li>Clique em <strong>✨ Auto-preencher do PGP</strong> pra montar o texto com dados reais</li>
                  <li>Revise + clique em <strong>Publicar</strong> de novo</li>
                </ol>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-red-700 hover:text-red-900">
                    Ver os {Math.min(5, placeholders.length)} primeiros placeholders detectados
                  </summary>
                  <ul className="mt-1 ml-4 space-y-0.5">
                    {placeholders.slice(0, 5).map((p, i) => (
                      <li key={i} className="font-mono text-red-900">[{p}]</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Warning âmbar — rascunho ainda com placeholders (vai bloquear publicar) */}
        {placeholders.length > 0 && !publicado && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 mb-1">
                  Atenção: este Aviso ainda tem {placeholders.length} placeholder(s) do template
                </div>
                <p className="text-amber-900 mb-2">
                  Publicar com textos entre colchetes vira &quot;compliance fake&quot; — pior que não publicar. Use o botão{" "}
                  <strong>✨ Auto-preencher do PGP</strong> pra montar o texto a partir dos dados que vocês já produziram, ou
                  edite manualmente cada trecho.
                </p>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-amber-700 hover:text-amber-900">
                    Ver os primeiros {Math.min(5, placeholders.length)} placeholders detectados
                  </summary>
                  <ul className="mt-1 ml-4 space-y-0.5">
                    {placeholders.slice(0, 5).map((p, i) => (
                      <li key={i} className="font-mono text-amber-900">[{p}]</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <Label>Conteúdo (Markdown)</Label>
          <Textarea
            rows={28}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            className="font-mono text-xs"
          />
          {publicado && aviso?.publicSlug && (
            <div className="mt-3 text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Publicado em: <code className="text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">{aviso.publicSlug}</code>
              <a
                href={`/p/${aviso.publicSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline hover:text-emerald-900"
              >
                Abrir URL pública →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Cardápio das 12 seções */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-medium mb-3">As 12 seções esperadas pela ANPD</h3>
        <div className="grid grid-cols-2 gap-2">
          {AVISO_SECOES.map((s) => (
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

function PrereqCard({ ok, label, value, href }: { ok: boolean; label: string; value: string; href: string }) {
  return (
    <a href={href} className="block border rounded p-3 hover:shadow-sm transition">
      <div className="flex items-center gap-1.5 mb-1">
        {ok
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        }
        <span className="text-[11px] uppercase text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </a>
  );
}

function gerarRascunho(): string {
  return `# Aviso de Privacidade

## 1. Quem somos
[Identifique o controlador — TCEES, CNPJ, sede.]

## 2. Encarregado pelo tratamento de dados
[Nome, e-mail e telefone do Encarregado titular e do substituto.]

## 3. Quais dados tratamos e por quê
[Síntese dos processos do Inventário + finalidades. Alimentado pelo RIPD.]

## 4. Base legal do tratamento
[Art. 7º — dados comuns. Art. 11 — dados sensíveis. Fundamentar cada hipótese.]

## 5. Por quanto tempo guardamos seus dados
[Prazo de retenção declarado no Inventário.]

## 6. Como protegemos seus dados
[Medidas técnicas e administrativas — art. 46 da LGPD.]

## 7. Com quem compartilhamos
[Lista de operadores e órgãos parceiros. Alimentado pela Gestão de Terceiros.]

## 8. Transferência internacional
[Há? Sob qual hipótese do art. 33 da LGPD?]

## 9. Cookies e tecnologias de rastreamento
[O que coletamos via cookies no portal.]

## 10. Decisões automatizadas (art. 20)
[Há decisão automatizada? Como o titular pode contestar?]

## 11. Como exercer seus direitos
[Canal funcional do titular — e-mail, formulário, telefone. Alimentado pelo DSR.]

## 12. Atualizações deste Aviso
[Data da última revisão.]
`;
}
