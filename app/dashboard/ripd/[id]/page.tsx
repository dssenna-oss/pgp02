import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RipdEditorContent from "@/components/ripd/ripd-editor-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function RipdEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="RIPD" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <RipdEditorContent ripdId={params.id} />
    </DashboardLayout>
  );
}
