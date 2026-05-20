import { PageHeader } from "@/components/page-header";
import { BaseLegalCard } from "@/components/base-legal-card";
import { IncidentesList } from "./incidentes-list";
import { PriSecao } from "./pri-secao";
import { listIncidentes, contarInventariosAprovados } from "./actions";
import { listarPri } from "./pri-actions";
import { getSession } from "@/lib/auth-server";
import { podeEditarFaseAvancada } from "@/lib/curso-permissoes";
import { ModoObservadorBanner } from "@/components/modo-observador-banner";
import { FaseReadOnlyWrapper } from "@/components/fase-readonly-wrapper";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const session = await getSession();
  const podeEditar = podeEditarFaseAvancada(session?.user?.role);
  const [items, qtdInventariosAprovados, pri] = await Promise.all([
    listIncidentes(),
    contarInventariosAprovados(),
    listarPri().catch(() => ({ membros: [], raci: [] })), // se tabelas não migradas ainda, não quebra
  ]);
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 5 · Incidentes"
        titulo="Resposta a Incidentes"
        descricao="O incidente vai acontecer — pergunta é se vocês estarão prontos. Registre, classifique a severidade, comunique ANPD e titulares no prazo da Res. CD/ANPD nº 15/2024."
      />
      <BaseLegalCard faseKey="incidentes" />
      {!podeEditar && <ModoObservadorBanner />}
      <FaseReadOnlyWrapper podeEditar={podeEditar}>
        {/* PRI — Plano de Resposta a Incidentes (preparação ANTES) */}
        <PriSecao
          membrosIniciais={pri.membros as any}
          raciInicial={pri.raci as any}
        />

        <IncidentesList items={items as any} qtdInventariosAprovados={qtdInventariosAprovados} />
      </FaseReadOnlyWrapper>
    </div>
  );
}
