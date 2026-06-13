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
  const companyId = session?.user?.companyId;
  const ehAdmin = session?.user?.role === "ADMIN";
  // Só o Encarregado(a) (role="DPO") registra a atividade do grupo. Membros
  // veem em modo leitura a resposta que o DPO enviou (acompanham no celular).
  const ehDpo = session?.user?.role === "DPO";

  await ensureTabelaAtividadesC();
  let respostaSalva: any = null;
  if (ehDpo && userId) {
    // DPO: a própria resposta (que ele edita/reenvia).
    const linha = await prisma.cursoAtividadeResposta.findUnique({
      where: { userId_atividadeId: { userId, atividadeId: at.id } },
      select: { resposta: true },
    });
    respostaSalva = linha?.resposta ?? null;
  } else if (!ehAdmin && companyId) {
    // Membro do grupo: a resposta do DPO do grupo (leitura).
    const linha = await prisma.cursoAtividadeResposta.findFirst({
      where: { companyId, atividadeId: at.id, papel: "DPO" },
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

      {/* Membro (não-DPO, não-facilitador): explica que o DPO registra. */}
      {!ehDpo && !ehAdmin && companyId && (
        <div className="mb-4 rounded-lg border-l-4 border-l-indigo-400 border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          👤 <strong>O(A) Encarregado(a) do grupo responde por todos.</strong> Discutam juntos — ele(a) registra no celular dele(a). Aqui você acompanha a resposta do grupo.
        </div>
      )}

      <AtividadeRunner atividade={at} respostaSalva={respostaSalva} somenteLeitura={!ehDpo} />
    </div>
  );
}
