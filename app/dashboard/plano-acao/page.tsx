import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PlanoAcaoContent from "@/components/plano-acao/plano-acao-content";
import { isDPO } from "@/lib/auth-helpers";

export default async function PlanoAcaoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userIsDPO = isDPO(session.user?.role);
  if (!userIsDPO) redirect("/dashboard");
  return (
    <DashboardLayout session={session}>
      <PlanoAcaoContent session={session} isDPO={userIsDPO} />
    </DashboardLayout>
  );
}
