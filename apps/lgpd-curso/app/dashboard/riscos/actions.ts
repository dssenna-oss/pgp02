"use server";

import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function listRiscos() {
  const { companyId } = await requireCompany();
  return prisma.processRisk.findMany({
    where: { companyId },
    include: { inventory: { select: { id: true, nome: true, createdById: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// Lista inventários do grupo, filtrada por papel:
//   - DPO / ADMIN          → vê todos
//   - Contribuidor dono    → vê processos onde é createdById
//   - Setor de apoio (TI / PROCURADORIA / COMUNICACAO) → também vê processos
//     com riscos tramitados pro papel dele (tramitadoPara = user.papel)
export async function listInventoriesForSelect() {
  const { companyId, session } = await requireCompany();
  const role = session.user.role;
  const isDpoOuAdmin = role === "DPO" || role === "ADMIN";

  if (isDpoOuAdmin) {
    return prisma.dataInventory.findMany({
      where: { companyId },
      select: { id: true, nome: true, setor: true, status: true, dadosSensiveis: true, createdById: true },
      orderBy: { createdAt: "asc" },
    });
  }

  // Pra não-admin: combina (dono) + (setor de apoio com tramitação ativa)
  const tramitados = session.user.papel
    ? await prisma.processRisk.findMany({
        where: { companyId, tramitadoPara: session.user.papel },
        select: { inventoryId: true },
      })
    : [];
  const idsTramitados = Array.from(new Set(tramitados.map((r) => r.inventoryId).filter(Boolean))) as string[];

  return prisma.dataInventory.findMany({
    where: {
      companyId,
      OR: [
        { createdById: session.user.id },
        ...(idsTramitados.length > 0 ? [{ id: { in: idsTramitados } }] : []),
      ],
    },
    select: { id: true, nome: true, setor: true, status: true, dadosSensiveis: true, createdById: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function saveRisco(input: {
  id?: string;
  inventoryId?: string;
  riscoTitulo: string;
  descricao?: string;
  categoria?: string;
  probabilidade: "BAIXA" | "MEDIA" | "ALTA";
  impacto: "BAIXO" | "MEDIO" | "ALTO";
  mitigationPlan?: string;
}) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  // Segregação: Contribuidor só pode criar/editar risco em processo que ELE é dono
  // OU em processo com tramitação pro papel dele (setor de apoio).
  if (input.inventoryId && !isDpoOuAdmin) {
    const inv = await prisma.dataInventory.findFirst({
      where: { id: input.inventoryId, companyId },
      select: { createdById: true },
    });
    if (!inv) throw new Error("Processo não encontrado");
    const ehDono = inv.createdById === session.user.id;
    const temTramitacao = session.user.papel
      ? !!(await prisma.processRisk.findFirst({
          where: { companyId, inventoryId: input.inventoryId, tramitadoPara: session.user.papel },
          select: { id: true },
        }))
      : false;
    if (!ehDono && !temTramitacao) {
      throw new Error("Você só pode adicionar risco em processo que você é dono ou que foi tramitado pro seu setor.");
    }
  }

  // Regra 2b: vale pra QUALQUER papel (inclusive DPO) — não pode adicionar
  // risco novo em processo com análise FECHADA (todos riscos APROVADOS).
  // Pra adicionar, DPO precisa REABRIR a análise antes.
  if (!input.id && input.inventoryId) {
    const aprovados = await prisma.processRisk.count({
      where: { companyId, inventoryId: input.inventoryId, status: "APROVADO" },
    });
    const naoAprovados = await prisma.processRisk.count({
      where: { companyId, inventoryId: input.inventoryId, status: { not: "APROVADO" } },
    });
    if (aprovados > 0 && naoAprovados === 0) {
      throw new Error(
        "Processo já tem análise aprovada (todos riscos APROVADOS). Pra adicionar novos riscos, REABRA a análise primeiro (botão 'Reabrir análise' visível pro DPO no card)."
      );
    }
  }

  let statusNovo: string | undefined; // pra possível reset em edição
  if (input.id && !isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id: input.id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    const ehDono = existente.inventory && existente.inventory.createdById === session.user.id;
    const temTramitacao = existente.tramitadoPara && existente.tramitadoPara === session.user.papel;
    if (!ehDono && !temTramitacao) {
      throw new Error("Você só pode editar riscos dos seus processos ou tramitados pro seu setor.");
    }
    // Regra 1: Contribuidor NÃO pode mexer em risco APROVADO (precisa DPO devolver/reabrir)
    if (existente.status === "APROVADO") {
      throw new Error("Risco já APROVADO pelo DPO. Pra ajustar, peça pro DPO devolver ou reabrir a análise.");
    }
    // Contribuidor também NÃO mexe em SUBMETIDO (já tá com DPO pra avaliação)
    if (ehDono && !temTramitacao && existente.status === "SUBMETIDO") {
      throw new Error("Risco já submetido ao DPO — aguarde a revisão. Se for urgente, peça pro DPO devolver.");
    }
    // Se Contribuidor dono edita um risco DEVOLVIDO, volta pra RASCUNHO automaticamente
    // Se setor de apoio edita risco tramitado, mantém status (DPO recebe de volta intacto)
    if (ehDono && existente.status === "DEVOLVIDO") statusNovo = "RASCUNHO";
  }

  const sevP = input.probabilidade.charAt(0);
  const sevI = input.impacto.charAt(0);
  const sevS = computeSeverity(input.probabilidade, input.impacto);
  const severityLevel = `P:${sevP};I:${sevI};S:${sevS}`;

  const data: any = {
    companyId,
    inventoryId: input.inventoryId || null,
    riscoTitulo: input.riscoTitulo,
    descricao: input.descricao || null,
    categoria: input.categoria || null,
    severityLevel,
    mitigationPlan: input.mitigationPlan || null,
  };
  if (statusNovo) data.status = statusNovo;

  let result;
  if (input.id) {
    result = await prisma.processRisk.update({
      where: { id: input.id },
      data: { ...data, companyId: undefined },
    });
  } else {
    // Novo risco: stamp createdById + status RASCUNHO
    result = await prisma.processRisk.create({
      data: {
        ...data,
        createdById: session.user.id,
        status: "RASCUNHO",
      },
    });
  }

  revalidatePath("/dashboard/riscos");
  return result;
}

function computeSeverity(p: string, i: string): "BAIXO" | "MEDIO" | "ALTO" {
  const map: Record<string, number> = { BAIXA: 1, MEDIA: 2, ALTA: 3, BAIXO: 1, MEDIO: 2, ALTO: 3 };
  const score = (map[p] || 1) * (map[i] || 1);
  if (score >= 6) return "ALTO";
  if (score >= 3) return "MEDIO";
  return "BAIXO";
}

export async function deletarRisco(id: string) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  if (!isDpoOuAdmin) {
    const existente = await prisma.processRisk.findFirst({
      where: { id, companyId },
      include: { inventory: { select: { createdById: true } } },
    });
    if (!existente) throw new Error("Risco não encontrado");
    if (existente.inventory && existente.inventory.createdById !== session.user.id) {
      throw new Error("Apenas o DPO ou o dono do processo pode remover este risco.");
    }
    if (existente.status === "APROVADO") {
      throw new Error("Risco APROVADO não pode ser removido. Peça ao DPO se for necessário.");
    }
  }

  await prisma.processRisk.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/riscos");
}

// ============================================================================
// Workflow Contribuidor → DPO (em LOTE por inventário/processo)
// Art. 41 §2º LGPD — encarregado aprova análises de risco
// ============================================================================

// Contribuidor (dono do processo) submete todos os riscos RASCUNHO/DEVOLVIDO daquele processo pro DPO
export async function submeterRiscosDoProcesso(inventoryId: string) {
  const { companyId, session } = await requireCompany();
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { createdById: true, nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  // Permissão: dono do processo ou DPO
  if (!isDpoOuAdmin && inv.createdById !== session.user.id) {
    throw new Error("Apenas o dono do processo ou o DPO pode submeter os riscos.");
  }

  const updated = await prisma.processRisk.updateMany({
    where: {
      companyId,
      inventoryId,
      status: { in: ["RASCUNHO", "DEVOLVIDO"] },
    },
    data: {
      status: "SUBMETIDO",
      submittedAt: new Date(),
      feedbackDpo: null, // limpa feedback anterior se houver
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco em RASCUNHO ou DEVOLVIDO pra submeter no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// DPO aprova todos os riscos SUBMETIDOS daquele processo
export async function aprovarRiscosDoProcesso(inventoryId: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode aprovar riscos.");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "SUBMETIDO" },
    data: {
      status: "APROVADO",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      feedbackDpo: null,
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco SUBMETIDO pra aprovar no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// ============================================================================
// Tramitação multi-setor (Comitê LGPD): DPO pede apoio a TI/PROCURADORIA/COMUNICACAO
// antes de aprovar. Setor de apoio recebe acesso temporário ao processo.
// ============================================================================

const PAPEIS_DE_APOIO_VALIDOS = ["TI", "PROCURADORIA", "COMUNICACAO"];

// DPO tramita todos riscos SUBMETIDOS do processo pra um setor de apoio
export async function tramitarRiscosParaApoio(inventoryId: string, papelDestino: string, nota: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode tramitar riscos pra setor de apoio.");
  }
  if (!PAPEIS_DE_APOIO_VALIDOS.includes(papelDestino)) {
    throw new Error(`Papel destino inválido. Use um de: ${PAPEIS_DE_APOIO_VALIDOS.join(", ")}.`);
  }
  if (!nota || nota.trim().length < 10) {
    throw new Error("Escreva uma nota explicando o que você precisa do setor de apoio (mínimo 10 caracteres).");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "SUBMETIDO", tramitadoPara: null },
    data: {
      tramitadoPara: papelDestino,
      tramitacaoNota: nota.trim(),
      tramitadoEm: new Date(),
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco SUBMETIDO sem tramitação ativa em "${inv.nome}". Devolva a tramitação atual primeiro se for o caso.`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// Setor de apoio devolve riscos ao DPO (mantém status SUBMETIDO)
export async function devolverRiscosAoDPO(inventoryId: string) {
  const { companyId, session } = await requireCompany();
  const papel = session.user.papel;
  const isDpoOuAdmin = session.user.role === "DPO" || session.user.role === "ADMIN";

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  // Quem pode devolver: o setor de apoio destinatário (papel matches) OU DPO/ADMIN (override)
  const whereTramitadoPara = isDpoOuAdmin ? { not: null } : papel;
  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, tramitadoPara: whereTramitadoPara },
    data: { tramitadoPara: null, tramitacaoNota: null },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco em tramitação ativa pra você no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// DPO reabre análise — reverte todos APROVADOS pra DEVOLVIDO com motivo padrão
// Usado quando processo já fechado precisa receber novos riscos ou ajustes.
export async function reabrirAnaliseDoProcesso(inventoryId: string, motivo: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode reabrir uma análise de riscos aprovada.");
  }
  if (!motivo || motivo.trim().length < 10) {
    throw new Error("Explique brevemente por que está reabrindo (mínimo 10 caracteres). Os Contribuidores vão ver.");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "APROVADO" },
    data: {
      status: "DEVOLVIDO",
      feedbackDpo: `[REABERTURA] ${motivo.trim()}`,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    throw new Error(`Nenhum risco APROVADO pra reabrir em "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}

// DPO devolve todos os riscos SUBMETIDOS daquele processo com motivo
export async function devolverRiscosDoProcesso(inventoryId: string, motivo: string) {
  const { companyId, session } = await requireCompany();
  if (!["DPO", "ADMIN"].includes(session.user.role)) {
    throw new Error("Apenas o DPO pode devolver riscos.");
  }
  if (!motivo || motivo.trim().length < 5) {
    throw new Error("Informe o motivo da devolução (mínimo 5 caracteres).");
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    select: { nome: true },
  });
  if (!inv) throw new Error("Processo não encontrado");

  const updated = await prisma.processRisk.updateMany({
    where: { companyId, inventoryId, status: "SUBMETIDO" },
    data: {
      status: "DEVOLVIDO",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      feedbackDpo: motivo.trim(),
    },
  });

  if (updated.count === 0) {
    throw new Error(`Nenhum risco SUBMETIDO pra devolver no processo "${inv.nome}".`);
  }

  revalidatePath("/dashboard/riscos");
  return { count: updated.count };
}
