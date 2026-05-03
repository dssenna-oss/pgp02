import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ContribuidoresContent from "@/components/contribuidores/contribuidores-content";

/**
 * Tela do DPO pra gerenciar contribuidores da própria organização.
 *
 * Acesso: qualquer DPO (Principal, Substituto, Auxiliar, ou admin legado).
 * Contribuidores tentando entrar são redirecionados pro dashboard.
 *
 * Mutações (criar/excluir/resetar) ficam restritas a Principal/Substituto
 * — checagem feita no backend (API) e no UI (botões só aparecem).
 */
export default async function ContribuidoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout session={session}>
      <ContribuidoresContent session={session} />
    </DashboardLayout>
  );
}
