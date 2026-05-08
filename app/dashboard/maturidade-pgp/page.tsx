import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import MaturidadePgpContent from "@/components/maturidade-pgp/maturidade-pgp-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function MaturidadePgpPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Maturidade do PGP" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <MaturidadePgpContent />
    </DashboardLayout>
  );
}
