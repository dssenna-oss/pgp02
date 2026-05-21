// Conteúdo de slides das fases iniciais (Preliminar, 1 e 2) — apresentado
// pelo facilitador antes das missões práticas. As lâminas vêm do PowerPoint
// "ENFOC 2026 - LGPD 7 PASSOS", renderizadas em public/slides-curso/.

export type FaseSlides = {
  slug: string; // fase-preliminar | fase-1 | fase-2
  emoji: string;
  titulo: string;
  subtitulo: string;
  intro: string;
  faseKey?: string; // chave pro card "Base legal desta fase" (quando houver)
  slideInicio: number; // 1º slide (1-based) no public/slides-curso
  slideFim: number; // último slide
};

export const SLIDES_FASES: FaseSlides[] = [
  {
    slug: "fase-preliminar",
    emoji: "🚩",
    titulo: "Fase Preliminar",
    subtitulo: "Sensibilização e engajamento",
    intro:
      "A adequação à LGPD começa antes da prática — sensibilizar a Alta Administração e engajar " +
      "a instituição inteira. Estes são os slides que o facilitador apresenta nesta fase; reveja " +
      "quando quiser.",
    faseKey: "fundacao",
    slideInicio: 1,
    slideFim: 10,
  },
  {
    slug: "fase-1",
    emoji: "🚩",
    titulo: "Fase 1 — Formação das equipes de trabalho",
    subtitulo: "Quem faz a adequação acontecer",
    intro:
      "A formação da equipe de trabalho, a indicação do Encarregado (DPO) e a comunicação interna " +
      "da instituição. Slides apresentados pelo facilitador — a prática do Encarregado fica no " +
      "mini-app desta fase.",
    slideInicio: 11,
    slideFim: 18,
  },
  {
    slug: "fase-2",
    emoji: "🚩",
    titulo: "Fase 2 — Diagnóstico inicial",
    subtitulo: "A fotografia do ponto de partida",
    intro:
      "O diagnóstico da cultura organizacional e da maturidade da instituição frente à LGPD — o " +
      "mapa macro que orienta tudo que vem depois. Slides apresentados pelo facilitador antes das " +
      "missões práticas.",
    faseKey: "escopo",
    slideInicio: 19,
    slideFim: 28,
  },
];

export function slidesDaFase(f: FaseSlides): string[] {
  const arr: string[] = [];
  for (let n = f.slideInicio; n <= f.slideFim; n++) {
    arr.push(`/slides-curso/slide-${n}.jpg`);
  }
  return arr;
}

export function getFaseSlides(slug: string): FaseSlides | undefined {
  return SLIDES_FASES.find((f) => f.slug === slug);
}
