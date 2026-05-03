export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TASK_STATUS } from "@/lib/tarefas-types";

/**
 * GET /api/tarefas/contadores
 * Retorna os contadores agregados das tarefas do usuário (alimenta o
 * badge da sidebar e os totais visíveis em cada aba).
 *
 * Sem filtros server-side — sempre retorna os 5 totais.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where = { userId: user.id };

  const [aFazer, emAndamento, concluidas, atrasadas, vencendoHoje] =
    await Promise.all([
      prisma.task.count({ where: { ...where, status: TASK_STATUS.A_FAZER } }),
      prisma.task.count({
        where: { ...where, status: TASK_STATUS.EM_ANDAMENTO },
      }),
      prisma.task.count({
        where: { ...where, status: TASK_STATUS.CONCLUIDA },
      }),
      prisma.task.count({
        where: {
          ...where,
          status: { not: TASK_STATUS.CONCLUIDA },
          dueDate: { lt: today },
        },
      }),
      prisma.task.count({
        where: {
          ...where,
          status: { not: TASK_STATUS.CONCLUIDA },
          dueDate: { gte: today, lt: tomorrow },
        },
      }),
    ]);

  return NextResponse.json({
    aFazer,
    emAndamento,
    concluidas,
    atrasadas,
    vencendoHoje,
  });
}
