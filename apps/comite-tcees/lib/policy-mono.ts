/**
 * Ponte mono-instituição entre as Políticas e o resto do app do Comitê.
 *
 * - tceesPlaceholders(): monta o perfil fixo do TCEES (dados do Comitê +
 *   Encarregado) para resolver os {{placeholders}} dos templates.
 * - policyTypeForInstrumento(): mapeia o nome de um item da Central de
 *   Instrumentos para o tipo de política editável (ou null quando o
 *   instrumento é executado por outro editor — RIPD, Cláusulas, DSR...).
 */

import { prisma } from "@/lib/prisma";
import type { CompanyPlaceholders } from "@/lib/policies-templates";
import { POLICY_TYPE, type PolicyType } from "@/lib/policies-helpers";

/** Perfil do TCEES para preencher os placeholders dos templates. */
export async function tceesPlaceholders(): Promise<CompanyPlaceholders> {
  const [comite, encarregado, presidente] = await Promise.all([
    prisma.comite.findFirst(),
    prisma.membro.findFirst({
      where: { funcao: { contains: "Encarregado" } },
      orderBy: { ordem: "asc" },
      select: { nome: true, email: true },
    }),
    prisma.membro.findFirst({
      where: { funcao: { contains: "Presidente" } },
      orderBy: { ordem: "asc" },
      select: { nome: true },
    }),
  ]);

  return {
    companyName: comite?.instituicao || "Tribunal de Contas do Estado do Espírito Santo (TCE-ES)",
    tradeName: comite?.sigla || "TCE-ES",
    cnpj: comite?.cnpj ?? null,
    address: comite?.sede ?? null,
    city: "Vitória",
    state: "ES",
    email: comite?.canalEncarregado ?? null,
    phone: null,
    website: comite?.portal ?? null,
    dpoName: encarregado?.nome ?? null,
    dpoEmail: encarregado?.email ?? null,
    dpoPhone: null,
    legalRepresentative: presidente?.nome ?? null,
  };
}

/**
 * Tipo de política editável para um item da Central de Instrumentos.
 * Retorna null quando o instrumento não é um documento de texto editável
 * aqui (RIPD, Cláusulas, Gestão de Operadores, DSR, LIA — outros editores).
 */
export function policyTypeForInstrumento(nome: string): PolicyType | null {
  const n = nome.toLowerCase();
  if (n.includes("aviso de privacidade")) return POLICY_TYPE.AVISO_PRIVACIDADE_EXTERNO;
  if (n.includes("política de privacidade") || n.includes("politica de privacidade")) return POLICY_TYPE.POLITICA_PRIVACIDADE_INTERNO;
  if (n.includes("cookies")) return POLICY_TYPE.POLITICA_COOKIES;
  if (n.includes("termos de uso")) return POLICY_TYPE.TERMOS_USO;
  if (n.includes("política do pgp") || n.includes("politica do pgp")) return POLICY_TYPE.POLITICA_PGP;
  if (n.includes("política interna") || n.includes("politica interna")) return POLICY_TYPE.NORMA_PRIVACIDADE;
  if (n.includes("retenção") || n.includes("retencao") || n.includes("descarte")) return POLICY_TYPE.POLITICA_RETENCAO;
  if (n.includes("transferência") || n.includes("transferencia")) return POLICY_TYPE.POLITICA_TRANSFERENCIA;
  if (n.includes("treinamento") || n.includes("capacitaç") || n.includes("capacitac")) return POLICY_TYPE.POLITICA_TREINAMENTO;
  // PSI, Termo de Confidencialidade, Termo de Consentimento: documentos de
  // texto sem template dedicado → editor genérico (OUTRA).
  if (n.includes("segurança da informação") || n.includes("seguranca da informacao") || n.includes("psi")) return POLICY_TYPE.OUTRA;
  if (n.includes("confidencialidade")) return POLICY_TYPE.OUTRA;
  if (n.includes("consentimento")) return POLICY_TYPE.OUTRA;
  return null;
}
