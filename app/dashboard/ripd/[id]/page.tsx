import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import RipdEditorContent from "@/components/ripd/ripd-editor-content";

export default async function RipdEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <RipdEditorContent ripdId={params.id} />
    </DashboardLayout>
  );
}
