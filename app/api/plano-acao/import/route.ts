export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadActionPlanAuth,
  ACTION_PRIORITY,
  ACTION_STATUS,
  ACTION_ORIGIN,
} from "@/lib/action-plan-helpers";
import { GAP_CONTROLS } from "@/lib/gap-catalog";
import { decodeSeverity } from "@/lib/riscos-catalog";
import { usesLegitimateInterest } from "@/lib/lia-helpers";
import { getCyberControl, cyberFunctionLabel } from "@/lib/cyber-catalog";

/**
 * POST /api/plano-acao/import
 *
 * Auto-importa ações pendentes de:
 *   - GAP: controles NAO_ADERENTE / PARCIAL com Ponto de Melhoria preenchido
 *   - Riscos: status IDENTIFICADO sem mitigação documentada
 *   - Bases Legais: processos APROVADOS sem base legal preenchida
 *   - Operadores (Checkpoint 14 G4): contrato vencido / sem cláusulas /
 *     score ALTO em avaliação / sem contrato
 *
 * Cria 1 ActionPlan por item pendente, com `origin` e refs preenchidos.
 * **Idempotente**: pula items que já têm ActionPlan correspondente
 * (mesmo origin + mesma ref) — não duplica se rodar 2 vezes seguidas.
 *
 * Devolve { created: N, skipped: N, byOrigin: { GAP, RISCO, BASES, OPERADOR } }
 */
export async function POST(_request: NextRequest) {
  const r = await loadActionPlanAuth(/* requireDPO */ true);
  if ("error" in r) return r.error;
  const { user } = r;

  // 1) Carregar TUDO em paralelo
  const [existingActions, gapAnswers, risks, inventories, operators, incidents, lias, cyberAnswers] = await Promise.all([
    // Pra dedup: chaves já existentes
    prisma.actionPlan.findMany({
      where: {
        companyId: user.companyId,
        origin: { in: ["GAP", "RISCO", "BASES", "OPERADOR", "INCIDENTE", "LIA", "CYBER"] },
      },
      select: {
        origin: true,
        refGapCode: true,
        refRiskId: true,
        refInventoryId: true,
        refOperatorId: true,
        refIncidentId: true,
        refCyberCode: true,
      },
    }),
    prisma.gapAnswer.findMany({
      where: {
        companyId: user.companyId,
        OR: [{ aderencia: "NAO_ADERENTE" }, { aderencia: "PARCIAL" }],
      },
      select: {
        controlCode: true,
        aderencia: true,
        pontoMelhoria: true,
      },
    }),
    prisma.processRisk.findMany({
      where: {
        companyId: user.companyId,
        status: "IDENTIFICADO",
      },
      select: {
        id: true,
        riskCode: true,
        dataInventoryId: true,
        severityLevel: true,
        description: true,
      },
    }),
    prisma.dataInventory.findMany({
      where: { companyId: user.companyId, status: "APROVADO" },
      select: {
        id: true,
        serviceName: true,
        dataCategory: true,
        legalBasis: true,
        legalBasisSensitive: true,
      },
    }),
    prisma.operator.findMany({
      where: { companyId: user.companyId },
      select: {
        id: true,
        name: true,
        contractStatus: true,
        contractExpiresAt: true,
        contractRiskClass: true,
        relationType: true,
        hasPrivacyClause: true,
        hasIncidentClause: true,
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            overallRiskClass: true,
            cyberRiskClass: true,
            lgpdRiskClass: true,
            sentAt: true,
          },
        },
      },
    }),
    // Incidentes em aberto (não encerrados / não falsos positivos) — geram
    // ações automáticas de remediação no Plano (Checkpoint 16 F1).
    prisma.incident.findMany({
      where: {
        companyId: user.companyId,
        status: { notIn: ["ENCERRADO", "FALSO_POSITIVO"] },
      },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        detectedAt: true,
        anpdNotifiedAt: true,
        correctiveMeasures: true,
        containmentMeasures: true,
      },
    }),
    // LIAs existentes em qualquer status — pra detectar processos
    // 7º IX que ainda não têm LIA documentada (CP21 Fatia 3).
    prisma.lia.findMany({
      where: { companyId: user.companyId },
      select: { id: true, inventoryId: true, status: true },
    }),
    // Cyber NIST — controles NAO_ADERENTE com ponto de melhoria viram
    // ações automáticas no Plano (CP22 Fatia 3).
    prisma.cyberAnswer.findMany({
      where: { companyId: user.companyId, aderencia: "NAO_ADERENTE" },
      select: { controlCode: true, pontoMelhoria: true, evidence: true },
    }),
  ]);

  // Sets pra dedup rápido
  const seenGap = new Set<string>();
  const seenRisk = new Set<string>();
  const seenBases = new Set<string>();
  const seenOperator = new Set<string>();
  const seenIncident = new Set<string>();
  const seenLia = new Set<string>();
  const seenCyber = new Set<string>();
  for (const a of existingActions) {
    if (a.origin === "GAP" && a.refGapCode) seenGap.add(a.refGapCode);
    if (a.origin === "RISCO" && a.refRiskId) seenRisk.add(a.refRiskId);
    if (a.origin === "BASES" && a.refInventoryId) seenBases.add(a.refInventoryId);
    if (a.origin === "OPERADOR" && a.refOperatorId) seenOperator.add(a.refOperatorId);
    if (a.origin === "INCIDENTE" && a.refIncidentId) seenIncident.add(a.refIncidentId);
    if (a.origin === "LIA" && a.refInventoryId) seenLia.add(a.refInventoryId);
    if (a.origin === "CYBER" && a.refCyberCode) seenCyber.add(a.refCyberCode);
  }

  // Processos que JÁ têm LIA cadastrada (qualquer status) — não precisam
  // de ação "Documentar LIA". Se a LIA está em rascunho/revisão, está
  // no fluxo; se aprovada, está concluída; se arquivada, foi concluído
  // por outra base e não precisa repetir.
  const inventoriesWithLia = new Set<string>();
  for (const l of lias) {
    if (l.inventoryId) inventoriesWithLia.add(l.inventoryId);
  }

  // Cache do catálogo do GAP pra título amigável
  const gapByCode: Record<string, { domain: string; question: string }> = {};
  for (const c of GAP_CONTROLS) {
    gapByCode[c.code] = { domain: c.domain, question: c.question };
  }

  const toCreate: Array<{
    companyId: string;
    title: string;
    description: string;
    origin: string;
    refGapCode?: string;
    refRiskId?: string;
    refInventoryId?: string;
    refOperatorId?: string;
    refIncidentId?: string;
    refCyberCode?: string;
    priority: string;
    status: string;
    createdById: string;
  }> = [];

  // ---------- GAP ----------
  for (const a of gapAnswers) {
    if (!a.pontoMelhoria || !a.pontoMelhoria.trim()) continue;
    if (seenGap.has(a.controlCode)) continue;
    const meta = gapByCode[a.controlCode];
    const priority =
      a.aderencia === "NAO_ADERENTE" ? ACTION_PRIORITY.ALTA : ACTION_PRIORITY.MEDIA;
    toCreate.push({
      companyId: user.companyId,
      title: `GAP #${a.controlCode}: ${truncate(a.pontoMelhoria, 140)}`,
      description: meta
        ? `Domínio: ${meta.domain}\nPergunta: ${meta.question}\n\nPonto de Melhoria registrado: ${a.pontoMelhoria}`
        : a.pontoMelhoria,
      origin: ACTION_ORIGIN.GAP,
      refGapCode: a.controlCode,
      priority,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- RISCO ----------
  for (const risk of risks) {
    if (seenRisk.has(risk.id)) continue;
    const sev = decodeSeverity(risk.severityLevel)?.severity ?? null;
    const priority =
      sev === "ALTO"
        ? ACTION_PRIORITY.ALTA
        : sev === "MEDIO"
          ? ACTION_PRIORITY.MEDIA
          : ACTION_PRIORITY.BAIXA;
    const desc = sev
      ? `Risco classificado como ${sev}, status Identificado, sem mitigação iniciada.`
      : `Risco identificado sem severidade classificada nem plano de mitigação. Detalhe a matriz Probabilidade × Impacto.`;
    toCreate.push({
      companyId: user.companyId,
      title: `Tratar risco "${risk.riskCode}" (processo ${risk.dataInventoryId.slice(-6).toUpperCase()})`,
      description: risk.description ? `${desc}\n\nObservação: ${risk.description}` : desc,
      origin: ACTION_ORIGIN.RISCO,
      refRiskId: risk.id,
      refInventoryId: risk.dataInventoryId,
      priority,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- BASES LEGAIS ----------
  for (const inv of inventories) {
    if (seenBases.has(inv.id)) continue;
    const isSensitive = /sens[íi]ve/i.test(inv.dataCategory ?? "");
    const missingComum =
      !inv.legalBasis || !inv.legalBasis.trim() || inv.legalBasis === "[Em preenchimento]";
    const missingSensitive =
      isSensitive && (!inv.legalBasisSensitive || !inv.legalBasisSensitive.trim());
    if (!missingComum && !missingSensitive) continue;
    const what = missingComum ? "base legal comum (Art. 7º)" : "base legal sensível (Art. 11)";
    toCreate.push({
      companyId: user.companyId,
      title: `Definir ${what} em "${inv.serviceName}"`,
      description: missingSensitive
        ? "Processo aprovado declara dados sensíveis mas não tem a base legal exigida pelo Art. 11 da LGPD preenchida."
        : "Processo aprovado sem a base legal preenchida (Art. 7º). Compliance básico ausente.",
      origin: ACTION_ORIGIN.BASES,
      refInventoryId: inv.id,
      priority: ACTION_PRIORITY.ALTA,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- OPERADORES (Checkpoint 14 G4) ----------
  // Sinaliza problemas dos terceiros como ações automáticas.
  // 1 ação por operador (não 1 por problema): título descreve o pior caso,
  // descrição lista todos os pontos. Idempotente via seenOperator.
  for (const op of operators) {
    if (seenOperator.has(op.id)) continue;
    const issues: string[] = [];
    let priority: string = ACTION_PRIORITY.MEDIA;
    let urgency = "";

    // 1) Contrato
    const expiresAt = op.contractExpiresAt;
    const now = Date.now();
    const expired =
      op.contractStatus === "VENCIDO" ||
      (expiresAt && expiresAt.getTime() < now);
    const noContract = op.contractStatus === "SEM_CONTRATO";
    if (expired) {
      issues.push("Contrato VENCIDO — renovar urgente.");
      urgency = "Contrato vencido";
      priority = ACTION_PRIORITY.ALTA;
    } else if (noContract) {
      issues.push("Sem contrato cadastrado — formalizar.");
      if (!urgency) urgency = "Sem contrato";
      priority = ACTION_PRIORITY.ALTA;
    }

    // 2) Cláusulas (só pra OPERADOR, onde a Denise exige cláusula LGPD)
    if (op.relationType === "OPERADOR") {
      const missingClauses: string[] = [];
      if (!op.hasPrivacyClause) missingClauses.push("privacidade");
      if (!op.hasIncidentClause) missingClauses.push("notificação de incidente");
      if (missingClauses.length > 0) {
        issues.push(
          `Faltam cláusulas obrigatórias no contrato: ${missingClauses.join(", ")}.`,
        );
        if (!urgency) urgency = "Cláusulas pendentes";
        if (priority !== ACTION_PRIORITY.ALTA) priority = ACTION_PRIORITY.MEDIA;
      }
    }

    // 3) Risco do contrato (régua ANPD)
    if (op.contractRiskClass === "ALTO") {
      issues.push(
        "Contrato classificado como risco ALTO pela régua ANPD — revisar critérios e elevar controles.",
      );
      if (!urgency) urgency = "Risco ALTO";
      if (priority !== ACTION_PRIORITY.ALTA) priority = ACTION_PRIORITY.ALTA;
    }

    // 4) Avaliação de terceiro (formulário público)
    const lastAssess = op.assessments[0];
    if (lastAssess) {
      if (lastAssess.overallRiskClass === "ALTO") {
        issues.push(
          `Última avaliação de risco do terceiro classificada como ALTO (Cyber: ${lastAssess.cyberRiskClass ?? "—"}, LGPD: ${lastAssess.lgpdRiskClass ?? "—"}).`,
        );
        if (!urgency) urgency = "Avaliação ALTO";
        priority = ACTION_PRIORITY.ALTA;
      }
      // Avaliação enviada e parada há +30 dias sem resposta
      if (
        lastAssess.status === "AGUARDANDO_TERCEIRO" &&
        lastAssess.sentAt &&
        now - lastAssess.sentAt.getTime() > 30 * 24 * 60 * 60 * 1000
      ) {
        issues.push(
          `Formulário de avaliação enviado ao terceiro há mais de 30 dias sem resposta.`,
        );
        if (!urgency) urgency = "Formulário pendente";
      }
    }

    if (issues.length === 0) continue;

    toCreate.push({
      companyId: user.companyId,
      title: urgency
        ? `Operador "${op.name}": ${urgency}`
        : `Revisar operador "${op.name}"`,
      description: `Pontos identificados na Gestão de Terceiros:\n\n• ${issues.join("\n• ")}`,
      origin: ACTION_ORIGIN.OPERADOR,
      refOperatorId: op.id,
      priority,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- INCIDENTES (Checkpoint 16 F1) ----------
  // 1 ação consolidada por incidente em aberto. Prioridade derivada da
  // severidade. Título reflete urgência se houver prazo ANPD pendente.
  const nowMs = Date.now();
  for (const inc of incidents) {
    if (seenIncident.has(inc.id)) continue;

    const incPriority =
      inc.severity === "ALTO"
        ? ACTION_PRIORITY.ALTA
        : inc.severity === "MEDIO"
          ? ACTION_PRIORITY.MEDIA
          : ACTION_PRIORITY.BAIXA;

    const requiresAnpd = inc.severity === "ALTO" || inc.severity === "MEDIO";
    const anpdPending = requiresAnpd && inc.anpdNotifiedAt == null;
    const detectedMs = inc.detectedAt.getTime();
    const overdueAnpd = anpdPending && nowMs - detectedMs > 72 * 60 * 60 * 1000;

    let title: string;
    let descPrefix: string;
    if (overdueAnpd) {
      title = `Incidente "${truncate(inc.title, 100)}": prazo ANPD vencido`;
      descPrefix =
        "Prazo de 3 dias úteis (Art. 48 LGPD) já vencido. Comunicar ANPD com justificativa de demora e seguir com contenção.";
    } else if (anpdPending) {
      title = `Incidente "${truncate(inc.title, 100)}": comunicar ANPD em até 72h`;
      descPrefix =
        "Severidade dispara obrigatoriedade de comunicação à ANPD em até 3 dias úteis (Res. CD/ANPD nº 15/2024).";
    } else {
      title = `Tratar incidente "${truncate(inc.title, 100)}"`;
      descPrefix =
        "Seguir com contenção, medidas corretivas e encerramento do incidente.";
    }

    const measuresParts: string[] = [];
    if (inc.containmentMeasures) {
      measuresParts.push(`Contenção planejada: ${inc.containmentMeasures}`);
    }
    if (inc.correctiveMeasures) {
      measuresParts.push(`Corretivas planejadas: ${inc.correctiveMeasures}`);
    }
    const description = measuresParts.length
      ? `${descPrefix}\n\n${measuresParts.join("\n\n")}`
      : descPrefix;

    toCreate.push({
      companyId: user.companyId,
      title,
      description,
      origin: ACTION_ORIGIN.INCIDENTE,
      refIncidentId: inc.id,
      priority: incPriority,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- CYBER NIST (Checkpoint 22 Fatia 3) ----------
  // Cada CyberAnswer com NAO_ADERENTE vira 1 ação no Plano. Prioridade
  // ALTA porque "não aderente" em segurança da informação é gap real.
  // Idempotente via seenCyber.
  for (const ca of cyberAnswers) {
    if (seenCyber.has(ca.controlCode)) continue;
    const ctrl = getCyberControl(ca.controlCode);
    if (!ctrl) continue; // catálogo mudou — ignora
    const fnLabel = cyberFunctionLabel(ctrl.function);
    const titleSnippet = truncate(ca.pontoMelhoria || ctrl.question, 100);
    toCreate.push({
      companyId: user.companyId,
      title: `Cyber ${ca.controlCode}: ${titleSnippet}`,
      description:
        `Função NIST: ${fnLabel}\n` +
        `Categoria: ${ctrl.category}\n` +
        `Pergunta: ${ctrl.question}\n\n` +
        (ca.pontoMelhoria
          ? `Ponto de melhoria registrado: ${ca.pontoMelhoria}\n\n`
          : "") +
        `Referência NIST original: ${ctrl.nistRef}`,
      origin: ACTION_ORIGIN.CYBER,
      refCyberCode: ca.controlCode,
      priority: ACTION_PRIORITY.ALTA,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // ---------- LIA (Checkpoint 21 Fatia 3) ----------
  // Processo APROVADO usando Art. 7º IX (legítimo interesse) sem LIA
  // cadastrada → cria 1 ação "Documentar LIA". Idempotente (seenLia +
  // inventoriesWithLia).
  for (const inv of inventories) {
    if (seenLia.has(inv.id)) continue;
    if (inventoriesWithLia.has(inv.id)) continue;
    const usesLia =
      usesLegitimateInterest(inv.legalBasis) ||
      usesLegitimateInterest(inv.legalBasisSensitive);
    if (!usesLia) continue;

    toCreate.push({
      companyId: user.companyId,
      title: `Documentar LIA — "${inv.serviceName}"`,
      description:
        "Este processo usa Art. 7º IX da LGPD (legítimo interesse) como base legal. " +
        "O Art. 10 §3º exige que o controlador documente a Avaliação de Legítimo Interesse (LIA), " +
        "com teste de finalidade, necessidade e balanceamento dos direitos do titular. " +
        "Sem essa documentação, o uso da base é vulnerável a questionamento da ANPD.",
      origin: ACTION_ORIGIN.LIA,
      refInventoryId: inv.id,
      priority: ACTION_PRIORITY.ALTA,
      status: ACTION_STATUS.A_FAZER,
      createdById: user.id,
    });
  }

  // 2) Criar tudo (idempotente — só os novos)
  let created = 0;
  if (toCreate.length > 0) {
    const result = await prisma.actionPlan.createMany({ data: toCreate });
    created = result.count;
  }

  return NextResponse.json({
    created,
    skipped:
      gapAnswers.filter((a) => a.pontoMelhoria?.trim() && seenGap.has(a.controlCode)).length +
      risks.filter((r) => seenRisk.has(r.id)).length +
      inventories.filter((i) => seenBases.has(i.id)).length +
      operators.filter((o) => seenOperator.has(o.id)).length +
      incidents.filter((i) => seenIncident.has(i.id)).length +
      inventories.filter(
        (i) =>
          (usesLegitimateInterest(i.legalBasis) ||
            usesLegitimateInterest(i.legalBasisSensitive)) &&
          (seenLia.has(i.id) || inventoriesWithLia.has(i.id)),
      ).length +
      cyberAnswers.filter((c) => seenCyber.has(c.controlCode)).length,
    byOrigin: {
      GAP: toCreate.filter((t) => t.origin === ACTION_ORIGIN.GAP).length,
      RISCO: toCreate.filter((t) => t.origin === ACTION_ORIGIN.RISCO).length,
      BASES: toCreate.filter((t) => t.origin === ACTION_ORIGIN.BASES).length,
      OPERADOR: toCreate.filter((t) => t.origin === ACTION_ORIGIN.OPERADOR).length,
      INCIDENTE: toCreate.filter((t) => t.origin === ACTION_ORIGIN.INCIDENTE).length,
      LIA: toCreate.filter((t) => t.origin === ACTION_ORIGIN.LIA).length,
      CYBER: toCreate.filter((t) => t.origin === ACTION_ORIGIN.CYBER).length,
    },
  });
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}
