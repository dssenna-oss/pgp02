import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import BasesLegaisContent from "@/components/inventario/bases-legais-content";

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * Tela do DPO/jurídico pra preencher as Bases Legais de um processo.
 *
 * Acesso: qualquer DPO da org. Contribuidor é redirecionado de volta
 * pra listagem (não tem permissão pra mexer em base legal).
 */
export default async function BasesLegaisPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    redirect("/dashboard/inventario");
  }
  const { id } = await Promise.resolve(params as any);

  return (
    <DashboardLayout session={session}>
      <BasesLegaisContent id={id} session={session} />
    </DashboardLayout>
  );
}
