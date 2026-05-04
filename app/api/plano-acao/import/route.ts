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

/**
 * POST /api/plano-acao/import
 *
 * Auto-importa ações pendentes de:
 *   - GAP: controles NAO_ADERENTE / PARCIAL com Ponto de Melhoria preenchido
 *   - Riscos: status IDENTIFICADO sem mitigação documentada
 *   - Bases Legais: processos APROVADOS sem base legal preenchida
 *
 * Cria 1 ActionPlan por item pendente, com `origin` e refs preenchidos.
 * **Idempotente**: pula items que já têm ActionPlan correspondente
 * (mesmo origin + mesma ref) — não duplica se rodar 2 vezes seguidas.
 *
 * Devolve { created: N, skipped: N, byOrigin: { GAP, RISCO, BASES } }
 */
export async function POST(_request: NextRequest) {
  const r = await loadActionPlanAuth(/* requireDPO */ true);
  if ("error" in r) return r.error;
  const { user } = r;

  // 1) Carregar TUDO em paralelo
  const [existingActions, gapAnswers, risks, inventories] = await Promise.all([
    // Pra dedup: chaves já existentes
    prisma.actionPlan.findMany({
      where: {
        companyId: user.companyId,
        origin: { in: ["GAP", "RISCO", "BASES"] },
      },
      select: {
        origin: true,
        refGapCode: true,
        refRiskId: true,
        refInventoryId: true,
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
  ]);

  // Sets pra dedup rápido
  const seenGap = new Set<string>();
  const seenRisk = new Set<string>();
  const seenBases = new Set<string>();
  for (const a of existingActions) {
    if (a.origin === "GAP" && a.refGapCode) seenGap.add(a.refGapCode);
    if (a.origin === "RISCO" && a.refRiskId) seenRisk.add(a.refRiskId);
    if (a.origin === "BASES" && a.refInventoryId) seenBases.add(a.refInventoryId);
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
      inventories.filter((i) => seenBases.has(i.id)).length,
    byOrigin: {
      GAP: toCreate.filter((t) => t.origin === ACTION_ORIGIN.GAP).length,
      RISCO: toCreate.filter((t) => t.origin === ACTION_ORIGIN.RISCO).length,
      BASES: toCreate.filter((t) => t.origin === ACTION_ORIGIN.BASES).length,
    },
  });
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}
