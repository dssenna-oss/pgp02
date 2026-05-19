// Gera o Caderno do Participante (DOCX) — Modalidade A.
// Reproduz o conteúdo do caderno anterior + insere uma nova página
// "Visão Geral — As 8 Etapas do PGP" logo após a capa, ANTES do Glossário.
// Essa nova página é parte do Nível 1 (Contextualização Fases Preliminar/1/2)
// — bate com o MapaPgp da home /dashboard e com os 3 slides M0 do deck.
//
// Uso (do diretório apps/lgpd-curso):
//   node scripts/gerar-caderno-vegas.js
// Saída:
//   E:\_________PGP\Jogo Vegas Modalidade A - Eletronico\Caderno_Participante_Vegas.docx

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  PageBreak, LevelFormat,
} = require("docx");

const OUT_DIR = "E:\\_________PGP\\Jogo Vegas Modalidade A - Eletronico";
const OUT_FILE = path.join(OUT_DIR, "Caderno_Participante_Vegas.docx");

// Paleta
const SLATE_900 = "0F172A";
const SLATE_600 = "475569";
const SLATE_400 = "94A3B8";
const SLATE_200 = "E2E8F0";
const SLATE_100 = "F1F5F9";
const EMERALD = "059669";
const EMERALD_LIGHT = "D1FAE5";
const VIOLET = "7C3AED";
const ORANGE = "B45309";
const GRAY_500 = "6B7280";

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };

// Helpers de paragrafo
function p(opts) {
  return new Paragraph({
    children: opts.children || [],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 120, line: opts.line || 300 },
    pageBreakBefore: opts.pageBreak || false,
    indent: opts.indent,
  });
}
function spacer(height = 200) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: height, after: height } });
}
function H1(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: opts.color || SLATE_900 })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: 300, after: 200, line: 320 },
    pageBreakBefore: opts.pageBreak || false,
  });
}
function H2(text, color) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: color || SLATE_600 })],
    spacing: { before: 240, after: 140, line: 300 },
  });
}
function H3(text, color) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: color || SLATE_900 })],
    spacing: { before: 180, after: 100, line: 280 },
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: opts.color || SLATE_900, italics: opts.italics || false, bold: opts.bold || false })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 120, line: 300 },
  });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, color: opts.color || SLATE_900 })],
    spacing: { before: 40, after: 60, line: 280 },
  });
}
function blankLine() {
  // Linha em branco grande pra escrita à mão.
  return new Paragraph({
    children: [new TextRun({ text: " ", size: 22 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SLATE_400, space: 1 } },
    spacing: { before: 200, after: 200 },
  });
}
function footer() {
  return new Paragraph({
    children: [new TextRun({ text: "DEFENSORES DE VEGAS · meu caderno", size: 16, color: SLATE_400, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 0 },
  });
}

// Tabela helper
function cell(text, opts = {}) {
  return new TableCell({
    borders: allBorders,
    margins: cellMargins,
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    verticalAlign: "center",
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), bold: opts.bold || false, size: opts.size || 20, color: opts.color || SLATE_900, italics: opts.italics || false })],
      alignment: opts.align || AlignmentType.LEFT,
      spacing: { before: 20, after: 20, line: 260 },
    })],
  });
}

// ─────────────────────────────────────────────────────────────────────
// Construção do documento
// ─────────────────────────────────────────────────────────────────────
const children = [];

// ============================================================
// PÁGINA 1 — CAPA
// ============================================================
children.push(
  new Paragraph({
    children: [new TextRun({ text: "🛡", size: 200, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "DEFENSORES DE VEGAS", bold: true, size: 48, color: SLATE_900, characterSpacing: 60 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "meu caderno do curso", italics: true, size: 32, color: SLATE_600 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 600 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Curso prático de LGPD", size: 26, color: SLATE_900 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Município fictício · Vegas", size: 22, italics: true, color: GRAY_500 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 800 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "ESTE CADERNO PERTENCE A:", bold: true, size: 22, color: SLATE_600, characterSpacing: 40 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 240 },
  }),
  blankLine(),
  new Paragraph({
    children: [new TextRun({ text: "Meu grupo:", size: 20, color: SLATE_600 })],
    spacing: { before: 200, after: 100 },
  }),
  blankLine(),
  new Paragraph({
    children: [new TextRun({ text: "Meu papel no jogo:", size: 20, color: SLATE_600 })],
    spacing: { before: 200, after: 100 },
  }),
  blankLine(),
);

// ============================================================
// PÁGINA NOVA — VISÃO GERAL DAS 8 ETAPAS DO PGP
// (inserida entre capa e Glossário — parte do Nível 1)
// ============================================================
children.push(
  new Paragraph({
    children: [new TextRun({ text: "🗺  Visão Geral — As 8 Etapas do PGP", bold: true, size: 32, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120, line: 320 },
    pageBreakBefore: true,
  }),
  new Paragraph({
    children: [new TextRun({ text: "Onde sua turma se encaixa no programa de adequação", italics: true, size: 22, color: SLATE_600 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 280 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Adequar uma instituição à LGPD é um caminho de 8 etapas — chamado Programa de Governança em Privacidade (PGP). Na sua organização real, isso leva meses. Em Vegas (cenário fictício), as 3 primeiras etapas já foram cumpridas antes de você chegar — você joga a partir da Fase 3.",
      size: 22, color: SLATE_900,
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 240, line: 320 },
  }),
);

// Tabela 8 etapas
const etapasTabela = [
  { rotulo: "Preliminar", nome: "Sensibilização e engajamento", entrega: "Servidores capacitados · alta gestão comprometida",        status: "feito"  },
  { rotulo: "Fase 1",     nome: "Formação das equipes",         entrega: "DPO nomeado · Comitê LGPD · Política Institucional",      status: "feito"  },
  { rotulo: "Fase 2",     nome: "Diagnóstico inicial",          entrega: "Setores mapeados · processos prioritários listados",      status: "feito"  },
  { rotulo: "Fase 3",     nome: "Mapeamento e Análise de Riscos", entrega: "Inventário aprovado · matriz de riscos preenchida",     status: "aqui"   },
  { rotulo: "Fase 4",     nome: "GAP Analysis",                 entrega: "10 controles diagnosticados (ADERENTE/PARCIAL/NÃO)",      status: "futuro" },
  { rotulo: "Fase 5",     nome: "Plano de Ação",                entrega: "Cada risco e gap vira ação com responsável + prazo",      status: "futuro" },
  { rotulo: "Fase 6",     nome: "Execução",                     entrega: "RIPD · Aviso de Privacidade · Terceiros · DSR",           status: "futuro" },
  { rotulo: "Fase 7",     nome: "Monitoramento",                entrega: "Incidentes · revisão contínua · auditoria",               status: "futuro" },
];

const tabelaEtapas = new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [1100, 2300, 4500, 1126],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        cell("Etapa",         { bold: true, width: 1100, shade: SLATE_100, align: AlignmentType.CENTER, size: 18 }),
        cell("Nome",          { bold: true, width: 2300, shade: SLATE_100, align: AlignmentType.LEFT,   size: 18 }),
        cell("O que entrega", { bold: true, width: 4500, shade: SLATE_100, align: AlignmentType.LEFT,   size: 18 }),
        cell("Status",        { bold: true, width: 1126, shade: SLATE_100, align: AlignmentType.CENTER, size: 18 }),
      ],
    }),
    ...etapasTabela.map((e) => {
      const isAqui = e.status === "aqui";
      const isFeito = e.status === "feito";
      const shade = isAqui ? EMERALD_LIGHT : undefined;
      const statusText = isAqui ? "📍 AQUI" : (isFeito ? "✓ feito" : "à frente");
      const statusColor = isAqui ? EMERALD : (isFeito ? EMERALD : SLATE_400);
      return new TableRow({
        children: [
          cell(e.rotulo,  { bold: true, width: 1100, align: AlignmentType.CENTER, shade, size: 20, color: isAqui ? EMERALD : SLATE_900 }),
          cell(e.nome,    { bold: isAqui, width: 2300, shade, size: 20, color: isAqui ? SLATE_900 : SLATE_900 }),
          cell(e.entrega, { width: 4500, shade, size: 18, color: isFeito || isAqui ? SLATE_900 : SLATE_600 }),
          cell(statusText, { bold: true, width: 1126, align: AlignmentType.CENTER, shade, size: 18, color: statusColor }),
        ],
      });
    }),
  ],
});
children.push(tabelaEtapas);

children.push(
  new Paragraph({
    children: [new TextRun({
      text: "💡 Por que isso importa pra você agora",
      bold: true, size: 22, color: SLATE_900,
    })],
    spacing: { before: 320, after: 100, line: 280 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "Você vai jogar a Fase 3 (Inventário + Análise de Riscos) e seguir até a Fase 7 ao longo das 5 missões cronometradas. As Fases anteriores não são exercitadas porque, em Vegas, já estão prontas — o DPO já foi nomeado, o Comitê já existe, e os 2 processos pré-cadastrados no seu Inventário VIERAM do levantamento da Fase 2.",
      size: 20, color: SLATE_900,
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 160, line: 300 },
  }),
  new Paragraph({
    children: [new TextRun({
      text: "👉 Pegou a referência? Na hora que terminar o curso, abra este caderno e veja a tabela acima — é o mapa que você levará pra dentro da sua organização real.",
      size: 20, italics: true, color: SLATE_600,
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 160, line: 300 },
  }),
  footer(),
);

// ============================================================
// PÁGINA — GLOSSÁRIO 1
// ============================================================
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Glossário · 10 termos essenciais", bold: true, size: 32, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 240 },
    pageBreakBefore: true,
  }),
);

const glossario = [
  ["LGPD", "Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018). Regula o tratamento de dados pessoais por organizações públicas e privadas no Brasil."],
  ["ANPD", "Autoridade Nacional de Proteção de Dados. Órgão federal que fiscaliza, aplica multas e edita regulamentos. Pode bater na porta a qualquer momento."],
  ["Titular", "pessoa natural a quem os dados pessoais se referem. O CIDADÃO. É quem a LGPD protege."],
  ["Controlador", "quem decide POR QUÊ tratar os dados (ex.: a Prefeitura é controlador dos dados dos cidadãos atendidos no Posto)."],
  ["Operador", "quem trata os dados em nome do controlador, seguindo suas instruções (ex.: laboratório terceirizado, CIEE)."],
  ["Encarregado (DPO)", "ponte entre o controlador, os titulares e a ANPD. Recebe reclamações, orienta a organização, atende a ANPD."],
  ["Base legal", "uma das hipóteses do Art. 7º (dados comuns) ou Art. 11 (dados sensíveis) que JUSTIFICA o tratamento. Sem base legal = sem direito de tratar."],
];
glossario.forEach(([termo, def]) => {
  children.push(new Paragraph({
    children: [
      new TextRun({ text: termo, bold: true, size: 22, color: EMERALD }),
      new TextRun({ text: " = ", size: 22, color: SLATE_900 }),
      new TextRun({ text: def, size: 22, color: SLATE_900 }),
    ],
    spacing: { before: 100, after: 100, line: 280 },
    alignment: AlignmentType.JUSTIFIED,
  }));
});
children.push(footer());

// ============================================================
// PÁGINA — GLOSSÁRIO 2 (continuação)
// ============================================================
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Glossário · continuação", bold: true, size: 32, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 240 },
    pageBreakBefore: true,
  }),
);

const glossario2 = [
  ["Dado sensível (Art. 5º II)", "origem racial/étnica, convicção religiosa, opinião política, filiação a sindicato/organização religiosa, saúde, vida sexual, dados genéticos/biométricos. Exige base legal mais restrita (Art. 11)."],
  ["Inventário de tratamentos", "registro de TODO processo que envolve dados pessoais. Sem inventário, não há como provar conformidade. Base de tudo."],
  ["Aviso de Privacidade", "documento público que conta ao cidadão o que a organização faz com os dados dele. Art. 9º LGPD obriga."],
  ["RIPD", "Relatório de Impacto à Proteção de Dados. Obrigatório quando o tratamento gera alto risco. Justifica o tratamento e mapeia mitigações."],
];
glossario2.forEach(([termo, def]) => {
  children.push(new Paragraph({
    children: [
      new TextRun({ text: termo, bold: true, size: 22, color: EMERALD }),
      new TextRun({ text: " = ", size: 22, color: SLATE_900 }),
      new TextRun({ text: def, size: 22, color: SLATE_900 }),
    ],
    spacing: { before: 100, after: 100, line: 280 },
    alignment: AlignmentType.JUSTIFIED,
  }));
});

children.push(new Paragraph({
  children: [new TextRun({
    text: "💡 Macete: sempre comece pelo TITULAR. Quem é o cidadão prejudicado se algo der errado? Esse é o ponto de partida de tudo na LGPD.",
    italics: true, size: 22, color: SLATE_600,
  })],
  alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 320, after: 200, line: 300 },
}));
children.push(footer());

// ============================================================
// PÁGINAS — M1 a M4 + Missões 0-5 + Compromisso + Contatos
// (idêntico ao original)
// ============================================================
function paginaAnotacoes(titulo, perguntas, modulo = "M") {
  const blocos = [];
  blocos.push(new Paragraph({
    children: [new TextRun({ text: titulo, bold: true, size: 32, color: modulo === "M1" ? EMERALD : modulo === "M2" ? VIOLET : modulo === "M3" ? ORANGE : modulo === "M4" ? SLATE_900 : SLATE_900 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 280 },
    pageBreakBefore: true,
  }));
  perguntas.forEach((pergunta) => {
    blocos.push(new Paragraph({
      children: [new TextRun({ text: pergunta, bold: true, size: 22, color: SLATE_900 })],
      spacing: { before: 240, after: 100, line: 280 },
    }));
    blocos.push(blankLine());
    blocos.push(blankLine());
  });
  blocos.push(footer());
  return blocos;
}

children.push(...paginaAnotacoes("M1 · Por que LGPD?", [
  "3 ideias-chave que ouvi:",
  "1 caso real que me marcou:",
  "Como isso se aplica na minha realidade:",
], "M1"));

children.push(...paginaAnotacoes("M2 · Direitos do Titular", [
  "Os direitos do Art. 18 que mais me chamaram atenção:",
  "Como o cidadão da minha cidade real exerceria esses direitos hoje:",
  "O que falta na minha organização pra atender bem o titular:",
], "M2"));

children.push(...paginaAnotacoes("M3 · O PGP em 9 Fases", [
  "Em qual fase a minha organização está hoje? Justifico:",
  "Qual fase do PGP é a mais urgente pra mim?",
], "M3"));

children.push(...paginaAnotacoes("M4 · Incidentes e Responsabilidade", [
  "3 tipos de incidente que podem acontecer na minha organização:",
  "Quanto tempo tenho pra comunicar a ANPD?",
  "Quem deve estar envolvido na resposta a um incidente?",
], "M4"));

children.push(...paginaAnotacoes("Missão 0 · Pitch ao Prefeito", [
  "Por que o Prefeito deveria apoiar (3 razões curtas):",
  "Quanto custaria fazer NADA?",
  "O que pediria de concreto?",
]));

children.push(...paginaAnotacoes("Missão 1 · Inventário", [
  "Maior dúvida sobre BASE LEGAL no nosso grupo:",
  "Dado que descobri ser SENSÍVEL e não imaginava:",
  "Compartilhamento que parecia OK mas o grupo questionou:",
]));

children.push(...paginaAnotacoes("Missão 2 · Riscos", [
  "Risco que classificamos como CRÍTICO:",
  "Risco que descartamos (e por quê):",
  "Ação mitigatória mais difícil de implementar na realidade:",
]));

children.push(...paginaAnotacoes("Missão 3 · GAP Analysis", [
  "Controle que marcamos como NÃO ADERENTE com mais convicção:",
  "Carta-Gestor que recebemos (se recebemos):",
  "Como contornamos a falta de apoio dos chefes:",
]));

children.push(...paginaAnotacoes("Missão 4 · Aviso de Privacidade", [
  "Seção do Aviso que mais discutimos:",
  "O canal de DSR que definimos:",
  "Como ficou nosso momento UAU quando o facilitador leu em voz alta:",
]));

children.push(...paginaAnotacoes("Missão 5 · Incidente Surpresa", [
  "Severidade que classificamos e por quê:",
  "Tempo que levamos pra gerar a Comunicação ANPD:",
  "O que faria diferente se acontecesse de verdade na minha organização:",
]));

// Página final — Compromisso
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Meu compromisso ao voltar pro trabalho", bold: true, size: 32, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 280 },
    pageBreakBefore: true,
  }),
  new Paragraph({
    children: [new TextRun({ text: "3 coisas que vou propor na minha organização nos próximos 30 dias:", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 200, after: 100 },
  }),
  blankLine(), blankLine(), blankLine(),
  new Paragraph({
    children: [new TextRun({ text: "1 conversa difícil que preciso ter (e com quem):", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 240, after: 100 },
  }),
  blankLine(), blankLine(),
  new Paragraph({
    children: [new TextRun({ text: "Quem na minha organização pode ser meu aliado(a):", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 240, after: 100 },
  }),
  blankLine(), blankLine(),
  new Paragraph({
    children: [new TextRun({
      text: "Lembrete: você não precisa fazer TUDO. Comece pelo Inventário do processo que mais te incomoda. O resto vem em sequência.",
      italics: true, size: 22, color: SLATE_600,
    })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 320, after: 200, line: 300 },
  }),
  footer(),
);

// Página — Contatos
children.push(
  new Paragraph({
    children: [new TextRun({ text: "Contatos úteis", bold: true, size: 32, color: EMERALD })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 280 },
    pageBreakBefore: true,
  }),
  new Paragraph({
    children: [new TextRun({ text: "ANPD — Autoridade Nacional de Proteção de Dados", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 200, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Site: www.gov.br/anpd · Atendimento: 0800 282 8484", size: 20, color: SLATE_600 })],
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Lei Geral de Proteção de Dados (LGPD)", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 100, after: 60 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Lei nº 13.709/2018 · planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm", size: 20, color: SLATE_600 })],
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: "Resoluções importantes da ANPD:", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 100, after: 60 },
  }),
  bullet("Res. 2/2022 — adequação de agentes de pequeno porte"),
  bullet("Res. 15/2024 — comunicação de incidentes"),
  bullet("Res. 18/2024 — comunicação no exercício de direitos"),
  bullet("Res. 19/2024 — transferência internacional"),
  bullet("Res. 20/2024 — atuação do Encarregado"),
  new Paragraph({
    children: [new TextRun({ text: "Contato do facilitador:", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 280, after: 100 },
  }),
  blankLine(),
  new Paragraph({
    children: [new TextRun({ text: "Contato do meu DPO do grupo:", bold: true, size: 22, color: SLATE_900 })],
    spacing: { before: 240, after: 100 },
  }),
  blankLine(),
  footer(),
);

// ─────────────────────────────────────────────────────────────────────
// Document setup
// ─────────────────────────────────────────────────────────────────────
const doc = new Document({
  creator: "Defensores de Vegas",
  title: "Caderno do Participante — Vegas",
  description: "Caderno de anotações do curso prático LGPD",
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 360, hanging: 240 } } },
          },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1080, bottom: 1080, left: 1080 },  // 1in top, 0.75in sides
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, buffer);
  console.log("✅ Gerado:", OUT_FILE);
});
