import { PageHeader } from "@/components/page-header";
import { DsrList } from "./dsr-list";
import { listDsr } from "./actions";

export const dynamic = "force-dynamic";

export default async function DsrPage() {
  const items = await listDsr();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 4a · DSR"
        titulo="Direitos do Titular"
        descricao="Pré-requisito do Aviso de Privacidade. Estrutura do canal pelo qual o titular exerce os direitos do art. 18 da LGPD. Sem canal funcional, o Aviso vira letra morta."
      />
      <DsrList items={items as any} />
    </div>
  );
}
