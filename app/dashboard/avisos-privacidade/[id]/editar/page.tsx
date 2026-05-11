import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import AvisoEditorContent from "@/components/avisos-privacidade/aviso-editor-content";

export default async function AvisoEditarPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Avisos de Privacidade" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <AvisoEditorContent noticeId={params.id} />
    </DashboardLayout>
  );
}
