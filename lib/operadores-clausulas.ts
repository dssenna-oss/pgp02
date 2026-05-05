/**
 * Engine de cláusulas contratuais (Checkpoint 14 / G3).
 *
 * Junta:
 *   - Catálogo de templates seed (5 modelos em markdown)
 *   - Resolução de placeholders {{contratante.razaoSocial}} etc.
 *
 * Quem é "contratante" / "contratado" depende do tipo de cláusula:
 *   - ROBUSTA / SIMPLES / CC / MINUTA →
 *       contratante = Company, contratado = Operator
 *   - CLIENTE_OPERADOR →
 *       contratante = Operator (terceiro),
 *       contratado = Company (que atua como Operadora)
 *
 * Uso típico (server-side):
 *   const ctx = buildClauseContext(operator, company, type);
 *   const template = getClauseTemplate(type);
 *   const md = applyClauseTemplate(template.content, ctx);
 *   // md → DOCX via lib/operadores-clausulas-docx.ts
 *
 * Engine pura — testável sem DB.
 */

import type { RecommendedClause } from "@/lib/operadores-helpers";
import {
  CLAUSE_TEMPLATES,
  getClauseTemplate as _getClauseTemplate,
  type ClauseTemplate,
} from "@/lib/operadores-clausulas-templates";

export { CLAUSE_TEMPLATES };
export const getClauseTemplate = _getClauseTemplate;
export type { ClauseTemplate };

// ============================================================
// Tipos do contexto
// ============================================================

export interface ClausePartyData {
  razaoSocial: string;
  cnpj: string;
  endereco: string;
}

export interface ClauseDpoData {
  nome: string;
  email: string;
  telefone: string;
}

export interface ClauseContractData {
  /** Nome do contrato principal (ex: "Contrato 2026/045") */
  nome: string;
  /** Data de assinatura (formato pt-BR já preparado) */
  dataAssinatura: string;
  /** Data atual (geração do DOCX), formato pt-BR */
  dataAtual: string;
}

export interface ClauseContext {
  contratante: ClausePartyData;
  contratado: ClausePartyData;
  contrato: ClauseContractData;
  /** DPO da Company — geralmente o ponto de contato. */
  dpo: ClauseDpoData;
}

// ============================================================
// Builder de contexto
// ============================================================

/**
 * Constrói o ClauseContext a partir dos dados do Operator + Company,
 * já decidindo quem é contratante/contratado conforme o tipo de cláusula.
 */
export function buildClauseContext(
  operator: {
    name: string;
    tradeName?: string | null;
    cnpj?: string | null;
    country?: string | null;
    contractLabel?: string | null;
    contractSignedAt?: Date | string | null;
  },
  company: {
    companyName: string;
    cnpj?: string | null;
    address?: string | null;
    dpoName?: string | null;
    dpoEmail?: string | null;
    dpoPhone?: string | null;
  },
  clauseType: RecommendedClause
): ClauseContext {
  // Empty fallbacks pra placeholders
  const FB = "[A PREENCHER]";

  const operatorAsParty: ClausePartyData = {
    razaoSocial: operator.name || FB,
    cnpj: operator.cnpj || FB,
    endereco: operator.country
      ? `(sede em ${operator.country})`
      : FB,
  };

  const companyAsParty: ClausePartyData = {
    razaoSocial: company.companyName || FB,
    cnpj: company.cnpj || FB,
    endereco: company.address || FB,
  };

  // Quem é contratante/contratado
  const isClienteOperador = clauseType === "CLIENTE_OPERADOR";
  const contratante = isClienteOperador ? operatorAsParty : companyAsParty;
  const contratado = isClienteOperador ? companyAsParty : operatorAsParty;

  // Datas
  const today = new Date();
  const dataAtual = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dataAssinatura = operator.contractSignedAt
    ? new Date(operator.contractSignedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "[DATA DA ASSINATURA]";

  // Contrato
  const contractName =
    operator.contractLabel ||
    `Contrato celebrado entre ${companyAsParty.razaoSocial} e ${operator.name || FB}`;

  // DPO da Company (sempre o controlador da org no PGP)
  const dpo: ClauseDpoData = {
    nome: company.dpoName || FB,
    email: company.dpoEmail || FB,
    telefone: company.dpoPhone || FB,
  };

  return {
    contratante,
    contratado,
    contrato: {
      nome: contractName,
      dataAssinatura,
      dataAtual,
    },
    dpo,
  };
}

// ============================================================
// Aplicação de placeholders
// ============================================================

/**
 * Aplica os placeholders {{...}} num markdown de template.
 *
 * Suporta caminhos simples ("contratante.razaoSocial",
 * "contrato.dataAtual") e ignora silenciosamente placeholders
 * desconhecidos (deixa como `[?]`).
 */
export function applyClauseTemplate(
  template: string,
  ctx: ClauseContext
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const value = resolvePath(ctx, path);
    if (value == null || value === "") return "[?]";
    return String(value);
  });
}

function resolvePath(obj: any, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

// ============================================================
// Helper de alto nível
// ============================================================

export interface RenderClauseInput {
  operator: Parameters<typeof buildClauseContext>[0];
  company: Parameters<typeof buildClauseContext>[1];
  clauseType: RecommendedClause;
}

export interface RenderedClause {
  type: RecommendedClause;
  title: string;
  /** Markdown final com placeholders aplicados. */
  content: string;
  context: ClauseContext;
}

export function renderClauseTemplate(
  input: RenderClauseInput
): RenderedClause | null {
  const tpl = getClauseTemplate(input.clauseType);
  if (!tpl) return null;
  const ctx = buildClauseContext(
    input.operator,
    input.company,
    input.clauseType
  );
  return {
    type: tpl.type,
    title: tpl.defaultTitle,
    content: applyClauseTemplate(tpl.content, ctx),
    context: ctx,
  };
}
