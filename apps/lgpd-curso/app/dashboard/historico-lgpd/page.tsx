import { History } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { HistoricoEmbed } from "@/components/historico-lgpd/historico-embed";

export const dynamic = "force-dynamic";

export default function HistoricoLgpdPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Cabeçalho compacto: a própria apresentação já traz título e intro,
          então aqui mantemos só uma faixa pequena pra sobrar espaço vertical. */}
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <History className="h-3.5 w-3.5" /> Slides das fases · Histórico da LGPD
      </div>

      <AdminPreviewBanner />

      <div className="mt-3">
        <HistoricoEmbed />
      </div>
    </div>
  );
}
