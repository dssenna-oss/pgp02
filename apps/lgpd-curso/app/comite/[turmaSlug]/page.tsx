// Página pública /comite/[turmaSlug]?orgao=PM|CM — sem auth.
// Acessada via QR Code do crachá do Comitê Executivo. Não há login —
// cada comitê (1 PM, 1 CM) acompanha os grupos do próprio órgão
// em modo read-only durante o curso.
//
// ⚠️ Importante: este "Comitê Executivo" é o PAPEL DOS PARTICIPANTES DO
// CURSO que acompanham as equipes em ação. NÃO é o Comitê de Governança
// do PGP (Fase 1) que cada Instituição forma INTERNAMENTE pra gerenciar
// privacidade. São conceitos diferentes — o roteiro deixa isso claro
// no D-0 e na Apresentação Inicial.

import { ComiteView } from "./comite-view";

export const dynamic = "force-dynamic";

export default function ComitePage({
  params,
  searchParams,
}: {
  params: { turmaSlug: string };
  searchParams: { orgao?: string };
}) {
  // orgao=PM ou orgao=CM define qual comitê é. Sem param = mostra todos
  // os grupos (útil pra facilitador testar a URL).
  const orgao =
    searchParams?.orgao === "PM" || searchParams?.orgao === "CM"
      ? searchParams.orgao
      : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <ComiteView turmaSlug={params.turmaSlug} orgao={orgao} />
        <footer className="mt-8 text-center text-[11px] text-gray-400">
          LGPD-Friendly · Curso 2026 · Comitê Executivo (read-only)
        </footer>
      </div>
    </div>
  );
}
