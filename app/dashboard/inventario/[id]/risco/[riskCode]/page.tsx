import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DetalhamentoRiscoContent from "@/components/inventario/detalhamento-risco-content";

export default async function DetalhamentoRiscoPage({
  params,
}: {
  params: Promise<{ id: string; riskCode: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) redirect("/dashboard");const { id, riskCode } = await params;
  return (
    <DashboardLayout session={session}>
      <DetalhamentoRiscoContent invId={id} riskCode={riskCode} />
    </DashboardLayout>
  );
}
