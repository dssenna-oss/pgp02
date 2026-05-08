import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import IncidenteEditorContent from "@/components/incidentes/incidente-editor-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
interface PageProps {
  params: { id: string };
}

export default async function IncidenteEditorPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Incidentes" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <IncidenteEditorContent session={session} incidentId={params.id} />
    </DashboardLayout>
  );
}
