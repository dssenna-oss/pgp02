/**
 * Fallback exibido quando um Contribuidor tenta acessar uma rota
 * DPO-only. Em vez de redirect silencioso pro /dashboard, mostra
 * mensagem clara com ícone de alerta + botão de voltar.
 *
 * Uso típico em server pages:
 *
 *   if (!isDPO(session.user?.role)) {
 *     return (
 *       <DashboardLayout session={session}>
 *         <DpoOnlyFallback feature="RIPD" />
 *       </DashboardLayout>
 *     );
 *   }
 */
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function DpoOnlyFallback({
  feature,
}: {
  /** Nome da funcionalidade pra contextualizar (opcional). */
  feature?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-amber-100 dark:bg-amber-950/40 p-4 mb-5">
        <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Somente disponível para o DPO
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
        {feature ? (
          <>
            A funcionalidade <strong>{feature}</strong> é parte do trabalho
            institucional do DPO da sua organização.
          </>
        ) : (
          <>
            Esta tela é parte do trabalho institucional do DPO da sua
            organização.
          </>
        )}{" "}
        Como Contribuidor, você ajuda a alimentar o PGP preenchendo
        formulários e participando dos conteúdos didáticos.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o Dashboard
      </Link>
    </div>
  );
}
