import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DiagnosticoContent from "@/components/diagnostico/diagnostico-content";

export default async function DiagnosticoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <DashboardLayout session={session}>
      <DiagnosticoContent />
    </DashboardLayout>
  );
}
