// Telão — tela de projeção do facilitador: placar da turma + conquistas ao
// vivo. Fica FORA de /facilitador de propósito, pra usar o layout raiz (sem
// a sidebar do app) e ocupar a tela inteira na projeção. O middleware
// protege /telao só pra ADMIN.

import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { TelaoView } from "./telao-view";

export const dynamic = "force-dynamic";
// Primeira query pós cold-start do Neon pode demorar.
export const maxDuration = 30;

export default async function TelaoPage() {
  await requireAdmin();
  const turmas = await prisma.cursoTurma.findMany({
    where: { status: "ATIVA" },
    select: { id: true, nome: true, cidade: true },
    orderBy: { createdAt: "desc" },
  });
  return <TelaoView turmas={turmas} />;
}
