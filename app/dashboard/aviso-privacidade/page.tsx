import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";

/**
 * Atalho do sidebar pro Aviso de Privacidade institucional (D6 do
 * cardápio). Como o Aviso é só um dos templates do mini-app de
 * Políticas, esta página resolve o redirecionamento em runtime:
 *
 *   - Se já existe Policy `AVISO_PRIVACIDADE_EXTERNO`, redireciona
 *     direto pro editor `/dashboard/politicas/<id>`.
 *   - Se não existe, manda pra listagem com `?novo=AVISO_PRIVACIDADE_EXTERNO`
 *     pra abrir o modal de criação já com o template em foco.
 *
 * DPO-only — usuários sem permissão veem o fallback padrão.
 */
export default async function AvisoPrivacidadeShortcutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <DashboardLayout session={session}>
        <DpoOnlyFallback feature="Aviso de Privacidade" />
      </DashboardLayout>
    );
  }

  const companyId = session.user?.companyId;
  if (!companyId) {
    redirect("/dashboard/politicas");
  }

  // Acha o Aviso institucional mais recente, preferindo Publicada > Rascunho > Arquivada.
  const publicado = await prisma.policy.findFirst({
    where: { companyId, type: "AVISO_PRIVACIDADE_EXTERNO", status: "PUBLICADA" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (publicado) redirect(`/dashboard/politicas/${publicado.id}`);

  const rascunho = await prisma.policy.findFirst({
    where: { companyId, type: "AVISO_PRIVACIDADE_EXTERNO", status: "RASCUNHO" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (rascunho) redirect(`/dashboard/politicas/${rascunho.id}`);

  redirect("/dashboard/politicas?novo=AVISO_PRIVACIDADE_EXTERNO");
}
