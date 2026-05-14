/**
 * Engine que monta o markdown final de um Termo de Consentimento.
 *
 * Pipeline:
 *   1. Caller escolhe um templateType (`GERAL`, `SENSIVEIS`, etc.)
 *   2. Passa Company + opcional DataInventory(s) vinculado(s)
 *   3. Engine substitui placeholders {{empresa}}, {{servico}}, ...
 *   4. Retorna markdown pronto pra salvar em `currentContent`
 *
 * Decisões:
 *   - Quando placeholder não tem origem (ex: termo sem processo vinculado),
 *     usa texto neutro ("o serviço da {{empresa}}") em vez de deixar
 *     o {{...}} cru no markdown — confunde o cidadão.
 *   - DPO sempre pode editar o `currentContent` depois — engine só semeia.
 *   - Slug é derivado do título via slugifyTitle; colisão por org é
 *     tratada no caller (incrementa "-2", "-3").
 */

import {
  CONSENT_TEMPLATE_BY_ID,
  type ConsentTemplateType,
} from "./consent-templates";

export interface BuilderCompany {
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  dpoPhone: string | null;
}

export interface BuilderInventory {
  serviceName: string | null;
  purpose: string | null;
  personalData: string | null;
  retention: string | null;
  sharing: string | null;
}

export interface BuilderInput {
  templateType: ConsentTemplateType;
  company: BuilderCompany;
  /** Inventários vinculados — usa o 1º pra preencher placeholders.
   *  Quando vazio, placeholders ficam genéricos. */
  inventories: BuilderInventory[];
}

function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return "(CNPJ não informado)";
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function fallbackPurpose(): string {
  return "Tratar os dados pessoais coletados pra prestar o serviço da nossa organização ao titular. O DPO pode complementar essa seção com a finalidade específica do processo.";
}

function fallbackData(): string {
  return "Os dados pessoais necessários pra prestar o serviço serão coletados conforme cadastrado pela nossa equipe. O DPO pode complementar com a lista exata neste documento.";
}

function fallbackRetention(): string {
  return "Pelo prazo necessário ao cumprimento da finalidade, respeitando os prazos legais de retenção aplicáveis à administração pública.";
}

function fallbackSharing(): string {
  return "Os dados não serão compartilhados com terceiros, ressalvadas as hipóteses previstas em lei.";
}

/** Slugify pra título do termo (URL pública). */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "termo";
}

/**
 * Substitui placeholders no markdown do template e devolve o
 * `currentContent` pra salvar.
 */
export function buildConsentMarkdown(input: BuilderInput): string {
  const tpl = CONSENT_TEMPLATE_BY_ID[input.templateType];
  if (!tpl) {
    throw new Error(`Template não encontrado: ${input.templateType}`);
  }

  const c = input.company;
  const inv = input.inventories[0] ?? null;
  const empresa = c.tradeName?.trim() || c.companyName;
  const cnpj = formatCnpj(c.cnpj);
  const dpoNome = c.dpoName?.trim() || "(a preencher)";
  const dpoEmail = c.dpoEmail?.trim() || "(a preencher)";
  const dpoTelefone = c.dpoPhone?.trim() ?? "";

  const servico = inv?.serviceName?.trim() || "o serviço";
  const finalidade =
    inv?.purpose && inv.purpose !== "(a preencher)"
      ? inv.purpose
      : fallbackPurpose();
  const dados =
    inv?.personalData && inv.personalData !== "(a preencher)"
      ? inv.personalData
      : fallbackData();
  const retencao =
    inv?.retention && inv.retention !== "(a preencher)"
      ? inv.retention
      : fallbackRetention();
  const compartilhamento =
    inv?.sharing && inv.sharing.trim() ? inv.sharing : fallbackSharing();

  return tpl.content
    .replace(/\{\{empresa\}\}/g, empresa)
    .replace(/\{\{cnpj\}\}/g, cnpj)
    .replace(/\{\{dpoNome\}\}/g, dpoNome)
    .replace(/\{\{dpoEmail\}\}/g, dpoEmail)
    .replace(/\{\{dpoTelefone\}\}/g, dpoTelefone)
    .replace(/\{\{servico\}\}/g, servico)
    .replace(/\{\{finalidade\}\}/g, finalidade)
    .replace(/\{\{dados_coletados\}\}/g, dados)
    .replace(/\{\{retencao\}\}/g, retencao)
    .replace(/\{\{compartilhamento\}\}/g, compartilhamento);
}

/**
 * Helper pro caller: monta título "humano" inicial pra o termo.
 * DPO pode renomear depois.
 */
export function suggestTitle(
  templateType: ConsentTemplateType,
  inventory: BuilderInventory | null,
): string {
  const tpl = CONSENT_TEMPLATE_BY_ID[templateType];
  const base = tpl?.label ?? "Termo de Consentimento";
  if (inventory?.serviceName) {
    return `${base} — ${inventory.serviceName}`;
  }
  return base;
}
