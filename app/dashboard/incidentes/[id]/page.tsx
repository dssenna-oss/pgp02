import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import IncidenteEditorContent from "@/components/incidentes/incidente-editor-content";

interface PageProps {
  params: { id: string };
}

export default async function IncidenteEditorPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <IncidenteEditorContent session={session} incidentId={params.id} />
    </DashboardLayout>
  );
}
