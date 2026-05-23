// Cartaz tela cheia do Quiz Diagnóstico — pensado pra projetar no telão
// (16:9) OU imprimir em A4 paisagem. Facilitador abre essa página antes da
// turma chegar e projeta na sala — todo mundo escaneia o QR ao mesmo tempo.
//
// Acesso: ADMIN-only (herda middleware de /facilitador/*).

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartazQuiz } from "./cartaz-quiz";

export const dynamic = "force-dynamic";

export default async function CartazQuizPage({ params }: { params: { turmaSlug: string } }) {
  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: params.turmaSlug },
    select: { nome: true, cidade: true, slug: true, status: true },
  });
  if (!turma) notFound();

  return <CartazQuiz turma={turma} />;
}
