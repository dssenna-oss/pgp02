import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import LiaListContent from "@/components/lia/lia-list-content";

export default async function LiaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <DashboardLayout session={session}>
      <LiaListContent />
    </DashboardLayout>
  );
}
