import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getEncarregado } from "./actions";
import { EncarregadoForm } from "./encarregado-form";
import { getSession } from "@/lib/auth-server";
import { turmaEmModoCards } from "@/lib/curso-permissoes";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function EncarregadoPage() {
  const session = await getSession();
  const modoCards = await turmaEmModoCards(session?.user?.companyId);
  const company = await getEncarregado();
  return (
    <div className="max-w-5xl mx-auto">
      <AdminPreviewBanner />
      <PageHeader
        missao="Fase 1 · Governança"
        titulo="Identidade do Encarregado (DPO)"
        descricao="Cadastre uma única vez os dados do Encarregado (Art. 41 LGPD) e do Substituto. Esses dados serão reutilizados automaticamente no RIPD, Aviso de Privacidade, Comunicação ANPD e qualquer outro documento legal — você não precisa redigitar a cada vez."
      />
      <BaseLegalCard faseKey="encarregado" />
      {modoCards && <ModoCardsBanner />}
      <FaseReadOnlyWrapper podeEditar={!modoCards}>
        <EncarregadoForm company={company} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
