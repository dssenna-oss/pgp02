/**
 * Helpers da LIA — Avaliação de Legítimo Interesse (Checkpoint 21).
 *
 * Cada `Lia` é um documento institucional estruturado em 3 etapas
 * (LiaData), vinculado opcionalmente a um processo do Inventário
 * (DataInventory). Documenta o teste de balanceamento exigido pelo
 * Art. 10 §3º LGPD pra usar Art. 7º IX (legítimo interesse) como base.
 *
 * Estrutura paralela ao RIPD (CP13) e Políticas (CP12) — mesma família
 * de "documento institucional com workflow + versionamento".
 *
 * Fluxo de aprovação:
 *   - Contribuidor cria → RASCUNHO
 *   - Contribuidor "envia pra revisão" → EM_REVISAO
 *   - DPO aprova → APROVADO (cria LiaVersion + atualiza
 *     publishedContent / publishedAt / publishedVersionNum)
 *   - DPO rejeita → volta pra RASCUNHO com `rejectionNote`
 *   - DPO em RASCUNHO/EM_REVISAO próprio: aprova diretamente (atalho)
 *
 * Visibilidade:
 *   - DPO (qualquer nível): vê todas as LIAs da org
 *   - Contribuidor: vê apenas as próprias
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, isContribuidor } from "@/lib/auth-helpers";

// ============================================================
// Status (enum)
// ============================================================

export const LIA_STATUS = {
  RASCUNHO: "RASCUNHO",
  EM_REVISAO: "EM_REVISAO",
  APROVADO: "APROVADO",
  ARQUIVADO: "ARQUIVADO",
} as const;
export type LiaStatus = (typeof LIA_STATUS)[keyof typeof LIA_STATUS];

export const VALID_LIA_STATUSES = new Set(Object.values(LIA_STATUS));

export function liaStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovada";
    case "ARQUIVADO":  return "Arquivada";
    default:           return "—";
  }
}

export function liaStatusBadgeClass(s: string | null | undefined): string {
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
// Estrutura do conteúdo (JSON em Lia.data)
// ============================================================

/**
 * Esquema do `data` de uma LIA. Versionado pelo campo `v` pra permitir
 * migração se a estrutura mudar no futuro.
 *
 * 3 etapas seguem o modelo ANPD/GDPR clássico:
 *  s1 — Teste de Finalidade
 *  s2 — Teste de Necessidade (com 2 verificações bloqueantes:
 *       dados sensíveis e crianças/adolescentes)
 *  s3 — Teste de Balanceamento
 */
export interface LiaData {
  /** Versão do esquema. Sempre 1 nesta release. */
  v: 1;

  /** Etapa 1 — Teste de Finalidade */
  s1: {
    /** Descrição clara e específica do legítimo interesse pretendido. */
    interesseDescricao: string;
    /** Justificativa de por que o interesse é lícito (Art. 5º LGPD + outras). */
    interesseLicito: "sim" | "nao" | null;
    interesseLicitoJustificativa: string;
    /** Por que é específico (não genérico tipo "melhorar negócio")? */
    interesseEspecifico: string;
    /** Há previsão legal/regulatória que ampara o interesse? */
    previsaoLegal: string;
  };

  /** Etapa 2 — Teste de Necessidade */
  s2: {
    /** O tratamento é estritamente necessário? */
    estritamenteNecessario: string;
    /** Há alternativa menos invasiva? */
    alternativaMenosInvasiva: "sim_adotada" | "sim_inviavel" | "nao" | null;
    alternativaJustificativa: string;
    /** Quais dados são tratados — princípio da minimização (Art. 6º III). */
    dadosMinimosTratados: string;
    /** Checklist de minimização aplicada. */
    minimizacao: {
      avaliouEssenciais: boolean;
      removeuOpcionais: boolean;
      pseudonimizou: boolean;
      definiuRetencao: boolean;
    };
    /** BLOQUEANTE: dados sensíveis vetam Art. 7º IX (Art. 11). */
    dadosSensiveis: "sim" | "nao" | null;
    /** BLOQUEANTE: dados de crianças/adolescentes vetam Art. 7º IX (Art. 14). */
    criancaAdolescente: "sim" | "nao" | null;
  };

  /** Etapa 3 — Teste de Balanceamento */
  s3: {
    /** Direitos e expectativas dos titulares neste contexto. */
    direitosTitulares: string;
    /** Os titulares razoavelmente esperariam esse tratamento? */
    expectativaTitulares: "esperam" | "nao_esperam" | "incerto" | null;
    expectativaJustificativa: string;
    /** Impactos positivos do tratamento pro titular ou sociedade. */
    impactoPositivo: string;
    /** Impactos negativos / riscos pros titulares. */
    impactoNegativo: string;
    /** Salvaguardas adotadas pra mitigar impactos. */
    salvaguardas: {
      criptografia: boolean;
      anonimizacao: boolean;
      optOut: boolean;
      transparencia: boolean;
      auditoria: boolean;
    };
    /** Decisão final do teste de balanceamento. */
    decisaoFinal: "prevalece" | "nao_prevalece" | null;
    decisaoJustificativa: string;
  };
}

/**
 * Retorna LiaData válido a partir de qualquer entrada (JSON do banco,
 * payload do cliente, etc.). Preenche defaults pra não quebrar telas
 * antigas se a estrutura crescer no futuro.
 */
export function normalizeLiaData(raw: any): LiaData {
  const r = raw && typeof raw === "object" ? raw : {};
  const s1 = r.s1 ?? {};
  const s2 = r.s2 ?? {};
  const s3 = r.s3 ?? {};
  return {
    v: 1,
    s1: {
      interesseDescricao: String(s1.interesseDescricao ?? ""),
      interesseLicito: ["sim", "nao"].includes(s1.interesseLicito) ? s1.interesseLicito : null,
      interesseLicitoJustificativa: String(s1.interesseLicitoJustificativa ?? ""),
      interesseEspecifico: String(s1.interesseEspecifico ?? ""),
      previsaoLegal: String(s1.previsaoLegal ?? ""),
    },
    s2: {
      estritamenteNecessario: String(s2.estritamenteNecessario ?? ""),
      alternativaMenosInvasiva: ["sim_adotada", "sim_inviavel", "nao"].includes(s2.alternativaMenosInvasiva)
        ? s2.alternativaMenosInvasiva
        : null,
      alternativaJustificativa: String(s2.alternativaJustificativa ?? ""),
      dadosMinimosTratados: String(s2.dadosMinimosTratados ?? ""),
      minimizacao: {
        avaliouEssenciais: Boolean(s2.minimizacao?.avaliouEssenciais),
        removeuOpcionais: Boolean(s2.minimizacao?.removeuOpcionais),
        pseudonimizou: Boolean(s2.minimizacao?.pseudonimizou),
        definiuRetencao: Boolean(s2.minimizacao?.definiuRetencao),
      },
      dadosSensiveis: ["sim", "nao"].includes(s2.dadosSensiveis) ? s2.dadosSensiveis : null,
      criancaAdolescente: ["sim", "nao"].includes(s2.criancaAdolescente) ? s2.criancaAdolescente : null,
    },
    s3: {
      direitosTitulares: String(s3.direitosTitulares ?? ""),
      expectativaTitulares: ["esperam", "nao_esperam", "incerto"].includes(s3.expectativaTitulares)
        ? s3.expectativaTitulares
        : null,
      expectativaJustificativa: String(s3.expectativaJustificativa ?? ""),
      impactoPositivo: String(s3.impactoPositivo ?? ""),
      impactoNegativo: String(s3.impactoNegativo ?? ""),
      salvaguardas: {
        criptografia: Boolean(s3.salvaguardas?.criptografia),
        anonimizacao: Boolean(s3.salvaguardas?.anonimizacao),
        optOut: Boolean(s3.salvaguardas?.optOut),
        transparencia: Boolean(s3.salvaguardas?.transparencia),
        auditoria: Boolean(s3.salvaguardas?.auditoria),
      },
      decisaoFinal: ["prevalece", "nao_prevalece"].includes(s3.decisaoFinal) ? s3.decisaoFinal : null,
      decisaoJustificativa: String(s3.decisaoJustificativa ?? ""),
    },
  };
}

export function emptyLiaData(): LiaData {
  return normalizeLiaData({});
}

export const LIA_SECTION_LABELS: ReadonlyArray<{
  key: keyof LiaData & `s${number}`;
  label: string;
  short: string;
}> = [
  { key: "s1", label: "Teste de Finalidade",       short: "Finalidade" },
  { key: "s2", label: "Teste de Necessidade",      short: "Necessidade" },
  { key: "s3", label: "Teste de Balanceamento",    short: "Balanceamento" },
];

/**
 * Verifica se a LIA tem bloqueios estruturais (dados sensíveis ou
 * crianças/adolescentes marcados como "sim"). Quando bloqueada, o
 * tratamento NÃO PODE usar Art. 7º IX — base legal precisa mudar.
 */
export function liaIsBlocked(data: LiaData): boolean {
  return data.s2.dadosSensiveis === "sim" || data.s2.criancaAdolescente === "sim";
}

/**
 * Calcula completude da LIA por etapa (0..1) — usado pra mostrar
 * indicador visual no editor e exigir todas preenchidas antes de submeter.
 */
export function liaCompleteness(data: LiaData): {
  s1: number;
  s2: number;
  s3: number;
  overall: number;
} {
  // Conta quantos campos textuais "obrigatórios" estão preenchidos +
  // quantas escolhas categóricas foram feitas. Não pesa salvaguardas
  // (são opcionais — quanto mais melhor, mas zero é válido).
  const isFilled = (v: string) => v.trim().length >= 5;
  const s1Score =
    [
      isFilled(data.s1.interesseDescricao),
      data.s1.interesseLicito !== null,
      isFilled(data.s1.interesseLicitoJustificativa),
      isFilled(data.s1.interesseEspecifico),
    ].filter(Boolean).length / 4;

  const s2Score =
    [
      isFilled(data.s2.estritamenteNecessario),
      data.s2.alternativaMenosInvasiva !== null,
      isFilled(data.s2.dadosMinimosTratados),
      data.s2.dadosSensiveis !== null,
      data.s2.criancaAdolescente !== null,
    ].filter(Boolean).length / 5;

  const s3Score =
    [
      isFilled(data.s3.direitosTitulares),
      data.s3.expectativaTitulares !== null,
      isFilled(data.s3.impactoPositivo) || isFilled(data.s3.impactoNegativo),
      data.s3.decisaoFinal !== null,
      isFilled(data.s3.decisaoJustificativa),
    ].filter(Boolean).length / 5;

  return {
    s1: s1Score,
    s2: s2Score,
    s3: s3Score,
    overall: (s1Score + s2Score + s3Score) / 3,
  };
}

// ============================================================
// DTO (saída pras APIs)
// ============================================================

export interface LiaDTO {
  id: string;
  companyId: string;
  inventoryId: string | null;
  inventory: { id: string; serviceName: string; status: string } | null;
  title: string;
  status: LiaStatus;
  data: LiaData;
  rejectionNote: string | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
  approvedAt: string | null;
  publishedContent: LiaData | null;
  publishedAt: string | null;
  publishedVersionNum: number | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  /** Bloqueado por dados sensíveis ou crianças (Art. 11/14)? */
  blocked: boolean;
  /** Completude geral 0..1 — usado em badges visuais. */
  completeness: number;
}

interface LiaRow {
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

export function liaToDTO(r: LiaRow): LiaDTO {
  const data = normalizeLiaData(r.data);
  const versionCount = r._count?.versions ?? r.versions?.length ?? 0;
  return {
    id: r.id,
    companyId: r.companyId,
    inventoryId: r.inventoryId,
    inventory: r.inventory ?? null,
    title: r.title,
    status: r.status as LiaStatus,
    data,
    rejectionNote: r.rejectionNote,
    approvedBy: r.approvedBy ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    publishedContent:
      r.publishedContent != null ? normalizeLiaData(r.publishedContent) : null,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    publishedVersionNum: r.publishedVersionNum,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    versionCount,
    blocked: liaIsBlocked(data),
    completeness: liaCompleteness(data).overall,
  };
}

/**
 * Include padrão pra carregar uma LIA com todos os relacionamentos
 * usados pelo DTO. Reusa em todas as queries pra consistência.
 */
export const LIA_FULL_INCLUDE = {
  inventory: { select: { id: true, serviceName: true, status: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true } },
} as const;

// ============================================================
// Auth check (DPO + Contribuidor)
// ============================================================

export type LiaAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

/**
 * Carrega usuário autenticado e valida vínculo com Company.
 * Aceita DPO (qualquer nível) e Contribuidor — LIA é compartilhada
 * (Contribuidor cria rascunho, DPO aprova).
 */
export async function loadLiaAuth(): Promise<
  { error: NextResponse } | { user: LiaAuthUser }
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
        { error: "Sem permissão pra acessar LIAs" },
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
// Permissões (regras de quem pode quê) — paridade com RIPD
// ============================================================

export function canEditLia(
  user: LiaAuthUser,
  lia: { createdById: string; status: string }
): boolean {
  if (lia.status === "ARQUIVADO") return false;
  if (user.isDPO) return true;
  return lia.createdById === user.id && lia.status === "RASCUNHO";
}

export function canSubmitLia(
  user: LiaAuthUser,
  lia: { createdById: string; status: string }
): boolean {
  if (lia.status !== "RASCUNHO") return false;
  return lia.createdById === user.id;
}

export function canApproveLia(
  user: LiaAuthUser,
  lia: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return lia.status !== "ARQUIVADO";
}

export function canRejectLia(
  user: LiaAuthUser,
  lia: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return lia.status === "EM_REVISAO";
}

export function canDeleteLia(
  user: LiaAuthUser,
  lia: { createdById: string; status: string }
): boolean {
  if (user.isDPO) return true;
  return lia.createdById === user.id && lia.status === "RASCUNHO";
}

export function canArchiveLia(
  user: LiaAuthUser,
  lia: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return lia.status === "APROVADO";
}

// ============================================================
// Filtro de listagem (DPO vê tudo / Contribuidor só próprias)
// ============================================================

export function liaAccessFilter(
  user: LiaAuthUser
): { companyId: string; createdById?: string } {
  if (user.isDPO) return { companyId: user.companyId };
  return { companyId: user.companyId, createdById: user.id };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface LiaStats {
  total: number;
  byStatus: Record<LiaStatus, number>;
  awaitingReview: number; // EM_REVISAO (fila do DPO)
  myDrafts: number;       // RASCUNHO criados pelo usuário
  blocked: number;        // LIAs com bloqueio estrutural detectado
}

export function computeLiaStats(
  lias: ReadonlyArray<{ status: string; createdById: string; data: any }>,
  userId: string
): LiaStats {
  const stats: LiaStats = {
    total: lias.length,
    byStatus: { RASCUNHO: 0, EM_REVISAO: 0, APROVADO: 0, ARQUIVADO: 0 },
    awaitingReview: 0,
    myDrafts: 0,
    blocked: 0,
  };
  for (const l of lias) {
    if (l.status in stats.byStatus) (stats.byStatus as any)[l.status] += 1;
    if (l.status === "EM_REVISAO") stats.awaitingReview += 1;
    if (l.status === "RASCUNHO" && l.createdById === userId) stats.myDrafts += 1;
    if (liaIsBlocked(normalizeLiaData(l.data))) stats.blocked += 1;
  }
  return stats;
}
