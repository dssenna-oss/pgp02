import { BookText } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { EstruturaModulos } from "@/components/estrutura-lgpd/estrutura-modulos";
import { MODULOS_ESTRUTURA } from "@/lib/estrutura-lgpd";

export const dynamic = "force-dynamic";

export default function EstruturaLgpdPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <BookText className="h-3.5 w-3.5" /> Slides das fases
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Estrutura da LGPD</h1>
      <p className="mt-1 max-w-3xl text-sm text-gray-600">
        A LGPD percorrida artigo por artigo, em linguagem simples — pra você não ficar "a ver
        navios" quando a lei for citada. Abra cada módulo na ordem; ele abre em tela cheia aqui
        dentro (ou em uma nova aba, se preferir).
      </p>

      <div className="mt-4">
        <AdminPreviewBanner />
      </div>

      <div className="mt-7">
        <EstruturaModulos modulos={MODULOS_ESTRUTURA} />
      </div>
    </div>
  );
}
