/**
 * Helpers da PSI — Política de Segurança da Informação (Checkpoint 26).
 *
 * Cada `Psi` é um documento institucional formal que descreve as
 * medidas técnicas e organizacionais de segurança. Cumpre LGPD Art.
 * 50 §1º (programa de governança em privacidade) e referencia
 * ISO/IEC 27001/27002 + NIST CSF.
 *
 * Estrutura paralela ao RIPD (CP13), Políticas (CP12) e LIA (CP21) —
 * mesma família de "documento institucional com workflow + versionamento".
 *
 * Fluxo de aprovação:
 *   - Contribuidor cria → RASCUNHO
 *   - Contribuidor "envia pra revisão" → EM_REVISAO
 *   - DPO aprova → APROVADO (cria PsiVersion + atualiza
 *     publishedContent / publishedAt / publishedVersionNum)
 *   - DPO rejeita → volta pra RASCUNHO com `rejectionNote`
 *
 * Visibilidade:
 *   - DPO (qualquer nível): vê todas as PSIs da org
 *   - Contribuidor: vê apenas as próprias (mas a PSI é tipicamente DPO)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDPO, isContribuidor } from "@/lib/auth-helpers";

// ============================================================
// Status (enum)
// ============================================================

export const PSI_STATUS = {
  RASCUNHO: "RASCUNHO",
  EM_REVISAO: "EM_REVISAO",
  APROVADO: "APROVADO",
  ARQUIVADO: "ARQUIVADO",
} as const;
export type PsiStatus = (typeof PSI_STATUS)[keyof typeof PSI_STATUS];

export const VALID_PSI_STATUSES = new Set(Object.values(PSI_STATUS));

export function psiStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":   return "Rascunho";
    case "EM_REVISAO": return "Em revisão";
    case "APROVADO":   return "Aprovada";
    case "ARQUIVADO":  return "Arquivada";
    default:           return "—";
  }
}

export function psiStatusBadgeClass(s: string | null | undefined): string {
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
// Estrutura do conteúdo (JSON em Psi.data)
// ============================================================

/**
 * Esquema do `data` de uma PSI. Versionado pelo campo `v` pra permitir
 * migração se a estrutura crescer no futuro.
 *
 * 7 seções pragmáticas baseadas em ISO/IEC 27002:2022 e NIST CSF:
 *  s1 — Governança e Responsabilidades
 *  s2 — Gestão de Ativos
 *  s3 — Controle de Acesso
 *  s4 — Criptografia e Proteção de Dados
 *  s5 — Segurança Física e Ambiental
 *  s6 — Gestão de Incidentes
 *  s7 — Continuidade e Recuperação
 *
 * Cada seção tem campos textuais (HTML/markdown livre) + checkboxes
 * de controles aplicáveis. Pré-população opcional dos scores do NIST CSF.
 */
export interface PsiData {
  /** Versão do esquema. Sempre 1 nesta release. */
  v: 1;

  /** Cabeçalho institucional. */
  header: {
    /** Vigência (ex.: "2026-2027"). */
    vigencia: string;
    /** Aplicabilidade (escopo). */
    aplicabilidade: string;
    /** Data da última revisão (ISO yyyy-mm-dd). */
    ultimaRevisao: string;
    /** Frequência de revisão (ex.: "Anual / a cada incidente crítico"). */
    frequenciaRevisao: string;
  };

  /** Seção 1 — Governança e Responsabilidades */
  s1: {
    declaracao: string;       // Declaração da alta direção (texto livre)
    responsabilidades: string; // Papéis (DPO, CISO, Comitê, gestores)
    controles: {
      comiteSeguranca: boolean;
      comunicacaoFormal: boolean;
      revisoesPeriodicas: boolean;
      treinamentoRegular: boolean;
    };
  };

  /** Seção 2 — Gestão de Ativos */
  s2: {
    inventarioAtivos: string;        // Como inventariam os ativos
    classificacaoInformacao: string; // Pública / Interna / Confidencial / Restrita
    controles: {
      possuiInventario: boolean;
      ativosClassificados: boolean;
      proprietarioDefinido: boolean;
      descarteSeguro: boolean;
    };
  };

  /** Seção 3 — Controle de Acesso */
  s3: {
    politicaAcesso: string;       // Princípio do menor privilégio
    autenticacao: string;         // Senhas, MFA, SSO
    revisaoAcessos: string;       // Periodicidade
    controles: {
      menorPrivilegio: boolean;
      mfaCriticos: boolean;
      revisaoSemestral: boolean;
      desligamentoImediato: boolean;
    };
  };

  /** Seção 4 — Criptografia e Proteção de Dados */
  s4: {
    criptografiaEmTransito: string; // TLS, VPN
    criptografiaEmRepouso: string;  // Disco, banco, backup
    gestaoChaves: string;
    controles: {
      tlsObrigatorio: boolean;
      criptografiaRepouso: boolean;
      pseudonimizacao: boolean;
      backupCriptografado: boolean;
    };
  };

  /** Seção 5 — Segurança Física e Ambiental */
  s5: {
    perimetro: string;        // Acesso físico
    energiaAmbiente: string;  // Nobreak, climatização
    descarteFisico: string;   // Mídias, papéis
    controles: {
      controleAcessoFisico: boolean;
      monitoramentoCftv: boolean;
      energiaRedundante: boolean;
      descarteFormal: boolean;
    };
  };

  /** Seção 6 — Gestão de Incidentes (referencia mini-app CP16) */
  s6: {
    deteccaoMonitoramento: string; // Logs, SIEM
    respostaIncidente: string;     // Plano de resposta + 72h ANPD
    comunicacao: string;           // Canais, autoridades, titulares
    controles: {
      logsAtivados: boolean;
      planoResposta: boolean;
      notificacao72h: boolean;
      registroIncidentes: boolean; // Aponta pro mini-app CP16
    };
  };

  /** Seção 7 — Continuidade e Recuperação */
  s7: {
    backupEstrategia: string;
    rtoRpo: string;             // Tempos de recuperação alvo
    testesRecuperacao: string;
    controles: {
      backupRegular: boolean;
      backupOffsite: boolean;
      planoContinuidade: boolean;
      testeAnual: boolean;
    };
  };
}

/**
 * Retorna PsiData válido a partir de qualquer entrada (JSON do banco,
 * payload do cliente, etc.). Preenche defaults pra não quebrar telas
 * antigas se a estrutura crescer no futuro.
 */
export function normalizePsiData(raw: any): PsiData {
  const r = raw && typeof raw === "object" ? raw : {};
  const h = r.header ?? {};
  const s1 = r.s1 ?? {};
  const s2 = r.s2 ?? {};
  const s3 = r.s3 ?? {};
  const s4 = r.s4 ?? {};
  const s5 = r.s5 ?? {};
  const s6 = r.s6 ?? {};
  const s7 = r.s7 ?? {};
  return {
    v: 1,
    header: {
      vigencia: String(h.vigencia ?? ""),
      aplicabilidade: String(h.aplicabilidade ?? ""),
      ultimaRevisao: String(h.ultimaRevisao ?? ""),
      frequenciaRevisao: String(h.frequenciaRevisao ?? ""),
    },
    s1: {
      declaracao: String(s1.declaracao ?? ""),
      responsabilidades: String(s1.responsabilidades ?? ""),
      controles: {
        comiteSeguranca: Boolean(s1.controles?.comiteSeguranca),
        comunicacaoFormal: Boolean(s1.controles?.comunicacaoFormal),
        revisoesPeriodicas: Boolean(s1.controles?.revisoesPeriodicas),
        treinamentoRegular: Boolean(s1.controles?.treinamentoRegular),
      },
    },
    s2: {
      inventarioAtivos: String(s2.inventarioAtivos ?? ""),
      classificacaoInformacao: String(s2.classificacaoInformacao ?? ""),
      controles: {
        possuiInventario: Boolean(s2.controles?.possuiInventario),
        ativosClassificados: Boolean(s2.controles?.ativosClassificados),
        proprietarioDefinido: Boolean(s2.controles?.proprietarioDefinido),
        descarteSeguro: Boolean(s2.controles?.descarteSeguro),
      },
    },
    s3: {
      politicaAcesso: String(s3.politicaAcesso ?? ""),
      autenticacao: String(s3.autenticacao ?? ""),
      revisaoAcessos: String(s3.revisaoAcessos ?? ""),
      controles: {
        menorPrivilegio: Boolean(s3.controles?.menorPrivilegio),
        mfaCriticos: Boolean(s3.controles?.mfaCriticos),
        revisaoSemestral: Boolean(s3.controles?.revisaoSemestral),
        desligamentoImediato: Boolean(s3.controles?.desligamentoImediato),
      },
    },
    s4: {
      criptografiaEmTransito: String(s4.criptografiaEmTransito ?? ""),
      criptografiaEmRepouso: String(s4.criptografiaEmRepouso ?? ""),
      gestaoChaves: String(s4.gestaoChaves ?? ""),
      controles: {
        tlsObrigatorio: Boolean(s4.controles?.tlsObrigatorio),
        criptografiaRepouso: Boolean(s4.controles?.criptografiaRepouso),
        pseudonimizacao: Boolean(s4.controles?.pseudonimizacao),
        backupCriptografado: Boolean(s4.controles?.backupCriptografado),
      },
    },
    s5: {
      perimetro: String(s5.perimetro ?? ""),
      energiaAmbiente: String(s5.energiaAmbiente ?? ""),
      descarteFisico: String(s5.descarteFisico ?? ""),
      controles: {
        controleAcessoFisico: Boolean(s5.controles?.controleAcessoFisico),
        monitoramentoCftv: Boolean(s5.controles?.monitoramentoCftv),
        energiaRedundante: Boolean(s5.controles?.energiaRedundante),
        descarteFormal: Boolean(s5.controles?.descarteFormal),
      },
    },
    s6: {
      deteccaoMonitoramento: String(s6.deteccaoMonitoramento ?? ""),
      respostaIncidente: String(s6.respostaIncidente ?? ""),
      comunicacao: String(s6.comunicacao ?? ""),
      controles: {
        logsAtivados: Boolean(s6.controles?.logsAtivados),
        planoResposta: Boolean(s6.controles?.planoResposta),
        notificacao72h: Boolean(s6.controles?.notificacao72h),
        registroIncidentes: Boolean(s6.controles?.registroIncidentes),
      },
    },
    s7: {
      backupEstrategia: String(s7.backupEstrategia ?? ""),
      rtoRpo: String(s7.rtoRpo ?? ""),
      testesRecuperacao: String(s7.testesRecuperacao ?? ""),
      controles: {
        backupRegular: Boolean(s7.controles?.backupRegular),
        backupOffsite: Boolean(s7.controles?.backupOffsite),
        planoContinuidade: Boolean(s7.controles?.planoContinuidade),
        testeAnual: Boolean(s7.controles?.testeAnual),
      },
    },
  };
}

export function emptyPsiData(): PsiData {
  return normalizePsiData({});
}

export const PSI_SECTION_LABELS: ReadonlyArray<{
  key: keyof PsiData & `s${number}`;
  label: string;
  short: string;
  icon: string;
}> = [
  { key: "s1", label: "Governança e Responsabilidades",     short: "Governança",   icon: "🏛️" },
  { key: "s2", label: "Gestão de Ativos",                   short: "Ativos",        icon: "📦" },
  { key: "s3", label: "Controle de Acesso",                  short: "Acesso",        icon: "🔐" },
  { key: "s4", label: "Criptografia e Proteção de Dados",    short: "Criptografia",  icon: "🔒" },
  { key: "s5", label: "Segurança Física e Ambiental",        short: "Físico",        icon: "🏢" },
  { key: "s6", label: "Gestão de Incidentes",                short: "Incidentes",    icon: "🚨" },
  { key: "s7", label: "Continuidade e Recuperação",          short: "Continuidade",  icon: "♻️" },
];

/**
 * Calcula completude da PSI por seção (0..1) — usado pra mostrar
 * indicador visual no editor e exigir todas preenchidas antes de submeter.
 */
export function psiCompleteness(data: PsiData): {
  s1: number; s2: number; s3: number; s4: number;
  s5: number; s6: number; s7: number;
  overall: number;
} {
  const isFilled = (v: string) => v.trim().length >= 10;
  const countControles = (c: Record<string, boolean>) =>
    Object.values(c).filter(Boolean).length / Object.keys(c).length;

  // Cada seção: 50% pelo texto preenchido + 50% pelos controles marcados
  const sectionScore = (textFields: string[], controles: Record<string, boolean>) => {
    const textScore = textFields.filter(isFilled).length / textFields.length;
    const ctrlScore = countControles(controles);
    return (textScore + ctrlScore) / 2;
  };

  const s1 = sectionScore([data.s1.declaracao, data.s1.responsabilidades], data.s1.controles);
  const s2 = sectionScore([data.s2.inventarioAtivos, data.s2.classificacaoInformacao], data.s2.controles);
  const s3 = sectionScore([data.s3.politicaAcesso, data.s3.autenticacao, data.s3.revisaoAcessos], data.s3.controles);
  const s4 = sectionScore([data.s4.criptografiaEmTransito, data.s4.criptografiaEmRepouso, data.s4.gestaoChaves], data.s4.controles);
  const s5 = sectionScore([data.s5.perimetro, data.s5.energiaAmbiente, data.s5.descarteFisico], data.s5.controles);
  const s6 = sectionScore([data.s6.deteccaoMonitoramento, data.s6.respostaIncidente, data.s6.comunicacao], data.s6.controles);
  const s7 = sectionScore([data.s7.backupEstrategia, data.s7.rtoRpo, data.s7.testesRecuperacao], data.s7.controles);

  return {
    s1, s2, s3, s4, s5, s6, s7,
    overall: (s1 + s2 + s3 + s4 + s5 + s6 + s7) / 7,
  };
}

// ============================================================
// DTO (saída pras APIs)
// ============================================================

export interface PsiDTO {
  id: string;
  companyId: string;
  title: string;
  status: PsiStatus;
  data: PsiData;
  rejectionNote: string | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
  approvedAt: string | null;
  publishedContent: PsiData | null;
  publishedAt: string | null;
  publishedVersionNum: number | null;
  publicSlug: string | null;
  /** URL pública /psi-publico/<companySlug>/<psiSlug> — null se não aprovada
   *  ou empresa não tem slug. */
  publicUrl: string | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  /** Completude geral 0..1 — usado em badges visuais. */
  completeness: number;
}

interface PsiRow {
  id: string;
  companyId: string;
  title: string;
  status: string;
  data: any;
  rejectionNote: string | null;
  approvedBy?: { id: string; name: string | null; email: string } | null;
  approvedAt: Date | null;
  publishedContent: any;
  publishedAt: Date | null;
  publishedVersionNum: number | null;
  publicSlug: string | null;
  company?: { slug: string | null } | null;
  createdBy?: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { versions: number };
  versions?: { id: string }[];
}

export function psiToDTO(r: PsiRow): PsiDTO {
  const data = normalizePsiData(r.data);
  const versionCount = r._count?.versions ?? r.versions?.length ?? 0;
  // URL pública só faz sentido se a PSI foi aprovada E a empresa tem slug
  const publicUrl =
    r.status === "APROVADO" && r.publicSlug && r.company?.slug
      ? `/psi-publico/${r.company.slug}/${r.publicSlug}`
      : null;
  return {
    id: r.id,
    companyId: r.companyId,
    title: r.title,
    status: r.status as PsiStatus,
    data,
    rejectionNote: r.rejectionNote,
    approvedBy: r.approvedBy ?? null,
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    publishedContent:
      r.publishedContent != null ? normalizePsiData(r.publishedContent) : null,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    publishedVersionNum: r.publishedVersionNum,
    publicSlug: r.publicSlug,
    publicUrl,
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    versionCount,
    completeness: psiCompleteness(data).overall,
  };
}

export const PSI_FULL_INCLUDE = {
  approvedBy: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  company: { select: { slug: true } },
  _count: { select: { versions: true } },
} as const;

// ============================================================
// Auth check (DPO + Contribuidor)
// ============================================================

export type PsiAuthUser = {
  id: string;
  companyId: string;
  role: string;
  isDPO: boolean;
};

export async function loadPsiAuth(): Promise<
  { error: NextResponse } | { user: PsiAuthUser }
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
        { error: "Sem permissão pra acessar PSIs" },
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
// Permissões
// ============================================================

export function canEditPsi(
  user: PsiAuthUser,
  psi: { createdById: string; status: string }
): boolean {
  if (psi.status === "ARQUIVADO") return false;
  if (user.isDPO) return true;
  return psi.createdById === user.id && psi.status === "RASCUNHO";
}

export function canSubmitPsi(
  user: PsiAuthUser,
  psi: { createdById: string; status: string }
): boolean {
  if (psi.status !== "RASCUNHO") return false;
  return psi.createdById === user.id;
}

export function canApprovePsi(
  user: PsiAuthUser,
  psi: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return psi.status !== "ARQUIVADO";
}

export function canRejectPsi(
  user: PsiAuthUser,
  psi: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return psi.status === "EM_REVISAO";
}

export function canDeletePsi(
  user: PsiAuthUser,
  psi: { createdById: string; status: string }
): boolean {
  if (user.isDPO) return true;
  return psi.createdById === user.id && psi.status === "RASCUNHO";
}

export function canArchivePsi(
  user: PsiAuthUser,
  psi: { status: string }
): boolean {
  if (!user.isDPO) return false;
  return psi.status === "APROVADO";
}

// ============================================================
// Filtro de listagem (DPO vê tudo / Contribuidor só próprias)
// ============================================================

export function psiAccessFilter(
  user: PsiAuthUser
): { companyId: string; createdById?: string } {
  if (user.isDPO) return { companyId: user.companyId };
  return { companyId: user.companyId, createdById: user.id };
}

// ============================================================
// Stats agregadas
// ============================================================

export interface PsiStats {
  total: number;
  byStatus: Record<PsiStatus, number>;
  awaitingReview: number; // EM_REVISAO (fila do DPO)
  myDrafts: number;       // RASCUNHO criados pelo usuário
  approved: number;       // APROVADO (em vigor)
}

export function computePsiStats(
  psis: ReadonlyArray<{ status: string; createdById: string }>,
  userId: string
): PsiStats {
  const stats: PsiStats = {
    total: psis.length,
    byStatus: { RASCUNHO: 0, EM_REVISAO: 0, APROVADO: 0, ARQUIVADO: 0 },
    awaitingReview: 0,
    myDrafts: 0,
    approved: 0,
  };
  for (const p of psis) {
    if (p.status in stats.byStatus) (stats.byStatus as any)[p.status] += 1;
    if (p.status === "EM_REVISAO") stats.awaitingReview += 1;
    if (p.status === "RASCUNHO" && p.createdById === userId) stats.myDrafts += 1;
    if (p.status === "APROVADO") stats.approved += 1;
  }
  return stats;
}

// ============================================================
// Slug helper pra URL pública
// ============================================================

export function psiSlugFromTitle(title: string): string {
  return (title || "psi")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "psi";
}

/**
 * Gera slug único pra PSI nova. Tenta o slug "puro" primeiro; se já
 * existir, sufixa com `-2`, `-3`, etc.
 */
export async function generateUniquePsiSlug(title: string): Promise<string> {
  const base = psiSlugFromTitle(title);
  let candidate = base;
  let n = 2;
  while (await prisma.psi.findUnique({ where: { publicSlug: candidate } })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
