
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ConteudosDidaticosContent from "@/components/conteudos-didaticos/conteudos-didaticos-content";

export default async function ConteudosDidaticosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <ConteudosDidaticosContent />
    </DashboardLayout>
  );
}
