import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GapSnapshotDetail from "@/components/gap-analysis/gap-snapshot-detail";

import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
export default async function GapSnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="GAP Analysis · Snapshot" />
      </DashboardLayout>
    );
  }const { id } = await params;
  return (
    <DashboardLayout session={session}>
      <GapSnapshotDetail snapshotId={id} />
    </DashboardLayout>
  );
}
