import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import TerceirosListContent from "@/components/terceiros/terceiros-list-content";

export default async function TerceirosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) redirect("/dashboard");return (
    <DashboardLayout session={session}>
      <TerceirosListContent />
    </DashboardLayout>
  );
}
