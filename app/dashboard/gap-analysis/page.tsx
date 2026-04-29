
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GapAnalysisContent from "@/components/gap-analysis/gap-analysis-content";

export default async function GapAnalysisPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <GapAnalysisContent session={session} />
    </DashboardLayout>
  );
}
