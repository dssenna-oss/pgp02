import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PsiPdfView from "@/components/psi/psi-pdf-view";

export default async function PsiPdfPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { source?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const source =
    searchParams.source === "current" ? "current" : "published";

  return <PsiPdfView psiId={params.id} source={source as "current" | "published"} />;
}
