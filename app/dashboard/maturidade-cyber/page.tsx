import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import CyberContent from "@/components/cyber/cyber-content";
import { isDPO } from "@/lib/auth-helpers";

export default async function CyberPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Maturidade Cibernética" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <CyberContent />
    </DashboardLayout>
  );
}
