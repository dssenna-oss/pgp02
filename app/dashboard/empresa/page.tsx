
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import EmpresaContent from "@/components/empresa/empresa-content";

export default async function EmpresaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Empresa" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <EmpresaContent session={session} />
    </DashboardLayout>
  );
}
