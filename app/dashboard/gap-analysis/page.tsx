import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GapContent from "@/components/gap-analysis/gap-content";

export default async function GapAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isDPO(session.user?.role)) redirect("/dashboard");

  return (
    <DashboardLayout session={session}>
      <GapContent session={session} />
    </DashboardLayout>
  );
}
