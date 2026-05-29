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
];
