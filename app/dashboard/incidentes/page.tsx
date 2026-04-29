
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import IncidentesContent from "@/components/incidentes/incidentes-content";

export default async function IncidentesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <IncidentesContent session={session} />
    </DashboardLayout>
  );
}
