import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getEncarregado } from "./actions";
import { EncarregadoForm } from "./encarregado-form";

export const dynamic = "force-dynamic";

export default async function EncarregadoPage() {
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
      <EncarregadoForm company={company} />
    </div>
  );
}
