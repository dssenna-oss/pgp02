import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { PlanoAcaoList } from "./plano-acao-list";
import { listPlanoAcao } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function PlanoAcaoPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const items = await listPlanoAcao();
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Fase 5"
        titulo="Programa de Governança em Privacidade (PGP)"
        descricao="O Plano de Ação é o coração do PGP — sai NATURALMENTE das fases anteriores (Inventário → Riscos → GAP). Cada Risco com severidade ALTA e cada GAP NÃO ADERENTE vira uma ação aqui. Use o botão 'Importar' pra trazer tudo automaticamente — depois é só atribuir responsável e prazo."
      />
      <BaseLegalCard faseKey="fase-5" />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <PlanoAcaoList items={items as any} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
