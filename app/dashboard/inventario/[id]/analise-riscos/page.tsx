import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import AnaliseRiscosContent from "@/components/inventario/analise-riscos-content";

interface Props {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * Tela de Análise de Riscos por processo (Checkpoint 5).
 *
 * Acesso: somente DPO (qualquer nível) — Contribuidor é redirecionado
 * de volta pra listagem.
 */
export default async function AnaliseRiscosPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Análise de Riscos do Processo" />
      </DashboardLayout>
    );
  }
  const { id } = await Promise.resolve(params as any);

  return (
    <DashboardLayout session={session}>
      <AnaliseRiscosContent id={id} session={session} />
    </DashboardLayout>
  );
}
