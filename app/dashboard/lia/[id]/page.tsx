import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import LiaEditorContent from "@/components/lia/lia-editor-content";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function LiaEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="LIA" />
      </DashboardLayout>
    );
  }return (
    <DashboardLayout session={session}>
      <LiaEditorContent liaId={params.id} />
    </DashboardLayout>
  );
}
