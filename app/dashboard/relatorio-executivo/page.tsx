import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDPO } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import RelatorioExecutivoContent from "@/components/relatorio-executivo/relatorio-executivo-content";
import { buildRelatorioExecutivo } from "@/lib/relatorio-executivo-helpers";

export const dynamic = "force-dynamic";

/**
 * Relatório Executivo de Conformidade LGPD (R3, 2026-05-10).
 *
 * Página print-friendly que agrega TODOS os dados da postura LGPD
 * num só documento (capa + score + KPIs + radar + próximas etapas
 * + pendências + histórico + conclusão). Acesso DPO-only.
 */
export default async function RelatorioExecutivoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true, role: true },
  });
  if (!user?.companyId) {
    redirect("/dashboard");
  }
  if (!isDPO(user.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Relatório Executivo" />
      </DashboardLayout>
    );
  }

  const data = await buildRelatorioExecutivo({
    companyId: user.companyId,
    userId: user.id,
    isDPO: true,
  });

  return (
    <DashboardLayout session={session}>
      <RelatorioExecutivoContent data={data} />
    </DashboardLayout>
  );
}
