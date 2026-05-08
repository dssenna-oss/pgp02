import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import GapPdfView from "@/components/gap-analysis/gap-pdf-view";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
/**
 * Tela "PDF view" do GAP Analysis (Polimento C2). NÃO usa
 * `DashboardLayout` propositalmente — fica em layout limpo, full-page,
 * pra renderizar bem no diálogo de impressão do navegador (Salvar como
 * PDF). O componente client `GapPdfView` chama `window.print()` ao
 * montar; o usuário só precisa clicar "Salvar como PDF".
 */
export default async function GapPdfPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DpoOnlyFallback feature="GAP Analysis · PDF" />
      </div>
    );
  }return <GapPdfView />;
}
