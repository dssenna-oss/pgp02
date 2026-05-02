import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import InventarioWizard from "@/components/inventario/inventario-wizard";
import { prisma } from "@/lib/db";

/**
 * Página de edição/continuação de Inventário existente.
 * Carrega o registro pelo id (escopado à companyId do user) e
 * hidrata o wizard com `initialDraft`.
 */
export default async function EditarInventarioPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { companyId: true },
  });
  if (!user?.companyId) redirect("/dashboard/inventario");

  const inv = await prisma.dataInventory.findFirst({
    where: { id: params.id, companyId: user.companyId },
  });
  if (!inv) notFound();

  return (
    <DashboardLayout session={session}>
      <InventarioWizard
        userName={session.user?.name ?? ""}
        userEmail={session.user?.email ?? ""}
        initialDraft={{
          id: inv.id,
          formAnswers: (inv.formAnswers as any) ?? {},
        }}
      />
    </DashboardLayout>
  );
}
