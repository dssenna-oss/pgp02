import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasSuperAdminAccess } from "@/lib/auth-helpers";
import SysadminContent from "@/components/sysadmin/sysadmin-content";

/**
 * Painel do super admin do sistema.
 *
 * Acesso: somente o email em SUPER_ADMIN_EMAIL (env). Qualquer outro
 * user logado é redirecionado pro dashboard normal.
 *
 * Funcionalidades (Checkpoint 2.3):
 * - Listar organizações com seus DPOs Principais
 * - Criar nova organização + DPO Principal (senha temporária gerada)
 * - Resetar senha do DPO Principal (gera nova temporária)
 *
 * Não usa o dashboard-layout pra deixar claro que é um modo "fora" do
 * fluxo normal.
 */
export default async function SysadminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!hasSuperAdminAccess(session.user)) {
    redirect("/dashboard");
  }

  return <SysadminContent session={session} />;
}
