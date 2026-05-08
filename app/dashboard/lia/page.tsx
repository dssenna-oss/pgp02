import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import LiaListContent from "@/components/lia/lia-list-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function LiaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="LIA" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <LiaListContent />
    </DashboardLayout>
  );
}
