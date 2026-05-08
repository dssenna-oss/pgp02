import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import RipdPdfView from "@/components/ripd/ripd-pdf-view";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
/**
 * Tela "PDF view" do RIPD (Checkpoint 13 / F4).
 *
 * Layout limpo, sem DashboardLayout — pra renderizar bem no diálogo de
 * impressão do navegador. Auto-print quando `?autoprint=1`.
 *
 * `?source=published|current`:
 *   - "published" (default) → última versão aprovada
 *   - "current" → conteúdo atual em edição
 */
export default async function RipdPdfPage({
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
        <DpoOnlyFallback feature="RIPD · PDF" />
      </div>
    );
  }const source = searchParams.source === "current" ? "current" : "published";
  return <RipdPdfView ripdId={params.id} source={source} />;
}
