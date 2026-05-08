import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DiagnosticoContent from "@/components/diagnostico/diagnostico-content";

export default async function DiagnosticoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isDPO(session.user?.role)) redirect("/dashboard");
  return (
    <DashboardLayout session={session}>
      <DiagnosticoContent />
    </DashboardLayout>
  );
}
