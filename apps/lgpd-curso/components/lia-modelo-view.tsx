"use client";

// Renderização visual de UM modelo de LIA preenchido. Pensado pra
// PROJETAR na sala durante a Reflexão Final do curso — tipografia
// generosa, cores fortes pros vereditos, fácil de ler à distância.
//
// Modo Projeção (toggle) amplia tudo — mesmo padrão do GuiaView e do
// ConteudoFaseView.

import { useState } from "react";
import {
  Projector, Target, Scale, AlertTriangle, CheckCircle2,
  XCircle, Info, ArrowRight,
} from "lucide-react";
import type { LiaModelo, EtapaLia, StatusVeredito } from "@/lib/lia-modelos";

export function LiaModeloView({ modelo }: { modelo: LiaModelo }) {
  const [projecao, setProjecao] = useState(false);

  const sz = projecao
    ? {
        wrap: "max-w-6xl",
        h1: "text-4xl",
        h2: "text-2xl",
        h3: "text-xl",
        body: "text-lg",
        small: "text-base",
        meta: "text-sm",
        pad: "p-6",
        gap: "space-y-5",
      }
    : {
        wrap: "max-w-4xl",
        h1: "text-2xl sm:text-3xl",
        h2: "text-xl",
        h3: "text-base",
        body: "text-sm sm:text-base",
        small: "text-xs sm:text-sm",
        meta: "text-xs",
        pad: "p-4",
        gap: "space-y-4",
      };

  const headerCor =
    modelo.orgao === "PM"
      ? "from-emerald-600 via-emerald-700 to-teal-800"
      : "from-blue-600 via-blue-700 to-indigo-800";

  return (
    <div className={`${sz.wrap} mx-auto`}>
      {/* Header do modelo */}
      <div className={`rounded-2xl bg-gradient-to-br ${headerCor} text-white shadow-lg ${sz.pad} mb-5`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex items-start gap-3">
            <div className="text-5xl shrink-0">{modelo.emoji}</div>
            <div>
              <div className={`${sz.meta} uppercase tracking-[0.15em] font-semibold text-white/80`}>
                LIA — Modelo · {modelo.orgao === "PM" ? "Prefeitura" : "Câmara"}
              </div>
              <h2 className={`${sz.h1} font-bold leading-tight mt-1`}>{modelo.titulo}</h2>
              <div className={`${sz.small} text-white/90 mt-1`}>{modelo.processoFonte}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setProjecao((v) => !v)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              projecao
                ? "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
                : "bg-white/15 text-white border-white/30 hover:bg-white/25 backdrop-blur"
            }`}
            title="Amplia o texto pra projetar na sala"
          >
            <Projector className="h-4 w-4" />
            {projecao ? "Sair da projeção" : "Modo projeção"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/25">
            🎯 Tentativa: {modelo.tentativaBaseLegal}
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/25">
            🔗 {modelo.pegadinhaRef}
          </span>
        </div>
      </div>

      {/* Contexto */}
      <div className={`rounded-lg border-l-4 border-l-amber-400 bg-amber-50 ${sz.pad} mb-5`}>
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
          <div className="flex-1">
            <div className={`${sz.small} font-bold text-amber-900 mb-1`}>Contexto do tratamento</div>
            <p className={`${sz.body} text-amber-900 leading-relaxed italic`}>
              {modelo.contexto}
            </p>
          </div>
        </div>
      </div>

      {/* 3 etapas */}
      <div className={sz.gap}>
        {modelo.etapas.map((etapa, i) => (
          <EtapaCard key={i} etapa={etapa} sz={sz} />
        ))}
      </div>

      {/* Veredito final destacado */}
      <div className={`mt-6 rounded-2xl ${vereditoFinalBg(modelo.vereditoFinal.status)} ${sz.pad} ring-2 ${vereditoFinalRing(modelo.vereditoFinal.status)}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <XCircle className={`h-8 w-8 ${vereditoFinalIconColor(modelo.vereditoFinal.status)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`${sz.h2} font-bold ${vereditoFinalTextColor(modelo.vereditoFinal.status)}`}>
              {modelo.vereditoFinal.titulo}
            </h3>
            <p className={`${sz.body} ${vereditoFinalTextColor(modelo.vereditoFinal.status)} mt-2 leading-relaxed`}>
              {modelo.vereditoFinal.explicacao}
            </p>
            <div className={`mt-3 rounded-lg bg-white/60 ${sz.pad}`}>
              <div className={`${sz.small} font-bold flex items-center gap-1.5 ${vereditoFinalTextColor(modelo.vereditoFinal.status)}`}>
                <ArrowRight className="h-4 w-4" /> RECOMENDAÇÃO
              </div>
              <p className={`${sz.body} text-gray-800 mt-1 leading-relaxed`}>
                {modelo.vereditoFinal.recomendacao}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 ${sz.meta} text-center text-gray-400 italic`}>
        Modelo didático preenchido pelo facilitador · Não substitui uma LIA real do app principal lgpd-pgp.vercel.app
      </div>
    </div>
  );
}

// ─── ETAPA ──────────────────────────────────────────────────────────────

function EtapaCard({ etapa, sz }: { etapa: EtapaLia; sz: any }) {
  return (
    <div className={`rounded-xl border-2 bg-white ${sz.pad} ${etapaBorderColor(etapa.veredito.status)}`}>
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">{etapa.icone}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`${sz.h2} font-bold text-gray-900`}>{etapa.titulo}</h3>
          <p className={`${sz.small} text-gray-600 mt-1`}>{etapa.descricao}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {etapa.perguntas.map((p, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="shrink-0 mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`${sz.small} font-semibold text-gray-700`}>{p.pergunta}</div>
              <div className={`${sz.body} text-gray-900 mt-1 leading-relaxed`}>{p.resposta}</div>
              {p.obs && (
                <div className={`${sz.small} text-gray-500 italic mt-1`}>↳ {p.obs}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 rounded-lg ${etapaBg(etapa.veredito.status)} ${sz.pad.replace("p-", "px-")} py-3`}>
        <div className="flex items-start gap-2">
          {etapa.veredito.status === "ok" ? (
            <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${etapaText(etapa.veredito.status)}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${etapaText(etapa.veredito.status)}`} />
          )}
          <div className="flex-1">
            <div className={`${sz.small} uppercase font-bold tracking-wide ${etapaText(etapa.veredito.status)}`}>
              Veredito da etapa
            </div>
            <div className={`${sz.body} ${etapaText(etapa.veredito.status)} font-medium mt-0.5`}>
              {etapa.veredito.texto}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS DE COR ─────────────────────────────────────────────────────

function etapaBorderColor(status: StatusVeredito): string {
  return status === "ok"
    ? "border-emerald-300"
    : status === "alerta"
    ? "border-amber-300"
    : "border-rose-400";
}

function etapaBg(status: StatusVeredito): string {
  return status === "ok"
    ? "bg-emerald-50"
    : status === "alerta"
    ? "bg-amber-50"
    : "bg-rose-50";
}

function etapaText(status: StatusVeredito): string {
  return status === "ok"
    ? "text-emerald-800"
    : status === "alerta"
    ? "text-amber-800"
    : "text-rose-800";
}

function vereditoFinalBg(status: "bloqueio" | "reprovada" | "aprovada"): string {
  return status === "aprovada"
    ? "bg-emerald-50"
    : status === "reprovada"
    ? "bg-rose-50"
    : "bg-red-100";
}

function vereditoFinalRing(status: "bloqueio" | "reprovada" | "aprovada"): string {
  return status === "aprovada"
    ? "ring-emerald-300"
    : status === "reprovada"
    ? "ring-rose-300"
    : "ring-red-400";
}

function vereditoFinalIconColor(status: "bloqueio" | "reprovada" | "aprovada"): string {
  return status === "aprovada"
    ? "text-emerald-700"
    : status === "reprovada"
    ? "text-rose-700"
    : "text-red-700";
}

function vereditoFinalTextColor(status: "bloqueio" | "reprovada" | "aprovada"): string {
  return status === "aprovada"
    ? "text-emerald-900"
    : status === "reprovada"
    ? "text-rose-900"
    : "text-red-900";
}
