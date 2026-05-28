// Cartaz tela cheia de uma Atividade ao vivo (Modalidade C, Onda 2) — pra
// projetar no telão. Acesso ADMIN-only (herda middleware de /facilitador/*).
// A atividade vem por query param ?a=<atividadeId>.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAtividadeC, ATIVIDADES_C } from "@/lib/atividades-c";
import { CartazAtividade } from "./cartaz-atividade";

export const dynamic = "force-dynamic";

export default async function CartazAtividadePage({
  params,
  searchParams,
}: {
  params: { turmaSlug: string };
  searchParams: { a?: string };
}) {
  const turma = await prisma.cursoTurma.findFirst({
    where: { slug: params.turmaSlug },
    select: { id: true, nome: true, cidade: true, slug: true },
  });
  if (!turma) notFound();

  const at = (searchParams.a && getAtividadeC(searchParams.a)) || ATIVIDADES_C[0];

  return (
    <CartazAtividade
      turma={turma}
      atividade={{ id: at.id, titulo: at.titulo, fase: at.fase, emoji: at.emoji, contexto: at.contexto }}
    />
  );
}
