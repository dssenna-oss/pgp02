import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import CapacitacaoContent from "@/components/capacitacao/capacitacao-content";

export default async function CapacitacaoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <CapacitacaoContent />
    </DashboardLayout>
  );
}
