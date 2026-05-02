import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InventarioWizard from "@/components/inventario/inventario-wizard";

/**
 * Página do wizard de Mapeamento Completo (form base do Inventário).
 *
 * Sem ID nas params → wizard começa do zero (cria draft no primeiro save).
 * Pra continuar um draft existente, usar a rota /dashboard/inventario/[id]
 * (a integrar no checkpoint 7).
 */
export default async function NovoInventarioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <InventarioWizard
        userName={session.user?.name ?? ""}
        userEmail={session.user?.email ?? ""}
      />
    </DashboardLayout>
  );
}
