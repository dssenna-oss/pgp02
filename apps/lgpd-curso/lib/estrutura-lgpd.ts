// "Estrutura da LGPD" — apresentações HTML standalone (criadas no Claude Design)
// que percorrem a Lei 13.709/2018 artigo por artigo, em linguagem simples.
// Ficam na área Slides das fases, depois do Histórico. Os arquivos são servidos
// estaticamente de public/estrutura-lgpd/ (viajam com o deploy — não dependem
// de caminho local file:// nem de CDN externo).
//
// Pra adicionar um módulo novo: copie o .html pra public/estrutura-lgpd/ e
// acrescente uma entrada aqui (na ordem dos artigos).

export type ModuloEstrutura = {
  slug: string;
  titulo: string;
  intervalo: string; // ex.: "Arts. 1º a 11"
  descricao: string;
  arquivo: string; // caminho público, ex.: "/estrutura-lgpd/artigos-1-11.html"
};

export const MODULOS_ESTRUTURA: ModuloEstrutura[] = [
  {
    slug: "artigos-1-11",
    titulo: "Disposições preliminares e bases legais",
    intervalo: "Arts. 1º a 11",
    descricao:
      "Do que a lei trata, a quem se aplica, os conceitos-chave (dado pessoal, titular, controlador, " +
      "operador), os fundamentos e princípios, e as hipóteses que autorizam o tratamento de dados " +
      "(as bases legais).",
    arquivo: "/estrutura-lgpd/artigos-1-11.html",
  },
  {
    slug: "artigos-12-20",
    titulo: "Anonimização, crianças e direitos do titular",
    intervalo: "Arts. 12 a 20",
    descricao:
      "Quando o dado deixa de ser pessoal (anonimização), o cuidado redobrado com dados de crianças e " +
      "adolescentes, quando o tratamento deve terminar e os direitos que toda pessoa tem sobre seus " +
      "dados (acesso, correção, exclusão, portabilidade…).",
    arquivo: "/estrutura-lgpd/artigos-12-20.html",
  },
  {
    slug: "artigos-21-30",
    titulo: "Tratamento de dados pelo Poder Público",
    intervalo: "Arts. 21 a 30",
    descricao:
      "As regras específicas para os órgãos públicos tratarem dados pessoais — finalidades, uso " +
      "compartilhado entre entes e o papel da administração. A parte mais importante pra quem " +
      "trabalha no serviço público.",
    arquivo: "/estrutura-lgpd/artigos-21-30.html",
  },
  {
    slug: "artigos-31-40",
    titulo: "Transferência internacional e agentes de tratamento",
    intervalo: "Arts. 31 a 40",
    descricao:
      "O envio de dados para fora do país (transferência internacional) e quem são os responsáveis " +
      "pelo tratamento — controlador, operador e o Encarregado (DPO) —, além do relatório de impacto.",
    arquivo: "/estrutura-lgpd/artigos-31-40.html",
  },
  {
    slug: "artigos-41-50",
    titulo: "Encarregado, responsabilidade e segurança",
    intervalo: "Arts. 41 a 50",
    descricao:
      "O Encarregado (DPO) em detalhe, a responsabilidade e o dever de reparar danos, e as medidas " +
      "de segurança, boas práticas e governança que protegem os dados.",
    arquivo: "/estrutura-lgpd/artigos-41-50.html",
  },
  {
    slug: "artigos-51-65",
    titulo: "Fiscalização, sanções e ANPD",
    intervalo: "Arts. 51 a 65",
    descricao:
      "Como a lei é fiscalizada, as sanções aplicáveis (advertência, multa, bloqueio…), o papel da " +
      "ANPD (Autoridade Nacional de Proteção de Dados) e as disposições finais da lei.",
    arquivo: "/estrutura-lgpd/artigos-51-65.html",
  },
];
