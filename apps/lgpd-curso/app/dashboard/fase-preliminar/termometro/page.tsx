import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getTermometro } from "./actions";
import { TermometroRunner } from "./termometro-runner";

export const dynamic = "force-dynamic";

export default async function TermometroPage() {
  const { inicio, fim } = await getTermometro();
  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <AdminPreviewBanner />
      </div>
      <TermometroRunner inicioSalvo={inicio} fimSalvo={fim} />
    </div>
  );
}
