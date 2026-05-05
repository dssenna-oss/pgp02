/**
 * Engine de pré-população do RIPD (Checkpoint 13 / F1).
 *
 * Dado um `inventoryId` (DataInventory aprovado), monta um `RipdData`
 * completo puxando dados de:
 *   - DataInventory + Company → Seções 1, 2, 3, 4 (parcial), 5
 *   - ProcessRisk (do inventário)        → Seção 6
 *   - GapAnswer (da company, aderentes)  → Seção 7 (controles existentes)
 *   - ActionPlan (refInventoryId, abertas) → Seção 7 (ações planejadas)
 *
 * Os campos livres das seções 4 (necessidade/proporcionalidade), 6
 * (overallAssessment) e 8 (parecer) ficam vazios — preenchidos pelo
 * usuário no editor.
 *
 * Idempotente e read-only (não persiste nada).
 */

import { prisma } from "@/lib/db";
import { type RipdData, emptyRipdData } from "@/lib/ripd-helpers";
import { RISCOS_BY_CODE, decodeSeverity } from "@/lib/riscos-catalog";
import { getControlByCode } from "@/lib/gap-catalog";

/** Campos do DataInventory que importam pra pré-população. */
type InventoryForPrepop = {
  id: string;
  companyId: string;
  serviceName: string;
  dataCategory: string;
  personalData: string;
  legalBasis: string;
  purpose: string;
  dataSubjects: string;
  retention: string;
  storage: string;
  sharing: string | null;
  security: string;
  setor: string | null;
  status: string;
  previsaoLegal: string | null;
  legalBasisSensitive: string | null;
  legalBasisComments: string | null;
  formAnswers: any;
  company: {
    id: string;
    companyName: string;
    cnpj: string | null;
    address: string | null;
    legalRepresentative: string | null;
    dpoName: string | null;
    dpoEmail: string | null;
    dpoPhone: string | null;
  };
  processRisks: ReadonlyArray<{
    id: string;
    riskCode: string;
    status: string;
    severityLevel: string | null;
    description: string | null;
    mitigationPlan: string | null;
  }>;
  /** Operadores vinculados a este processo (Checkpoint 14 G4). */
  operatorLinks: ReadonlyArray<{
    activityDescription: string | null;
    operator: {
      id: string;
      name: string;
      cnpj: string | null;
      country: string | null;
      relationType: string;
      contractStatus: string;
      contractRiskClass: string;
    };
  }>;
};

const PREPOP_INCLUDE = {
  company: true,
  processRisks: {
    where: {
      // Eliminados não vão pro RIPD; aceitos/em mitigação/identificados sim
      status: { not: "ELIMINADO" },
    },
    orderBy: { riskCode: "asc" as const },
  },
  operatorLinks: {
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          cnpj: true,
          country: true,
          relationType: true,
          contractStatus: true,
          contractRiskClass: true,
        },
      },
    },
  },
} as const;

/**
 * Carrega o inventário com tudo que a engine precisa. Retorna null se
 * não existir ou se pertencer a outra Company (proteção multi-tenant).
 */
export async function loadInventoryForPrepop(
  inventoryId: string,
  companyId: string
): Promise<InventoryForPrepop | null> {
  const inv = await prisma.dataInventory.findFirst({
    where: { id: inventoryId, companyId },
    include: PREPOP_INCLUDE,
  });
  return inv as InventoryForPrepop | null;
}

/**
 * Monta o `RipdData` a partir do inventário + dados auxiliares
 * (controles GAP aderentes + ações abertas do Plano).
 */
export async function prepopulateRipdFromInventory(
  inventoryId: string,
  companyId: string
): Promise<RipdData> {
  const inv = await loadInventoryForPrepop(inventoryId, companyId);
  if (!inv) {
    throw new Error("Inventário não encontrado ou fora da empresa");
  }

  // GAP — controles ADERENTES da empresa (já implementados)
  const gapAnswers = await prisma.gapAnswer.findMany({
    where: { companyId, aderencia: "ADERENTE" },
    select: { controlCode: true, cenarioAtual: true },
    orderBy: { controlCode: "asc" },
    take: 50, // limite prático — RIPD não precisa listar todos
  });

  // Plano de Ação — ações abertas ligadas a este processo
  const actions = await prisma.actionPlan.findMany({
    where: {
      companyId,
      refInventoryId: inventoryId,
      status: { in: ["A_FAZER", "EM_ANDAMENTO"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
    },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });

  return buildRipdData(inv, gapAnswers, actions);
}

// ============================================================
// Builder puro (testável sem DB)
// ============================================================

interface GapAnswerLite {
  controlCode: string;
  cenarioAtual: string | null;
}

interface ActionLite {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
}

export function buildRipdData(
  inv: InventoryForPrepop,
  gapAnswers: ReadonlyArray<GapAnswerLite>,
  actions: ReadonlyArray<ActionLite>
): RipdData {
  const base = emptyRipdData();

  // ----- Seção 1: Identificação dos agentes -----
  base.s1.controller = {
    name: inv.company.companyName ?? "",
    cnpj: inv.company.cnpj ?? "",
    address: inv.company.address ?? "",
    legalRepresentative: inv.company.legalRepresentative ?? "",
  };
  base.s1.dpo = {
    name: inv.company.dpoName ?? "",
    email: inv.company.dpoEmail ?? "",
    phone: inv.company.dpoPhone ?? "",
  };
  // Texto livre legado vem do campo "compartilhamento" do Inventário —
  // serve como complemento descritivo. A lista estruturada `operatorsList`
  // (Checkpoint 14 G4) é a fonte primária pros documentos.
  base.s1.operators = inv.sharing ?? "";
  base.s1.operatorsList = inv.operatorLinks.map((l) => ({
    id: l.operator.id,
    name: l.operator.name,
    cnpj: l.operator.cnpj ?? "",
    relationType: l.operator.relationType,
    activityDescription: l.activityDescription ?? "",
    contractStatus: l.operator.contractStatus,
    contractRiskClass: l.operator.contractRiskClass,
    country: l.operator.country ?? "",
  }));

  // ----- Seção 2: Descrição do projeto/processo -----
  base.s2 = {
    name: inv.serviceName ?? "",
    description: extractFromFormAnswers(inv.formAnswers, ["sec2", "processoDescricao"]) ?? "",
    objective: inv.purpose ?? "",
    responsibleArea: inv.setor ?? "",
  };

  // ----- Seção 3: Dados pessoais tratados -----
  const sensitiveDataNotes = inferSensitiveDataNotes(inv);
  base.s3 = {
    categories: inv.dataCategory ?? "",
    personalData: inv.personalData ?? "",
    sensitiveDataNotes,
    subjects: inv.dataSubjects ?? "",
    volumeEstimate: extractFromFormAnswers(inv.formAnswers, ["sec3", "volumeEstimado"]) ?? "",
  };

  // ----- Seção 4: Finalidade e bases legais -----
  base.s4 = {
    purposes: inv.purpose ?? "",
    legalBasis: combineLegalBasis(inv.legalBasis, inv.previsaoLegal),
    sensitiveBasis: inv.legalBasisSensitive ?? "",
    necessityJustification: "",          // preenchido pelo usuário
    proportionalityJustification: "",    // preenchido pelo usuário
  };

  // ----- Seção 5: Ciclo de vida dos dados -----
  base.s5 = {
    collection: extractFromFormAnswers(inv.formAnswers, ["sec3", "formaColeta"]) ?? "",
    storage: inv.storage ?? "",
    retention: inv.retention ?? "",
    elimination: extractFromFormAnswers(inv.formAnswers, ["sec5", "procedimentoEliminacao"]) ?? "",
    internationalTransfer: extractFromFormAnswers(inv.formAnswers, ["sec6", "transferenciaInternacional"]) ?? "",
  };

  // ----- Seção 6: Avaliação de riscos -----
  base.s6.risks = inv.processRisks.map((r) => {
    const def = RISCOS_BY_CODE[r.riskCode as keyof typeof RISCOS_BY_CODE];
    const sev = decodeSeverity(r.severityLevel);
    const sevDetail = sev
      ? `Probabilidade: ${sev.probability} · Impacto: ${sev.impact}`
      : "";
    return {
      code: r.riskCode,
      label: def?.fullLabel ?? def?.shortLabel ?? r.riskCode,
      status: r.status,
      severityLevel: sev?.severity ?? "",
      severityDetail: sevDetail,
      description: r.description ?? "",
      mitigationSummary: r.mitigationPlan ?? "",
    };
  });
  base.s6.overallAssessment = ""; // preenchido pelo usuário

  // ----- Seção 7: Medidas de mitigação -----
  base.s7.existingControls = gapAnswers.map((g) => {
    const ctrl = getControlByCode(g.controlCode);
    return {
      code: g.controlCode,
      label: ctrl?.question ?? "(controle desconhecido)",
      cenarioAtual: g.cenarioAtual ?? "",
    };
  });
  base.s7.plannedActions = actions.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    priority: a.priority,
  }));
  base.s7.additionalSafeguards = inv.security ?? "";

  // ----- Seção 8: Parecer (sempre vazia, preenchida pelo DPO) -----
  base.s8 = { finalConclusion: "", recommendations: "" };

  return base;
}

// ============================================================
// Helpers internos
// ============================================================

/**
 * Extrai um valor profundo do `formAnswers` do Inventário sem assumir
 * estrutura rígida. Aceita uma cadeia de chaves e devolve string ou null.
 *
 * Ex: extractFromFormAnswers(formAnswers, ["sec3", "formaColeta"])
 *
 * Retorna null se qualquer nível não existir ou o valor não for primitivo.
 */
function extractFromFormAnswers(
  formAnswers: any,
  path: ReadonlyArray<string>
): string | null {
  if (!formAnswers || typeof formAnswers !== "object") return null;
  let cursor: any = formAnswers;
  // Tenta primeiro o path direto
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return null;
    // Algumas estruturas têm `.sections.sec2.respostas.foo` em vez de `.sec2.foo`
    if (cursor.sections && typeof cursor.sections === "object" && key in cursor.sections) {
      cursor = cursor.sections[key];
    } else if (key in cursor) {
      cursor = cursor[key];
    } else if (cursor.respostas && typeof cursor.respostas === "object" && key in cursor.respostas) {
      cursor = cursor.respostas[key];
    } else {
      return null;
    }
  }
  if (typeof cursor === "string") return cursor.trim() || null;
  if (typeof cursor === "number" || typeof cursor === "boolean") return String(cursor);
  return null;
}

/**
 * Detecta se o inventário trata dados sensíveis e devolve nota
 * descritiva curta. Heurística baseada em `dataCategory`.
 */
function inferSensitiveDataNotes(inv: InventoryForPrepop): string {
  const cat = (inv.dataCategory ?? "").toLowerCase();
  if (cat.includes("sensív") || cat.includes("sensiv")) {
    return "Este processo trata dados pessoais sensíveis (art. 5º, II da LGPD).";
  }
  if (cat.includes("crianç") || cat.includes("adolescent")) {
    return "Este processo trata dados de crianças e/ou adolescentes (art. 14 da LGPD).";
  }
  return "";
}

/** Une os campos `legalBasis` (do wizard) e `previsaoLegal` (do DPO). */
function combineLegalBasis(
  legalBasis: string | null,
  previsaoLegal: string | null
): string {
  const parts: string[] = [];
  if (legalBasis?.trim()) parts.push(legalBasis.trim());
  if (previsaoLegal?.trim()) parts.push(`Previsão legal: ${previsaoLegal.trim()}`);
  return parts.join("\n\n");
}
