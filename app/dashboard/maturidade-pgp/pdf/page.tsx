import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import MaturidadePgpPdfView from "@/components/maturidade-pgp/maturidade-pgp-pdf-view";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
/**
 * Versão print-friendly do Painel de Maturidade do PGP (B3 da
 * Opção 1). Mesmo padrão do GAP/RIPD/Políticas: layout limpo full-page,
 * sem sidebar, com auto-print ao montar (`?autoprint=1`).
 *
 * O DPO usa pra exportar relatório executivo pra Alta Direção / ANPD /
 * auditoria. O navegador abre o diálogo "Salvar como PDF".
 */
export default async function MaturidadePgpPdfPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DpoOnlyFallback feature="Maturidade do PGP · PDF" />
      </div>
    );
  }return <MaturidadePgpPdfView />;
}
