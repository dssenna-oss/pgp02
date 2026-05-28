import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { PriEditor } from "./pri-editor";
import { getPri } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada, podeEditarAgora } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function PriPage() {
  const session = await getSession();
  const { podeEditar, modoCards } = await podeEditarAgora(session?.user?.companyId, podeEditarFaseAvancada(session?.user?.role));
  const pri = await getPri();
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Fase 7 · PRI"
        titulo="Documento do Plano de Resposta a Incidentes"
        descricao="O PRI formal do órgão — preparação ANTES do incidente. 8 seções: objetivo, equipe, severidade, detecção, contenção, comunicação, registro e melhoria contínua. Publica numa URL pública institucional."
      />
      <BaseLegalCard faseKey="incidentes" />
      {modoCards ? <ModoCardsBanner /> : !podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <PriEditor pri={pri as any} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
