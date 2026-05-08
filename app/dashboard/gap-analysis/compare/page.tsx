import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GapCompareContent from "@/components/gap-analysis/gap-compare-content";

export default async function GapComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) redirect("/dashboard");const sp = await searchParams;
  return (
    <DashboardLayout session={session}>
      <GapCompareContent
        initialA={sp.a ?? null}
        initialB={sp.b ?? "atual"}
      />
    </DashboardLayout>
  );
}
