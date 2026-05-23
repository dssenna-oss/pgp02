// Página pública /quiz/[turmaSlug] — sem auth. Acessada via QR code do crachá,
// link no e-mail de convite, ou URL direta. Renderiza só o runner client-side.

import { QuizRunner } from "./quiz-runner";

export const dynamic = "force-dynamic";

export default function QuizPage({ params }: { params: { turmaSlug: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <QuizRunner turmaSlug={params.turmaSlug} />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          LGPD-Friendly · Curso 2026 · Quiz Diagnóstico anônimo
        </footer>
      </div>
    </div>
  );
}
