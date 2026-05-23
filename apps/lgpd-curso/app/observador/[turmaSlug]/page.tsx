// Página pública /observador/[turmaSlug] — sem auth. Acessada via QR Code
// do crachá do Observador. Não há login porque os 10 observadores genéricos
// da turma circulam pela sala sem usar mini-apps — só acompanham.

import { ObservadorView } from "./observador-view";

export const dynamic = "force-dynamic";

export default function ObservadorPage({ params }: { params: { turmaSlug: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <ObservadorView turmaSlug={params.turmaSlug} />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          LGPD-Friendly · Curso 2026 · Painel do Observador (read-only)
        </footer>
      </div>
    </div>
  );
}
