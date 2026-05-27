import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getQuizState } from "./actions";
import { CacaPegadinhasView } from "./caca-pegadinhas-view";

export const dynamic = "force-dynamic";

export default async function CacaPegadinhasPage() {
  const estado = await getQuizState();
  return (
    <div>
      <div className="max-w-6xl mx-auto">
        <AdminPreviewBanner />
      </div>
      <CacaPegadinhasView estado={estado} />
    </div>
  );
}
