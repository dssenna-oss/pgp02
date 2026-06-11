// Acesso rápido do facilitador — gera um atalho/QR de login automático (reusa
// o mecanismo /login#email=...&senha=...&auto=1 que já existe). Junto com a
// sessão de 30 dias do admin, faz o facilitador praticamente nunca digitar
// login. ADMIN-only (herda middleware de /facilitador/*).

import { requireAdmin, getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { AcessoRapido } from "./acesso-rapido";

export const dynamic = "force-dynamic";

export default async function AcessoRapidoPage() {
  await requireAdmin();
  const session = await getSession();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      })
    : null;
  return <AcessoRapido email={user?.email ?? ""} />;
}
