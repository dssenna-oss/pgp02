import { PageHeader } from "@/components/page-header";
import { DsrList } from "./dsr-list";
import { listDsr } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function DsrPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const items = await listDsr();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 4a · DSR"
        titulo="Direitos do Titular"
        descricao="Pré-requisito do Aviso de Privacidade. Estrutura do canal pelo qual o titular exerce os direitos do art. 18 da LGPD. Sem canal funcional, o Aviso vira letra morta."
      />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <DsrList items={items as any} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
