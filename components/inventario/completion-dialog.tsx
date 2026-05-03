"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Plus, Sparkles, Clock } from "lucide-react";
import {
  listMiniApps,
  resolveMiniApps,
  type MiniApp,
} from "@/lib/inventario-mini-apps";
import { INVENTARIO_FORM_SCHEMA } from "@/lib/inventario-form-schema";
import type { FormAnswers } from "@/lib/inventario-form-schema";
import { isFieldVisible } from "@/lib/inventario-form-schema";

interface CompletionDialogProps {
  open: boolean;
  /** Respostas finais — usa pra calcular quais mini-apps foram alimentados. */
  answers: FormAnswers;
  /** Fechar o dialog (e navegar pra lista). */
  onClose: () => void;
}

/**
 * Dialog mostrado depois do user clicar "Concluir" no review step.
 * Mostra:
 *  - Confirmação do mapeamento concluído
 *  - Chips dos mini-apps que serão gerados a partir das respostas
 *  - CTAs: "Voltar ao Inventário" (primary), "Mapear outro processo"
 *
 * Próxima etapa direta (Análise de Riscos #3) ainda não foi implementada
 * — então mostro como "em breve" ao invés de botão clicável.
 */
export function CompletionDialog({
  open,
  answers,
  onClose,
}: CompletionDialogProps) {
  const router = useRouter();

  const fedApps = computeFedMiniApps(answers);
  // Excluindo o próprio Inventário (já está concluído) e rename-org
  const downstream = fedApps.filter(
    (a) => a.id !== "inventario" && a.id !== "rename-org"
  );

  // Mini-app de "próxima etapa" no pipeline = primeiro depois do Inventário
  const next = listMiniApps()
    .filter((a) => a.id !== "rename-org" && a.ordem > 2)
    .sort((a, b) => a.ordem - b.ordem)[0];

  const handleNewProcess = () => {
    onClose();
    router.push("/dashboard/inventario/novo");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Mapeamento concluído!
          </DialogTitle>
          <DialogDescription>
            Suas respostas estão salvas e vão alimentar a geração automática
            dos documentos abaixo.
          </DialogDescription>
        </DialogHeader>

        {/* Chips dos mini-apps fed */}
        {downstream.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase font-bold tracking-wide text-emerald-700 dark:text-emerald-300">
              Documentos que receberão suas respostas ({downstream.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {downstream.map((app) => (
                <Badge
                  key={app.id}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 font-normal"
                >
                  <span className="mr-1">{app.emoji}</span>
                  {app.short}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Próxima etapa — copy genérica, sem nomear mini-app específico */}
        {next && (
          <div className="rounded-md border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Quer ir pra próxima etapa agora?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Em breve — {next.full} será gerado a partir do seu
                  Inventário.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleNewProcess}>
            <Plus className="h-4 w-4 mr-1.5" />
            Mapear outro processo
          </Button>
          <Button onClick={onClose}>
            Voltar ao Inventário
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * União dos `feedsInto` de todos os fields visíveis e preenchidos.
 * Retorna em ordem do pipeline (`MiniApp.ordem`).
 */
function computeFedMiniApps(answers: FormAnswers): MiniApp[] {
  const ids = new Set<string>();
  for (const step of INVENTARIO_FORM_SCHEMA) {
    if (step.kind !== "section") continue;
    const sa = ((answers as any)[step.id] ?? {}) as Record<string, any>;
    for (const field of step.fields) {
      if (!field.help?.feedsInto) continue;
      if (!isFieldVisible(field, sa)) continue;
      const v = sa[field.id];
      const filled = Array.isArray(v) ? v.length > 0 : !!v?.toString().trim();
      if (!filled) continue;
      for (const id of field.help.feedsInto) ids.add(id);
    }
  }
  return resolveMiniApps([...ids]);
}
