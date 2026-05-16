import { PageHeader } from "@/components/page-header";
import { CriarTurmaForm } from "./criar-turma-form";
import { TurmasList } from "./turmas-list";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
// Neon pode levar 10-20s pra acordar. Folga pra absorver retry do Prisma.
export const maxDuration = 30;

export default async function Page() {
  await requireAdmin();
  const turmas = await prisma.cursoTurma.findMany({
    include: {
      grupos: { include: { company: { include: { _count: { select: { users: true, inventories: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        missao="Admin"
        titulo="Criar Turma"
        descricao="Cria turma + grupos PM/CM + 5 logins por grupo + 2 processos pré-cadastrados em Vegas. Cada grupo é uma Company isolada."
      />
      <CriarTurmaForm />
      <div className="mt-10">
        <h2 className="text-sm font-semibold mb-3">Turmas existentes</h2>
        <TurmasList turmas={turmas as any} />
      </div>
    </div>
  );
}
