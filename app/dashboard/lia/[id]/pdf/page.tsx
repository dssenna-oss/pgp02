import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import LiaPdfView from "@/components/lia/lia-pdf-view";

/**
 * Tela "PDF view" da LIA (Checkpoint 21 / Fatia 2).
 *
 * Layout limpo, sem DashboardLayout — pra renderizar bem no diálogo de
 * impressão do navegador. Auto-print quando `?autoprint=1`.
 *
 * `?source=published|current`:
 *   - "published" (default) → última versão aprovada
 *   - "current" → conteúdo atual em edição
 */
export default async function LiaPdfPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { source?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) redirect("/dashboard");const source = searchParams.source === "current" ? "current" : "published";
  return <LiaPdfView liaId={params.id} source={source} />;
}
