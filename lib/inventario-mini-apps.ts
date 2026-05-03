/**
 * Mapa dos 13 mini-apps do PGP — usado por componentes de help pra mostrar
 * "esta resposta vai parar em [chips]" e pelo onboarding/conclusão do
 * wizard. Fonte de verdade da nomeação e ordem dos mini-apps.
 *
 * Ordem reflete o pipeline natural: o user preenche o Inventário (#2),
 * que alimenta os documentos derivados (#3 a #13).
 *
 * `route` é opcional — só os mini-apps já implementados têm rota.
 */

export type MiniAppId =
  | "rename-org"
  | "inventario"
  | "riscos"
  | "gap"
  | "diagnostico"
  | "plano-acao"
  | "politica-privacidade"
  | "termos-cookies"
  | "politica-seguranca"
  | "contratos"
  | "incidentes"
  | "ripd"
  | "modelo-pgp";

export interface MiniApp {
  id: MiniAppId;
  /** Nome curto pra usar em chips. */
  short: string;
  /** Nome completo pra header/explicação. */
  full: string;
  /** Tipo de output gerado. */
  output: "Excel" | "Word" | "UI";
  /** Emoji pra chip (rápido, sem importar lucide). */
  emoji: string;
  /** Posição no pipeline. */
  ordem: number;
  /** Rota se já implementado. */
  route?: string;
}

export const MINI_APPS: Record<MiniAppId, MiniApp> = {
  "rename-org": {
    id: "rename-org",
    short: "Organização",
    full: "Rename Empresa → Organização",
    output: "UI",
    emoji: "🏢",
    ordem: 1,
  },
  inventario: {
    id: "inventario",
    short: "Inventário",
    full: "Inventário de Dados Pessoais",
    output: "Excel",
    emoji: "📋",
    ordem: 2,
    route: "/dashboard/inventario",
  },
  riscos: {
    id: "riscos",
    short: "Análise de Riscos",
    full: "Análise de Riscos LGPD",
    output: "Excel",
    emoji: "⚠️",
    ordem: 3,
  },
  gap: {
    id: "gap",
    short: "GAP Analysis",
    full: "GAP Analysis de Conformidade",
    output: "Excel",
    emoji: "📊",
    ordem: 4,
  },
  diagnostico: {
    id: "diagnostico",
    short: "Diagnóstico",
    full: "Diagnóstico de Privacidade",
    output: "Word",
    emoji: "🩺",
    ordem: 5,
  },
  "plano-acao": {
    id: "plano-acao",
    short: "Plano de Ação",
    full: "Plano de Ação de Adequação",
    output: "Excel",
    emoji: "✅",
    ordem: 6,
  },
  "politica-privacidade": {
    id: "politica-privacidade",
    short: "Política de Privacidade",
    full: "Política de Privacidade Interna + Aviso Externo",
    output: "Word",
    emoji: "📄",
    ordem: 7,
  },
  "termos-cookies": {
    id: "termos-cookies",
    short: "Termos & Cookies",
    full: "Termos de Uso + Aviso de Cookies",
    output: "Word",
    emoji: "🍪",
    ordem: 8,
  },
  "politica-seguranca": {
    id: "politica-seguranca",
    short: "Política de Segurança",
    full: "Política de Segurança da Informação",
    output: "Word",
    emoji: "🔒",
    ordem: 9,
  },
  contratos: {
    id: "contratos",
    short: "Contratos",
    full: "Adequação de Contratos",
    output: "Word",
    emoji: "📝",
    ordem: 10,
  },
  incidentes: {
    id: "incidentes",
    short: "Plano de Incidentes",
    full: "Plano de Resposta a Incidentes",
    output: "Word",
    emoji: "🚨",
    ordem: 11,
  },
  ripd: {
    id: "ripd",
    short: "RIPD",
    full: "Relatório de Impacto à Proteção de Dados",
    output: "Word",
    emoji: "⚖️",
    ordem: 12,
  },
  "modelo-pgp": {
    id: "modelo-pgp",
    short: "Modelo PGP",
    full: "Modelo PGP — Programa de Governança em Privacidade",
    output: "Word",
    emoji: "🏛️",
    ordem: 13,
  },
};

/** Retorna mini-apps na ordem do pipeline. */
export function listMiniApps(): MiniApp[] {
  return Object.values(MINI_APPS).sort((a, b) => a.ordem - b.ordem);
}

/** Resolve uma lista de ids em objetos MiniApp, ignorando ids inválidos. */
export function resolveMiniApps(ids: string[] | undefined): MiniApp[] {
  if (!ids?.length) return [];
  return ids
    .map((id) => MINI_APPS[id as MiniAppId])
    .filter((m): m is MiniApp => !!m)
    .sort((a, b) => a.ordem - b.ordem);
}
