import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import BasesLegaisDashboardContent from "@/components/inventario/bases-legais-dashboard-content";

/**
 * Painel consolidado das Bases Legais (DPO-only).
 *
 * Mostra todos os processos APROVADOS da organização e o status de
 * preenchimento das bases legais (Art. 7º + Art. 11 + Previsão Legal).
 * Útil pro DPO acompanhar o progresso de "completude jurídica" do
 * inventário.
 */
export default async function BasesLegaisDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Bases Legais" />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout session={session}>
      <BasesLegaisDashboardContent session={session} />
    </DashboardLayout>
  );
}
