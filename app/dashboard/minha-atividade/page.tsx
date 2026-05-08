/**
 * Página "Minha atividade" — timeline dos últimos 30 dias do user logado.
 *
 * Server component: carrega session + dispara fetch inicial via helper
 * (não API) pra evitar round-trip. Passa pra client component renderizar.
 */
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserActivity } from "@/lib/atividade-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { AtividadeContent } from "@/components/atividade/atividade-content";

export const dynamic = "force-dynamic";

export default async function MinhaAtividadePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const events = await getUserActivity(session.user.id);
  const userName = session.user.name ?? "você";

  return (
    <DashboardLayout session={session}>
      <AtividadeContent initialEvents={events} userName={userName} />
    </DashboardLayout>
  );
}
