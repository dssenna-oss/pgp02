
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ConfiguracoesContent from "@/components/configuracoes/configuracoes-content";

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <ConfiguracoesContent session={session} />
    </DashboardLayout>
  );
}
