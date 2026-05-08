import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RipdListContent from "@/components/ripd/ripd-list-content";

export default async function RipdPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) redirect("/dashboard");return (
    <DashboardLayout session={session}>
      <RipdListContent />
    </DashboardLayout>
  );
}
