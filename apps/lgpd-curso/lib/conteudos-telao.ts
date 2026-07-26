// Materiais de Apoio projetáveis no Telão Comandado (comando "conteudo:<id>").
//
// O telão ao vivo renderiza a página num IFRAME fullscreen (mesma origem; o
// notebook está logado como facilitador) com `?projecao=1` — o ModoProjecao
// detecta o param e esconde sidebar/amplia fontes sem mostrar o banner verde.
//
// `hrefAluno` é a rota equivalente no celular do participante (banner "📺 No
// telão agora…"). null = conteúdo sem página própria pro participante (Fases
// 3-7 vivem só em /facilitador/conteudo-fase) — o banner aparece sem botão.

import { MODULOS_LGPD } from "@/lib/estrutura-lgpd";

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
  // botão do M4 e o controle local usam).
  // hrefTelao = HTML estático (projeta direto, fullscreen). hrefAluno NÃO pode
  // ser esse HTML (estático, sem barra do app → beco sem saída no celular):
  // aponta pra /dashboard/guia-art-1-11, que embute o HTML num iframe DENTRO do
  // app (com "voltar" + faixa do telão). Assim, em Modalidade C, o celular
  // espelha pra cá quando o Guia é projetado e segue sozinho ao avançar.
  {
    id: "guia-art-1-11",
    emoji: "📘",
    titulo: "Guia LGPD — Artigos 1 a 11",
    hrefTelao: "/estrutura-lgpd/artigos-1-11.html",
    hrefAluno: "/dashboard/guia-art-1-11",
  },
  // Mini app "A LGPD, artigo por artigo" (/lgpd) — os DEMAIS módulos da
  // jornada, no mesmo padrão do guia-art-1-11: hrefTelao = HTML estático
  // (projeta fullscreen) e hrefAluno = wrapper /dashboard/lgpd/<slug> (dentro
  // do app; em Modo Cards o celular espelha e segue sozinho). O 1-11 fica de
  // fora da lista (já coberto pelo guia-art-1-11 acima, usado no Momento 4).
  ...MODULOS_LGPD.filter((m) => m.slug !== "artigos-1-11").map(
    (m): ConteudoTelao => ({
      id: `lgpd-${m.slug}`,
      emoji: m.slug === "historico" ? "📜" : m.slug === "simulado-15-questoes" ? "🎯" : "📘",
      titulo:
        m.slug === "historico"
          ? "Histórico — Como o mundo chegou à LGPD"
          : m.slug === "simulado-15-questoes"
            ? "Simulado LGPD — 15 questões"
            : `LGPD — ${m.intervalo}: ${m.titulo}`,
      hrefTelao: m.arquivo,
      hrefAluno: `/dashboard/lgpd/${m.slug}`,
    }),
  ),
  ambos("fase-preliminar", "🚩", "Fase Preliminar", "/dashboard/fase-preliminar"),
  ambos("fase-1", "🚩", "Fase 1 — Formação das equipes", "/dashboard/fase-1"),
  // Documentos-modelo da Fase 1, projetáveis na sala (demonstração — dados de
  // exemplo entre [colchetes]; versão editável no Pacote de Modelos pra levar).
  ambos("modelo-ato-designacao", "📜", "Ato de Designação (modelo)", "/dashboard/modelo/ato-designacao"),
  ambos("modelo-portaria-comite", "🏛️", "Portaria do Comitê Gestor (modelo)", "/dashboard/modelo/portaria-comite"),
  ambos("modelo-carta-alta-gestao", "✉️", "Carta à Alta Gestão (modelo)", "/dashboard/modelo/carta-alta-gestao"),
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
// Os módulos do mini app /lgpd (guia 1-11 incluso) entram na biblioteca:
// são os Fundamentos, projetáveis a qualquer momento.
const IDS_BIBLIOTECA = [
  "conteudos-didaticos",
  "entendendo-pgp",
  "historico-lgpd",
  "estrutura-lgpd",
  "guia-art-1-11",
  ...MODULOS_LGPD.filter((m) => m.slug !== "artigos-1-11").map((m) => `lgpd-${m.slug}`),
];
export const CONTEUDOS_TELAO_BIBLIOTECA = CONTEUDOS_TELAO.filter((c) =>
  IDS_BIBLIOTECA.includes(c.id),
);
