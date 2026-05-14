/**
 * Engine que monta o markdown de um Aviso de Privacidade por Serviço
 * a partir do DataInventory + Company + opções escolhidas pelo DPO.
 *
 * Princípios:
 *  - Linguagem acessível ao cidadão (cf. Art. 9º LGPD + cartilha ANPD)
 *  - Só renderiza as seções marcadas em `includedSections`
 *  - Seções obrigatórias (`required: true` em AVISO_SECTIONS) sempre saem
 *  - Quando o Inventário não tem o dado pra preencher uma seção opcional,
 *    a seção sai com placeholder "(a preencher pelo DPO)" — UI sinaliza
 *  - "Observações adicionais" (texto livre do DPO) vira a última seção
 *  - Cabeçalho e rodapé fixos, gerados aqui (não vêm do Inventário)
 */

import {
  AVISO_SECTIONS,
  type AvisoSectionId,
  type IncludedSections,
  normalizeIncludedSections,
} from "./aviso-privacidade-sections";

// ============================================================
// Tipos de entrada (mínimo necessário — caller passa o que tem)
// ============================================================

export interface BuilderCompany {
  companyName: string;
  cnpj: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  dpoPhone: string | null;
}

/**
 * DataInventory + formAnswers tipado o suficiente pra extração.
 * Aceita os campos String legados como fallback.
 */
export interface BuilderInventory {
  serviceName: string | null;
  /** Finalidade (text-long do Inventário). */
  purpose: string | null;
  /** Base legal Art. 7º. */
  legalBasis: string | null;
  /** Base legal sensíveis Art. 11. */
  legalBasisSensitive: string | null;
  /** Previsão legal (lei específica que obriga). */
  previsaoLegal: string | null;
  /** Categorias de dados pessoais (multi). */
  personalData: string | null;
  /** Compartilhamento — texto livre. */
  sharing: string | null;
  /** Retenção — texto livre. */
  retention: string | null;
  /** Medidas de segurança — texto livre. */
  security: string | null;
  /** Quem são os titulares (público-alvo). */
  dataSubjects: string | null;
  /** Local de armazenamento. */
  storage: string | null;
  /** formAnswers (Json) — fonte de verdade quando preenchido. */
  formAnswers: any;
}

export interface BuilderInput {
  company: BuilderCompany;
  inventory: BuilderInventory;
  includedSections: IncludedSections;
  additionalNotes: string | null;
}

// ============================================================
// Helpers
// ============================================================

function escapeMd(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\|/g, "\\|");
}

/**
 * Lê um valor de `formAnswers.secN.fieldId`. Aceita string ou string[].
 * Retorna null se vazio/ausente.
 */
function fa(
  formAnswers: any,
  section: string,
  fieldId: string,
): string | string[] | null {
  const sec = formAnswers?.[section];
  if (!sec || typeof sec !== "object") return null;
  const v = sec[fieldId];
  if (v == null) return null;
  if (Array.isArray(v)) return v.length > 0 ? v : null;
  const s = String(v).trim();
  return s ? s : null;
}

/** Renderiza um valor (string | string[]) como bullet list ou parágrafo. */
function renderAsList(v: string | string[] | null): string {
  if (!v) return "";
  if (Array.isArray(v)) {
    return v.map((item) => `- ${item}`).join("\n");
  }
  return v;
}

/** Slug de texto pra URL pública. */
export function slugifyServiceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ============================================================
// Renderers por seção
// ============================================================

function renderControlador(input: BuilderInput): string {
  const { company } = input;
  const cnpjStr = company.cnpj ? ` (CNPJ ${company.cnpj})` : "";
  const dpoLine: string[] = [];
  if (company.dpoName) dpoLine.push(company.dpoName);
  if (company.dpoEmail) dpoLine.push(company.dpoEmail);
  if (company.dpoPhone) dpoLine.push(company.dpoPhone);
  const dpoBlock =
    dpoLine.length > 0
      ? `**Encarregado pelo Tratamento de Dados Pessoais (DPO):**\n${dpoLine.join(" · ")}`
      : "**Encarregado pelo Tratamento de Dados Pessoais (DPO):** (a preencher no cadastro da organização)";

  return [
    `O **${company.companyName}**${cnpjStr} é o controlador dos dados pessoais tratados neste serviço, nos termos da Lei nº 13.709/2018 (LGPD).`,
    "",
    dpoBlock,
  ].join("\n");
}

function renderFinalidade(input: BuilderInput): string {
  const fromFa = fa(input.inventory.formAnswers, "sec2", "process_purpose");
  const text =
    (typeof fromFa === "string" ? fromFa : null) ?? input.inventory.purpose;
  if (!text || text === "(a preencher)") {
    return `_(Pendente: o DPO ainda não detalhou a finalidade deste serviço no Inventário.)_`;
  }
  return `Os dados que você fornece neste serviço são usados para:\n\n${text}`;
}

function renderBaseLegal(input: BuilderInput): string {
  const inv = input.inventory;
  const lines: string[] = [];
  if (inv.legalBasis && inv.legalBasis !== "(a preencher)") {
    lines.push(`- **Art. 7º da LGPD** — ${escapeMd(inv.legalBasis)}`);
  }
  if (inv.legalBasisSensitive) {
    lines.push(
      `- **Art. 11 da LGPD (dados sensíveis)** — ${escapeMd(inv.legalBasisSensitive)}`,
    );
  }
  if (inv.previsaoLegal) {
    lines.push(`- **Previsão legal específica:** ${escapeMd(inv.previsaoLegal)}`);
  }
  if (lines.length === 0) {
    return `_(Pendente: bases legais ainda não foram preenchidas pelo jurídico/DPO.)_`;
  }
  return ["O tratamento dos seus dados neste serviço se ampara em:", "", ...lines].join("\n");
}

function renderDadosColetados(input: BuilderInput): string {
  // Tenta o JSON estruturado primeiro
  const categorias = fa(input.inventory.formAnswers, "sec5", "data_categories");
  const tiposDados = fa(input.inventory.formAnswers, "sec5", "personal_data_types");

  const blocks: string[] = ["Ao usar este serviço, você pode fornecer:", ""];

  if (Array.isArray(categorias) && categorias.length > 0) {
    blocks.push(...categorias.map((c) => `- ${c}`));
  } else if (input.inventory.personalData && input.inventory.personalData !== "(a preencher)") {
    blocks.push(input.inventory.personalData);
  } else if (Array.isArray(tiposDados) && tiposDados.length > 0) {
    blocks.push(...tiposDados.map((c) => `- ${c}`));
  } else {
    return `_(Pendente: lista de dados pessoais ainda não foi detalhada no Inventário.)_`;
  }

  return blocks.join("\n");
}

function renderCompartilhamento(input: BuilderInput): string {
  const inv = input.inventory;
  const targets = fa(inv.formAnswers, "sec6", "share_targets");
  const withWhom = fa(inv.formAnswers, "sec6", "share_with_whom");

  const naoCompartilha =
    Array.isArray(targets) &&
    targets.length === 1 &&
    targets[0] === "Não são compartilhados";

  if (naoCompartilha) {
    return "Os dados coletados neste serviço **não são compartilhados** com terceiros nem com outros setores externos à equipe responsável pela prestação do serviço.";
  }

  const parts: string[] = [];
  if (Array.isArray(targets) && targets.length > 0) {
    parts.push("Seus dados podem ser compartilhados com:");
    parts.push("");
    parts.push(...targets.map((t) => `- ${t}`));
  } else if (inv.sharing) {
    parts.push("Seus dados podem ser compartilhados com:");
    parts.push("");
    parts.push(inv.sharing);
  }

  if (typeof withWhom === "string" && withWhom) {
    if (parts.length > 0) parts.push("");
    parts.push(`**Em específico:** ${escapeMd(withWhom)}.`);
  }

  if (parts.length === 0) {
    return `_(Pendente: compartilhamento ainda não foi detalhado no Inventário.)_`;
  }
  return parts.join("\n");
}

function renderRetencao(input: BuilderInput): string {
  const fromFa = fa(input.inventory.formAnswers, "sec7", "retention_period");
  const text =
    (typeof fromFa === "string" ? fromFa : null) ?? input.inventory.retention;
  if (!text || text === "(a preencher)") {
    return `_(Pendente: prazo de retenção ainda não foi detalhado no Inventário.)_`;
  }
  return `Os dados ficam armazenados pelo prazo necessário ao cumprimento da finalidade, respeitando os prazos legais de retenção aplicáveis:\n\n${text}`;
}

function renderDireitosTitular(input: BuilderInput): string {
  const dpoEmail = input.company.dpoEmail;
  const exerciseLine = dpoEmail
    ? `Para exercer qualquer um desses direitos, entre em contato com o nosso Encarregado: **${dpoEmail}**.`
    : `Para exercer qualquer um desses direitos, entre em contato com o nosso Encarregado pelo canal indicado na seção "Quem é o controlador".`;

  return [
    "A LGPD (Art. 18) garante a você o direito de, a qualquer momento, solicitar:",
    "",
    "- Confirmação de que seus dados estão sendo tratados;",
    "- Acesso aos seus dados;",
    "- Correção de dados incompletos, incorretos ou desatualizados;",
    "- Anonimização, bloqueio ou eliminação dos dados desnecessários ou tratados em desconformidade com a Lei;",
    "- Portabilidade dos dados a outro fornecedor de serviço ou produto;",
    "- Eliminação dos dados pessoais tratados com base no seu consentimento;",
    "- Informação sobre as entidades públicas e privadas com as quais a organização compartilha seus dados;",
    "- Informação sobre a possibilidade de não fornecer consentimento e as consequências da negativa;",
    "- Revogação do consentimento.",
    "",
    exerciseLine,
  ].join("\n");
}

function renderSeguranca(input: BuilderInput): string {
  const inv = input.inventory;
  const fromFa = fa(inv.formAnswers, "sec7", "security_measures");
  const text =
    Array.isArray(fromFa)
      ? fromFa.map((m) => `- ${m}`).join("\n")
      : (typeof fromFa === "string" ? fromFa : null) ?? inv.security;

  if (!text || text === "(a preencher)") {
    return [
      "Adotamos medidas técnicas e administrativas pra proteger seus dados contra acesso não autorizado, perda, alteração ou destruição.",
      "",
      "_(Pendente: medidas específicas ainda não foram detalhadas no Inventário.)_",
    ].join("\n");
  }
  return [
    "Adotamos medidas técnicas e administrativas pra proteger seus dados contra acesso não autorizado, perda, alteração ou destruição, incluindo:",
    "",
    text,
  ].join("\n");
}

function renderTransferenciaInternacional(_input: BuilderInput): string {
  // Seção opcional — quando o DPO liga, expomos um texto-base que ele
  // pode editar via "Observações adicionais" se quiser detalhar.
  return [
    "Em algumas situações, seus dados podem ser transferidos pra outros países (por exemplo, quando armazenados em provedores de nuvem com servidores no exterior).",
    "",
    "Quando isso ocorre, exigimos do destinatário garantias equivalentes às previstas na LGPD, conforme Art. 33 da Lei (transferência internacional autorizada).",
  ].join("\n");
}

function renderCookies(_input: BuilderInput): string {
  return [
    "Este serviço pode usar cookies e tecnologias similares pra funcionar corretamente (manter você logado, lembrar suas preferências) e melhorar a navegação.",
    "",
    "Você pode gerenciar o uso de cookies pelas configurações do seu navegador. Para detalhes, consulte a Política de Cookies da organização.",
  ].join("\n");
}

// ============================================================
// Composição do documento
// ============================================================

const RENDERERS: Record<AvisoSectionId, (input: BuilderInput) => string> = {
  controlador: renderControlador,
  finalidade: renderFinalidade,
  base_legal: renderBaseLegal,
  dados_coletados: renderDadosColetados,
  compartilhamento: renderCompartilhamento,
  retencao: renderRetencao,
  direitos_titular: renderDireitosTitular,
  seguranca: renderSeguranca,
  transferencia_internacional: renderTransferenciaInternacional,
  cookies: renderCookies,
};

/**
 * Monta o markdown completo do Aviso. Caller usa o resultado pra salvar
 * em `ServicePrivacyNotice.currentContent`.
 */
export function buildAvisoPrivacidadeMarkdown(input: BuilderInput): string {
  const normalizedSections = normalizeIncludedSections(input.includedSections);
  const serviceName =
    input.inventory.serviceName ?? "(serviço sem nome no Inventário)";

  const header = [
    `# Aviso de Privacidade — ${serviceName}`,
    "",
    `> Este Aviso de Privacidade tem por finalidade esclarecer ao cidadão, em linguagem acessível, como o **${input.company.companyName}** trata os dados pessoais coletados no âmbito do serviço **${serviceName}**, em cumprimento ao Art. 9º da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).`,
    "",
  ];

  const body: string[] = [];
  let index = 1;
  for (const section of AVISO_SECTIONS) {
    const state = normalizedSections[section.id];
    if (!state?.included && !section.required) continue;
    const renderer = RENDERERS[section.id];
    const content = renderer({ ...input, includedSections: normalizedSections });
    body.push(`## ${index}. ${section.title}`);
    body.push("");
    body.push(content);
    body.push("");
    index++;
  }

  // Observações adicionais — sempre por último se preenchidas
  const notes = input.additionalNotes?.trim();
  if (notes) {
    body.push(`## ${index}. Observações adicionais`);
    body.push("");
    body.push(notes);
    body.push("");
  }

  const footer = [
    "---",
    "",
    `_Documento gerado a partir do Inventário de Dados Pessoais do(a) ${input.company.companyName}, mantido conforme exigências da Lei nº 13.709/2018 (LGPD)._`,
  ];

  return [...header, ...body, ...footer].join("\n");
}

/**
 * Computa o objeto pronto pra salvar no banco. Útil tanto pra create
 * (quando precisamos popular `currentContent` + `lastSyncedFromInventoryAt`)
 * quanto pra sync (regerar `currentContent` mantendo `additionalNotes`).
 */
export function buildAvisoForCreate(input: BuilderInput): {
  currentContent: string;
  includedSections: IncludedSections;
  lastSyncedFromInventoryAt: Date;
} {
  const normalizedSections = normalizeIncludedSections(input.includedSections);
  const currentContent = buildAvisoPrivacidadeMarkdown({
    ...input,
    includedSections: normalizedSections,
  });
  return {
    currentContent,
    includedSections: normalizedSections,
    lastSyncedFromInventoryAt: new Date(),
  };
}
