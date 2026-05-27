import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getCarta } from "./actions";
import { CartaEditor } from "./carta-editor";

export const dynamic = "force-dynamic";

export default async function CartaPage() {
  const { salva, templateSugerido } = await getCarta();
  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <AdminPreviewBanner />
      </div>
      <CartaEditor salva={salva} templateSugerido={templateSugerido} />
    </div>
  );
}
