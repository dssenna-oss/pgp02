import { PageHeader } from "@/components/page-header";
import { CriarTurmaForm } from "./criar-turma-form";
import { TurmasList } from "./turmas-list";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";

export const dynamic = "force-dynamic";
// Neon pode levar 10-20s pra acordar. Folga pra absorver retry do Prisma.
export const maxDuration = 30;

export default async function Page() {
  await requireAdmin();
  await ensureColunasControleTurma();
  const turmas = await prisma.cursoTurma.findMany({
    include: {
      grupos: { include: { company: { include: { _count: { select: { users: true, inventories: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        missao="Admin"
        titulo="Controle de Turma"
        descricao="Cria e gerencia as turmas do curso. Cada turma cria grupos PM/CM + 6 logins por grupo + 2 processos pré-cadastrados. Em cada turma você define o período de acesso ao app, registra os e-mails dos inscritos e gera o e-mail de convite."
      />
      <CriarTurmaForm />
      <div className="mt-10">
        <h2 className="text-sm font-semibold mb-3">Turmas existentes</h2>
        <TurmasList turmas={turmas as any} />
      </div>
    </div>
  );
}
