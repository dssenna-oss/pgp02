import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getSetores } from "./actions";
import { SetoresView } from "./setores-view";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function SetoresPage() {
  const session = await getSession();
  const modoCards = await turmaEmModoCards(session?.user?.companyId);
  const { setores, salvos } = await getSetores();
  return (
    <div>
      <div className="max-w-5xl mx-auto">
        <AdminPreviewBanner />
        {modoCards && <ModoCardsBanner />}
      </div>
      <FaseReadOnlyWrapper podeEditar={!modoCards}>
        <SetoresView setores={setores} salvos={salvos} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
