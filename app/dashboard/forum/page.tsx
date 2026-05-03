import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ForumContent from "@/components/forum/forum-content";

/**
 * Fórum + Mensagens — espaço de comunicação entre os usuários da
 * organização. Posts públicos visíveis a todos; mensagens diretas 1-pra-1
 * só pro autor + destinatário.
 *
 * Acesso: qualquer usuário autenticado da organização (DPO + Contribuidor).
 */
export default async function ForumPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <ForumContent session={session} />
    </DashboardLayout>
  );
}
