
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RiskAssessmentContent from "@/components/risk-assessment/risk-assessment-content";

export default async function RiskAssessmentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <RiskAssessmentContent session={session} />
    </DashboardLayout>
  );
}
