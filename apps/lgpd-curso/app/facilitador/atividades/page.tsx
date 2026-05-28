// Modalidade C — Onda 2: painel do facilitador das Atividades ao vivo.
// Acesso ADMIN-only (herda middleware de /facilitador/*).

import { prisma } from "@/lib/prisma";
import { PainelAtividades } from "./painel-atividades";

export const dynamic = "force-dynamic";

export default async function FacilitadorAtividadesPage() {
  const turmas = await prisma.cursoTurma.findMany({
    where: { status: "ATIVA" },
    orderBy: { proximoCurso: "desc" },
    select: { id: true, nome: true, cidade: true, slug: true, proximoCurso: true },
  });

  return <PainelAtividades turmas={turmas} />;
}
