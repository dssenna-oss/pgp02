import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import TermosConsentimentoContent from "@/components/consent/termos-content";

export default async function TermosConsentimentoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Termos de Consentimento" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <TermosConsentimentoContent />
    </DashboardLayout>
  );
}
