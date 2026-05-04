import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PolicyEditor from "@/components/politicas/policy-editor";

export default async function PolicyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  return (
    <DashboardLayout session={session}>
      <PolicyEditor policyId={id} />
    </DashboardLayout>
  );
}
