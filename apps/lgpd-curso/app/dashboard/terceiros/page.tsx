import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { TerceirosList } from "./terceiros-list";
import { PareceresSolicitados } from "./pareceres-solicitados";
import { listOperadores } from "./actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada, podeEditarAgora } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { ModoCardsBanner } from "@/components/modo-cards-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function TerceirosPage() {
  const session = await getSession();
  const role = session?.user?.role ?? null;
  const papel = session?.user?.papel ?? null;
  const { podeEditar, modoCards } = await podeEditarAgora(session?.user?.companyId, podeEditarFaseAvancada(session?.user?.role));
  const operadores = await listOperadores();
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Missão 4a · Terceiros"
        titulo="Gestão de Terceiros (Operadores)"
        descricao="Pré-requisito do Aviso de Privacidade. Liste os operadores contratados e marque quais já têm cláusulas LGPD (Art. 39) nos contratos."
      />
      <BaseLegalCard faseKey="terceiros" />
      {modoCards ? <ModoCardsBanner /> : !podeEditar && <ModoObservadorBanner />}
      <PareceresSolicitados operadores={operadores as any} role={role} papel={papel} />
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        <TerceirosList items={operadores as any} role={role} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
