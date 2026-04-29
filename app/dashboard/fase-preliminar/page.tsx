
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import FasePrelimimarContent from "@/components/fases/fase-preliminar-content";

export default async function FasePrelimimarPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <FasePrelimimarContent />
    </DashboardLayout>
  );
}
