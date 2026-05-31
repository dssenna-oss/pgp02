import { requireSession } from "@/lib/auth-server";
import { PageHeader } from "@/components/page-header";
import { ContaClient } from "@/components/conta-client";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const session = await requireSession();
  return (
    <>
      <PageHeader
        emoji="👤"
        title="Minha conta"
        lead="Troque a sua senha de acesso ao painel do Comitê."
      />
      <div className="bg-white border rounded-xl p-5 max-w-md">
        <div className="text-[13px] text-gray-600 mb-4">
          Conectado como <b>{session.user?.name}</b> · {session.user?.email}
        </div>
        <ContaClient />
      </div>
    </>
  );
}
