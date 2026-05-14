import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import RiscosDashboardContent from "@/components/riscos/riscos-dashboard-content";

/**
 * Painel consolidado da Análise de Riscos (DPO-only).
 *
 * Tem 2 abas:
 *   - "Riscos por processo" — lista todos os processos APROVADOS com
 *     contagem de riscos identificados em cada um.
 *   - "Riscos da organização" — placeholder. Será implementado no
 *     Checkpoint 9 (GAP Analysis) com riscos macro que não pertencem
 *     a uma área específica (não ter DPO, política, conscientização).
 */
export default async function RiscosDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Análise de Riscos" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <RiscosDashboardContent session={session} />
    </DashboardLayout>
  );
}
