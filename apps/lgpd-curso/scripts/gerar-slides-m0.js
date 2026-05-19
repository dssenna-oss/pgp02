// Gera o Módulo 0 (3 slides) — "Onde estamos?" — pra contextualizar
// Fases Preliminar / 1 / 2 ANTES do M1 começar no deck principal.
//
// Saída: Slides_M0_Contextualizacao.pptx (arquivo separado).
// Combinar manualmente no deck Slides_M1-M4_Vegas.pptx via
// PowerPoint > Início > Novo Slide > Reutilizar Slides...
//
// Uso (do diretório apps/lgpd-curso):
//   node scripts/gerar-slides-m0.js
//
// Paleta alinhada com Slides_M1-M4_Vegas.pptx:
//   - Slate 64748B (capa M0 — diferencia dos M1-M4 coloridos)
//   - Amarelo FBBF24 (acento "MÓDULO N", igual M1-M4)
//   - Branco FFFFFF
//   - Emerald 059669 (Fase 3 destacada na linha do tempo)

const PptxGenJS = require("pptxgenjs");
const path = require("path");

const OUT_DIR = "E:\\_________PGP\\Jogo Vegas Modalidade A - Eletronico";
const OUT_FILE = path.join(OUT_DIR, "Slides_M0_Contextualizacao.pptx");

const SLATE = "64748B";
const SLATE_DARK = "475569";
const SLATE_LIGHT = "F1F5F9";
const SLATE_BORDER = "CBD5E1";
const AMARELO = "FBBF24";
const BRANCO = "FFFFFF";
const EMERALD = "059669";
const EMERALD_LIGHT = "D1FAE5";
const TXT_DARK = "1E293B";
const TXT_MUTED = "64748B";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 inches (16:9)
pptx.title = "Módulo 0 — Onde estamos?";
pptx.author = "Defensores de Vegas";
pptx.company = "Curso prático LGPD";

function addFooter(slide) {
  slide.addText("Defensores de Vegas · curso prático LGPD", {
    x: 0.5, y: 7.0, w: 12.33, h: 0.3,
    fontSize: 11, italic: true, color: BRANCO, align: "center",
  });
}

function addFooterDark(slide) {
  slide.addText("Defensores de Vegas · curso prático LGPD", {
    x: 0.5, y: 7.0, w: 12.33, h: 0.3,
    fontSize: 11, italic: true, color: TXT_MUTED, align: "center",
  });
}

// ─────────────────────────────────────────────────────────────────────
// Slide 1 — Capa do Módulo 0
// ─────────────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: SLATE };

  // Bússola 🧭
  slide.addText("🧭", {
    x: 0.5, y: 0.6, w: 12.33, h: 1.5,
    fontSize: 90, color: BRANCO, align: "center", valign: "middle",
  });

  // MÓDULO 0
  slide.addText("MÓDULO 0", {
    x: 0.5, y: 2.2, w: 12.33, h: 0.5,
    fontSize: 18, bold: true, charSpacing: 8, color: AMARELO, align: "center",
  });

  // Onde estamos?
  slide.addText("Onde estamos?", {
    x: 0.5, y: 2.8, w: 12.33, h: 1.4,
    fontSize: 54, bold: true, color: BRANCO, align: "center", valign: "middle",
  });

  // Subtítulo
  slide.addText("As 3 fases que aconteceram antes desta aula", {
    x: 0.5, y: 4.3, w: 12.33, h: 0.7,
    fontSize: 22, italic: true, color: BRANCO, align: "center",
  });

  // Duração
  slide.addText("Duração sugerida: ~5 minutos", {
    x: 0.5, y: 5.5, w: 12.33, h: 0.4,
    fontSize: 14, italic: true, color: BRANCO, align: "center",
  });

  addFooter(slide);
}

// ─────────────────────────────────────────────────────────────────────
// Slide 2 — Linha do tempo das 8 etapas
// ─────────────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: BRANCO };

  // Título
  slide.addText("🗺  A jornada do PGP — Vegas chegou na Fase 3", {
    x: 0.5, y: 0.4, w: 12.33, h: 0.7,
    fontSize: 30, bold: true, color: TXT_DARK, align: "center",
  });

  // Subtítulo
  slide.addText("Cada instituição precisa percorrer 8 etapas. As 3 primeiras já aconteceram antes da turma chegar.", {
    x: 0.5, y: 1.15, w: 12.33, h: 0.4,
    fontSize: 15, italic: true, color: TXT_MUTED, align: "center",
  });

  // Linha horizontal de fundo
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.0, y: 3.45, w: 11.33, h: 0.05,
    fill: { color: SLATE_BORDER }, line: { type: "none" },
  });
  // Linha verde até Fase 3
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.0, y: 3.45, w: 11.33 * (3.5 / 8), h: 0.05,
    fill: { color: EMERALD }, line: { type: "none" },
  });

  // 8 etapas
  const etapas = [
    { rotulo: "Preliminar", titulo: "Sensibilização",            status: "feito"  },
    { rotulo: "Fase 1",     titulo: "Formação das equipes",      status: "feito"  },
    { rotulo: "Fase 2",     titulo: "Diagnóstico inicial",       status: "feito"  },
    { rotulo: "Fase 3",     titulo: "Mapeamento e Análise de Riscos", status: "aqui"   },
    { rotulo: "Fase 4",     titulo: "GAP Analysis",              status: "futuro" },
    { rotulo: "Fase 5",     titulo: "Plano de Ação",             status: "futuro" },
    { rotulo: "Fase 6",     titulo: "Execução",                  status: "futuro" },
    { rotulo: "Fase 7",     titulo: "Monitoramento",             status: "futuro" },
  ];

  const totalWidth = 11.33;
  const startX = 1.0;
  const slotW = totalWidth / 8;

  etapas.forEach((etapa, i) => {
    const cx = startX + slotW * (i + 0.5);

    // Bolinha
    let dotColor, dotBorder, dotSize, dotText, dotTextColor;
    if (etapa.status === "feito") {
      dotColor = EMERALD;
      dotBorder = EMERALD;
      dotSize = 0.55;
      dotText = "✓";
      dotTextColor = BRANCO;
    } else if (etapa.status === "aqui") {
      dotColor = BRANCO;
      dotBorder = EMERALD;
      dotSize = 0.75;
      dotText = "📍";
      dotTextColor = EMERALD;
    } else {
      dotColor = BRANCO;
      dotBorder = SLATE_BORDER;
      dotSize = 0.55;
      dotText = String(i);
      dotTextColor = TXT_MUTED;
    }

    slide.addShape(pptx.ShapeType.ellipse, {
      x: cx - dotSize / 2, y: 3.45 - dotSize / 2, w: dotSize, h: dotSize,
      fill: { color: dotColor },
      line: { color: dotBorder, width: etapa.status === "aqui" ? 3 : 2 },
    });
    slide.addText(dotText, {
      x: cx - dotSize / 2, y: 3.45 - dotSize / 2, w: dotSize, h: dotSize,
      fontSize: etapa.status === "aqui" ? 22 : 14, bold: true,
      color: dotTextColor, align: "center", valign: "middle",
    });

    // Rótulo "Fase N" acima da bolinha
    slide.addText(etapa.rotulo, {
      x: cx - slotW / 2, y: 2.5, w: slotW, h: 0.3,
      fontSize: 11, bold: true,
      color: etapa.status === "feito" ? EMERALD : (etapa.status === "aqui" ? EMERALD : TXT_MUTED),
      align: "center",
    });

    // Título da fase abaixo da bolinha
    slide.addText(etapa.titulo, {
      x: cx - slotW / 2, y: 4.05, w: slotW, h: 0.55,
      fontSize: 10,
      bold: etapa.status === "aqui",
      color: etapa.status === "aqui" ? TXT_DARK : TXT_MUTED,
      align: "center", valign: "top",
    });

    // Badge "AQUI ESTAMOS" extra na Fase 3
    if (etapa.status === "aqui") {
      slide.addText("AQUI ESTAMOS", {
        x: cx - slotW / 2, y: 4.65, w: slotW, h: 0.3,
        fontSize: 9, bold: true, charSpacing: 4, color: EMERALD, align: "center",
      });
    }
  });

  // Linha de fechamento
  slide.addText("Vocês vão jogar a Fase 3 (Inventário + Riscos) e seguir até a Fase 7 ao longo das 5 missões.", {
    x: 1.0, y: 5.7, w: 11.33, h: 0.5,
    fontSize: 16, italic: true, color: TXT_DARK, align: "center",
  });

  addFooterDark(slide);
}

// ─────────────────────────────────────────────────────────────────────
// Slide 3 — Três cards "O que já aconteceu"
// ─────────────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: BRANCO };

  // Título
  slide.addText("✅  O que já aconteceu antes de vocês chegarem", {
    x: 0.5, y: 0.4, w: 12.33, h: 0.7,
    fontSize: 30, bold: true, color: TXT_DARK, align: "center",
  });

  // Subtítulo
  slide.addText("Numa adequação real, essas 3 fases podem levar semanas. No cenário fictício de Vegas, elas já estão prontas.", {
    x: 0.5, y: 1.15, w: 12.33, h: 0.4,
    fontSize: 14, italic: true, color: TXT_MUTED, align: "center",
  });

  // 3 cards
  const cards = [
    {
      rotulo: "PRELIMINAR",
      titulo: "Sensibilização",
      bullets: [
        "4h de capacitação teórica pros servidores",
        "Conceitos básicos: dado pessoal, sensível, base legal, direitos",
        "Vocês são RESULTADO dessa fase — chegaram preparados",
      ],
    },
    {
      rotulo: "FASE 1",
      titulo: "Formação das equipes",
      bullets: [
        "Prefeito/Presidente da Câmara nomeou o DPO por portaria",
        "Comitê LGPD formado: TI + Jurídico + RH + Comunicação",
        "Política Institucional de Privacidade aprovada",
      ],
    },
    {
      rotulo: "FASE 2",
      titulo: "Diagnóstico inicial",
      bullets: [
        "Todos os setores que tratam dados foram identificados",
        "Lista de processos priorizados — quem entra primeiro",
        "Os 2 processos pré-cadastrados que vocês vão detalhar vieram daqui",
      ],
    },
  ];

  const cardW = 3.95;
  const cardH = 4.1;
  const startCardX = 0.55;
  const gap = 0.22;
  const cardY = 1.75;

  cards.forEach((card, i) => {
    const cx = startCardX + (cardW + gap) * i;

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx, y: cardY, w: cardW, h: cardH,
      fill: { color: SLATE_LIGHT },
      line: { color: EMERALD, width: 2 },
      rectRadius: 0.1,
    });

    // Faixa verde do topo (rotulo)
    slide.addShape(pptx.ShapeType.rect, {
      x: cx, y: cardY, w: cardW, h: 0.55,
      fill: { color: EMERALD },
      line: { type: "none" },
    });
    slide.addText("✓  " + card.rotulo, {
      x: cx, y: cardY, w: cardW, h: 0.55,
      fontSize: 13, bold: true, charSpacing: 4, color: BRANCO, align: "center", valign: "middle",
    });

    // Titulo
    slide.addText(card.titulo, {
      x: cx + 0.2, y: cardY + 0.7, w: cardW - 0.4, h: 0.55,
      fontSize: 22, bold: true, color: TXT_DARK, align: "left",
    });

    // Bullets
    slide.addText(
      card.bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, fontSize: 12 } })),
      {
        x: cx + 0.2, y: cardY + 1.4, w: cardW - 0.4, h: cardH - 1.6,
        fontSize: 12, color: TXT_DARK, paraSpaceAfter: 6, valign: "top",
      }
    );
  });

  // Linha de fechamento
  slide.addText("👉  Agora é com vocês: a Fase 3 começa aqui.", {
    x: 1.0, y: 6.2, w: 11.33, h: 0.5,
    fontSize: 18, bold: true, italic: true, color: EMERALD, align: "center",
  });

  addFooterDark(slide);
}

// ─────────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: OUT_FILE }).then((file) => {
  console.log("✅ Gerado:", file);
});
