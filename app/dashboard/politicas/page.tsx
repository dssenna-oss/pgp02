import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PoliticasContent from "@/components/politicas/politicas-content";

export default async function PoliticasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <DashboardLayout session={session}>
      <PoliticasContent />
    </DashboardLayout>
  );
}
