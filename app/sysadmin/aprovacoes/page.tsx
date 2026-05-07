import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasSuperAdminAccess } from "@/lib/auth-helpers";
import AprovacoesContent from "@/components/sysadmin/aprovacoes-content";

/**
 * Painel de aprovações — Escopo A do plano de gestão de cadastros.
 *
 * Fluxo: usuário se cadastra via /signup → conta nasce com `isActive=false`
 * → super admin entra aqui → vê pendentes → Aprova (ativa conta) ou Recusa
 * (apaga user + empresa órfã).
 *
 * Acesso: apenas SUPER_ADMIN_EMAIL. Outros redirecionados pra /dashboard.
 */
export default async function AprovacoesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!hasSuperAdminAccess(session.user)) {
    redirect("/dashboard");
  }

  return <AprovacoesContent session={session} />;
}
