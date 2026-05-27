import { getPriorizacao } from "./actions";
import { PriorizacaoView } from "./priorizacao-view";

export const dynamic = "force-dynamic";

export default async function PriorizacaoPage() {
  const { processos, salva } = await getPriorizacao();
  return <PriorizacaoView processos={processos} salva={salva} />;
}
