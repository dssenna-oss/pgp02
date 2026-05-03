/**
 * Glossário LGPD — termos técnicos com definição em linguagem simples.
 *
 * Usado pelo componente <TermoLGPD> pra envolver palavras no conteúdo do
 * form e mostrar tooltip com a definição. Também é referência pra textos
 * de help (FieldHelp).
 *
 * Convenção:
 * - chave = forma canônica em minúsculo (sem acento se possível)
 * - aliases = outras grafias que o componente deve reconhecer
 * - artigo = referência LGPD (Lei nº 13.709/2018)
 */

export interface TermoLGPD {
  termo: string;
  definicao: string;
  artigo?: string;
  aliases?: string[];
}

export const GLOSSARIO_LGPD: Record<string, TermoLGPD> = {
  "dado pessoal": {
    termo: "Dado pessoal",
    definicao:
      "Qualquer informação que identifique ou possa identificar uma pessoa natural — nome, CPF, e-mail, IP, foto, etc.",
    artigo: "Art. 5º, I",
    aliases: ["dados pessoais"],
  },

  "dado sensivel": {
    termo: "Dado pessoal sensível",
    definicao:
      "Dado sobre origem racial/étnica, religião, opinião política, sindicato, saúde, vida sexual, dado genético ou biométrico. Tem proteção reforçada na LGPD.",
    artigo: "Art. 5º, II",
    aliases: ["dado sensível", "dados sensíveis", "dados sensiveis"],
  },

  titular: {
    termo: "Titular",
    definicao:
      "A pessoa (de carne e osso) a quem os dados pessoais se referem — o cliente, o funcionário, o usuário do app.",
    artigo: "Art. 5º, V",
    aliases: ["titulares"],
  },

  controlador: {
    termo: "Controlador",
    definicao:
      "Pessoa ou empresa que decide sobre o tratamento dos dados pessoais — define para que serão usados e como.",
    artigo: "Art. 5º, VI",
    aliases: ["controladora"],
  },

  operador: {
    termo: "Operador",
    definicao:
      "Pessoa ou empresa que trata dados em nome do controlador (ex: um SaaS de folha de pagamento que processa dados dos funcionários da sua empresa).",
    artigo: "Art. 5º, VII",
    aliases: ["operadora", "operadores"],
  },

  encarregado: {
    termo: "Encarregado (DPO)",
    definicao:
      "Pessoa indicada pelo controlador como canal entre titulares, ANPD e a empresa. É o ponto de contato pra dúvidas sobre proteção de dados.",
    artigo: "Art. 5º, VIII e Art. 41",
    aliases: ["dpo"],
  },

  finalidade: {
    termo: "Finalidade",
    definicao:
      "Motivo legítimo, específico e informado pelo qual a empresa trata o dado pessoal. Não pode ser genérico tipo 'pra melhorar serviços'.",
    artigo: "Art. 6º, I",
    aliases: ["finalidades"],
  },
};

/**
 * Busca um termo no glossário, tolerando acento, caixa e plurais
 * registrados como alias. Retorna `null` se não encontrar.
 */
export function findTermo(query: string): TermoLGPD | null {
  if (!query) return null;
  const norm = query.trim().toLowerCase();
  // Match direto pela chave
  if (GLOSSARIO_LGPD[norm]) return GLOSSARIO_LGPD[norm];
  // Match por alias
  for (const t of Object.values(GLOSSARIO_LGPD)) {
    if (t.aliases?.some((a) => a.toLowerCase() === norm)) return t;
  }
  // Match removendo acento (controlador vs controladôr etc.)
  const stripped = norm.normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [key, t] of Object.entries(GLOSSARIO_LGPD)) {
    const keyStripped = key.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (keyStripped === stripped) return t;
    if (
      t.aliases?.some(
        (a) =>
          a.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") ===
          stripped
      )
    )
      return t;
  }
  return null;
}
