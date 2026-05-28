// Fórum da turma — visão do facilitador (ADMIN-only, herda middleware /facilitador/*).
// Seleciona a turma, liga/desliga o fórum (suporte pós-curso) e participa/modera.

import { prisma } from "@/lib/prisma";
import { ensureColunaForumAberto } from "@/lib/coluna-forum-aberto";
import { ForumFacilitador } from "./forum-facilitador";

export const dynamic = "force-dynamic";

export default async function FacilitadorForumPage() {
  await ensureColunaForumAberto();
  const turmas = await prisma.cursoTurma.findMany({
    orderBy: [{ proximoCurso: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nome: true,
      cidade: true,
      proximoCurso: true,
      forumAberto: true,
      acessoFim: true,
    },
  });

  return <ForumFacilitador turmas={turmas} />;
}
