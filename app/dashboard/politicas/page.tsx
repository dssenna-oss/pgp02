import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PoliticasContent from "@/components/politicas/politicas-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function PoliticasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Políticas" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <PoliticasContent />
    </DashboardLayout>
  );
}
