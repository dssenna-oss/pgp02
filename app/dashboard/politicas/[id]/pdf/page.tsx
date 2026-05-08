import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import PolicyPdfView from "@/components/politicas/policy-pdf-view";

/**
 * Tela "PDF view" de uma política (Checkpoint 12 / E4).
 * Layout limpo, sem DashboardLayout — pra renderizar bem no diálogo
 * de impressão do navegador. Auto-print quando `?autoprint=1`.
 */
export default async function PolicyPdfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  if (!isDPO(session.user?.role)) redirect("/dashboard");const { id } = await params;
  const sp = await searchParams;
  const source = sp.source === "current" ? "current" : "published";
  return <PolicyPdfView policyId={id} source={source as "current" | "published"} />;
}
