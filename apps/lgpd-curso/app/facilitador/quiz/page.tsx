import { prisma } from "@/lib/prisma";
import { PainelQuiz } from "./painel-quiz";

export const dynamic = "force-dynamic";

export default async function FacilitadorQuizPage() {
  // Busca lista de turmas pra o seletor
  const turmas = await prisma.cursoTurma.findMany({
    where: { status: "ATIVA" },
    orderBy: { proximoCurso: "desc" },
    select: { id: true, nome: true, cidade: true, slug: true, proximoCurso: true },
  });

  return <PainelQuiz turmas={turmas} />;
}
