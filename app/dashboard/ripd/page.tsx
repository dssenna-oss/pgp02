import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RipdListContent from "@/components/ripd/ripd-list-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function RipdPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="RIPD" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <RipdListContent />
    </DashboardLayout>
  );
}
