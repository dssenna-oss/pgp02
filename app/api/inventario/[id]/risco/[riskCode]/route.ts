export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO } from "@/lib/auth-helpers";
import {
  RISCOS_BY_CODE,
  computeSeverity,
  encodeSeverity,
  decodeSeverity,
  RISK_PROBABILITY,
  RISK_IMPACT,
  type RiskProbability,
  type RiskImpact,
  type RiskCode,
} from "@/lib/riscos-catalog";

/**
 * Endpoints de detalhamento INDIVIDUAL de um risco específico
 * (Checkpoint 6). Diferente de `/api/inventario/[id]/riscos` que faz
 * sync em massa dos 13 tipos, aqui trabalhamos 1 risco por vez:
 *
 * GET   → carrega o risco com seus campos detalhados (severidade,
 *         probabilidade, impacto, plano de mitigação, ref. legal).
 * PATCH → atualiza esses campos. Severidade é DERIVADA da matriz
 *         Probabilidade × Impacto (não vem do body).
 *
 * Acesso: somente DPO. Risco precisa existir (ser identificado antes
 * via `/api/inventario/[id]/riscos` PATCH em massa).
 */

const VALID_PROBABILITY = new Set(Object.values(RISK_PROBABILITY));
const VALID_IMPACT = new Set(Object.values(RISK_IMPACT));

async function loadDPOAndRisk(
  invId: string,
  riskCode: string,
): Promise<
  | {
      error: NextResponse;
    }
  | {
      user: { id: string; companyId: string };
      risk: {
        id: string;
        riskCode: string;
        status: string;
        description: string | null;
        autoSuggested: boolean;
        severityLevel: string | null;
        mitigationPlan: string | null;
        legalBasisRef: string | null;
        identifiedAt: Date;
        reviewedAt: Date | null;
        identifiedBy: { name: string | null; email: string } | null;
        reviewedBy: { name: string | null; email: string } | null;
      };
      inv: { id: string; serviceName: string; setor: string | null };
    }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user?.companyId) {
    return {
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 },
      ),
    };
  }
  if (!isDPO(user.role)) {
    return {
      error: NextResponse.json(
        { error: "Apenas DPO pode acessar o detalhamento de riscos" },
        { status: 403 },
      ),
    };
  }
  if (!RISCOS_BY_CODE[riskCode as RiskCode]) {
    return {
      error: NextResponse.json(
        { error: `Código de risco inválido: ${riskCode}` },
        { status: 400 },
      ),
    };
  }

  const inv = await prisma.dataInventory.findFirst({
    where: { id: invId, companyId: user.companyId },
    select: { id: true, serviceName: true, setor: true },
  });
  if (!inv) {
    return {
      error: NextResponse.json(
        { error: "Processo não encontrado nesta organização" },
        { status: 404 },
      ),
    };
  }

  const risk = await prisma.processRisk.findUnique({
    where: {
      dataInventoryId_riskCode: {
        dataInventoryId: invId,
        riskCode,
      },
    },
    include: {
      identifiedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });
  if (!risk) {
    return {
      error: NextResponse.json(
        {
          error:
            "Risco não foi identificado nesse processo. Marque-o primeiro na Análise de Riscos.",
        },
        { status: 404 },
      ),
    };
  }

  return {
    user: { id: user.id, companyId: user.companyId },
    inv,
    risk,
  };
}

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; riskCode: string }>
      | { id: string; riskCode: string };
  },
) {
  const { id, riskCode } = await Promise.resolve(params as any);
  const r = await loadDPOAndRisk(id, riskCode);
  if ("error" in r) return r.error;
  const { risk, inv } = r;

  const def = RISCOS_BY_CODE[riskCode as RiskCode];
  const decoded = decodeSeverity(risk.severityLevel);

  return NextResponse.json({
    process: inv,
    catalog: def,
    risk: {
      id: risk.id,
      riskCode: risk.riskCode,
      status: risk.status,
      description: risk.description,
      autoSuggested: risk.autoSuggested,
      mitigationPlan: risk.mitigationPlan,
      legalBasisRef: risk.legalBasisRef,
      severity: decoded?.severity ?? null,
      probability: decoded?.probability ?? null,
      impact: decoded?.impact ?? null,
      identifiedAt: risk.identifiedAt,
      reviewedAt: risk.reviewedAt,
      identifiedBy: risk.identifiedBy,
      reviewedBy: risk.reviewedBy,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params:
      | Promise<{ id: string; riskCode: string }>
      | { id: string; riskCode: string };
  },
) {
  const { id, riskCode } = await Promise.resolve(params as any);
  const r = await loadDPOAndRisk(id, riskCode);
  if ("error" in r) return r.error;
  const { user, risk } = r;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const updates: any = {
    reviewedById: user.id,
    reviewedAt: new Date(),
  };

  // ---------- Severidade (Probabilidade × Impacto) ----------
  // Aceita 3 modos:
  //  1) prob + impact ambos → recalcula severity e salva
  //  2) só clearSeverity: true → zera o campo
  //  3) nenhum dos dois presentes → mantém o valor atual
  if (body.clearSeverity === true) {
    updates.severityLevel = null;
  } else if (body.probability !== undefined || body.impact !== undefined) {
    if (
      !VALID_PROBABILITY.has(body.probability) ||
      !VALID_IMPACT.has(body.impact)
    ) {
      return NextResponse.json(
        {
          error:
            "Pra calcular severidade, envie probability + impact com valores válidos (BAIXA/MEDIA/ALTA × BAIXO/MEDIO/ALTO).",
        },
        { status: 400 },
      );
    }
    const prob = body.probability as RiskProbability;
    const imp = body.impact as RiskImpact;
    const sev = computeSeverity(prob, imp);
    updates.severityLevel = encodeSeverity({
      probability: prob,
      impact: imp,
      severity: sev,
    });
  }

  // ---------- Plano de mitigação ----------
  if (body.mitigationPlan !== undefined) {
    const txt = body.mitigationPlan == null ? null : String(body.mitigationPlan).slice(0, 5000);
    updates.mitigationPlan = txt && txt.trim() ? txt : null;
  }

  // ---------- Referência legal específica ----------
  if (body.legalBasisRef !== undefined) {
    const txt = body.legalBasisRef == null ? null : String(body.legalBasisRef).slice(0, 500);
    updates.legalBasisRef = txt && txt.trim() ? txt : null;
  }

  // ---------- Descrição (texto livre, igual à PATCH em massa) ----------
  if (body.description !== undefined) {
    const txt = body.description == null ? null : String(body.description).slice(0, 2000);
    updates.description = txt && txt.trim() ? txt : null;
  }

  // ---------- Status (ciclo de vida) ----------
  if (body.status !== undefined) {
    const validStatuses = new Set([
      "IDENTIFICADO",
      "EM_MITIGACAO",
      "ACEITO",
      "ELIMINADO",
    ]);
    if (!validStatuses.has(body.status)) {
      return NextResponse.json(
        { error: `Status inválido: ${body.status}` },
        { status: 400 },
      );
    }
    updates.status = body.status;
  }

  const updated = await prisma.processRisk.update({
    where: { id: risk.id },
    data: updates,
    include: {
      identifiedBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  const decoded = decodeSeverity(updated.severityLevel);
  return NextResponse.json({
    risk: {
      id: updated.id,
      riskCode: updated.riskCode,
      status: updated.status,
      description: updated.description,
      autoSuggested: updated.autoSuggested,
      mitigationPlan: updated.mitigationPlan,
      legalBasisRef: updated.legalBasisRef,
      severity: decoded?.severity ?? null,
      probability: decoded?.probability ?? null,
      impact: decoded?.impact ?? null,
      identifiedAt: updated.identifiedAt,
      reviewedAt: updated.reviewedAt,
      identifiedBy: updated.identifiedBy,
      reviewedBy: updated.reviewedBy,
    },
  });
}
