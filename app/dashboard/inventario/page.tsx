
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InventarioContent from "@/components/inventario/inventario-content";

export default async function InventarioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <InventarioContent session={session} />
    </DashboardLayout>
  );
}
