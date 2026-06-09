import { PageHeader } from "@/components/page-header";
import { PainelConducao } from "./painel-conducao";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function ConducaoPage() {
  await requireAdmin();
  const turmas = await prisma.cursoTurma.findMany({
    where: { status: "ATIVA" },
    select: { id: true, nome: true, cidade: true, slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        missao="Admin · Condução ao vivo"
        titulo="Painel de Condução"
        descricao="Seu GPS do curso: o momento atual do roteiro, os botões certos na hora certa, quantos grupos já responderam e os alertas — tudo numa tela só."
      />
      {turmas.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          Nenhuma turma ativa. Crie uma em{" "}
          <a className="text-brand-600 underline" href="/admin/criar-turma">Criar turma</a>.
        </div>
      ) : (
        <PainelConducao turmas={turmas} />
      )}
    </div>
  );
}
