import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import { isDPO } from "@/lib/auth-helpers";
import SugestaoCartaContent from "@/components/inventario/sugestao-carta-content";

export default async function SugestaoCartaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Sugerir processos da Carta de Serviços" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <SugestaoCartaContent />
    </DashboardLayout>
  );
}
