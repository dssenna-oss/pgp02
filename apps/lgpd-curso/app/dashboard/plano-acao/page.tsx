import { PageHeader } from "@/components/page-header";
import { PlanoAcaoList } from "./plano-acao-list";
import { listPlanoAcao } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlanoAcaoPage() {
  const items = await listPlanoAcao();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Fase 5"
        titulo="Plano de Ação"
        descricao="O Plano sai NATURALMENTE das fases anteriores. Cada Risco com severidade ALTA e cada GAP NÃO ADERENTE vira uma ação aqui. Use o botão 'Importar' pra trazer tudo automaticamente — depois é só atribuir responsável e prazo."
      />
      <PlanoAcaoList items={items as any} />
    </div>
  );
}
