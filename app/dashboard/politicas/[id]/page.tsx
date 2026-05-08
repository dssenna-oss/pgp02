import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PolicyEditor from "@/components/politicas/policy-editor";

export default async function PolicyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) redirect("/dashboard");const { id } = await params;
  return (
    <DashboardLayout session={session}>
      <PolicyEditor policyId={id} />
    </DashboardLayout>
  );
}
