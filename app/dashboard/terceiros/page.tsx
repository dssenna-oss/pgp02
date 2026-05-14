import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import TerceirosListContent from "@/components/terceiros/terceiros-list-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function TerceirosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Gestão de Terceiros" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <TerceirosListContent />
    </DashboardLayout>
  );
}
