import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getPriorizacao } from "./actions";
import { PriorizacaoView } from "./priorizacao-view";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function PriorizacaoPage() {
  const session = await getSession();
  const modoCards = await turmaEmModoCards(session?.user?.companyId);
  const { processos, salva } = await getPriorizacao();
  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <AdminPreviewBanner />
        {modoCards && <ModoCardsBanner />}
      </div>
      <FaseReadOnlyWrapper podeEditar={!modoCards}>
        <PriorizacaoView processos={processos} salva={salva} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
