import { PageHeader } from "@/components/page-header";
import { IncidentesList } from "./incidentes-list";
import { PriSecao } from "./pri-secao";
import { listIncidentes, contarInventariosAprovados } from "./actions";
import { listarPri } from "./pri-actions";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
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

      {/* PRI — Plano de Resposta a Incidentes (preparação ANTES) */}
      <PriSecao
        membrosIniciais={pri.membros as any}
        raciInicial={pri.raci as any}
      />

      <IncidentesList items={items as any} qtdInventariosAprovados={qtdInventariosAprovados} />
    </div>
  );
}
