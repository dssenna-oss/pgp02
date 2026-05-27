import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getSetores } from "./actions";
import { SetoresView } from "./setores-view";

export const dynamic = "force-dynamic";

export default async function SetoresPage() {
  const { setores, salvos } = await getSetores();
  return (
    <div>
      <div className="max-w-5xl mx-auto">
        <AdminPreviewBanner />
      </div>
      <SetoresView setores={setores} salvos={salvos} />
    </div>
  );
}
