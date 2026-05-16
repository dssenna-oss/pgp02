import { PageHeader } from "@/components/page-header";
import { IncidentesList } from "./incidentes-list";
import { listIncidentes } from "./actions";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const items = await listIncidentes();
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Missão 5 · Incidentes"
        titulo="Resposta a Incidentes"
        descricao="O incidente vai acontecer — pergunta é se vocês estarão prontos. Registre, classifique a severidade, comunique ANPD e titulares no prazo da Res. CD/ANPD nº 15/2024."
      />
      <IncidentesList items={items as any} />
    </div>
  );
}
