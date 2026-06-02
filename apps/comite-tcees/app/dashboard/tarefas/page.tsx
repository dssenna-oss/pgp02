import { prisma } from "@/lib/prisma";
import { getSession, isEditorRole } from "@/lib/auth-server";
import { PageHeader } from "@/components/page-header";
import { TarefasClient, type TarefaDTO } from "@/components/tarefas-client";

export const dynamic = "force-dynamic";

export default async function TarefasPage() {
  const session = await getSession();
  const meuId = session?.user?.id ?? "";
  const ehEditor = isEditorRole(session?.user?.role);

  // Editor (Coordenação/Admin) vê todas as tarefas; membro vê só as suas.
  const tarefas = await prisma.tarefa.findMany({
    where: ehEditor ? {} : { responsavelId: meuId },
    orderBy: [{ status: "asc" }, { prazo: "asc" }, { createdAt: "desc" }],
    include: { inventory: { select: { id: true, nome: true, status: true } } },
  });

  const dtos: TarefaDTO[] = tarefas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    responsavelId: t.responsavelId,
    responsavelNome: t.responsavelNome,
    criadoPorNome: t.criadoPorNome,
    inventoryId: t.inventoryId,
    inventoryNome: t.inventory?.nome ?? null,
    inventoryStatus: t.inventory?.status ?? null,
    prazoISO: t.prazo ? new Date(t.prazo).toISOString().slice(0, 10) : null,
    prioridade: t.prioridade,
    status: t.status,
  }));

  // Opções do modal de atribuição — só o editor precisa.
  const [usuarios, processos] = ehEditor
    ? await Promise.all([
        prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        }),
        prisma.dataInventory.findMany({ select: { id: true, nome: true }, orderBy: { ordem: "asc" } }),
      ])
    : [[] as { id: string; name: string; role: string }[], [] as { id: string; nome: string }[]];

  return (
    <>
      <PageHeader
        emoji="🗒️"
        title="Tarefas"
        lead={
          ehEditor
            ? "Atribua o preenchimento de um processo do Inventário (ou qualquer outra tarefa) a um membro, com prazo. Quem recebe uma tarefa ligada a um processo passa a poder editar aquele processo."
            : "Suas tarefas atribuídas pela Coordenação do Comitê. Abra o processo vinculado para preencher o Inventário e marque a tarefa como concluída ao terminar."
        }
      />
      <TarefasClient
        tarefas={dtos}
        ehEditor={ehEditor}
        meuId={meuId}
        usuarios={usuarios.map((u) => ({ id: u.id, nome: u.name, role: u.role }))}
        processos={processos.map((p) => ({ id: p.id, nome: p.nome }))}
      />
    </>
  );
}
