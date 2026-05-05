import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import MaturidadePgpContent from "@/components/maturidade-pgp/maturidade-pgp-content";

export default async function MaturidadePgpPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <DashboardLayout session={session}>
      <MaturidadePgpContent />
    </DashboardLayout>
  );
}
