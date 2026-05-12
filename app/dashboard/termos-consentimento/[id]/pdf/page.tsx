import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDPO } from "@/lib/auth-helpers";
import DpoOnlyFallback from "@/components/auth/dpo-only-fallback";
import TermoPdfView from "@/components/consent/termo-pdf-view";

export default async function TermoPdfPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { source?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!isDPO(session.user?.role)) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DpoOnlyFallback feature="Termos · PDF" />
      </div>
    );
  }

  const source = searchParams.source === "current" ? "current" : "published";
  return <TermoPdfView termId={params.id} source={source as "current" | "published"} />;
}
