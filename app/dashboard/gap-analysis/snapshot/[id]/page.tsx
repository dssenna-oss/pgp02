import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GapSnapshotDetail from "@/components/gap-analysis/gap-snapshot-detail";

export default async function GapSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  return (
    <DashboardLayout session={session}>
      <GapSnapshotDetail snapshotId={id} />
    </DashboardLayout>
  );
}
