
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import Fase4Content from "@/components/fases/fase-4-content";

export default async function Fase4Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <Fase4Content />
    </DashboardLayout>
  );
}
