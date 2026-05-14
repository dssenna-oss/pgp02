/**
 * Helpers do RIPD v2 (Checkpoint 13).
 *
 * Cada `Ripd` é um documento institucional estruturado em 8 seções
 * (RipdData), vinculado opcionalmente a um processo do Inventário
 * (DataInventory). O conteúdo é gerado pelo motor de pré-população em
 * `lib/ripd-prepopulate.ts` quando o usuário cria a partir de um
 * processo aprovado.
 *
 * Fluxo de aprovação:
 *   - Contribuidor cria → RASCUNHO
 *   - Contribuidor "envia pra revisão" → EM_REVISAO
 *   - DPO aprova → APROVADO (cria RipdVersion + atualiza
 *     publishedContent / publishedAt / publishedVersionNum)
 *   - DPO rejeita → volta pra RASCUNHO com `rejectionNote`
 *   - DPO em RASCUNHO/EM_REVISAO próprio: aprova diretamente (atalho)
 *
 * Visibilidade:
 *   - DPO (qualquer nível): vê todos os RIPDs da org
 *   - Contribuidor: vê apenas os próprios
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, isContribuidor } from "@/lib/auth-helpers";

// ============================================================
// Status (enum)
// ============================================================

export const RIPD_STATUS = {
  RASCUNHO: "RASCUNHO",
  EM_REVISAO: "EM_REVISAO",
  APROVADO: "APROVADO",
  ARQUIVADO: "ARQUIVADO",
} as const;
export type RipdStatus = (typeof RIPD_STATUS)[keyof typeof RIPD_STATUS];

export const VALID_RIPD_STATUSES = new Set(Object.values(RIPD_STATUS));

export function ripdStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovado";
    case "ARQUIVADO":  return "Arquivado";
    default:           return "—";
  }
}

export function ripdStatusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "APROVADO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    case "EM_REVISAO":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "RASCUNHO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "ARQUIVADO":
      return "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

// ============================================================
// Estrutura do conteúdo (JSON em Ripd.data)
// ============================================================

/**
 * Esquema do `data` de um Ripd. Versionado pelo campo `v` pra permitir
 * migração se a estrutura mudar no futuro.
 *
 * As 8 seções seguem o Guia Orientativo da ANPD pra elaboração de
 * RIPDs e a Resolução CD/ANPD nº 2/2022.
 */
export interface RipdData {
  /** Versão do esquema. Sempre 1 nesta release. */
  v: 1;

  /** Seção 1 — Identificação dos agentes de tratamento */
  s1: {
    controller: {
      name: string;
      cnpj: string;
      address: string;
      legalRepresentative: string;
    };
    dpo: {
      name: string;
      email: string;
      phone: string;
    };
    /** Operadores e terceiros envolvidos — texto livre legado.
     *  Desde Checkpoint 14 G4 fica como complemento; a lista
     *  estruturada `operatorsList` é a fonte primária. */
    operators: string;
    /** Lista estruturada de operadores vinda da Gestão de Terceiros
     *  (Checkpoint 14 G4). Pré-populada a partir de `OperatorProcessLink`
     *  do processo. Vazio = nenhum operador cadastrado pra esse processo. */
    operatorsList: ReadonlyArray<{
      id: string;
      name: string;
      cnpj: string;
      relationType: string;          // OPERADOR | CONTROLADOR | CO_CONTROLADOR | INDEFINIDO
      activityDescription: string;   // o que esse operador faz neste processo
      contractStatus: string;
      contractRiskClass: string;
      country: string;
    }>;
  };

  /** Seção 2 — Descrição do projeto/processo */
  s2: {
    name: string;
    description: string;
    objective: string;
    responsibleArea: string;
  };

  /** Seção 3 — Dados pessoais tratados */
  s3: {
    /** Categorias gerais (ex: "Dados pessoais comuns + sensíveis") */
    categories: string;
    /** Tipos específicos coletados (ex: "Nome, CPF, e-mail, ...") */
    personalData: string;
    /** Notas sobre dados sensíveis (se houver) */
    sensitiveDataNotes: string;
    /** Categorias de titulares (clientes, funcionários, etc.) */
    subjects: string;
    /** Estimativa de volume (opcional, texto livre) */
    volumeEstimate: string;
  };

  /** Seção 4 — Finalidade e bases legais */
  s4: {
    /** Finalidades específicas do tratamento */
    purposes: string;
    /** Base legal aplicável (LGPD art. 7º ou 11) */
    legalBasis: string;
    /** Base legal específica para dados sensíveis (se aplicável) */
    sensitiveBasis: string;
    /** Justificativa de necessidade — campo livre do DPO/Contribuidor */
    necessityJustification: string;
    /** Justificativa de proporcionalidade — campo livre */
    proportionalityJustification: string;
  };

  /** Seção 5 — Ciclo de vida dos dados */
  s5: {
    /** Forma de coleta (formulário, API, importação, etc.) */
    collection: string;
    /** Local e forma de armazenamento */
    storage: string;
    /** Período de retenção e justificativa */
    retention: string;
    /** Procedimento de eliminação */
    elimination: string;
    /** Transferência internacional (se houver — país, salvaguardas) */
    internationalTransfer: string;
  };

  /** Seção 6 — Avaliação de riscos (origem: ProcessRisk) */
  s6: {
    risks: ReadonlyArray<{
      code: string;            // riskCode (BR-CD)
      label: string;
      status: string;          // IDENTIFICADO/EM_MITIGACAO/...
      severityLevel: string;   // BAIXO/MEDIO/ALTO ou null se ainda não detalhado
      severityDetail: string;  // "P:M;I:A" decoded ou ""
      description: string;
      mitigationSummary: string;
    }>;
    /** Avaliação geral livre (DPO complementa) */
    overallAssessment: string;
  };

  /** Seção 7 — Medidas de mitigação (origem: GAP + Plano de Ação) */
  s7: {
    /** Controles aderentes do GAP (já implementados) */
    existingControls: ReadonlyArray<{
      code: string;
      label: string;
      cenarioAtual: string;
    }>;
    /** Ações abertas do Plano de Ação ligadas ao processo */
    plannedActions: ReadonlyArray<{
      id: string;
      title: string;
      status: string;
      dueDate: string | null;
      priority: string;
    }>;
    /** Salvaguardas adicionais — texto livre */
    additionalSafeguards: string;
  };

  /** Seção 8 — Parecer e aprovação do DPO */
  s8: {
    /** Conclusão / parecer técnico final */
    finalConclusion: string;
    /** Recomendações pro tratamento prosseguir */
    recommendations: string;
  };
}

/**
 * Normaliza um RipdData lido do banco. Garante que campos novos
 * (adicionados em versões posteriores do schema) existam mesmo em
 * documentos antigos. Idempotente.
 *
 * Principais migrações:
 *   - Checkpoint 14 G4: garante `s1.operatorsList` (array).
 */
export function normalizeRipdData(raw: any): RipdData {
  const base = emptyRipdData();
  if (!raw || typeof raw !== "object") return base;
  const out: any = { ...base, ...raw };
  // Seções podem vir parciais — garantir defaults
  out.s1 = { ...base.s1, ...(raw.s1 ?? {}) };
  out.s1.controller = { ...base.s1.controller, ...(raw.s1?.controller ?? {}) };
  out.s1.dpo = { ...base.s1.dpo, ...(raw.s1?.dpo ?? {}) };
  if (!Array.isArray(out.s1.operatorsList)) out.s1.operatorsList = [];
  out.s2 = { ...base.s2, ...(raw.s2 ?? {}) };
  out.s3 = { ...base.s3, ...(raw.s3 ?? {}) };
  out.s4 = { ...base.s4, ...(raw.s4 ?? {}) };
  out.s5 = { ...base.s5, ...(raw.s5 ?? {}) };
  out.s6 = { ...base.s6, ...(raw.s6 ?? {}) };
  if (!Array.isArray(out.s6.risks)) out.s6.risks = [];
  out.s7 = { ...base.s7, ...(raw.s7 ?? {}) };
  if (!Array.isArray(out.s7.existingControls)) out.s7.existingControls = [];
  if (!Array.isArray(out.s7.plannedActions)) out.s7.plannedActions = [];
  out.s8 = { ...base.s8, ...(raw.s8 ?? {}) };
  out.v = 1;
  return out as RipdData;
}

/** RipdData vazio (todos os campos como string vazia / arrays vazios).
 *  Usado pra criar RIPDs avulsos sem inventoryId. */
export function emptyRipdData(): RipdData {
  return {
    v: 1,
    s1: {
      controller: { name: "", cnpj: "", address: "", legalRepresentative: "" },
      dpo: { name: "", email: "", phone: "" },
      operators: "",
      operatorsList: [],
    },
    s2: { name: "", description: "", objective: "", responsibleArea: "" },
    s3: {
      categories: "",
      personalData: "",
      sensitiveDataNotes: "",
      subjects: "",
      volumeEstimate: "",
    },
    s4: {
      purposes: "",
      legalBasis: "",
      sensitiveBasis: "",
      necessityJustification: "",
      proportionalityJustification: "",
    },
    s5: {
      collection: "",
      storage: "",
      retention: "",
      elimination: "",
      internationalTransfer: "",
    },
    s6: { risks: [], overallAssessment: "" },
    s7: { existingControls: [], plannedActions: [], additionalSafeguards: "" },
    s8: { finalConclusion: "", recommendations: "" },
  };
}

/** Section labels pra UI (abas/accordions) */
export const RIPD_SECTION_LABELS: ReadonlyArray<{
  key: keyof RipdData & `s${number}`;
  label: string;
  short: string;
}> = [
  { key: "s1", label: "Identificação dos agentes",       short: "Agentes" },
  { key: "s2", label: "Descrição do projeto/processo",   short: "Projeto" },
  { key: "s3", label: "Dados pessoais tratados",         short: "Dados" },
  { key: "s4", label: "Finalidade e bases legais",       short: "Finalidade" },
  { key: "s5", label: "Ciclo de vida dos dados",         short: "Ciclo de vida" },
  { key: "s6", label: "Avaliação de riscos",             short: "Riscos" },
  { key: "s7", label: "Medidas de mitigação",            short: "Mitigação" },
  { key: "s8", label: "Parecer e aprovação",             short: "Parecer" },
];

// ============================================================
// DTO (saída pras APIs)
// ============================================================

export interface RipdDTO {
  id: string;
  companyId: string;
  inventoryId: string | null;
  inventory: { id: string; serviceName: string; status: string } | null;
  title: string;
  status: RipdStatus;
  data: RipdData;
  rejectionNote: string | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
  approvedAt: string | null;
  publishedContent: RipdData | null;
  publishedAt: string | null;
  publishedVersionNum: number | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
}

interface RipdRow {
  id: string;
  companyId: string;
  inventoryId: string | null;
  inventory?: { id: string; serviceName: string; status: string } | null;
  title: string;
  status: string;
  data: any;
  rejectionNote: string | null;
  approvedBy?: { id: string; name: string | null; email: string } | null;
  approvedAt: Date | null;
  publishedContent: any;
  publishedAt: Date | null;
  publishedVersionNum: number | null;
  createdBy?: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { versions: number };
  versions?: { id: string }[];
}

export function ripdToDTO(r: RipdRow): RipdDTO {
  const versionCount = r._count?.versions ?? r.versions?.length ?? 0;
  return {
    id: r.id,
    companyId: r.companyId,
    inventoryId: r.inventoryId,
    inventory: r.inventory ?? null,
    title: r.title,
    status: r.status as RipdStatus,
    data: normalizeRipdData(r.data),
    rejectionNote: r.rejectionNote,
    approvedBy: r.approvedBy ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    publishedContent:
      r.publishedContent != null ? normalizeRipdData(r.publishedContent) : null,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    publishedVersionNum: r.publishedVersionNum,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    versionCount,
  };
}

// ============================================================
// Auth check (DPO + Contribuidor)
// ============================================================

export type RipdAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

/**
 * Carrega usuário autenticado e valida vínculo com Company.
 * Aceita DPO (qualquer nível) e Contribuidor — RIPD é uma feature
 * compartilhada (Contribuidor cria rascunho, DPO aprova).
 */
export async function loadRipdAuth(): Promise<
  { error: NextResponse } | { user: RipdAuthUser }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }
  const u = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!u?.companyId) {
    return {
      error: NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      ),
    };
  }
  if (!isDPO(u.role) && !isContribuidor(u.role)) {
    return {
      error: NextResponse.json(
        { error: "Sem permissão pra acessar RIPDs" },
        { status: 403 }
      ),
    };
  }
  return {
    user: {
      id: u.id,
      companyId: u.companyId,
      role: u.role,
      isDPO: isDPO(u.role),
    },
  };
}

// ============================================================
// Permissões (regras de quem pode quê)
// ============================================================

/**
 * Pode editar `data` e `title`?
 *
 * Modelo (igual ao de Políticas no Checkpoint 12): `data` é sempre o
 * "rascunho de trabalho" do DPO; `publishedContent` é o snapshot da
 * última aprovação. Editar `data` em RIPD APROVADO não desfaz a versão
 * publicada — só prepara conteúdo pra próxima aprovação (v2).
 *
 *   - DPO: edita em RASCUNHO, EM_REVISAO ou APROVADO. ARQUIVADO é
 *     imutável (precisa desarquivar primeiro — futuro).
 *   - Contribuidor: só RIPDs próprios em RASCUNHO. Depois de submeter
 *     pra revisão ou após aprovação, perde a edição.
 */
export function canEditRipd(
  user: RipdAuthUser,
  ripd: { createdById: string; status: string }
): boolean {
  if (ripd.status === "ARQUIVADO") return false;
  if (user.isDPO) return true;
  return ripd.createdById === user.id && ripd.status === "RASCUNHO";
}

/**
 * Pode submeter pra revisão (RASCUNHO → EM_REVISAO)?
 *   - Apenas o criador (Contribuidor) — DPO normalmente aprova direto
 *   - Status atual deve ser RASCUNHO
 */
export function canSubmitRipd(
  user: RipdAuthUser,
  ripd: { createdById: string; status: string }
): boolean {
  if (ripd.status !== "RASCUNHO") return false;
  return ripd.createdById === user.id;
}

/**
 * Pode aprovar (cria nova RipdVersion + atualiza publishedContent)?
 *   - Apenas DPO
 *   - RASCUNHO/EM_REVISAO: aprova primeira vez (cria v1) ou re-aprova
 *     após rejeição
 *   - APROVADO: re-aprova pra publicar nova versão (cria v2, v3, ...)
 *     quando o conteúdo divergiu da última publicada
 *   - ARQUIVADO: não pode (precisa desarquivar primeiro)
 */
export function canApproveRipd(
  user: RipdAuthUser,
  ripd: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return ripd.status !== "ARQUIVADO";
}

/**
 * Pode rejeitar (EM_REVISAO → RASCUNHO com `rejectionNote`)?
 *   - Apenas DPO
 *   - Status atual deve ser EM_REVISAO
 */
export function canRejectRipd(
  user: RipdAuthUser,
  ripd: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return ripd.status === "EM_REVISAO";
}

/**
 * Pode excluir?
 *   - DPO: sempre (qualquer status)
 *   - Contribuidor: só RIPDs próprios em RASCUNHO
 */
export function canDeleteRipd(
  user: RipdAuthUser,
  ripd: { createdById: string; status: string }
): boolean {
  if (user.isDPO) return true;
  return ripd.createdById === user.id && ripd.status === "RASCUNHO";
}

/**
 * Pode arquivar (APROVADO → ARQUIVADO)?
 *   - Apenas DPO
 *   - Status atual deve ser APROVADO
 */
export function canArchiveRipd(
  user: RipdAuthUser,
  ripd: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return ripd.status === "APROVADO";
}

// ============================================================
// Filtro de listagem (DPO vê tudo / Contribuidor só próprios)
// ============================================================

export function ripdAccessFilter(
  user: RipdAuthUser
): { companyId: string; createdById?: string } {
  if (user.isDPO) return { companyId: user.companyId };
  return { companyId: user.companyId, createdById: user.id };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface RipdStats {
  total: number;
  byStatus: Record<RipdStatus, number>;
  awaitingReview: number; // EM_REVISAO (pra DPO ver "fila")
  myDrafts: number;       // RASCUNHO criados pelo usuário
}

export function computeRipdStats(
  ripds: ReadonlyArray<{ status: string; createdById: string }>,
  userId: string
): RipdStats {
  const stats: RipdStats = {
    total: ripds.length,
    byStatus: { RASCUNHO: 0, EM_REVISAO: 0, APROVADO: 0, ARQUIVADO: 0 },
    awaitingReview: 0,
    myDrafts: 0,
  };
  for (const r of ripds) {
    if (r.status in stats.byStatus) (stats.byStatus as any)[r.status] += 1;
    if (r.status === "EM_REVISAO") stats.awaitingReview += 1;
    if (r.status === "RASCUNHO" && r.createdById === userId) stats.myDrafts += 1;
  }
  return stats;
}
