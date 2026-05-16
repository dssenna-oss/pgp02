import { PageHeader } from "@/components/page-header";
import { PainelFacilitador } from "./painel-facilitador";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function FacilitadorPage() {
  await requireAdmin();
  const turmas = await prisma.cursoTurma.findMany({
    where: { status: "ATIVA" },
    select: { id: true, nome: true, cidade: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        missao="Admin · Ao vivo"
        titulo="Painel do Facilitador"
        descricao="Acompanhe o ritmo dos grupos em tempo real, dispare o incidente surpresa na Missão 5 e gere os certificados no debrief. Atualiza automaticamente a cada 3 segundos."
      />
      {turmas.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-sm text-gray-500">
          Nenhuma turma ativa. Crie uma em <a className="text-brand-600 underline" href="/admin/criar-turma">Criar turma</a>.
        </div>
      ) : (
        <PainelFacilitador turmas={turmas} />
      )}
    </div>
  );
}
