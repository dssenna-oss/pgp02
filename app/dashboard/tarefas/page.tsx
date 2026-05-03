import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import TarefasContent from "@/components/tarefas/tarefas-content";

/**
 * Tarefas pessoais — caderno individual de planejamento.
 *
 * Acesso: qualquer usuário autenticado (DPO + Contribuidor). Cada um
 * vê SÓ as próprias tarefas (visibilidade privada).
 */
export default async function TarefasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <TarefasContent session={session} />
    </DashboardLayout>
  );
}
