import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import LiaEditorPlaceholder from "@/components/lia/lia-editor-placeholder";

export default async function LiaEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <LiaEditorPlaceholder liaId={params.id} />
    </DashboardLayout>
  );
}
