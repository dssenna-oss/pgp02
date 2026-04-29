
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import Fase6Content from "@/components/fases/fase-6-content";

export default async function Fase6Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <Fase6Content />
    </DashboardLayout>
  );
}
