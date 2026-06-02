import { prisma } from "@/lib/prisma";
import { prazoInfo, prazoBR } from "@/lib/tarefas";
import { emailLembreteTarefas } from "@/lib/comite-emails";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diário: avisa por e-mail cada responsável sobre suas tarefas com prazo
 * próximo (até 2 dias) ou vencido. Um e-mail por pessoa, listando as tarefas.
 *
 * Segurança: exige `Authorization: Bearer <CRON_SECRET>`. A Vercel injeta esse
 * header automaticamente nas chamadas de cron quando a env var CRON_SECRET existe.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Não concluídas, com prazo definido, vencendo em até 2 dias (inclui vencidas).
  const limite = new Date();
  limite.setHours(23, 59, 59, 999);
  limite.setDate(limite.getDate() + 2);

  const tarefas = await prisma.tarefa.findMany({
    where: { status: { not: "CONCLUIDA" }, prazo: { not: null, lte: limite } },
    orderBy: { prazo: "asc" },
  });

  // Agrupa por responsável (User.id).
  const porResp = new Map<string, typeof tarefas>();
  for (const t of tarefas) {
    const arr = porResp.get(t.responsavelId) ?? [];
    arr.push(t);
    porResp.set(t.responsavelId, arr);
  }
  if (porResp.size === 0) return Response.json({ ok: true, enviados: 0, tarefas: 0 });

  const users = await prisma.user.findMany({
    where: { id: { in: [...porResp.keys()] }, isActive: true },
    select: { id: true, name: true, email: true },
  });

  let enviados = 0;
  for (const u of users) {
    if (!u.email || !u.email.includes("@")) continue;
    const itens = (porResp.get(u.id) ?? []).map((t) => {
      const iso = t.prazo ? new Date(t.prazo).toISOString().slice(0, 10) : null;
      const pz = prazoInfo(iso, t.status);
      return { titulo: t.titulo, prazoBR: prazoBR(iso), situacao: pz.texto, vencida: pz.atrasada };
    });
    await emailLembreteTarefas({ to: { email: u.email, name: u.name }, itens });
    enviados++;
  }

  return Response.json({ ok: true, enviados, tarefas: tarefas.length });
}
