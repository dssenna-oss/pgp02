import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import TermoEditorContent from "@/components/consent/termo-editor-content";

export default async function TermoEditarPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Termos de Consentimento" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout session={session}>
      <TermoEditorContent termId={params.id} />
    </DashboardLayout>
  );
}
