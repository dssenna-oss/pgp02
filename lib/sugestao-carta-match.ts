/**
 * Match leve entre a `category` que o LLM atribui a um serviço sugerido
 * (Carta de Serviços) e o `setor` cadastrado nos Contribuidores da
 * organização — pra pré-selecionar o responsável no modal de atribuição
 * antes do DPO clicar em "Criar e atribuir".
 *
 * O LLM usa um vocabulário fechado (`SIC`, `Ouvidoria`, `RH`, `Atendimento`,
 * `Licitação`, `Patrimônio`, `Outros`) em `lib/sugestao-carta.ts`, mas o
 * `setor` do Contribuidor é texto livre digitado pelo DPO. A função abaixo
 * tolera variações comuns (acento, abreviação, sinônimos) — se nada bater,
 * retorna `null` e a UI mostra "Sem responsável".
 */

export interface ContributorLite {
  id: string;
  name: string | null;
  email: string;
  setor: string | null;
  isActive: boolean;
}

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Lista de palavras-chave (já normalizadas) que casam com cada categoria
 * que o LLM pode emitir. Match é substring — basta uma palavra do `setor`
 * do Contribuidor estar presente.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sic: ["sic", "acesso a informacao", "lai", "informacao publica", "transparencia"],
  ouvidoria: ["ouvidoria", "ouvidor"],
  rh: ["rh", "recursos humanos", "pessoas", "gestao de pessoas", "departamento pessoal"],
  atendimento: ["atendimento", "recepcao", "atendimento ao cidadao", "atendimento ao publico"],
  licitacao: ["licitacao", "compras", "pregao", "contratos", "suprimentos"],
  patrimonio: ["patrimonio", "almoxarifado"],
};

/**
 * Tenta achar o Contribuidor cujo `setor` melhor casa com a categoria
 * sugerida pelo LLM. Retorna `null` se:
 *  - category é null
 *  - não há Contribuidor com `setor` preenchido que case
 *  - só há matches em Contribuidores inativos
 *
 * O DPO sempre pode trocar manualmente no modal.
 */
export function suggestContributorForCategory(
  category: string | null | undefined,
  contributors: ContributorLite[],
): ContributorLite | null {
  if (!category) return null;
  const normCat = normalize(category);
  if (!normCat) return null;

  // Resolve grupo de keywords. Tenta match direto na chave; senão tenta
  // achar uma chave cujo nome esteja contido em `normCat` (defensivo —
  // o LLM pode mandar "RH e Pessoal" em vez de só "RH").
  let keywords = CATEGORY_KEYWORDS[normCat] ?? null;
  if (!keywords) {
    for (const key of Object.keys(CATEGORY_KEYWORDS)) {
      if (normCat.includes(key)) {
        keywords = CATEGORY_KEYWORDS[key];
        break;
      }
    }
  }
  if (!keywords) return null;

  // Match em Contribuidores ATIVOS primeiro (preferência); cai pra qualquer
  // se nenhum ativo bater. UI ainda mostra inativo desabilitado, mas
  // pré-seleção foca em ativos.
  const ativos = contributors.filter((c) => c.isActive);
  const pool = ativos.length > 0 ? ativos : contributors;

  for (const c of pool) {
    const normSetor = normalize(c.setor);
    if (!normSetor) continue;
    for (const kw of keywords) {
      if (normSetor.includes(kw)) {
        return c;
      }
    }
  }
  return null;
}
