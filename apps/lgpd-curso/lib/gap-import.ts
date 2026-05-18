// Engine de "Importar resultados já apurados" pro GAP.
// Pra cada tipo de import (gap-catalogo.importavel), consulta o banco e
// devolve { resposta, justificativa } automaticamente — DPO não precisa
// avaliar manualmente o que já está documentado nas fases anteriores.

import { prisma } from "@/lib/prisma";
import { getControleById } from "@/lib/gap-catalogo";

export type RespostaAuto = "ADERENTE" | "PARCIAL" | "NAO_ADERENTE";

export type ResultadoImport = {
  resposta: RespostaAuto;
  justificativa: string;
};

/** Calcula resposta automática pra um controle importável. */
export async function calcularImport(
  companyId: string,
  controleId: number,
): Promise<ResultadoImport> {
  const controle = getControleById(controleId);
  if (!controle?.importavel) {
    throw new Error("Este controle não suporta importação automática");
  }

  switch (controle.importavel) {
    case "INV_ATUALIZADO":
      return await importInvAtualizado(companyId);
    case "INV_BASE_LEGAL":
      return await importInvBaseLegal(companyId);
    case "RISCO_MATRIZ":
      return await importRiscoMatriz(companyId);
    case "RIPD_APROVADO":
      return await importRipdAprovado(companyId);
    case "OPERADOR_CLAUSULAS":
      return await importOperadorClausulas(companyId);
    case "DSR_CANAL":
      return await importDsrCanal(companyId);
    case "AVISO_PUBLICADO":
      return await importAvisoPublicado(companyId);
    case "INCIDENTE_REGISTRADO":
      return await importIncidenteRegistrado(companyId);
  }
}

async function importInvAtualizado(companyId: string): Promise<ResultadoImport> {
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  const [total, aprovados, recentes] = await Promise.all([
    prisma.dataInventory.count({ where: { companyId } }),
    prisma.dataInventory.count({ where: { companyId, status: "APROVADO" } }),
    prisma.dataInventory.count({
      where: { companyId, status: "APROVADO", updatedAt: { gte: umAnoAtras } },
    }),
  ]);
  if (aprovados === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: `Importado: nenhum processo aprovado no Inventário (${total} em rascunho).` };
  }
  if (recentes < aprovados) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${recentes} de ${aprovados} processos aprovados foram revisados nos últimos 12 meses.` };
  }
  return { resposta: "ADERENTE", justificativa: `Importado: ${aprovados} processos aprovados e revisados nos últimos 12 meses.` };
}

async function importInvBaseLegal(companyId: string): Promise<ResultadoImport> {
  const aprovados = await prisma.dataInventory.findMany({
    where: { companyId, status: "APROVADO" },
    select: { nome: true, baseLegal: true },
  });
  if (aprovados.length === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: nenhum processo aprovado pra avaliar base legal." };
  }
  const comBase = aprovados.filter((i) => i.baseLegal && i.baseLegal.trim().length > 0);
  const semBase = aprovados.filter((i) => !i.baseLegal || i.baseLegal.trim().length === 0);
  const pct = Math.round((comBase.length / aprovados.length) * 100);

  if (pct === 100) {
    return { resposta: "ADERENTE", justificativa: `Importado: ${comBase.length} de ${aprovados.length} processos (100%) com base legal documentada.` };
  }
  if (pct >= 50) {
    const faltam = semBase.slice(0, 5).map((i) => i.nome).join(", ");
    return { resposta: "PARCIAL", justificativa: `Importado: ${comBase.length} de ${aprovados.length} processos (${pct}%) com base legal. Falta em: ${faltam}${semBase.length > 5 ? "..." : ""}.` };
  }
  return { resposta: "NAO_ADERENTE", justificativa: `Importado: apenas ${comBase.length} de ${aprovados.length} processos (${pct}%) com base legal documentada.` };
}

async function importRiscoMatriz(companyId: string): Promise<ResultadoImport> {
  const [total, comSeverity] = await Promise.all([
    prisma.processRisk.count({ where: { companyId } }),
    prisma.processRisk.count({ where: { companyId, severityLevel: { not: null } } }),
  ]);
  if (total === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: nenhum risco identificado." };
  }
  if (comSeverity < total) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${comSeverity} de ${total} riscos com matriz P×I preenchida.` };
  }
  return { resposta: "ADERENTE", justificativa: `Importado: ${total} riscos com matriz P×I formalizada.` };
}

async function importRipdAprovado(companyId: string): Promise<ResultadoImport> {
  const [aprovados, total, sensiveis] = await Promise.all([
    prisma.ripd.count({ where: { companyId, status: "APROVADO" } }),
    prisma.ripd.count({ where: { companyId } }),
    prisma.dataInventory.count({ where: { companyId, status: "APROVADO", dadosSensiveis: true } }),
  ]);
  if (aprovados === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: `Importado: nenhum RIPD aprovado${sensiveis > 0 ? ` (${sensiveis} processos sensíveis no Inventário sem RIPD)` : ""}.` };
  }
  if (sensiveis > 0 && aprovados < sensiveis) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${aprovados} RIPDs aprovados, mas há ${sensiveis} processos com dados sensíveis no Inventário.` };
  }
  return { resposta: "ADERENTE", justificativa: `Importado: ${aprovados} RIPD(s) aprovado(s) cobrindo os processos de alto risco.` };
}

async function importOperadorClausulas(companyId: string): Promise<ResultadoImport> {
  const operadores = await prisma.operator.findMany({
    where: { companyId },
    include: { contracts: { select: { clausulasLgpd: true } } },
  });
  if (operadores.length === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: nenhum operador cadastrado em Gestão de Terceiros." };
  }
  const comCl = operadores.filter((o) => o.contracts?.[0]?.clausulasLgpd).length;
  const pct = Math.round((comCl / operadores.length) * 100);
  if (pct === 100) {
    return { resposta: "ADERENTE", justificativa: `Importado: ${comCl} de ${operadores.length} operadores (100%) com cláusulas LGPD no contrato.` };
  }
  if (pct >= 50) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${comCl} de ${operadores.length} operadores (${pct}%) com cláusulas LGPD no contrato.` };
  }
  return { resposta: "NAO_ADERENTE", justificativa: `Importado: apenas ${comCl} de ${operadores.length} operadores (${pct}%) com cláusulas LGPD.` };
}

async function importDsrCanal(companyId: string): Promise<ResultadoImport> {
  const total = await prisma.dsrRequest.count({ where: { companyId } });
  if (total === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: canal DSR não tem registro de solicitações — sinal de que não está divulgado ou não foi usado." };
  }
  if (total < 3) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${total} solicitação(ões) registrada(s) — canal existe mas é pouco usado.` };
  }
  return { resposta: "ADERENTE", justificativa: `Importado: ${total} solicitações registradas no canal DSR — canal divulgado e em uso.` };
}

async function importAvisoPublicado(companyId: string): Promise<ResultadoImport> {
  const aviso = await prisma.policy.findUnique({
    where: { companyId_slug: { companyId, slug: "aviso-privacidade" } },
    select: { status: true, publicSlug: true },
  });
  if (!aviso) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: Aviso de Privacidade não foi sequer rascunhado." };
  }
  if (aviso.status === "PUBLICADO" && aviso.publicSlug) {
    return { resposta: "ADERENTE", justificativa: `Importado: Aviso de Privacidade publicado no portal externo (/p/${aviso.publicSlug}).` };
  }
  if (aviso.status === "RASCUNHO") {
    return { resposta: "PARCIAL", justificativa: "Importado: Aviso em rascunho, ainda não publicado no portal externo." };
  }
  return { resposta: "NAO_ADERENTE", justificativa: `Importado: Aviso com status "${aviso.status}".` };
}

async function importIncidenteRegistrado(companyId: string): Promise<ResultadoImport> {
  const incidentes = await prisma.incident.findMany({
    where: { companyId },
    select: { status: true, comunicadoAnpd: true },
  });
  if (incidentes.length === 0) {
    return { resposta: "NAO_ADERENTE", justificativa: "Importado: nenhum incidente registrado — pode significar que não houve, ou que não há procedimento de registro. Plano de resposta provavelmente não foi testado." };
  }
  const movidos = incidentes.filter((i) => i.status !== "RASCUNHO").length;
  const comAnpd = incidentes.filter((i) => i.comunicadoAnpd).length;
  if (movidos === 0) {
    return { resposta: "PARCIAL", justificativa: `Importado: ${incidentes.length} incidente(s) em rascunho, sem fluxo de resposta concluído.` };
  }
  return { resposta: "ADERENTE", justificativa: `Importado: ${movidos} incidente(s) com fluxo de resposta executado${comAnpd > 0 ? ` (${comAnpd} com comunicação à ANPD)` : ""}.` };
}
