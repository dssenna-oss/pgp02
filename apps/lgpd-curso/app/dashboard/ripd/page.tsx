import { PageHeader } from "@/components/page-header";
import { RipdEditor } from "./ripd-editor";
import { listRipds } from "./actions";

export const dynamic = "force-dynamic";

export default async function RipdPage() {
  const ripds = await listRipds();
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        missao="Missão 4a · RIPD"
        titulo="Relatório de Impacto à Proteção de Dados"
        descricao="O RIPD é exigido pela LGPD (arts. 32 e 38) para tratamentos de alto risco. Pré-requisito do Aviso de Privacidade — sem ele, o Aviso vira promessa vazia."
      />
      <RipdEditor ripds={ripds as any} />
    </div>
  );
}
