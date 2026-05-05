import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import TerceirosListContent from "@/components/terceiros/terceiros-list-content";

export default async function TerceirosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <TerceirosListContent />
    </DashboardLayout>
  );
}
