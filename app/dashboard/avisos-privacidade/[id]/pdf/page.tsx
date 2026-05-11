import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import AvisoPdfView from "@/components/avisos-privacidade/aviso-pdf-view";

/**
 * Tela "PDF view" de um Aviso de Privacidade. Layout limpo (sem sidebar),
 * pra renderizar bem no diálogo de impressão do navegador. Auto-print
 * quando `?autoprint=1`. Reusa mesmo padrão das Políticas.
 */
export default async function AvisoPdfPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { source?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DpoOnlyFallback feature="Avisos de Privacidade · PDF" />
      </div>
    );
  }

  const source = searchParams.source === "current" ? "current" : "published";
  return <AvisoPdfView noticeId={params.id} source={source as "current" | "published"} />;
}
