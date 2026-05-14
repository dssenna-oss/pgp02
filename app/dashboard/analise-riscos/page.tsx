
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RiskAssessmentContent from "@/components/risk-assessment/risk-assessment-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function RiskAssessmentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Análise de Riscos" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <RiskAssessmentContent session={session} />
    </DashboardLayout>
  );
}
