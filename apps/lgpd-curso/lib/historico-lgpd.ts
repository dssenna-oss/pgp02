// Conteúdo do "Histórico da LGPD" — apresentado na área Slides das fases,
// antes da Fase Preliminar. A maioria dos participantes nunca leu a Lei
// 13.709/2018; este panorama dá o contexto (de onde veio a ideia de
// privacidade no mundo até virar lei no Brasil) em linguagem simples.

export type MarcoHistorico = {
  ano: string;
  titulo: string;
  local?: string; // país ou bloco (ex.: "União Europeia")
  descricao: string;
  destaque?: boolean; // marcos centrais da história (recebem realce visual)
};

// ───────── Evolução mundial da privacidade e proteção de dados ─────────
export const MARCOS_MUNDO: MarcoHistorico[] = [
  {
    ano: "1948",
    titulo: "Declaração Universal dos Direitos Humanos",
    local: "ONU",
    descricao:
      "Pela primeira vez, um documento global reconhece a privacidade como direito de todos: " +
      "ninguém pode sofrer interferências arbitrárias na sua vida privada (art. 12). É a semente de tudo.",
  },
  {
    ano: "1970",
    titulo: "Primeira lei de proteção de dados do mundo",
    local: "Hesse, Alemanha",
    descricao:
      "O estado alemão de Hesse cria a primeira lei só sobre dados pessoais. Surge porque os " +
      "computadores começam a juntar informações de cidadãos em larga escala — e isso assusta.",
  },
  {
    ano: "1980",
    titulo: "Diretrizes da OCDE",
    local: "OCDE",
    descricao:
      "Princípios que inspiram leis no mundo inteiro até hoje: coletar só o necessário, dizer pra quê, " +
      "manter seguro, deixar a pessoa corrigir seus dados. A base do que viria a ser a LGPD.",
  },
  {
    ano: "1981",
    titulo: "Convenção 108",
    local: "Conselho da Europa",
    descricao:
      "Primeiro tratado internacional com força de lei sobre proteção de dados. Vários países assinam e se comprometem a proteger informações pessoais.",
  },
  {
    ano: "1995",
    titulo: "Diretiva 95/46/CE",
    local: "União Europeia",
    descricao:
      "A Europa cria regras comuns pra todos os seus países. Vira referência mundial e abre caminho pro GDPR, 20 anos depois.",
  },
  {
    ano: "2018",
    titulo: "GDPR entra em vigor",
    local: "União Europeia",
    descricao:
      "O Regulamento Geral de Proteção de Dados (aprovado em 2016) passa a valer em maio de 2018. " +
      "É a lei mais influente do tema no planeta e o principal espelho da nossa LGPD — inclusive multas pesadas e direitos fortes pro cidadão.",
    destaque: true,
  },
  {
    ano: "2018+",
    titulo: "O mundo todo se mexe",
    local: "EUA, América Latina, Ásia…",
    descricao:
      "Califórnia (CCPA), Argentina, Uruguai, Chile, Japão, Coreia e dezenas de outros aprovam ou atualizam suas leis. Proteger dados pessoais virou padrão internacional — não mais exceção.",
  },
];

// ───────── Linha do tempo brasileira (principal) ─────────
export const MARCOS_BRASIL: MarcoHistorico[] = [
  {
    ano: "1988",
    titulo: "Constituição Federal",
    descricao:
      "A Constituição já protege a intimidade, a vida privada e o sigilo de dados e comunicações (art. 5º, X e XII) e cria o habeas data. O alicerce de tudo no Brasil.",
  },
  {
    ano: "1990",
    titulo: "Código de Defesa do Consumidor — Lei 8.078",
    descricao:
      "Primeiras regras sobre bancos de dados e cadastros de consumidores (arts. 43 e 44): a pessoa pode saber o que está registrado sobre ela e exigir correção.",
  },
  {
    ano: "2014",
    titulo: "Marco Civil da Internet — Lei 12.965",
    descricao:
      "A 'constituição da internet' no Brasil. Coloca a proteção de dados pessoais como princípio do uso da rede e prepara o terreno pra uma lei específica.",
  },
  {
    ano: "2018",
    titulo: "LGPD — Lei 13.709",
    descricao:
      "Sancionada em 14 de agosto de 2018. É a nossa lei geral: define dado pessoal, bases legais, direitos do titular e deveres de quem trata dados. O centro do nosso curso.",
    destaque: true,
  },
  {
    ano: "2019",
    titulo: "ANPD — Lei 13.853",
    descricao:
      "Cria a Autoridade Nacional de Proteção de Dados, o órgão que fiscaliza, orienta e pode aplicar sanções. É 'a polícia e o professor' da LGPD ao mesmo tempo.",
  },
  {
    ano: "2020",
    titulo: "LGPD entra em vigor",
    descricao:
      "A maior parte da lei passa a valer em setembro de 2020. A partir daí, tratar dados pessoais sem cuidado deixa de ser só má prática — passa a ser descumprimento da lei.",
  },
  {
    ano: "2021",
    titulo: "Começam as sanções",
    descricao:
      "Em agosto de 2021 entram em vigor as sanções administrativas (advertência, multa, bloqueio de dados…). A ANPD passa a poder punir quem não se adequa.",
  },
  {
    ano: "2022",
    titulo: "Proteção de dados vira direito fundamental — EC 115",
    descricao:
      "A Emenda Constitucional 115/2022 inclui a proteção de dados pessoais entre os direitos fundamentais (art. 5º, LXXIX). Agora é garantia constitucional — o nível mais alto de proteção.",
    destaque: true,
  },
];

// ───────── Linha do tempo complementar (setor público) ─────────
// Leis que conversam com a LGPD e são especialmente importantes pra quem
// trabalha em órgão público.
export const MARCOS_COMPLEMENTARES: MarcoHistorico[] = [
  {
    ano: "2011",
    titulo: "Lei de Acesso à Informação — Lei 12.527",
    descricao:
      "Garante o acesso da população às informações públicas (transparência). Anda de mãos dadas com a LGPD: transparência do que é público, proteção do que é pessoal.",
  },
  {
    ano: "2017",
    titulo: "Código de Defesa do Usuário do Serviço Público — Lei 13.460",
    descricao:
      "Define direitos de quem usa serviços públicos, incluindo o respeito à privacidade e o bom uso das suas informações pelo Estado.",
  },
  {
    ano: "2021",
    titulo: "Lei do Governo Digital — Lei 14.129",
    descricao:
      "Moderniza e digitaliza os serviços públicos e reforça que essa digitalização tem que respeitar a proteção de dados pessoais dos cidadãos.",
  },
];
