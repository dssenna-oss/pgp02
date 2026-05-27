import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getPriorizacao } from "./actions";
import { PriorizacaoView } from "./priorizacao-view";

export const dynamic = "force-dynamic";

export default async function PriorizacaoPage() {
  const { processos, salva } = await getPriorizacao();
  return (
    <div>
      <div className="max-w-4xl mx-auto">
        <AdminPreviewBanner />
      </div>
      <PriorizacaoView processos={processos} salva={salva} />
    </div>
  );
}
