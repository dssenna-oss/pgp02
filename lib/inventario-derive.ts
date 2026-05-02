/**
 * Deriva os 10 campos resumo (legacy) do `DataInventory` a partir das
 * respostas completas do wizard (`formAnswers`).
 *
 * Esses 10 campos foram a 1ª implementação simples do Inventário e
 * continuam alimentando o export Excel da listagem. O wizard agora é
 * a fonte de verdade — o resumo é gerado automaticamente quando o
 * user clica "Concluir".
 *
 * Cada derivação tem regra explícita; se o campo do form ficou vazio
 * cai num placeholder seguro (não rejeita o save).
 */

import type { FormAnswers } from "./inventario-form-schema";

const PLACEHOLDER = "Não informado";

/** Junta valores de array (ou string) num separador legível. */
function asLine(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "string") return v.trim();
  return "";
}

/** Pega múltiplos campos e junta. */
function joinFields(
  section: Record<string, any> | undefined,
  fieldIds: string[],
  separator = " | "
): string {
  if (!section) return "";
  return fieldIds
    .map((id) => asLine(section[id]))
    .filter((s) => s.length > 0)
    .join(separator);
}

export interface DerivedFields {
  serviceName: string;       // "Nome do Processo" (sec2.process_name)
  dataCategory: string;      // categoria sintetizada (sensível? geral?)
  personalData: string;      // tipos marcados em sec3
  legalBasis: string;        // a inferir — wizard não pergunta diretamente
  purpose: string;           // sec2.process_purpose
  dataSubjects: string;      // sec4.use_subjects
  retention: string;         // sec7.store_retention
  storage: string;           // sec7.store_format + sec7.store_location
  sharing: string;           // sec6.share_targets + share_with_whom
  security: string;          // resumo de segurança (sec6/sec7)
}

/**
 * Computa os 10 campos resumo. Funciona com formAnswers parcial — campos
 * não preenchidos viram placeholder.
 */
export function deriveLegacyFields(formAnswers: FormAnswers): DerivedFields {
  const sec2 = (formAnswers as any).sec2 ?? {};
  const sec3 = (formAnswers as any).sec3 ?? {};
  const sec4 = (formAnswers as any).sec4 ?? {};
  const sec5 = (formAnswers as any).sec5 ?? {};
  const sec6 = (formAnswers as any).sec6 ?? {};
  const sec7 = (formAnswers as any).sec7 ?? {};

  // serviceName ← sec2.process_name
  const serviceName = asLine(sec2.process_name) || PLACEHOLDER;

  // dataCategory ← se sensíveis = "Sim" → "Dados Sensíveis", senão "Dados Pessoais"
  const dataCategory =
    sec3.data_sensitive_yn === "Sim" ? "Dados Sensíveis" : "Dados Pessoais";

  // personalData ← agrega todos os data_* (exceto N/A) num resumo
  const dataGroupKeys = [
    "data_names",
    "data_personal",
    "data_filiation",
    "data_official_ids",
    "data_residential",
    "data_education",
    "data_professional",
    "data_financial",
    "data_legal",
    "data_children",
    "data_teens",
    "data_preferences",
    "data_mobile",
    "data_health",
    "data_sensitive_list",
  ];
  const personalDataItems: string[] = [];
  for (const key of dataGroupKeys) {
    const arr = sec3[key];
    if (Array.isArray(arr)) {
      const filtered = arr.filter((v) => v && v !== "N/A");
      personalDataItems.push(...filtered);
    }
  }
  const personalData =
    personalDataItems.length > 0 ? personalDataItems.join(", ") : PLACEHOLDER;

  // legalBasis ← inferir de sec5.collect_consent + sec4 — não temos pergunta
  // direta; deixar placeholder claro pra usuário editar depois.
  const legalBasis =
    sec5.collect_consent === "Sim"
      ? "I - consentimento (a confirmar pelo DPO)"
      : "A definir com o DPO";

  // purpose ← sec2.process_purpose
  const purpose = asLine(sec2.process_purpose) || PLACEHOLDER;

  // dataSubjects ← sec4.use_subjects
  const dataSubjects = asLine(sec4.use_subjects) || PLACEHOLDER;

  // retention ← sec7.store_retention (multi-choice)
  const retention = asLine(sec7.store_retention) || PLACEHOLDER;

  // storage ← formato + localização
  const storage =
    joinFields(sec7, ["store_format", "store_location"], " | ") || PLACEHOLDER;

  // sharing ← com quem + objetivo + meios + internacional
  const internationalNote =
    sec6.share_international === "Sim"
      ? `Inclui transferência internacional${sec6.share_international_countries ? ` (${asLine(sec6.share_international_countries)})` : ""}`
      : "";
  const sharingParts = [
    asLine(sec6.share_targets),
    asLine(sec6.share_with_whom),
    asLine(sec6.share_purpose),
    internationalNote,
  ].filter((s) => s.length > 0);
  const sharing = sharingParts.length > 0 ? sharingParts.join(" | ") : "";

  // security ← resumo de medidas de segurança (sec6.share_security + sec7.* relacionados)
  const securityParts: string[] = [];
  if (sec6.share_security === "Sim")
    securityParts.push("Medidas de segurança no compartilhamento");
  if (sec7.store_paper_secure)
    securityParts.push(`Papel: ${asLine(sec7.store_paper_secure)}`);
  if (sec7.store_mobile_protected === "Sim") {
    const m = asLine(sec7.store_mobile_measures);
    securityParts.push(`Mobile protegido${m ? `: ${m}` : ""}`);
  }
  if (sec7.store_local_backup)
    securityParts.push(`Backup: ${asLine(sec7.store_local_backup)}`);
  const security =
    securityParts.length > 0 ? securityParts.join(" | ") : PLACEHOLDER;

  return {
    serviceName,
    dataCategory,
    personalData,
    legalBasis,
    purpose,
    dataSubjects,
    retention,
    storage,
    sharing,
    security,
  };
}
