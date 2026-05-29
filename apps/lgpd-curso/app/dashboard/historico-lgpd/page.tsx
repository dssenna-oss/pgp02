import { History } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { HistoricoEmbed } from "@/components/historico-lgpd/historico-embed";

export const dynamic = "force-dynamic";

export default function HistoricoLgpdPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <History className="h-3.5 w-3.5" /> Slides das fases
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Histórico da LGPD</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        Antes de mergulhar na lei, vale entender de onde ela veio. Esta apresentação mostra a
        evolução da privacidade e da proteção de dados no mundo e no Brasil, em linguagem simples.
        Abre aqui dentro; use "Tela cheia" para projetar.
      </p>

      <div className="mt-4">
        <AdminPreviewBanner />
      </div>

      <div className="mt-5">
        <HistoricoEmbed />
      </div>
    </div>
  );
}
