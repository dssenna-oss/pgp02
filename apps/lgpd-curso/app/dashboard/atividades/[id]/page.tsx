// Modalidade C — Onda 2: tela de UMA atividade do participante.
// Server component: carrega a atividade e a resposta já enviada (se houver)
// pra pré-preencher, e delega a interação ao runner client.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ensureTabelaAtividadesC } from "@/lib/colunas-atividades-c";
import { getAtividadeC } from "@/lib/atividades-c";
import { AtividadeRunner } from "../atividade-runner";

export const dynamic = "force-dynamic";

export default async function AtividadePage({ params }: { params: { id: string } }) {
  const at = getAtividadeC(params.id);
  if (!at) notFound();

  const session = await getSession();
  const userId = session?.user?.id;
  const ehAdmin = session?.user?.role === "ADMIN";

  let respostaSalva: any = null;
  if (userId) {
    await ensureTabelaAtividadesC();
    const linha = await prisma.cursoAtividadeResposta.findUnique({
      where: { userId_atividadeId: { userId, atividadeId: at.id } },
      select: { resposta: true },
    });
    respostaSalva = linha?.resposta ?? null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <AdminPreviewBanner />

      <Link
        href="/dashboard/atividades"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Todas as atividades
      </Link>

      <AtividadeRunner atividade={at} respostaSalva={respostaSalva} somenteLeitura={ehAdmin} />
    </div>
  );
}
