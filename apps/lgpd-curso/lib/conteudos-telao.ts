// Materiais de Apoio projetáveis no Telão Comandado (comando "conteudo:<id>").
//
// O telão ao vivo renderiza a página num IFRAME fullscreen (mesma origem; o
// notebook está logado como facilitador) com `?projecao=1` — o ModoProjecao
// detecta o param e esconde sidebar/amplia fontes sem mostrar o banner verde.
//
// `hrefAluno` é a rota equivalente no celular do participante (banner "📺 No
// telão agora…"). null = conteúdo sem página própria pro participante (Fases
// 3-7 vivem só em /facilitador/conteudo-fase) — o banner aparece sem botão.

export type ConteudoTelao = {
  id: string;
  emoji: string;
  titulo: string;
  hrefTelao: string; // rota que o telão (admin) abre no iframe
  hrefAluno: string | null; // rota no celular do participante
};

function ambos(id: string, emoji: string, titulo: string, href: string): ConteudoTelao {
  return { id, emoji, titulo, hrefTelao: href, hrefAluno: href };
}

function soTelao(id: string, emoji: string, titulo: string, href: string): ConteudoTelao {
  return { id, emoji, titulo, hrefTelao: href, hrefAluno: null };
}

export const CONTEUDOS_TELAO: ConteudoTelao[] = [
  ambos("conteudos-didaticos", "📚", "Conteúdos Didáticos", "/dashboard/conteudos-didaticos"),
  ambos("entendendo-pgp", "🧭", "Entendendo o PGP", "/dashboard/entendendo-pgp"),
  ambos("historico-lgpd", "📜", "Histórico da LGPD", "/dashboard/historico-lgpd"),
  ambos("estrutura-lgpd", "📖", "Estrutura da LGPD", "/dashboard/estrutura-lgpd"),
  // Guia didático de UM módulo da Estrutura (HTML estático standalone). Existe
  // pro "escape" do Momento 4: projetar SÓ os arts. 1-11 como amostra antes do
  // Desafio. O comando conteudo:estrutura-lgpd mostra a LISTA de módulos; este
  // projeta o conteúdo do guia direto. Fora do dropdown da biblioteca (só o
  // botão do M4 e o controle local usam). soTelao: a página é HTML estático
  // (sem barra do app / sem banner) → abrir no celular vira beco sem saída; o
  // Guia é pra LER no telão, e o celular segue pro Desafio (atividade) depois.
  soTelao("guia-art-1-11", "📘", "Guia LGPD — Artigos 1 a 11", "/estrutura-lgpd/artigos-1-11.html"),
  ambos("fase-preliminar", "🚩", "Fase Preliminar", "/dashboard/fase-preliminar"),
  ambos("fase-1", "🚩", "Fase 1 — Formação das equipes", "/dashboard/fase-1"),
  // Documentos-modelo da Fase 1, projetáveis na sala (demonstração — dados de
  // exemplo entre [colchetes]; versão editável no Pacote de Modelos pra levar).
  ambos("modelo-ato-designacao", "📜", "Ato de Designação (modelo)", "/dashboard/modelo/ato-designacao"),
  ambos("modelo-portaria-comite", "🏛️", "Portaria do Comitê Gestor (modelo)", "/dashboard/modelo/portaria-comite"),
  ambos("fase-2", "🚩", "Fase 2 — Diagnóstico inicial", "/dashboard/fase-2"),
  soTelao("fase-3", "🚩", "Fase 3 — Mapeamento e Riscos", "/facilitador/conteudo-fase/fase-3"),
  soTelao("fase-4", "🚩", "Fase 4 — GAP Analysis", "/facilitador/conteudo-fase/fase-4"),
  soTelao("fase-5", "🚩", "Fase 5 — Plano de Ação", "/facilitador/conteudo-fase/fase-5"),
  soTelao("fase-6", "🚩", "Fase 6 — Execução", "/facilitador/conteudo-fase/fase-6"),
  soTelao("fase-7", "🚩", "Fase 7 — Monitoramento Contínuo", "/facilitador/conteudo-fase/fase-7"),
];

export function getConteudoTelao(id: string): ConteudoTelao | null {
  return CONTEUDOS_TELAO.find((c) => c.id === id) ?? null;
}

// Recorte "biblioteca" pro dropdown "📺 Slides e conteúdos…" do Painel de
// Condução: só os conteúdos transversais. As Fases (Preliminar e 1-7) ficam
// FORA do dropdown — cada uma já tem botão pronto em "Ação certa deste
// momento" do Momento correspondente (M5-M12). O catálogo completo continua
// valendo pros botões dos momentos e pro controle local do telão (plano B).
const IDS_BIBLIOTECA = ["conteudos-didaticos", "entendendo-pgp", "historico-lgpd", "estrutura-lgpd"];
export const CONTEUDOS_TELAO_BIBLIOTECA = CONTEUDOS_TELAO.filter((c) =>
  IDS_BIBLIOTECA.includes(c.id),
);
