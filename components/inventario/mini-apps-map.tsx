"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowDown, MapPin } from "lucide-react";
import { listMiniApps, type MiniApp } from "@/lib/inventario-mini-apps";
import { INVENTARIO_FORM_SCHEMA } from "@/lib/inventario-form-schema";
import { cn } from "@/lib/utils";

/**
 * Mapa visual mostrando os mini-apps que serão gerados a partir do
 * Inventário. Renderizado no onboarding pra dar ao user a noção do
 * "destino" das respostas — assim ele entende que o esforço de
 * preencher 58 perguntas vira 12 documentos automaticamente.
 *
 * O Inventário (mini-app atual = #2) ganha destaque "← Você está aqui".
 * O `rename-org` (#1, só rename UI) é filtrado.
 */
export function MiniAppsMap() {
  // Filtra rename-org (não é deliverable do user) e ordena por pipeline
  const apps = listMiniApps().filter((a) => a.id !== "rename-org");
  // Mini-app atual (Inventário) — destaque
  const inventario = apps.find((a) => a.id === "inventario");
  const downstream = apps.filter((a) => a.id !== "inventario");

  return (
    <div className="rounded-lg border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/40 to-emerald-50/30 dark:from-blue-950/20 dark:to-emerald-950/20 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2 mt-0.5">
          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
            Mapa de destino das suas respostas
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Cada resposta deste questionário alimenta os documentos abaixo de
            forma automática. Você responde uma vez, gera tudo.
          </p>
        </div>
      </div>

      {/* Card de destaque do Inventário (mini-app atual) */}
      {inventario && (
        <div className="rounded-md border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{inventario.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {inventario.full}
                </h4>
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
                  Você está aqui
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Output: {inventario.output} · Fonte de verdade que alimenta
                todos os documentos abaixo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Seta indicando "deriva pra baixo" */}
      <div className="flex justify-center">
        <ArrowDown className="h-5 w-5 text-blue-400 dark:text-blue-500" />
      </div>

      {/* Grid dos 11 documentos derivados */}
      <div>
        <p className="text-xs uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400 mb-2 text-center">
          {downstream.length} documentos derivados
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {downstream.map((app) => (
            <MiniAppCard key={app.id} app={app} />
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center italic pt-1">
        Os documentos serão gerados conforme você concluir as fases
        correspondentes do PGP.
      </p>
    </div>
  );
}

function MiniAppCard({ app }: { app: MiniApp }) {
  // Conta quantas perguntas do form alimentam este mini-app — dá uma
  // noção do "peso" relativo de cada destino.
  const fieldsFeed = countFieldsFeeding(app.id);

  const outputColor: Record<MiniApp["output"], string> = {
    Excel:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    Word: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    UI: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div
      className={cn(
        "rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
        "p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl shrink-0">{app.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 leading-tight">
            {app.short}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                outputColor[app.output]
              )}
            >
              {app.output}
            </span>
            {fieldsFeed > 0 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {fieldsFeed} pergunta{fieldsFeed !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Conta quantas perguntas do INVENTARIO_FORM_SCHEMA alimentam um
 * mini-app específico (via field.help.feedsInto). Computado em runtime
 * — barato (54 fields × 13 apps).
 */
function countFieldsFeeding(appId: string): number {
  let count = 0;
  for (const step of INVENTARIO_FORM_SCHEMA) {
    if (step.kind !== "section") continue;
    for (const field of step.fields) {
      if (field.help?.feedsInto.includes(appId)) count++;
    }
  }
  return count;
}
