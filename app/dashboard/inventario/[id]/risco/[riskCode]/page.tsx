import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DetalhamentoRiscoContent from "@/components/inventario/detalhamento-risco-content";

export default async function DetalhamentoRiscoPage({
  params,
}: {
  params: Promise<{ id: string; riskCode: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id, riskCode } = await params;
  return (
    <DashboardLayout session={session}>
      <DetalhamentoRiscoContent invId={id} riskCode={riskCode} />
    </DashboardLayout>
  );
}
