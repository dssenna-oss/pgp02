"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, requireSession, isEditorRole } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { emailTarefaAtribuida } from "@/lib/comite-emails";

export type TarefaInput = {
  id?: string;
  titulo: string;
  descricao?: string;
  responsavelId: string; // User.id de quem deve executar
  inventoryId?: string | null; // processo vinculado (opcional)
  prazo?: string | null; // "YYYY-MM-DD"
  prioridade: string; // BAIXA | MEDIA | ALTA
};

const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"];
const STATUS = ["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA"];

function dataBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Cria/edita uma tarefa. Só Coordenação/Admin atribui. */
export async function salvarTarefa(input: TarefaInput) {
  const session = await requireEditor();
  if (!input.titulo?.trim()) throw new Error("O título da tarefa é obrigatório.");
  if (!input.responsavelId) throw new Error("Escolha o membro responsável.");

  const resp = await prisma.user.findUnique({
    where: { id: input.responsavelId },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!resp || !resp.isActive) throw new Error("Responsável inválido ou login inativo.");

  let inventory: { id: string; nome: string } | null = null;
  if (input.inventoryId) {
    inventory = await prisma.dataInventory.findUnique({
      where: { id: input.inventoryId },
      select: { id: true, nome: true },
    });
    if (!inventory) throw new Error("Processo do Inventário não encontrado.");
  }

  const prazoDate = input.prazo ? new Date(`${input.prazo}T12:00:00`) : null;
  const prioridade = PRIORIDADES.includes(input.prioridade) ? input.prioridade : "MEDIA";

  const dados = {
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    responsavelId: resp.id,
    responsavelNome: resp.name,
    inventoryId: inventory?.id ?? null,
    prazo: prazoDate,
    prioridade,
  };

  let ehNova = false;
  if (input.id) {
    await prisma.tarefa.update({ where: { id: input.id }, data: dados });
  } else {
    await prisma.tarefa.create({
      data: { ...dados, criadoPorNome: session.user.name ?? null, status: "A_FAZER" },
    });
    ehNova = true;
  }

  // Vínculo com processo → o responsável vira "dono" do processo (ganha edição).
  if (inventory) {
    await prisma.dataInventory.update({
      where: { id: inventory.id },
      data: { responsavelId: resp.id, responsavelNome: resp.name },
    });
    revalidatePath("/dashboard/inventario");
  }

  // Aviso ao membro: notificação no app + e-mail. Só em tarefa NOVA (não reavisa a cada edição).
  if (ehNova) {
    await prisma.notificacao.create({
      data: {
        tipo: "TAREFA",
        titulo: `Nova tarefa para ${resp.name}: ${dados.titulo}`,
        descricao:
          `${prazoDate ? `Prazo ${dataBR(prazoDate)}. ` : ""}${inventory ? `Processo: ${inventory.nome}.` : ""}`.trim() ||
          null,
        href: "/dashboard/tarefas",
      },
    });
    if (resp.email && resp.email.includes("@")) {
      await emailTarefaAtribuida({
        to: { email: resp.email, name: resp.name },
        titulo: dados.titulo,
        prazoBR: prazoDate ? dataBR(prazoDate) : null,
        processoNome: inventory?.nome ?? null,
        descricao: dados.descricao,
      });
    }
  }

  revalidatePath("/dashboard/tarefas");
  revalidatePath("/dashboard/notificacoes");
  return { ok: true };
}

export async function excluirTarefa(id: string) {
  await requireEditor();
  await prisma.tarefa.delete({ where: { id } });
  revalidatePath("/dashboard/tarefas");
  return { ok: true };
}

/** Muda o status. Pode: editor (Coordenação/Admin) OU o próprio responsável. */
export async function atualizarStatusTarefa(id: string, status: string) {
  const session = await requireSession();
  if (!STATUS.includes(status)) throw new Error("Status inválido.");

  const tarefa = await prisma.tarefa.findUnique({
    where: { id },
    select: { responsavelId: true },
  });
  if (!tarefa) throw new Error("Tarefa não encontrada.");

  if (!isEditorRole(session.user.role) && tarefa.responsavelId !== session.user.id) {
    throw new Error("Você só pode atualizar as tarefas atribuídas a você.");
  }

  await prisma.tarefa.update({
    where: { id },
    data: { status, concluidaEm: status === "CONCLUIDA" ? new Date() : null },
  });
  revalidatePath("/dashboard/tarefas");
  return { ok: true };
}
