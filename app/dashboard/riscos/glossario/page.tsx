import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import GlossarioRiscosContent from "@/components/riscos/glossario-riscos-content";

/**
 * Glossário dos 13 tipos de risco LGPD (catálogo BR..CD).
 *
 * Acessível por qualquer usuário autenticado — é referência didática.
 * O conteúdo é estático (puxa de `lib/riscos-catalog.ts`), sem queries.
 */
export default async function GlossarioRiscosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <DashboardLayout session={session}>
      <GlossarioRiscosContent />
    </DashboardLayout>
  );
}
