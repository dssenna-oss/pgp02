/**
 * Painel DPO — Requisições de Direitos do Titular.
 * Acesso restrito a papéis DPO (Principal, Substituto, Auxiliar, admin legado).
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { DsrAdminContent } from "@/components/direitos-titulares/dsr-admin-content";

export const dynamic = "force-dynamic";

export default async function RequisicoesTitularesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, companyId: true },
  });

  if (!user || !isDPO(user.role)) {
    redirect("/dashboard?error=acesso-restrito-dpo");
  }

  return (
    <DashboardLayout session={session}>
      <DsrAdminContent companyId={user.companyId || ""} />
    </DashboardLayout>
  );
}
