import { PageHeader } from "@/components/page-header";
import { RipdEditor } from "./ripd-editor";
import { listRipds, listInventariosAprovadosSemRipd, contarRiscos, contarInventariosAprovados } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function RipdPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const [ripds, inventariosDisponiveis, qtdRiscos, qtdInventariosAprovados] = await Promise.all([
    listRipds(),
    listInventariosAprovadosSemRipd(),
    contarRiscos(),
    contarInventariosAprovados(),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        missao="Missão 4a · RIPD"
        titulo="Relatório de Impacto à Proteção de Dados"
        descricao="O RIPD é exigido pela LGPD (arts. 32 e 38) para tratamentos de alto risco. Pré-requisito do Aviso de Privacidade — sem ele, o Aviso vira promessa vazia."
      />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <RipdEditor
          ripds={ripds as any}
          inventariosDisponiveis={inventariosDisponiveis}
          qtdRiscos={qtdRiscos}
          qtdInventariosAprovados={qtdInventariosAprovados}
        />
      </FaseReadOnlyWrapper>
    </div>
  );
}
