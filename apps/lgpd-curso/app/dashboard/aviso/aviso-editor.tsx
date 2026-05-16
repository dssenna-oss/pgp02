"use client";

import { useState, useTransition } from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveAviso, publicarAviso } from "./actions";
import { AVISO_SECOES } from "@/lib/aviso-secoes";
import toast from "react-hot-toast";

type Aviso = {
  id: string;
  conteudoMd: string;
  status: string;
  publicSlug: string | null;
} | null;

type Prereq = {
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

  function salvar() {
    startTransition(async () => {
      try { await saveAviso(conteudo); toast.success("Rascunho salvo"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  function publicar() {
    if (!aviso) { toast.error("Salve um rascunho primeiro"); return; }
    if (prereq.ripds === 0 || prereq.operadores === 0 || prereq.dsr === 0) {
      if (!confirm("Pré-requisitos da Missão 4a incompletos. Publicar mesmo assim?")) return;
    }
    startTransition(async () => {
      try { await publicarAviso(); toast.success("Aviso publicado!"); }
      catch (e: any) { toast.error(e.message); }
    });
  }

  const prereqOk = prereq.ripds > 0 && prereq.operadores > 0 && prereq.dsr > 0;

  return (
    <div className="space-y-6">
      {/* Quadro de pré-requisitos */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          Pré-requisitos da Missão 4a
          {prereqOk
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
        <header className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Texto do Aviso de Privacidade</h3>
            <Badge variant={publicado ? "success" : "default"}>{aviso?.status || "RASCUNHO"}</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={salvar} disabled={pending}>Salvar rascunho</Button>
            <Button size="sm" variant="success" onClick={publicar} disabled={pending || publicado}>
              <Send className="h-3.5 w-3.5" /> {publicado ? "Já publicado" : "Publicar"}
            </Button>
          </div>
        </header>
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
              <span className="text-gray-500">(URL pública será gerada na S3 com `/p/<slug>`)</span>
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
