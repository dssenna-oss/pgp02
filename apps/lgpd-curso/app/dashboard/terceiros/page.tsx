import { PageHeader } from "@/components/page-header";
import { TerceirosList } from "./terceiros-list";
import { listOperadores } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function TerceirosPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const operadores = await listOperadores();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 4a · Terceiros"
        titulo="Gestão de Terceiros (Operadores)"
        descricao="Pré-requisito do Aviso de Privacidade. Liste os operadores contratados e marque quais já têm cláusulas LGPD (Art. 39) nos contratos."
      />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <TerceirosList items={operadores as any} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
