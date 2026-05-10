/**
 * Heurística de classificação de URLs por categoria (Etapa "auto-discover"
 * 2026-05-11).
 *
 * Usado pelo `POST /api/inventario/discover-urls` pra agrupar URLs
 * candidatas vindas do Firecrawl `/v1/map` em categorias úteis pro
 * preenchimento do Inventário (carta de serviços, ouvidoria, SIC,
 * LGPD, atos normativos, transparência, RH, licitação).
 *
 * Match é simples: substring case-insensitive no PATH da URL (não no
 * host). Várias palavras-chave por categoria pra cobrir variações
 * regionais ("conta-pra-gente", "fala-conosco", "fale-conosco" — todos
 * ouvidoria).
 *
 * Pode crescer: adicionar palavras-chave conforme aparecem casos reais.
 */

export type UrlCategoryKey =
  | "carta_servicos"
  | "ouvidoria"
  | "sic"
  | "lgpd"
  | "atos_normativos"
  | "edital"
  | "transparencia"
  | "rh"
  | "licitacao";

interface CategorySpec {
  key: UrlCategoryKey;
  /** Label humano em PT-BR. */
  label: string;
  /** Lista de fragmentos a procurar no path da URL (substring lower-case). */
  keywords: string[];
}

export const URL_CATEGORIES: CategorySpec[] = [
  {
    key: "carta_servicos",
    label: "Carta de Serviços",
    keywords: [
      "carta-de-servicos",
      "carta-servicos",
      "cartadeservicos",
      "servicos-ao-cidadao",
      "servicos/cidadao",
    ],
  },
  {
    key: "ouvidoria",
    label: "Ouvidoria",
    keywords: [
      "ouvidoria",
      "manifestacoes",
      "manifestacao",
      "fala-conosco",
      "fale-conosco",
      "conta-pra-gente",
      "denuncias",
      "denuncia",
      "reclame",
    ],
  },
  {
    key: "sic",
    label: "SIC / e-SIC (LAI)",
    keywords: [
      "acesso-a-informacao",
      "acessoainformacao",
      "e-sic",
      "esic",
      "/sic/",
      "sic.",
      "lai",
      "informacao-cidadao",
    ],
  },
  {
    key: "lgpd",
    label: "LGPD / Privacidade",
    keywords: [
      "lgpd",
      "protecao-de-dados",
      "protecaodedados",
      "politica-de-privacidade",
      "privacidade",
      "encarregado",
      "dpo",
      "tratamento-de-dados",
    ],
  },
  {
    key: "atos_normativos",
    label: "Atos Normativos / Legislação",
    keywords: [
      "ato-normativo",
      "atos-normativos",
      "atosnormativos",
      "resolucao",
      "resolucoes",
      "decreto",
      "portaria",
      "instrucao-normativa",
      "instrucaonormativa",
      "regimento",
      "regulamento",
      "legislacao",
      "normas",
      "/biblioteca/",
    ],
  },
  {
    key: "edital",
    label: "Editais / Concursos / Seleções",
    keywords: [
      "edital",
      "editais",
      "concurso",
      "concursos",
      "selecao",
      "estagio",
      "processo-seletivo",
      "/vagas/",
    ],
  },
  {
    key: "transparencia",
    label: "Transparência (Art. 7 LAI)",
    keywords: [
      "transparencia",
      "portal-da-transparencia",
      "dados-abertos",
      "/transp/",
    ],
  },
  {
    key: "rh",
    label: "RH / Pessoas",
    keywords: [
      "recursos-humanos",
      "recursoshumanos",
      "/rh/",
      "/pessoas/",
      "gestao-de-pessoas",
      "gestaodepessoas",
      "servidor",
      "/servidores/",
      "carreira",
    ],
  },
  {
    key: "licitacao",
    label: "Licitações / Contratos",
    keywords: [
      "licitacao",
      "licitacoes",
      "/contratos/",
      "/contratacao/",
      "compras-publicas",
      "comprasnet",
      "/pncp/",
      "pregao",
      "concorrencia",
    ],
  },
];

/**
 * Classifica uma URL nas categorias detectadas. Pode retornar várias
 * (ex: `/lgpd/portal/ouvidoria/` bate em ambos lgpd e ouvidoria).
 * Vazio = não casou com nenhuma palavra-chave.
 */
export function classifyUrl(url: string): UrlCategoryKey[] {
  let path: string;
  try {
    const u = new URL(url);
    path = (u.pathname + u.search).toLowerCase();
  } catch {
    path = url.toLowerCase();
  }
  const hits: UrlCategoryKey[] = [];
  for (const cat of URL_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (path.includes(kw)) {
        hits.push(cat.key);
        break;
      }
    }
  }
  return hits;
}

/**
 * Agrupa uma lista de URLs por categoria. URLs que caem em múltiplas
 * categorias aparecem em todas as listas pertinentes (duplicação
 * intencional — UX permite o user marcar a categoria certa).
 *
 * URLs sem nenhuma categoria detectada vão pro grupo `_other`.
 */
export function groupUrlsByCategory(
  urls: string[],
): Record<UrlCategoryKey | "_other", string[]> {
  const out: Record<string, string[]> = { _other: [] };
  for (const cat of URL_CATEGORIES) out[cat.key] = [];
  for (const url of urls) {
    const cats = classifyUrl(url);
    if (cats.length === 0) {
      out._other.push(url);
    } else {
      for (const c of cats) out[c].push(url);
    }
  }
  return out as Record<UrlCategoryKey | "_other", string[]>;
}

/**
 * Lookup do label humano por chave.
 */
export const URL_CATEGORY_LABEL: Record<UrlCategoryKey, string> =
  URL_CATEGORIES.reduce(
    (acc, c) => ({ ...acc, [c.key]: c.label }),
    {} as Record<UrlCategoryKey, string>,
  );
