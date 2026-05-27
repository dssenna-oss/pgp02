import { PageHeader } from "@/components/page-header";
import { PacoteGapEditor } from "./pacote-gap-editor";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PacoteGapPage({
  searchParams,
}: {
  searchParams: { turmaId?: string };
}) {
  await requireAdmin();
  const turmaId = searchParams.turmaId;

  // Sem turmaId → mostra lista de turmas ativas pra escolher
  if (!turmaId) {
    const turmas = await prisma.cursoTurma.findMany({
      where: { status: "ATIVA" },
      select: { id: true, nome: true, cidade: true, gapPacote: true, _count: { select: { grupos: true } } },
      orderBy: { createdAt: "desc" },
    });
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader
          missao="Admin"
          titulo="Pacote GAP por turma"
          descricao="Escolha a turma pra customizar quais 10 controles do GAP os grupos vão responder. Catálogo: 30 controles cobrindo as 7 Fases do PGP. Pacote padrão cobre 1 controle por Fase + 4 na Fase 6."
        />
        {turmas.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
            Nenhuma turma ativa. Crie uma em <Link href="/admin/criar-turma" className="text-brand-600 underline">Criar turma</Link>.
          </div>
        ) : (
          <ul className="space-y-2">
            {turmas.map((t) => (
              <li key={t.id} className="border rounded-lg bg-white p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm">{t.nome}</div>
                  <div className="text-xs text-gray-500">{t.cidade} · {t._count.grupos} grupo(s)</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded ${t.gapPacote.length > 0 ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"}`}>
                    {t.gapPacote.length > 0 ? "Pacote customizado" : "Pacote padrão"}
                  </span>
                  <Link
                    href={`/admin/pacote-gap?turmaId=${t.id}`}
                    className="text-sm text-brand-600 underline"
                  >
                    Editar →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Com turmaId → renderiza o editor (carrega via fetch do componente client)
  const turma = await prisma.cursoTurma.findUnique({
    where: { id: turmaId },
    select: { id: true, nome: true, cidade: true },
  });
  if (!turma) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader missao="Admin" titulo="Turma não encontrada" />
        <Link href="/admin/pacote-gap" className="text-brand-600 underline">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Admin · Pacote GAP"
        titulo={`${turma.nome} · ${turma.cidade}`}
        descricao="Escolha exatamente 10 controles para a Missão 3 (GAP Analysis). O catálogo tem 30 controles cobrindo as 7 Fases do PGP — selecione conforme o perfil do grupo (técnicos, jurídicos, gestão)."
      />
      <PacoteGapEditor turmaId={turmaId} />
    </div>
  );
}
