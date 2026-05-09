"use client";

/**
 * Tela inicial do wizard de Inventário (2026-05-11).
 *
 * Apresenta 3 caminhos pra começar o preenchimento:
 *   (a) Modelos Padronizados — abre o TemplatePicker
 *   (b) Pré-preencher por Carta de Serviços — placeholder ("Em breve" — Fatia b)
 *   (c) Preenchimento Manual — segue direto pro wizard atual
 *
 * Aparece SÓ quando o user está criando um inventário novo (sem
 * `initialDraft`). Ao continuar um draft, o wizard pula direto pra
 * onde parou.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Library,
  Globe2,
  PenLine,
  ArrowRight,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { INVENTARIO_TEMPLATES } from "@/lib/inventario-templates-publicos";

export type EntryChoice = "templates" | "manual";

interface InventarioEntryScreenProps {
  /**
   * Chamada quando o user escolhe um caminho. "templates" abre o picker;
   * "manual" pula direto pra primeira seção do wizard.
   * (A opção "carta" é tratada inline aqui — mostra apenas mensagem
   * "em breve" e não dispara onChoose.)
   */
  onChoose: (choice: EntryChoice) => void;
}

export default function InventarioEntryScreen({
  onChoose,
}: InventarioEntryScreenProps) {
  const totalTemplates = INVENTARIO_TEMPLATES.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Como você prefere começar?</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o ponto de partida do mapeamento. Você poderá enriquecer com
          outras opções dentro do formulário, e ajustar tudo livremente depois.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* (a) Modelos Padronizados */}
        <button
          type="button"
          onClick={() => onChoose("templates")}
          className="text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <Card className="h-full transition-all hover:border-blue-400 hover:shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5">
                  <Library className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Recomendado
                </Badge>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">Modelos Padronizados</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                  Escolha um processo típico do setor público. O formulário vem
                  com a maioria dos campos já preenchidos — você só ajusta o que
                  é específico do seu órgão.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <ListChecks className="h-3.5 w-3.5" />
                <span>{totalTemplates} modelos disponíveis</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </button>

        {/* (b) Pré-preencher por Carta de Serviços — em breve */}
        <div className="text-left">
          <Card className="h-full opacity-70 cursor-not-allowed">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-2.5">
                  <Globe2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
                  Em breve
                </Badge>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">
                  Pré-preencher por Carta de Serviços
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                  Cole a URL da carta de serviços, página do serviço ou ato
                  normativo. O sistema lê e pré-preenche os campos extraíveis
                  do conteúdo público.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Disponível na próxima fatia</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* (c) Preenchimento Manual */}
        <button
          type="button"
          onClick={() => onChoose("manual")}
          className="text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <Card className="h-full transition-all hover:border-gray-400 hover:shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5">
                  <PenLine className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">Preenchimento Manual</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                  Comece do zero, respondendo cada pergunta do formulário. Use
                  esta opção se o seu processo não se encaixa em nenhum modelo
                  pré-pronto.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>Formulário em branco</span>
                <ArrowRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
        Você pode trocar de modelo ou voltar a esta tela a qualquer momento
        usando o botão "Trocar modelo / começar de novo" no topo do formulário.
      </div>
    </div>
  );
}
