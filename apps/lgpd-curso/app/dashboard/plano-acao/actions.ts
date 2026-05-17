"use server";

// Plano de Ação — server actions.
// Pedagogicamente: o Plano sai NATURALMENTE das fases anteriores.
//   - Cada Risco com Severidade ALTA → ação pra mitigar
//   - Cada GAP respondido NÃO ADERENTE → ação pra endereçar
//   - O DPO pode também criar ações MANUAL
// O botão "Importar de Riscos e GAP" é idempotente (não duplica).

import { prisma } from "@/lib/prisma";
import { requireCompany, requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { GAP_PACOTE } from "@/lib/gap-pacote";
import { ensureGapConcluido } from "@/lib/phase-guard";

const STATUS_VALIDOS = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA"] as const;
const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"] as const;
const ORIGENS = ["RISCO", "GAP", "MANUAL"] as const;

export async function listPlanoAcao() {
  const { companyId } = await requireCompany();
  return prisma.actionPlan.findMany({
    where: { companyId },
    orderBy: [{ status: "asc" }, { prioridade: "desc" }, { createdAt: "desc" }],
  });
}

export async function savePlanoAcao(input: {
  id?: string;
  acao: string;
  responsavel?: string;
  prazoIso?: string | null;
  status?: string;
  prioridade?: string;
}) {
  await ensureGapConcluido("FASE_5", input.id ? "Editar acao do Plano" : "Criar acao do Plano");
  const { companyId } = await requireCompany();
  if (!input.acao?.trim()) throw new Error("Ação obrigatória");

  const status = STATUS_VALIDOS.includes(input.status as any) ? input.status! : "ABERTA";
  const prioridade = PRIORIDADES.includes(input.prioridade as any) ? input.prioridade! : "MEDIA";
  const prazo = input.prazoIso ? new Date(input.prazoIso) : null;

  const data = {
    companyId,
    acao: input.acao.trim(),
    responsavel: input.responsavel?.trim() || null,
    prazo,
    status,
    prioridade,
  };

  let result;
  if (input.id) {
    result = await prisma.actionPlan.update({
      where: { id: input.id, companyId },
      data: { acao: data.acao, responsavel: data.responsavel, prazo: data.prazo, status, prioridade },
    });
  } else {
    result = await prisma.actionPlan.create({
      data: { ...data, origem: "MANUAL" },
    });
  }
  revalidatePath("/dashboard/plano-acao");
  return result;
}

export async function atualizarStatus(id: string, novoStatus: string) {
  await ensureGapConcluido("FASE_5", `Atualizar status -> ${novoStatus}`);
  const { companyId } = await requireCompany();
  if (!STATUS_VALIDOS.includes(novoStatus as any)) throw new Error("Status inválido");
  const result = await prisma.actionPlan.update({
    where: { id, companyId },
    data: { status: novoStatus },
  });
  revalidatePath("/dashboard/plano-acao");
  return result;
}

export async function deletarPlanoAcao(id: string) {
  await ensureGapConcluido("FASE_5", "Deletar acao do Plano");
  const { companyId } = await requireCompany();
  await prisma.actionPlan.delete({ where: { id, companyId } });
  revalidatePath("/dashboard/plano-acao");
}

// Auto-importa Riscos ALTO + GAP NÃO ADERENTE como ações pré-preenchidas.
// Idempotente: usa `origemRef` pra detectar o que já foi importado.
export async function importarDeRiscosEGap() {
  await ensureGapConcluido("FASE_5", "Importar Riscos + GAP");
  await requireSession();
  const { companyId } = await requireCompany();

  const [riscos, gaps, existentes] = await Promise.all([
    prisma.processRisk.findMany({
      where: { companyId },
      include: { inventory: { select: { nome: true } } },
    }),
    prisma.gapAnswer.findMany({
      where: { companyId, resposta: "NAO_ADERENTE" },
    }),
    prisma.actionPlan.findMany({
      where: { companyId, origem: { in: ["RISCO", "GAP"] } },
      select: { origem: true, origemRef: true },
    }),
  ]);

  const jaImportados = new Set(existentes.map((e) => `${e.origem}:${e.origemRef}`));
  const criados: { origem: string; acao: string }[] = [];

  // RISCOS — só os com Severidade ALTO (parse do encoding "P:M;I:A;S:ALTO")
  for (const r of riscos) {
    const sev = parseSeveridade(r.severityLevel);
    if (sev !== "ALTO") continue;
    const chave = `RISCO:${r.id}`;
    if (jaImportados.has(chave)) continue;
    const processo = r.inventory?.nome ? ` (processo: ${r.inventory.nome})` : "";
    await prisma.actionPlan.create({
      data: {
        companyId,
        origem: "RISCO",
        origemRef: r.id,
        acao: `Mitigar risco "${r.riscoTitulo}"${processo}`,
        responsavel: null,
        status: "ABERTA",
        prioridade: "ALTA",
      },
    });
    criados.push({ origem: "RISCO", acao: r.riscoTitulo });
  }

  // GAP — controles NÃO ADERENTE
  for (const g of gaps) {
    const chave = `GAP:${g.id}`;
    if (jaImportados.has(chave)) continue;
    const controleTexto = g.controleTexto || GAP_PACOTE.find((c) => c.id === g.controleId)?.texto || `Controle ${g.controleId}`;
    await prisma.actionPlan.create({
      data: {
        companyId,
        origem: "GAP",
        origemRef: g.id,
        acao: `Endereçar GAP (${g.area}): ${controleTexto}`,
        responsavel: null,
        status: "ABERTA",
        prioridade: "MEDIA",
      },
    });
    criados.push({ origem: "GAP", acao: controleTexto });
  }

  revalidatePath("/dashboard/plano-acao");
  return {
    criados: criados.length,
    detalhes: criados,
    jaExistiam: jaImportados.size,
  };
}

// Parse "P:M;I:A;S:ALTO" → "ALTO"
function parseSeveridade(severityLevel: string | null): string | null {
  if (!severityLevel) return null;
  const m = severityLevel.match(/S:(BAIXO|MEDIO|ALTO)/);
  return m?.[1] || null;
}
