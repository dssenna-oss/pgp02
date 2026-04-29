
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PlanoAcaoContent from "@/components/plano-acao/plano-acao-content";

export default async function PlanoAcaoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <PlanoAcaoContent session={session} />
    </DashboardLayout>
  );
}
