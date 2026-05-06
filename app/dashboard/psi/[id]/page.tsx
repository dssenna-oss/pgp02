import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import PsiEditorContent from "@/components/psi/psi-editor-content";

export default async function PsiEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <PsiEditorContent psiId={params.id} />
    </DashboardLayout>
  );
}
