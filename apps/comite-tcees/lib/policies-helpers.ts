/**
 * Helpers das Políticas (Fase 6) — versão mono-instituição do app do Comitê.
 * Trazido do app principal (Checkpoint 12), sem company/auth: só tipos,
 * labels, classes de badge e helpers de slug.
 */

export const POLICY_TYPE = {
  POLITICA_PGP: "POLITICA_PGP",
  AVISO_PRIVACIDADE_EXTERNO: "AVISO_PRIVACIDADE_EXTERNO",
  POLITICA_PRIVACIDADE_INTERNO: "POLITICA_PRIVACIDADE_INTERNO",
  NORMA_PRIVACIDADE: "NORMA_PRIVACIDADE",
  TERMOS_USO: "TERMOS_USO",
  POLITICA_COOKIES: "POLITICA_COOKIES",
  POLITICA_TERCEIROS: "POLITICA_TERCEIROS",
  POLITICA_RETENCAO: "POLITICA_RETENCAO",
  POLITICA_TREINAMENTO: "POLITICA_TREINAMENTO",
  POLITICA_TRANSFERENCIA: "POLITICA_TRANSFERENCIA",
  POLITICA_AVALIACAO_TERCEIROS: "POLITICA_AVALIACAO_TERCEIROS",
  OUTRA: "OUTRA",
} as const;
export type PolicyType = (typeof POLICY_TYPE)[keyof typeof POLICY_TYPE];

export const POLICY_STATUS = {
  RASCUNHO: "RASCUNHO",
  PUBLICADA: "PUBLICADA",
  ARQUIVADA: "ARQUIVADA",
} as const;
export type PolicyStatus = (typeof POLICY_STATUS)[keyof typeof POLICY_STATUS];

export const VALID_POLICY_TYPES = new Set<string>(Object.values(POLICY_TYPE));

// ============================================================
// Labels (UI)
// ============================================================

export function policyTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "POLITICA_PGP":                 return "Política do Programa de Governança em Privacidade (PGP)";
    case "AVISO_PRIVACIDADE_EXTERNO":    return "Aviso de Privacidade (externo)";
    case "POLITICA_PRIVACIDADE_INTERNO": return "Política de Privacidade (interna)";
    case "NORMA_PRIVACIDADE":            return "Norma de Privacidade";
    case "TERMOS_USO":                   return "Termos de Uso";
    case "POLITICA_COOKIES":             return "Política de Cookies";
    case "POLITICA_TERCEIROS":           return "Política de Terceiros";
    case "POLITICA_RETENCAO":            return "Política de Retenção e Descarte";
    case "POLITICA_TREINAMENTO":         return "Política de Treinamento";
    case "POLITICA_TRANSFERENCIA":       return "Política de Transferência Internacional";
    case "POLITICA_AVALIACAO_TERCEIROS": return "Política de Avaliação de Terceiros";
    case "OUTRA":                        return "Outra";
    default:                             return "—";
  }
}

export function policyTypeShortLabel(t: string | null | undefined): string {
  switch (t) {
    case "POLITICA_PGP":                 return "Política do PGP";
    case "AVISO_PRIVACIDADE_EXTERNO":    return "Privacidade (externa)";
    case "POLITICA_PRIVACIDADE_INTERNO": return "Privacidade (interna)";
    case "NORMA_PRIVACIDADE":            return "Norma";
    case "TERMOS_USO":                   return "Termos";
    case "POLITICA_COOKIES":             return "Cookies";
    case "POLITICA_TERCEIROS":           return "Terceiros";
    case "POLITICA_RETENCAO":            return "Retenção";
    case "POLITICA_TREINAMENTO":         return "Treinamento";
    case "POLITICA_TRANSFERENCIA":       return "Transferência Int.";
    case "POLITICA_AVALIACAO_TERCEIROS": return "Aval. de Terceiros";
    case "OUTRA":                        return "Outra";
    default:                             return "—";
  }
}

export function policyStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case "RASCUNHO":  return "Rascunho";
    case "PUBLICADA": return "Publicada";
    case "ARQUIVADA": return "Arquivada";
    default:          return "—";
  }
}

// ============================================================
// Classes Tailwind (UI) — tema claro do app do Comitê
// ============================================================

export function policyStatusBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "PUBLICADA": return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "RASCUNHO":  return "bg-amber-100 text-amber-800 border-amber-300";
    case "ARQUIVADA": return "bg-gray-200 text-gray-700 border-gray-300";
    default:          return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function policyTypeBadgeClass(t: string | null | undefined): string {
  switch (t) {
    case "POLITICA_PGP":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "AVISO_PRIVACIDADE_EXTERNO":
    case "POLITICA_PRIVACIDADE_INTERNO":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "NORMA_PRIVACIDADE":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "TERMOS_USO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "POLITICA_COOKIES":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

// ============================================================
// Slug helpers
// ============================================================

/** Normaliza string em slug URL-safe (sem acentos, lowercase, hífens). */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Slug default por tipo de política. */
export function defaultSlugForType(t: string): string {
  switch (t) {
    case "AVISO_PRIVACIDADE_EXTERNO":    return "privacidade";
    case "POLITICA_PRIVACIDADE_INTERNO": return "privacidade-interna";
    case "NORMA_PRIVACIDADE":            return "norma-privacidade";
    case "TERMOS_USO":                   return "termos-de-uso";
    case "POLITICA_COOKIES":             return "cookies";
    case "POLITICA_TERCEIROS":           return "terceiros";
    case "POLITICA_RETENCAO":            return "retencao-descarte";
    case "POLITICA_TREINAMENTO":         return "treinamento";
    case "POLITICA_TRANSFERENCIA":       return "transferencia-internacional";
    case "POLITICA_AVALIACAO_TERCEIROS": return "avaliacao-terceiros";
    case "POLITICA_PGP":                 return "politica-pgp";
    default:                             return "outra";
  }
}
