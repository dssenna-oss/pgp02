// Pacote de Modelos do PGP — 21 templates editáveis em DOCX único.
//
// Diferente da Cartilha (que é guia descritivo), este pacote contém
// MODELOS PRONTOS PRA EDITAR. Cada modelo tem:
//   - Cabeçalho do modelo (título + quando usar)
//   - Template editável com placeholders [NOME DA INSTITUIÇÃO] etc.
//   - Caixa amarela "💡 Exemplo preenchido" com versão de referência
//
// O DOCX único agrupa os 21 modelos em sequência (page break entre cada).
// O sumário no início permite navegação rápida.
//
// Endpoint: /api/curso/pacote-modelos/docx (admin + participantes).
// Personalização opcional via ?instituicao=X (substitui placeholder na geração).

import {
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import {
  DIMENSOES_PESSOAIS,
  DIMENSOES_INSTITUICAO,
  FAIXAS_PESSOAIS,
  FAIXAS_TERMOMETRO,
  type DimensaoTermometro,
  type FaixaTermometro,
} from "./termometro-perguntas";
import { COMPETENCIAS_COMITE } from "./comite-lgpd";

const COR_TITULO = "0F766E"; // teal escuro — distingue dos outros 3 documentos
const COR_ACCENT = "0D9488";
const COR_PLACEHOLDER = "DC2626"; // vermelho destacado pra placeholders
const COR_EXEMPLO_BG = "FEF3C7"; // amarelo claro
const COR_EXEMPLO_TEXTO = "92400E";
const COR_INSTRUCAO_BG = "EFF6FF"; // azul claro pra instruções
const COR_INSTRUCAO_TEXTO = "1E40AF";

// =============================================================================
// Helpers DOCX
// =============================================================================

export type PacoteOpts = {
  nomeInstituicao?: string;
};

// h1 com page break — usado pra abrir cada modelo
function h1Modelo(numero: number, titulo: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    pageBreakBefore: true,
    children: [
      new TextRun({
        text: `Modelo ${String(numero).padStart(2, "0")} — ${titulo}`,
        bold: true,
        size: 36,
        color: COR_TITULO,
      }),
    ],
  });
}

// h2 sem page break (subdivisões dentro do modelo)
function h2(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text: texto, bold: true, size: 26, color: COR_ACCENT })],
  });
}

function h3(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: texto, bold: true, size: 22, color: "0F172A" })],
  });
}

function p(
  texto: string,
  opts: { bold?: boolean; italics?: boolean; size?: number; color?: string; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacingAfter?: number; indent?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 120 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: [
      new TextRun({
        text: texto,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
        color: opts.color,
      }),
    ],
  });
}

function bullet(texto: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text: texto, size: 22 })],
  });
}

// Parágrafo com placeholders em VERMELHO destacado.
// Use o marcador `<PLACEHOLDER>` no texto. Ex: "Eu, <[NOME]>, declaro..."
// Onde aparecer `<...>`, o trecho vai sair em vermelho/itálico/bold.
function pComPlaceholder(
  texto: string,
  opts: {
    spacingAfter?: number;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
    bold?: boolean;
    italics?: boolean;
    size?: number;
  } = {},
): Paragraph {
  const runs: TextRun[] = [];
  const partes = texto.split(/(<[^>]+>)/g);
  const tamanhoTexto = opts.size ?? 22;
  for (const parte of partes) {
    if (!parte) continue;
    if (parte.startsWith("<") && parte.endsWith(">")) {
      runs.push(
        new TextRun({
          text: parte.slice(1, -1), // remove < e >
          color: COR_PLACEHOLDER,
          bold: true,
          italics: true,
          size: tamanhoTexto,
        }),
      );
    } else {
      runs.push(
        new TextRun({
          text: parte,
          size: tamanhoTexto,
          bold: opts.bold,
          italics: opts.italics,
        }),
      );
    }
  }
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 120 },
    children: runs,
  });
}

// Caixa azul de instruções (como usar o modelo)
function caixaInstrucao(titulo: string, texto: string): Paragraph[] {
  return [
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: COR_INSTRUCAO_BG },
      spacing: { before: 120, after: 0 },
      indent: { left: 200, right: 200 },
      children: [new TextRun({ text: `ℹ ${titulo}`, bold: true, color: COR_INSTRUCAO_TEXTO, size: 22 })],
    }),
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: COR_INSTRUCAO_BG },
      spacing: { before: 0, after: 200 },
      indent: { left: 200, right: 200 },
      children: [new TextRun({ text: texto, color: COR_INSTRUCAO_TEXTO, size: 22 })],
    }),
  ];
}

// Caixa amarela com exemplo preenchido (B2 — exemplo lado ao modelo)
function caixaExemplo(linhas: string[]): Paragraph[] {
  const paras: Paragraph[] = [];
  paras.push(
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: COR_EXEMPLO_BG },
      spacing: { before: 200, after: 0 },
      indent: { left: 200, right: 200 },
      children: [
        new TextRun({
          text: "💡 Exemplo preenchido (apenas referência — adapte à realidade da sua Instituição)",
          bold: true,
          color: COR_EXEMPLO_TEXTO,
          size: 20,
        }),
      ],
    }),
  );
  for (let i = 0; i < linhas.length; i++) {
    paras.push(
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: COR_EXEMPLO_BG },
        spacing: { before: 0, after: i === linhas.length - 1 ? 240 : 60 },
        indent: { left: 200, right: 200 },
        children: [new TextRun({ text: linhas[i], color: COR_EXEMPLO_TEXTO, size: 20, italics: true })],
      }),
    );
  }
  return paras;
}

// Tabela campo:valor padrão
function tabelaCampos(linhas: Array<[string, string]>): Table {
  return new Table({
    rows: linhas.map(
      ([rotulo, valor]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: rotulo, bold: true, size: 20 })] })],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [pComPlaceholder(valor)],
            }),
          ],
        }),
    ),
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
    },
  });
}

// =============================================================================
// Capa + Apresentação + Sumário
// =============================================================================

function capaPacote(opts: PacoteOpts): Paragraph[] {
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const inst = opts.nomeInstituicao?.trim();
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 200 },
      children: [
        new TextRun({ text: "PACOTE DE MODELOS", bold: true, size: 52, color: COR_TITULO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Programa de Governança em Privacidade", italics: true, size: 30, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "21 templates editáveis pra implementação da LGPD em Instituições Públicas",
          italics: true,
          size: 22,
          color: "64748B",
        }),
      ],
    }),
    inst
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: inst, bold: true, size: 32 })],
        })
      : new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Para qualquer Instituição Pública brasileira",
              italics: true,
              size: 22,
              color: "64748B",
            }),
          ],
        }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1800 },
      children: [new TextRun({ text: `Edição de ${hoje}`, size: 22, color: "475569" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "PGP Treinamento · Templates institucionais de apoio à conformidade LGPD",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  ];
}

function apresentacaoPacote(): (Paragraph | Table)[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 240 },
      pageBreakBefore: true,
      children: [new TextRun({ text: "Como usar este Pacote", bold: true, size: 36, color: COR_TITULO })],
    }),
    p(
      "Este documento reúne 21 modelos editáveis pra implementação da LGPD em órgãos públicos. Diferente da Cartilha (que é guia descritivo), aqui você tem TEMPLATES PRONTOS PRA EDITAR — abra no Word, navegue pelo sumário, vá direto ao modelo que precisa e adapte.",
    ),
    h2("Como os modelos estão organizados"),
    bullet("Cada modelo começa em página nova com cabeçalho 'Modelo NN — Nome' pra fácil localização."),
    bullet("Caixa azul ℹ logo abaixo do título: instrução breve de QUANDO usar o modelo."),
    bullet("Corpo do template com campos pra preencher destacados em vermelho/itálico/negrito: ex. [NOME DA INSTITUIÇÃO]."),
    bullet("Caixa amarela 💡 ao final: exemplo preenchido com dados fictícios pra você ver como fica."),
    h2("Convenção de placeholders"),
    p("Os campos a preencher seguem padrão de fácil identificação no Word — use Ctrl+F pra encontrar todos:"),
    bullet("[NOME DA INSTITUIÇÃO] — nome completo da Instituição"),
    bullet("[CIDADE] — cidade-sede"),
    bullet("[CNPJ] — CNPJ da Instituição"),
    bullet("[NOME DO ENCARREGADO] — nome do(a) DPO designado(a)"),
    bullet("[E-MAIL] e [TELEFONE] — contatos institucionais"),
    bullet("[DATA] — data de emissão"),
    bullet("[NOME DO PROCESSO], [NOME DO OPERADOR], [NOME DO TITULAR] — contextuais"),
    h2("Recomendação de uso"),
    p(
      "Não preencher tudo de uma vez. O PGP é processo gradual — preencha os modelos na ordem das fases (Preliminar primeiro: Ato de Designação · Carta Alta Gestão · Termômetro), e vá avançando conforme o Plano de Ação da Instituição.",
    ),
    p(
      "Sugestão: salvar uma cópia ANTES de editar (Salvar como…) — o original fica intacto pra futura consulta ou pra distribuir a outros servidores/setores.",
    ),
  ];
}

function sumarioPacote(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 240 },
      pageBreakBefore: true,
      children: [new TextRun({ text: "Sumário dos Modelos", bold: true, size: 36, color: COR_TITULO })],
    }),
  );
  out.push(p("Os 21 modelos estão organizados em 3 grupos:", { spacingAfter: 160 }));

  out.push(h2("Grupo 1 — Documentos Formais (6)"));
  out.push(bullet("Modelo 01 — Ato de Designação do Encarregado"));
  out.push(bullet("Modelo 02 — Portaria de Instituição do Comitê Gestor de Privacidade (companheiro do Modelo 01)"));
  out.push(bullet("Modelo 03 — Carta para a Alta Gestão"));
  out.push(bullet("Modelo 04 — Roadmap de 90 dias"));
  out.push(bullet("Modelo 05 — Aviso de Privacidade público"));
  out.push(bullet("Modelo 06 — Documento do PRI (Plano de Resposta a Incidentes)"));

  out.push(h2("Grupo 2 — Documentos Institucionais (6)"));
  out.push(bullet("Modelo 07 — Política do PGP (documento mater)"));
  out.push(bullet("Modelo 08 — Cláusulas LGPD pra contratos (aditamento padrão)"));
  out.push(bullet("Modelo 09 — Política de Retenção e Descarte"));
  out.push(bullet("Modelo 10 — Termo de Consentimento do Titular"));
  out.push(bullet("Modelo 11 — Comunicação de Incidente à ANPD"));
  out.push(bullet("Modelo 12 — Comunicação de Incidente aos Titulares"));

  out.push(h2("Grupo 3 — Fichas Operacionais (9)"));
  out.push(bullet("Modelo 13 — Termômetro: você + sua Instituição (formulário)"));
  out.push(bullet("Modelo 14 — Matriz de Priorização de Processos (Res. ANPD nº 2/2022)"));
  out.push(bullet("Modelo 15 — Ficha de Processo (Inventário)"));
  out.push(bullet("Modelo 16 — Ficha de Risco com matriz P × I"));
  out.push(bullet("Modelo 17 — GAP — Planilha de Avaliação de Controles"));
  out.push(bullet("Modelo 18 — Plano de Ação"));
  out.push(bullet("Modelo 19 — RIPD — Relatório de Impacto à Proteção de Dados (8 seções)"));
  out.push(bullet("Modelo 20 — Ficha de Operador (Terceiro)"));
  out.push(bullet("Modelo 21 — Registro de Solicitação DSR (Direitos do Titular)"));

  return out;
}

// =============================================================================
// Os 20 modelos
// =============================================================================
// Cada função render<Modelo> retorna (Paragraph | Table)[] com cabeçalho do
// modelo + instrução + template + exemplo. As funções estão implementadas em
// `pacote-modelos-fichas.ts` (modelos 12-20) e `pacote-modelos-docs.ts`
// (modelos 1-11) pra manter este arquivo navegável.

// Implementação dos 20 modelos é feita inline aqui pra manter coerência —
// arquivo grande mas auto-contido. Cada modelo é uma função pequena.

// ===== MODELO 01 — Ato de Designação do Encarregado =====
function modelo01_AtoDesignacao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(1, "Ato de Designação do Encarregado"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "No início da Fase 1 do PGP, pra cumprir o Art. 41 da LGPD. É documento formal que designa o Encarregado pelo Tratamento de Dados Pessoais (DPO). Deve ser publicado no diário oficial ou veículo institucional equivalente.",
    ),
  );

  out.push(h2("Template"));
  out.push(
    pComPlaceholder(
      "ATO DE DESIGNAÇÃO Nº <[NÚMERO/AAAA]>",
      { align: AlignmentType.CENTER },
    ),
  );
  out.push(p("(Designação do Encarregado pelo Tratamento de Dados Pessoais)", { align: AlignmentType.CENTER, italics: true, spacingAfter: 240 }));
  out.push(
    pComPlaceholder(
      "Designa o(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) de <[NOME DA INSTITUIÇÃO]>, em cumprimento ao art. 41 da Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).",
      { spacingAfter: 240 },
    ),
  );
  out.push(
    pComPlaceholder(
      "<[A AUTORIDADE MÁXIMA — ex: O(A) PREFEITO(A) MUNICIPAL DE CIDADE]>, no uso de suas atribuições legais e regimentais,",
    ),
  );
  out.push(p("CONSIDERANDO que a Lei nº 13.709, de 14 de agosto de 2018 (LGPD), em seu art. 41, determina ao controlador a indicação de Encarregado pelo Tratamento de Dados Pessoais;"));
  out.push(p("CONSIDERANDO o disposto na Resolução CD/ANPD nº 18, de 16 de julho de 2024, que regulamenta a atuação do Encarregado;"));
  out.push(
    pComPlaceholder(
      "CONSIDERANDO a necessidade de estabelecer canal formal de comunicação com a Autoridade Nacional de Proteção de Dados — ANPD e com os titulares de dados pessoais tratados no âmbito de <[NOME DA INSTITUIÇÃO]>;",
      { spacingAfter: 240 },
    ),
  );
  out.push(p("RESOLVE:", { bold: true, align: AlignmentType.CENTER, spacingAfter: 200 }));
  out.push(
    pComPlaceholder(
      "Art. 1º Designar <[NOME DO ENCARREGADO]> como Encarregado(a) pelo Tratamento de Dados Pessoais de <[NOME DA INSTITUIÇÃO]>, nos termos do art. 41 da Lei nº 13.709/2018.",
    ),
  );
  out.push(
    pComPlaceholder(
      "Parágrafo único. O canal de comunicação com o(a) Encarregado(a), para efeito do art. 41 §2º da LGPD, fica estabelecido pelos seguintes meios: e-mail <[E-MAIL]>, telefone <[TELEFONE]>, atendimento presencial em <[ENDEREÇO]>.",
    ),
  );
  out.push(
    pComPlaceholder(
      "Art. 2º A escolha do(a) Encarregado(a) considerou os seguintes fundamentos: <[JUSTIFICATIVA DA ESCOLHA — perfil técnico-jurídico, autonomia, acesso à alta administração]>.",
    ),
  );
  out.push(p("Art. 3º Compete ao(à) Encarregado(a) designado(a), conforme art. 41 §2º da LGPD:"));
  out.push(p("I — aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências;"));
  out.push(p("II — receber comunicações da Autoridade Nacional de Proteção de Dados — ANPD;"));
  out.push(p("III — orientar funcionários e contratados quanto às práticas a serem tomadas em relação à proteção de dados pessoais;"));
  out.push(p("IV — executar as demais atribuições determinadas pelo controlador ou estabelecidas em normas complementares."));
  out.push(p("Art. 4º Este ato entra em vigor na data de sua publicação, revogadas as disposições em contrário."));
  out.push(pComPlaceholder("<[CIDADE]>, <[DATA POR EXTENSO]>.", { align: AlignmentType.RIGHT, spacingAfter: 400 }));
  out.push(p("_______________________________________", { align: AlignmentType.CENTER }));
  out.push(pComPlaceholder("<[NOME DA AUTORIDADE]>", { align: AlignmentType.CENTER }));
  out.push(p("(Autoridade máxima do órgão)", { align: AlignmentType.CENTER, italics: true, size: 18, spacingAfter: 400 }));
  out.push(p("CIENTE E DE ACORDO:", { bold: true, spacingAfter: 400 }));
  out.push(p("_______________________________________"));
  out.push(pComPlaceholder("<[NOME DO ENCARREGADO]>"));
  out.push(p("Encarregado(a) pelo Tratamento de Dados Pessoais", { italics: true, size: 18 }));

  out.push(
    ...caixaExemplo([
      "ATO DE DESIGNAÇÃO Nº 03/2026",
      "Designa Maria Silva Santos como Encarregada pelo Tratamento de Dados Pessoais da Prefeitura Municipal de Vegas, em cumprimento ao art. 41 da Lei nº 13.709/2018 — LGPD.",
      "Justificativa: Servidora efetiva de carreira jurídica, com pós-graduação em Direito Digital, autonomia funcional e acesso direto ao gabinete.",
      "Contatos: dpo@vegas.gov.br · (00) 0000-0000 · Av. Principal, 100 — Centro.",
    ]),
  );
  return out;
}

// ===== MODELO 21 — Portaria de Instituição do Comitê Gestor de Privacidade =====
function modelo21_PortariaComite(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(2, "Portaria de Instituição do Comitê Gestor de Privacidade"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 1 do PGP, junto com o Ato de Designação (Modelo 01). Enquanto o Ato nomeia a PESSOA (o Encarregado), esta Portaria institui a EQUIPE de governança — o Comitê Gestor de Privacidade, instância multidisciplinar que dá sustentação coletiva ao programa (art. 50 da LGPD). Publique no diário oficial ou veículo institucional equivalente.",
    ),
  );

  out.push(h2("Template"));
  out.push(pComPlaceholder("PORTARIA Nº <[NÚMERO/AAAA]>", { align: AlignmentType.CENTER }));
  out.push(p("(Institui o Comitê Gestor de Privacidade e Proteção de Dados Pessoais)", { align: AlignmentType.CENTER, italics: true, spacingAfter: 240 }));
  out.push(
    pComPlaceholder(
      "Institui o Comitê Gestor de Privacidade e Proteção de Dados Pessoais de <[NOME DA INSTITUIÇÃO]> e define sua composição e competências, em consonância com a Lei nº 13.709/2018 (LGPD).",
      { spacingAfter: 240 },
    ),
  );
  out.push(
    pComPlaceholder(
      "<[A AUTORIDADE MÁXIMA — ex: O(A) PREFEITO(A) MUNICIPAL DE CIDADE]>, no uso de suas atribuições legais e regimentais,",
    ),
  );
  out.push(p("CONSIDERANDO o art. 50 da Lei nº 13.709/2018 (LGPD), que dispõe sobre a adoção de Programa de Governança em Privacidade pelos agentes de tratamento;"));
  out.push(p("CONSIDERANDO que a proteção de dados pessoais é tema transversal, exigindo atuação coordenada das áreas que tratam dados no órgão;"));
  out.push(p("CONSIDERANDO o art. 41 da LGPD e a necessidade de apoio institucional ao Encarregado pelo Tratamento de Dados Pessoais;", { spacingAfter: 240 }));
  out.push(p("RESOLVE:", { bold: true, align: AlignmentType.CENTER, spacingAfter: 200 }));
  out.push(
    pComPlaceholder(
      "Art. 1º Fica instituído o Comitê Gestor de Privacidade e Proteção de Dados Pessoais de <[NOME DA INSTITUIÇÃO]>, com a finalidade de coordenar a implementação da LGPD e do Programa de Governança em Privacidade.",
    ),
  );
  out.push(p("Art. 2º O Comitê é composto pelos seguintes membros, representando as áreas que tratam dados pessoais no órgão:"));
  out.push(pComPlaceholder("I — <[NOME]>, Encarregado(a) pelo Tratamento de Dados Pessoais — Coordenador(a) do Comitê;"));
  out.push(pComPlaceholder("II — <[NOME]>, representante da Tecnologia da Informação (TI);"));
  out.push(pComPlaceholder("III — <[NOME]>, representante da área Jurídica / Procuradoria;"));
  out.push(pComPlaceholder("IV — <[NOME]>, representante da Gestão de Pessoas (RH);"));
  out.push(pComPlaceholder("V — <[NOME]>, representante da Comunicação;"));
  out.push(pComPlaceholder("VI — <[NOME]>, representante das áreas donas dos processos críticos (ex: Saúde, Tributário, Assistência Social).", { spacingAfter: 120 }));
  out.push(p("Art. 3º Compete ao Comitê Gestor de Privacidade:"));
  COMPETENCIAS_COMITE.forEach((c) => out.push(p(c)));
  out.push(pComPlaceholder("Art. 4º O Comitê reunir-se-á <[PERIODICIDADE — ex: trimestralmente]> e, extraordinariamente, sempre que convocado por seu Coordenador."));
  out.push(p("Art. 5º Esta portaria entra em vigor na data de sua publicação."));
  out.push(pComPlaceholder("<[CIDADE]>, <[DATA POR EXTENSO]>.", { align: AlignmentType.RIGHT, spacingAfter: 400 }));
  out.push(p("_______________________________________", { align: AlignmentType.CENTER }));
  out.push(pComPlaceholder("<[NOME DA AUTORIDADE]>", { align: AlignmentType.CENTER }));
  out.push(p("(Autoridade máxima do órgão)", { align: AlignmentType.CENTER, italics: true, size: 18, spacingAfter: 400 }));

  out.push(
    ...caixaExemplo([
      "PORTARIA Nº 12/2026",
      "Institui o Comitê Gestor de Privacidade e Proteção de Dados Pessoais da Prefeitura Municipal de Vegas.",
      "Composição: Maria Silva (Encarregada, Coordenadora) · João Lima (TI) · Ana Costa (Procuradoria) · Pedro Réis (RH) · Lúcia Dias (Comunicação) · Carla Souza (Saúde — processo crítico).",
      "Reuniões trimestrais, com pauta conduzida pela Coordenadora.",
    ]),
  );
  return out;
}

// ===== MODELO 02 — Carta para a Alta Gestão =====
function modelo02_CartaAltaGestao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(3, "Carta para a Alta Gestão"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase Preliminar do PGP. É documento institucional curto apresentado ao dirigente máximo no início do trabalho de adequação. Objetivo: obter patrocínio formal pra o programa.",
    ),
  );

  out.push(h2("Template"));
  out.push(pComPlaceholder("À <[DESTINATÁRIO — ex: Excelentíssimo(a) Senhor(a) Prefeito(a) Municipal de Vegas]>", { spacingAfter: 240 }));
  out.push(p("Assunto: Patrocínio Institucional ao Programa de Governança em Privacidade (PGP)", { bold: true, spacingAfter: 240 }));

  out.push(h3("1. Justificativa legal"));
  out.push(
    pComPlaceholder(
      "A Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) está em vigor desde setembro de 2020 e é plenamente aplicável aos órgãos da Administração Pública (Art. 1º e Capítulo IV). <[NOME DA INSTITUIÇÃO]> trata, no exercício de suas atribuições legais, volume expressivo de dados pessoais de cidadãos, servidores e fornecedores — incluindo dados sensíveis. A adequação à LGPD tornou-se obrigação institucional, com responsabilização direta do(a) gestor(a) máximo(a) em caso de descumprimento.",
    ),
  );

  out.push(h3("2. Riscos de não-cumprimento"));
  out.push(p("O não-cumprimento expõe o órgão e seus dirigentes a riscos institucionais relevantes:"));
  out.push(bullet("Sanções administrativas pela ANPD: advertências, publicização da infração, repercussão na imagem institucional."));
  out.push(bullet("Responsabilização civil em caso de incidente (Art. 42 LGPD), com possibilidade de indenizações por dano moral coletivo e individual."));
  out.push(bullet("Repercussão midiática e perda de confiança da população."));
  out.push(bullet("Apontamentos em auditorias do Tribunal de Contas e Ministério Público."));

  out.push(h3("3. Pedido"));
  out.push(
    pComPlaceholder(
      "Em razão do exposto, solicitamos formalmente o apoio institucional de Vossa Excelência para a implementação do PGP de <[NOME DA INSTITUIÇÃO]>, especificamente:",
    ),
  );
  out.push(bullet("Designação formal do(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) por ato oficial (art. 41 LGPD);"));
  out.push(bullet("Constituição do Comitê de Governança de Dados Pessoais, com representação multidisciplinar;"));
  out.push(bullet("Alocação de recursos humanos e orçamentários compatíveis com a complexidade dos tratamentos;"));
  out.push(bullet("Inclusão da adequação à LGPD como pauta recorrente das reuniões de gestão."));

  out.push(p("Comprometemo-nos a apresentar, no prazo de 30 (trinta) dias após o início formal dos trabalhos, o cronograma detalhado de implementação do PGP e a lista priorizada de processos a serem mapeados.", { spacingAfter: 400 }));

  out.push(p("Respeitosamente,", { spacingAfter: 400 }));
  out.push(p("_______________________________________"));
  out.push(pComPlaceholder("<[NOME DO ENCARREGADO OU RESPONSÁVEL PELA CONDUÇÃO]>"));
  out.push(p("Encarregado(a) pelo Tratamento de Dados Pessoais", { italics: true, size: 18 }));

  out.push(
    ...caixaExemplo([
      "À Excelentíssima Senhora Prefeita Municipal de Vegas",
      "Assunto: Patrocínio Institucional ao Programa de Governança em Privacidade",
      "A Prefeitura Municipal de Vegas trata diariamente dados de 50 mil cidadãos atendidos pela UBS, 320 estagiários por seleção, dados sensíveis de servidores. O PGP estrutura este tratamento conforme a LGPD.",
      "Solicitamos: designação formal do Encarregado · constituição do Comitê (TI/Jurídico/Comunicação/RH/áreas) · rubrica orçamentária na LOA/2027 (~R$ 40 mil/ano) · agenda mensal do Comitê.",
      "Maria Silva Santos · Encarregada designada interinamente",
    ]),
  );
  return out;
}

// ===== MODELO 03 — Roadmap 90 dias =====
function modelo03_Roadmap90Dias(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(4, "Roadmap de 90 dias"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Ao iniciar o PGP, pra dar visibilidade da execução à Alta Gestão. Cronograma de 13 semanas (~3 meses) distribuindo as 7 Fases do PGP em marcos verificáveis. Anexar à Carta da Alta Gestão (Modelo 03).",
    ),
  );

  out.push(h2("Template — tabela editável"));
  out.push(p("Estrutura recomendada de 13 marcos. Preencha a coluna 'Responsável' e ajuste prazos à realidade da Instituição:"));

  const linhas: Array<[string, string, string]> = [
    ["1", "Preliminar", "Apresentar Carta à Alta Gestão · obter patrocínio formal"],
    ["2", "Fase 1", "Designar Encarregado(a) por ato formal · publicar no diário oficial"],
    ["3", "Fase 1", "Constituir Comitê de Privacidade · 1ª reunião"],
    ["4", "Fase 2", "Levantar setores que tratam dados · selecionar processos prioritários"],
    ["5", "Fase 2", "Aplicar Matriz de Priorização Res. CD/ANPD nº 2/2022"],
    ["6", "Fase 3", "Iniciar Inventário dos 5 processos prioritários"],
    ["7", "Fase 3", "Concluir Inventário · iniciar Análise de Riscos"],
    ["8", "Fase 4", "Aplicar GAP Analysis (10-30 controles)"],
    ["9", "Fase 5", "Consolidar Plano de Ação · aprovar no Comitê"],
    ["10", "Fase 6", "Elaborar RIPD dos processos de alto risco"],
    ["11", "Fase 6", "Publicar Aviso de Privacidade · estabelecer canal DSR"],
    ["12", "Fase 6", "Cadastrar Operadores · iniciar aditamento de contratos"],
    ["13", "Fase 7", "Estruturar PRI · apresentar PGP completo à Alta Gestão"],
  ];

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COR_TITULO },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sem.", bold: true, color: "FFFFFF", size: 20 })] })],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COR_TITULO },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fase", bold: true, color: "FFFFFF", size: 20 })] })],
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COR_TITULO },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Atividade-chave", bold: true, color: "FFFFFF", size: 20 })] })],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: COR_TITULO },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Responsável", bold: true, color: "FFFFFF", size: 20 })] })],
        }),
      ],
    }),
    ...linhas.map(([sem, fase, ativ]) =>
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sem, size: 20 })] })],
          }),
          new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fase, size: 20 })] })],
          }),
          new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: ativ, size: 20 })] })],
          }),
          new TableCell({
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            children: [pComPlaceholder("<[a definir]>")],
          }),
        ],
      }),
    ),
  ];

  out.push(
    new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
    }),
  );

  out.push(
    ...caixaExemplo([
      "Sem. 1 · Preliminar · Apresentar Carta à Alta Gestão · Responsável: João Lima (Coord. Jurídico)",
      "Sem. 4 · Fase 2 · Levantar setores · Responsável: Maria Silva (Encarregada)",
      "Sem. 7 · Fase 3 · Concluir Inventário · Responsável: Maria Silva + donos de processo",
      "Sem. 12 · Fase 6 · Aditamentos de contratos com cláusulas LGPD · Responsável: Pedro Costa (Procuradoria)",
    ]),
  );
  return out;
}

// ===== MODELO 04 — Aviso de Privacidade público =====
function modelo04_AvisoPrivacidade(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(5, "Aviso de Privacidade público"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 6 do PGP. Documento público publicado no portal externo da Instituição. Cumpre o Art. 9º da LGPD (direito de informação ao titular). Recomenda-se 1 Aviso institucional + Avisos específicos pra serviços de alto impacto.",
    ),
  );

  out.push(h2("Template — Aviso institucional padrão"));
  out.push(pComPlaceholder("AVISO DE PRIVACIDADE — <[NOME DA INSTITUIÇÃO]>", { bold: true, align: AlignmentType.CENTER, spacingAfter: 240 }));
  out.push(pComPlaceholder("Última atualização: <[DATA]>", { italics: true, align: AlignmentType.CENTER, spacingAfter: 240 }));

  out.push(h3("1. Quem somos"));
  out.push(
    pComPlaceholder(
      "<[NOME DA INSTITUIÇÃO]>, inscrita no CNPJ sob nº <[CNPJ]>, com sede em <[ENDEREÇO]>, é o controlador dos dados pessoais tratados no âmbito de suas atribuições legais.",
    ),
  );

  out.push(h3("2. Por que tratamos seus dados"));
  out.push(
    pComPlaceholder(
      "Tratamos dados pessoais pra <[FINALIDADES — ex: prestação de serviços públicos, atendimento ao cidadão, cumprimento de obrigações legais, execução de políticas públicas]>.",
    ),
  );

  out.push(h3("3. Quais dados tratamos"));
  out.push(
    pComPlaceholder(
      "Dependendo do serviço utilizado, tratamos: <[LISTA — dados cadastrais (nome, CPF), de contato (e-mail, telefone), e eventualmente dados sensíveis quando o serviço exigir (ex: saúde nos atendimentos em UBS)]>.",
    ),
  );

  out.push(h3("4. Base legal do tratamento"));
  out.push(p("Tratamos dados pessoais com base nas seguintes hipóteses da LGPD:"));
  out.push(bullet("Cumprimento de obrigação legal ou regulatória (Art. 7º II)"));
  out.push(bullet("Execução de políticas públicas previstas em leis e regulamentos (Art. 7º III)"));
  out.push(bullet("Execução de contrato (Art. 7º V) — quando há vínculo contratual"));
  out.push(bullet("Quando aplicável, tratamento de dados sensíveis com base no Art. 11"));

  out.push(h3("5. Por quanto tempo guardamos"));
  out.push(
    pComPlaceholder(
      "Os prazos variam por categoria de dado. Em geral: dados de atendimento <[X anos]>, dados de saúde <[Y anos]>, dados fiscais <[Z anos]>. Após o prazo, anonimizamos ou eliminamos.",
    ),
  );

  out.push(h3("6. Como protegemos seus dados"));
  out.push(p("Adotamos medidas técnicas e administrativas adequadas: controle de acesso por perfil, criptografia em trânsito, backup, logs de auditoria, treinamento da equipe. Operadores contratados (terceiros) têm cláusulas LGPD nos contratos."));

  out.push(h3("7. Com quem compartilhamos"));
  out.push(p("Compartilhamos dados apenas quando há previsão legal ou necessidade pra cumprimento da finalidade — outros órgãos públicos no caso de execução de políticas públicas; operadores contratados sob cláusulas LGPD; autoridade judicial mediante requisição."));

  out.push(h3("8. Transferência internacional"));
  out.push(p("Indicar se há ou não. Se houver, especificar país e fundamento legal (Art. 33 LGPD)."));

  out.push(h3("9. Seus direitos como titular"));
  out.push(p("Você pode exercer os direitos previstos no Art. 18 da LGPD:"));
  out.push(bullet("Confirmação da existência de tratamento"));
  out.push(bullet("Acesso aos dados tratados"));
  out.push(bullet("Correção de dados incompletos ou desatualizados"));
  out.push(bullet("Anonimização, bloqueio ou eliminação de dados desnecessários"));
  out.push(bullet("Portabilidade dos dados"));
  out.push(bullet("Informação sobre compartilhamento"));
  out.push(bullet("Revogação do consentimento (quando aplicável)"));

  out.push(h3("10. Canal de atendimento (DSR)"));
  out.push(
    pComPlaceholder(
      "Pra exercer seus direitos ou esclarecer dúvidas sobre privacidade, fale com o(a) Encarregado(a) <[NOME DO ENCARREGADO]>: e-mail <[E-MAIL]>, telefone <[TELEFONE]>, atendimento presencial em <[ENDEREÇO]>. Prazo de resposta: 15 dias úteis (Art. 19 II LGPD).",
    ),
  );

  out.push(h3("11. Atualização deste Aviso"));
  out.push(p("Este Aviso é revisado periodicamente. A data da última atualização aparece no topo. Mudanças significativas serão comunicadas."));

  out.push(
    ...caixaExemplo([
      "AVISO DE PRIVACIDADE — Prefeitura Municipal de Vegas",
      "Última atualização: 15 de janeiro de 2027",
      "Tratamos dados pessoais pra prestação de serviços públicos municipais nas áreas de saúde, educação, assistência social, tributação e ouvidoria. Base legal: Art. 7º III LGPD (políticas públicas) e Art. 11 II 'a' (obrigação legal) em dados sensíveis de saúde.",
      "Canal de atendimento: Maria Silva (Encarregada) — dpo@vegas.gov.br · (00) 0000-0000",
    ]),
  );
  return out;
}

// ===== MODELO 05 — Documento do PRI =====
function modelo05_DocumentoPRI(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(6, "Documento do PRI — Plano de Resposta a Incidentes"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 7 do PGP, ANTES de qualquer incidente real. Define equipe responsável (ETIR/CSIRT), matriz RACI por etapa NIST e fluxos de resposta. Sem PRI pronto, o caos do incidente impede resposta tempestiva (3 dias úteis à ANPD).",
    ),
  );

  out.push(h2("Template — 8 seções"));

  out.push(h3("1. Identificação do órgão"));
  out.push(
    pComPlaceholder(
      "<[NOME DA INSTITUIÇÃO]>, CNPJ <[CNPJ]>, com Encarregado(a) <[NOME DO ENCARREGADO]>, contato <[E-MAIL]> / <[TELEFONE]>.",
    ),
  );

  out.push(h3("2. Objetivo do PRI"));
  out.push(p("Estabelecer procedimentos padronizados pra resposta a incidentes de segurança envolvendo dados pessoais, em cumprimento ao Art. 48 da LGPD e à Resolução CD/ANPD nº 15/2024."));

  out.push(h3("3. Equipe de Tratamento de Incidentes (ETIR)"));
  out.push(p("Composição mínima recomendada — preencher com nomes e contatos 24h:"));
  out.push(
    tabelaCampos([
      ["DPO (Encarregado)", "<[NOME · E-MAIL · CELULAR 24h]>"],
      ["TI / Segurança", "<[NOME · E-MAIL · CELULAR 24h]>"],
      ["Jurídico", "<[NOME · E-MAIL · CELULAR 24h]>"],
      ["Comunicação", "<[NOME · E-MAIL · CELULAR 24h]>"],
      ["Alta Gestão (aprovador)", "<[NOME · E-MAIL · CELULAR 24h]>"],
    ]),
  );

  out.push(h3("4. Detecção"));
  out.push(p("Canais por onde incidentes podem ser identificados: SIEM/logs · denúncia interna · denúncia externa · notificação de operador · auditoria. Servidor que identificar comunica imediatamente o DPO pelo canal <[CANAL — ex: e-mail dpo@ + telefone (00) 0000-0000]>."));

  out.push(h3("5. Contenção, Erradicação e Recuperação"));
  out.push(p("Contenção (etapa CONTER): isolamento do sistema/processo afetado, bloqueio de credencial comprometida, revogação de acesso indevido."));
  out.push(p("Erradicação (etapa ERRADICAR): identificação da causa-raiz, aplicação de patches, fechamento da vulnerabilidade explorada."));
  out.push(p("Recuperação (etapa RECUPERAR): restauração a partir de backup íntegro, monitoramento reforçado pós-restauração, validação da operação."));

  out.push(h3("6. Responsáveis pela comunicação"));
  out.push(p("Comunicação à ANPD (Art. 48 + Res. 15/2024): elaborada pelo Encarregado em conjunto com Procuradoria; aprovada pela Alta Gestão antes do envio. Prazo: 3 dias úteis."));
  out.push(p("Comunicação aos titulares: elaborada pelo Encarregado + Comunicação Social; canal de envio compatível com o cadastro do titular. Prazo: 7 dias úteis (severidade ALTA/CRÍTICA)."));

  out.push(h3("7. Registro do incidente"));
  out.push(p("Todo incidente, mesmo o de severidade BAIXA, deve ser registrado no sistema interno do Encarregado. Retenção mínima: 5 anos. Base legal: Art. 7º II LGPD."));

  out.push(h3("8. Revisão e atualização do PRI"));
  out.push(p("Este PRI é revisado anualmente OU após qualquer incidente de severidade ALTA/CRÍTICA OU em caso de mudança significativa no parque tecnológico/equipe."));
  out.push(p("Recomendado: simulado anual (tabletop exercise) com cenário plausível pra testar tempos de resposta e identificar lacunas."));

  out.push(
    ...caixaExemplo([
      "Prefeitura Municipal de Vegas · Encarregada: Maria Silva — dpo@vegas.gov.br · (00) 0000-0001",
      "ETIR: DPO Maria Silva (primário) · TI João Costa (suporte 24h) · Jurídico Procuradoria-Geral (Dr. Pedro) · Alta Gestão (Prefeita Ana)",
      "Detecção típica: SIEM dispara alerta · servidor identifica vazamento durante auditoria · operador contratado comunica em 24h conforme cláusula",
      "Última simulação tabletop: 12/03/2026 — cenário 'pendrive perdido com 500 prontuários'. Resultado: 18h até comunicação ANPD (dentro do prazo legal).",
    ]),
  );
  return out;
}

// ===== Função pública parcial — modelos 1-5 inclusos =====
export function modelosDocumentosFormais(): (Paragraph | Table)[] {
  return [
    ...modelo01_AtoDesignacao(),
    ...modelo21_PortariaComite(),
    ...modelo02_CartaAltaGestao(),
    ...modelo03_Roadmap90Dias(),
    ...modelo04_AvisoPrivacidade(),
    ...modelo05_DocumentoPRI(),
  ];
}

// ===== MODELO 06 — Política do PGP (documento mater) =====
function modelo06_PoliticaPGP(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(7, "Política do PGP (documento mater)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 5 do PGP. Documento institucional aprovado por ato formal do dirigente máximo. Cita os demais instrumentos do PGP como anexos vinculados. Revisão anual recomendada.",
    ),
  );

  out.push(h2("Template — 8 seções"));

  out.push(h3("1. Objetivo"));
  out.push(
    pComPlaceholder(
      "Esta Política estabelece o Programa de Governança em Privacidade (PGP) de <[NOME DA INSTITUIÇÃO]>, em cumprimento à Lei nº 13.709/2018 — LGPD, regulamentando o tratamento de dados pessoais no âmbito de suas atividades.",
    ),
  );

  out.push(h3("2. Abrangência"));
  out.push(
    pComPlaceholder(
      "Aplica-se a todas as unidades, servidores, estagiários, terceirizados e demais agentes que, no exercício de funções vinculadas a <[NOME DA INSTITUIÇÃO]>, realizem tratamento de dados pessoais sob qualquer forma e base legal.",
    ),
  );

  out.push(h3("3. Princípios"));
  out.push(p("O tratamento observa os princípios do Art. 6º da LGPD: finalidade, adequação, necessidade, livre acesso, qualidade, transparência, segurança, prevenção, não discriminação e responsabilização."));

  out.push(h3("4. Governança"));
  out.push(
    pComPlaceholder(
      "O PGP é conduzido pelo(a) Encarregado(a) <[NOME DO ENCARREGADO]>, designado(a) por ato formal (Art. 41 LGPD), com apoio do Comitê de Privacidade — instância multidisciplinar com representantes das áreas <[ÁREAS — ex: TI, Jurídico, Comunicação, RH, áreas de negócio]>. O Comitê reúne-se <[PERIODICIDADE — ex: mensalmente]>.",
    ),
  );

  out.push(h3("5. Instrumentos do PGP"));
  out.push(p("Integram o PGP, como anexos vinculados:"));
  out.push(bullet("(a) Inventário de Tratamentos de Dados Pessoais"));
  out.push(bullet("(b) Análise de Riscos de Privacidade"));
  out.push(bullet("(c) Análise de Conformidade (GAP)"));
  out.push(bullet("(d) Plano de Ação"));
  out.push(bullet("(e) Relatórios de Impacto à Proteção de Dados (RIPD) dos processos de alto risco"));
  out.push(bullet("(f) Cadastro de Operadores com cláusulas LGPD"));
  out.push(bullet("(g) Canal e procedimento de exercício de Direitos do Titular (DSR)"));
  out.push(bullet("(h) Aviso de Privacidade público"));
  out.push(bullet("(i) Plano de Resposta a Incidentes (PRI)"));

  out.push(h3("6. Responsabilidades"));
  out.push(p("Dirigente máximo: aprova o PGP, garante recursos, responde por sanções (Art. 52)."));
  out.push(p("Encarregado: conduz operacionalmente, aceita reclamações, comunica-se com ANPD e titulares."));
  out.push(p("Comitê: delibera estrategicamente."));
  out.push(p("Gestores de área: aplicam as orientações."));
  out.push(p("Servidores: cumprem políticas, reportam incidentes."));
  out.push(p("Operadores (terceiros): cumprem cláusulas LGPD dos contratos."));

  out.push(h3("7. Revisão"));
  out.push(p("Esta Política é revisada anualmente ou antes em caso de: alteração legislativa · decisão da ANPD · incidente ALTA/CRÍTICA · reorganização institucional relevante."));

  out.push(h3("8. Vigência"));
  out.push(pComPlaceholder("Esta Política entra em vigor na data de sua publicação em <[DIÁRIO OFICIAL ou EQUIVALENTE]> e revoga disposições em contrário."));
  out.push(pComPlaceholder("<[CIDADE]>, <[DATA]>.", { align: AlignmentType.RIGHT, spacingAfter: 400 }));
  out.push(p("_______________________________________", { align: AlignmentType.CENTER }));
  out.push(pComPlaceholder("<[NOME DA AUTORIDADE MÁXIMA]>", { align: AlignmentType.CENTER }));
  out.push(p("Dirigente máximo do órgão", { align: AlignmentType.CENTER, italics: true, size: 18 }));

  out.push(
    ...caixaExemplo([
      "POLÍTICA DO PGP — Prefeitura Municipal de Vegas",
      "Encarregada: Maria Silva (Procuradoria-Adjunta). Comitê: 7 membros (TI/Jurídico/Comunicação/RH/Saúde/Tributário/Assistência Social).",
      "Reuniões mensais na 1ª terça-feira do mês.",
      "Aprovado pelo Decreto Municipal nº 042/2027, de 15 de fevereiro de 2027 — Prefeita Ana Costa.",
    ]),
  );
  return out;
}

// ===== MODELO 07 — Cláusulas LGPD pra contratos =====
function modelo07_ClausulasLGPD(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(8, "Cláusulas LGPD pra contratos (aditamento padrão)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Pra incluir em contratos novos OU aditar contratos vigentes com operadores (terceiros que tratam dados pessoais em nome da Instituição). Atende o Art. 39 LGPD. Em contratos antigos pré-2020 sem cláusulas LGPD, promover aditamento gradualmente.",
    ),
  );

  out.push(h2("Template — 8 cláusulas mínimas (Art. 39 LGPD)"));
  out.push(p("As cláusulas abaixo devem ser incluídas em todos os contratos com operadores. Adaptar redação às minutas-padrão da Procuradoria."));

  out.push(h3("Cláusula 1 — Objeto do tratamento"));
  out.push(p("O OPERADOR realizará tratamento de dados pessoais exclusivamente para os fins descritos no objeto principal deste contrato, ficando vedado qualquer tratamento estranho a esse escopo, salvo expressa autorização prévia e por escrito da CONTRATANTE."));

  out.push(h3("Cláusula 2 — Segurança e confidencialidade"));
  out.push(p("O OPERADOR adotará medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, perdas acidentais, alterações indevidas ou divulgação inadequada, em conformidade com os Arts. 46 a 49 da LGPD."));

  out.push(h3("Cláusula 3 — Comunicação de incidentes"));
  out.push(p("O OPERADOR comunicará à CONTRATANTE, imediatamente após o conhecimento e em prazo não superior a 24 (vinte e quatro) horas, qualquer incidente de segurança envolvendo dados pessoais sob seu tratamento, fornecendo informações pra subsidiar a comunicação à ANPD e aos titulares."));

  out.push(h3("Cláusula 4 — Subcontratação"));
  out.push(p("O OPERADOR não subcontratará terceiros para o tratamento sem prévia autorização escrita da CONTRATANTE. Em caso de autorização, o sub-operador assumirá as mesmas obrigações deste contrato por instrumento escrito."));

  out.push(h3("Cláusula 5 — Direitos dos titulares"));
  out.push(p("O OPERADOR auxiliará a CONTRATANTE no atendimento das solicitações dos titulares (Art. 18 LGPD), em prazo não superior a 5 (cinco) dias úteis a contar da requisição."));

  out.push(h3("Cláusula 6 — Retenção e devolução/destruição"));
  out.push(p("Encerrada a relação contratual, o OPERADOR devolverá à CONTRATANTE ou destruirá, conforme orientação desta, todos os dados pessoais sob seu tratamento, em prazo não superior a 30 (trinta) dias, salvo determinação legal em contrário."));

  out.push(h3("Cláusula 7 — Auditoria"));
  out.push(p("A CONTRATANTE poderá, mediante aviso prévio de 15 dias úteis, realizar auditoria das medidas de segurança implementadas pelo OPERADOR, diretamente ou por terceiro independente."));

  out.push(h3("Cláusula 8 — Responsabilidade"));
  out.push(p("O OPERADOR responde civilmente pelos danos decorrentes do descumprimento das obrigações deste contrato, nos termos do Art. 42 da LGPD, sem prejuízo das sanções administrativas e judiciais cabíveis."));

  out.push(
    ...caixaInstrucao(
      "Como aplicar em contratos antigos",
      "Promover TERMO ADITIVO ao contrato, sem necessidade de rescisão. Cabeçalho do aditivo: 'Termo Aditivo nº X — Inclusão de Cláusulas LGPD ao Contrato nº Y'. Anexar este conjunto de 8 cláusulas. Assinatura de ambas as partes.",
    ),
  );

  out.push(
    ...caixaExemplo([
      "TERMO ADITIVO Nº 02 — Inclusão de Cláusulas LGPD ao Contrato nº 045/2024",
      "Pelo presente Termo, a Prefeitura Municipal de Vegas e a Empresa Hipotética Tecnologia LTDA (CNPJ 00.000.000/0001-00) aditam o Contrato nº 045/2024 (objeto: hospedagem do sistema de Ouvidoria) pra incluir as Cláusulas LGPD do Art. 39 da Lei 13.709/2018, vigentes a partir desta data.",
      "Vegas, 15 de março de 2027. Prefeita Ana Costa / Diretor Empresa Hipotética.",
    ]),
  );
  return out;
}

// ===== MODELO 08 — Política de Retenção e Descarte =====
function modelo08_PoliticaRetencao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(9, "Política de Retenção e Descarte de Dados Pessoais"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 6 do PGP. Define prazos de retenção por categoria de dado e procedimento de descarte seguro. Cumpre o Art. 16 da LGPD. Revisão anual recomendada.",
    ),
  );

  out.push(h2("Template"));

  out.push(h3("1. Princípio geral"));
  out.push(p("Os dados pessoais não são mantidos por tempo superior ao necessário ao cumprimento da finalidade. Findo o tratamento, devem ser eliminados, anonimizados ou ter retenção justificada em hipótese legal específica (Art. 16 LGPD)."));

  out.push(h3("2. Hipóteses que autorizam retenção (Art. 16)"));
  out.push(bullet("Cumprimento de obrigação legal ou regulatória"));
  out.push(bullet("Estudo por órgão de pesquisa (com anonimização sempre que possível)"));
  out.push(bullet("Transferência a terceiro respeitada a Lei"));
  out.push(bullet("Uso exclusivo do controlador, com anonimização"));

  out.push(h3("3. Tabela de prazos por categoria — preencher"));
  out.push(p("Adaptar prazos à realidade institucional e à legislação setorial aplicável:"));
  out.push(
    tabelaCampos([
      ["Dados de servidores ativos", "<[durante o vínculo + prazo previdenciário — geralmente até 75 anos]>"],
      ["Dados de servidores inativos / pensionistas", "<[durante pagamento de benefícios + prazo previdenciário]>"],
      ["Candidatos não selecionados em seleções", "<[1 ano após término da validade do edital]>"],
      ["Atendimento ao cidadão / Ouvidoria", "<[5 anos — prazo prescricional padrão]>"],
      ["Dados de saúde (prontuários)", "<[20 anos da última consulta — CFM Res. 1.821/2007]>"],
      ["Dados fiscais / tributários", "<[5 anos — legislação tributária]>"],
      ["Logs de acesso a sistemas", "<[6 meses a 5 anos — conforme criticidade]>"],
      ["Imagens de CFTV", "<[30 a 90 dias, salvo investigação em curso]>"],
      ["Licitantes não vencedores", "<[5 anos após encerramento do certame]>"],
    ]),
  );

  out.push(h3("4. Procedimento de descarte"));
  out.push(p("Documental: fragmentação ou incineração com registro em termo."));
  out.push(p("Digital: exclusão lógica + sobrescrita ou descarte físico do meio."));
  out.push(p("Em ambos os casos, lavrar termo de descarte com data, responsável e categoria descartada. Reter o termo pelo prazo prescricional aplicável."));

  out.push(h3("5. Anonimização como alternativa"));
  out.push(p("Quando viável, anonimizar em vez de descartar (Art. 12 LGPD) — dado anonimizado sai do escopo da LGPD. Anonimização precisa ser irreversível (não basta pseudonimização)."));

  out.push(h3("6. Revisão"));
  out.push(p("Esta Política é revisada anualmente, especialmente pra adequar prazos a alterações legislativas e novos sistemas implantados."));

  out.push(
    ...caixaExemplo([
      "POLÍTICA DE RETENÇÃO — Prefeitura Municipal de Vegas",
      "Dados de servidores ativos: durante o vínculo + 75 anos (Lei nº 9.717/1998 — previdenciária).",
      "Dados de Ouvidoria: 5 anos (prazo prescricional padrão da AdmPub).",
      "Prontuários médicos: 20 anos da última consulta (Resolução CFM nº 1.821/2007).",
      "Anonimização aplicada aos dados de saúde após 20 anos (estatística agregada — fora do escopo LGPD).",
    ]),
  );
  return out;
}

// ===== MODELO 09 — Termo de Consentimento do Titular =====
function modelo09_TermoConsentimento(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(10, "Termo de Consentimento do Titular"));
  out.push(
    ...caixaInstrucao(
      "Quando usar — ATENÇÃO",
      "APENAS em tratamentos FACULTATIVOS do ponto de vista do cidadão (ex: cadastro voluntário em newsletter institucional, autorização pra uso de imagem em material promocional). NO SETOR PÚBLICO, consentimento é base legal EXCEPCIONAL — a regra é Art. 7º II (obrigação legal) ou Art. 7º III (política pública). Consentimento exige possibilidade REAL de recusa sem prejuízo do serviço público principal.",
    ),
  );

  out.push(h2("Template"));
  out.push(p("TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS", { bold: true, align: AlignmentType.CENTER, spacingAfter: 240 }));
  out.push(
    pComPlaceholder(
      "<[NOME DA INSTITUIÇÃO]>, inscrita no CNPJ sob nº <[CNPJ]>, com sede em <[ENDEREÇO]>, na qualidade de Controlador (Art. 5º VI LGPD), solicita o consentimento de <[NOME DO TITULAR]> para o tratamento dos seguintes dados pessoais:",
    ),
  );

  out.push(
    tabelaCampos([
      ["Dados tratados", "<[LISTA ESPECÍFICA — ex: nome, e-mail, telefone, imagem em vídeo de evento]>"],
      ["Finalidade", "<[ESPECÍFICA — ex: envio de informativo institucional mensal sobre eventos culturais]>"],
      ["Prazo de retenção", "<[ESPECÍFICO — ex: até que o titular solicite descadastro]>"],
      ["Compartilhamentos", "<[se houver, ESPECIFICAR — ex: empresa contratada pra hospedagem do mailing — nome + cláusulas LGPD]>"],
    ]),
  );

  out.push(h3("Direitos do titular"));
  out.push(
    pComPlaceholder(
      "O titular pode, a qualquer tempo, revogar este consentimento e exercer os direitos do Art. 18 da LGPD (acesso, correção, anonimização, eliminação, portabilidade, oposição, informações sobre compartilhamento), pelo canal: <[E-MAIL DO ENCARREGADO]>.",
    ),
  );

  out.push(h3("Declaração"));
  out.push(p("Declaro ter sido informado(a) sobre o tratamento dos meus dados pessoais e concordo livremente, de forma específica e inequívoca (Art. 5º XII LGPD), com o tratamento descrito acima."));

  out.push(p(""));
  out.push(pComPlaceholder("Local, data: <[CIDADE]>, <[DATA]>.", { spacingAfter: 400 }));
  out.push(p("_______________________________________"));
  out.push(p("Assinatura do(a) titular"));

  out.push(
    ...caixaInstrucao(
      "Validade do consentimento",
      "Consentimento marcado por padrão (opt-out) é INVÁLIDO (Art. 8º). Caixa de aceite deve estar DESMARCADA por padrão — titular marca se quiser (opt-in real). Consentimento revogado a qualquer momento pelo canal DSR.",
    ),
  );

  out.push(
    ...caixaExemplo([
      "TERMO DE CONSENTIMENTO — Prefeitura Municipal de Vegas",
      "Dados: nome + e-mail. Finalidade: envio de newsletter mensal sobre eventos culturais municipais. Prazo: até descadastro. Compartilhamento: nenhum.",
      "Titular: João Silva. Canal DSR: dpo@vegas.gov.br.",
      "Assinatura digital, 15 de janeiro de 2027.",
    ]),
  );
  return out;
}

// ===== MODELO 10 — Comunicação de Incidente à ANPD =====
function modelo10_ComunicacaoANPD(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(11, "Comunicação de Incidente à ANPD"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Em até 3 dias úteis após o conhecimento de incidente de severidade ALTA ou CRÍTICA (Art. 48 LGPD + Resolução CD/ANPD nº 15/2024). Submeter via portal da ANPD (gov.br/anpd → Comunicações).",
    ),
  );

  out.push(h2("Template — campos obrigatórios"));

  out.push(h3("1. Identificação do controlador"));
  out.push(
    tabelaCampos([
      ["Nome do órgão", "<[NOME DA INSTITUIÇÃO]>"],
      ["CNPJ", "<[CNPJ]>"],
      ["Endereço", "<[ENDEREÇO COMPLETO]>"],
      ["Nome do Encarregado", "<[NOME DO ENCARREGADO]>"],
      ["E-mail do Encarregado", "<[E-MAIL]>"],
      ["Telefone do Encarregado", "<[TELEFONE]>"],
    ]),
  );

  out.push(h3("2. Quando ocorreu / foi detectado"));
  out.push(
    tabelaCampos([
      ["Data e hora aproximada da ocorrência", "<[DATA + HORA — se conhecida; senão indicar 'desconhecida']>"],
      ["Data e hora da detecção pelo controlador", "<[DATA + HORA]>"],
      ["Data desta comunicação", "<[DATA + HORA]>"],
    ]),
  );

  out.push(h3("3. Descrição do incidente"));
  out.push(
    pComPlaceholder(
      "<[DESCRIÇÃO DA NATUREZA DO INCIDENTE — vazamento por acesso indevido? perda de dispositivo? ataque externo? falha em sistema? Detalhar de forma objetiva, sem juízo de valor.]>",
    ),
  );

  out.push(h3("4. Natureza dos dados afetados"));
  out.push(p("Marcar todas as categorias aplicáveis:"));
  out.push(bullet("☐ Dados cadastrais (nome, CPF, RG, endereço)"));
  out.push(bullet("☐ Dados de contato (e-mail, telefone)"));
  out.push(bullet("☐ Dados financeiros (conta bancária, salário, transações)"));
  out.push(bullet("☐ Dados de saúde"));
  out.push(bullet("☐ Outros dados sensíveis (Art. 5º II) — especificar"));
  out.push(bullet("☐ Dados de crianças/adolescentes"));
  out.push(bullet("☐ Outros — especificar"));

  out.push(h3("5. Categorias e número de titulares afetados"));
  out.push(
    tabelaCampos([
      ["Categorias", "<[ex: servidores ativos, cidadãos atendidos, fornecedores]>"],
      ["Número aproximado", "<[ex: 250 servidores]>"],
    ]),
  );

  out.push(h3("6. Medidas de segurança que estavam em uso"));
  out.push(
    pComPlaceholder(
      "<[DESCRIÇÃO DAS MEDIDAS QUE EXISTIAM ANTES DO INCIDENTE — controle de acesso, criptografia, backup, treinamento, etc.]>",
    ),
  );

  out.push(h3("7. Riscos relacionados ao incidente"));
  out.push(
    pComPlaceholder(
      "<[ANÁLISE DOS RISCOS — danos morais aos titulares, exposição financeira, discriminação, etc.]>",
    ),
  );

  out.push(h3("8. Medidas adotadas para mitigar"));
  out.push(bullet("☐ Isolamento do sistema/processo afetado"));
  out.push(bullet("☐ Revogação de credenciais comprometidas"));
  out.push(bullet("☐ Aplicação de patches/correções"));
  out.push(bullet("☐ Restauração a partir de backup íntegro"));
  out.push(bullet("☐ Apuração disciplinar (se aplicável)"));
  out.push(bullet("☐ Notificação individual aos titulares afetados"));
  out.push(bullet("☐ Revisão dos perfis de acesso"));
  out.push(bullet("☐ Outras — especificar"));

  out.push(h3("9. Motivo do atraso (se aplicável)"));
  out.push(
    pComPlaceholder(
      "<[SE A COMUNICAÇÃO NÃO FOI EM ATÉ 3 DIAS ÚTEIS — justificar com base técnica/operacional]>",
    ),
  );

  out.push(h3("10. Identificação do responsável pela comunicação"));
  out.push(pComPlaceholder("Nome: <[NOME DO ENCARREGADO]>"));
  out.push(pComPlaceholder("Cargo: <[CARGO]>"));
  out.push(pComPlaceholder("Data e assinatura: <[DATA]>, <[CIDADE]>."));

  out.push(
    ...caixaExemplo([
      "Comunicação à ANPD — Incidente de 15/03/2027",
      "Controlador: Prefeitura Municipal de Vegas. Encarregada: Maria Silva — dpo@vegas.gov.br.",
      "Detecção: 18/03/2027 — auditoria identificou cópia local não-autorizada de planilha contendo dados de 250 servidores (CPF, conta bancária).",
      "Mitigação: acesso do servidor revogado em 30 minutos · planilha excluída · apuração disciplinar instaurada · todos os 250 titulares notificados em até 7 dias úteis.",
      "Encarregada Maria Silva — comunicação submetida em 20/03/2027 às 16h.",
    ]),
  );
  return out;
}

// ===== MODELO 11 — Comunicação de Incidente aos Titulares =====
function modelo11_ComunicacaoTitulares(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(12, "Comunicação de Incidente aos Titulares"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Em até 7 dias úteis após o conhecimento de incidente de severidade ALTA ou CRÍTICA, conforme Art. 48 LGPD + Res. CD/ANPD nº 15/2024. Comunicar pelo canal mais compatível com o cadastro do titular (e-mail, carta, SMS, telefone).",
    ),
  );

  out.push(h2("Template — Modelo de carta/e-mail"));
  out.push(pComPlaceholder("Prezado(a) <[NOME DO TITULAR]>,", { spacingAfter: 240 }));

  out.push(
    pComPlaceholder(
      "Em cumprimento ao dever de transparência previsto na Lei Geral de Proteção de Dados Pessoais — LGPD (Lei nº 13.709/2018, Art. 48), comunicamos a ocorrência de incidente de segurança envolvendo dados pessoais sob nossa responsabilidade que afetou dados de sua titularidade.",
    ),
  );

  out.push(h3("O que aconteceu"));
  out.push(
    pComPlaceholder(
      "Em <[DATA DA OCORRÊNCIA]>, identificamos <[DESCRIÇÃO BREVE DO INCIDENTE — em linguagem clara, sem jargão técnico. Ex: 'acesso não autorizado a uma planilha contendo dados pessoais de servidores municipais']>.",
    ),
  );

  out.push(h3("Quais dados seus foram afetados"));
  out.push(
    pComPlaceholder(
      "Os dados envolvidos no incidente, referentes a você, foram: <[LISTAR DADOS ESPECÍFICOS — ex: nome completo, CPF, dados bancários]>.",
    ),
  );

  out.push(h3("O que estamos fazendo"));
  out.push(p("Adotamos as seguintes medidas pra mitigar o ocorrido e evitar novos incidentes:"));
  out.push(
    pComPlaceholder(
      "<[LISTAR MEDIDAS — ex: 'revogamos imediatamente o acesso indevido', 'instauramos procedimento de apuração', 'revisamos os perfis de acesso aos sistemas', 'comunicamos o incidente à Autoridade Nacional de Proteção de Dados (ANPD)']>.",
    ),
  );

  out.push(h3("O que você pode fazer"));
  out.push(p("Recomendamos que você, como medida preventiva, considere:"));
  out.push(bullet("Monitorar movimentações em suas contas bancárias e cadastros (se aplicável aos dados afetados)"));
  out.push(bullet("Manter atenção a tentativas de fraude que possam usar essas informações"));
  out.push(bullet("Entrar em contato conosco pelo canal abaixo em caso de dúvidas ou suspeitas"));

  out.push(h3("Como falar conosco"));
  out.push(
    pComPlaceholder(
      "O(A) Encarregado(a) <[NOME DO ENCARREGADO]> está disponível pra esclarecer dúvidas e atender solicitações:",
    ),
  );
  out.push(pComPlaceholder("E-mail: <[E-MAIL]>"));
  out.push(pComPlaceholder("Telefone: <[TELEFONE]>"));
  out.push(pComPlaceholder("Atendimento presencial: <[ENDEREÇO]>"));

  out.push(p("Reiteramos nosso compromisso com a proteção de seus dados pessoais e nos colocamos à disposição pra esclarecimentos.", { spacingAfter: 400 }));

  out.push(p("Respeitosamente,", { spacingAfter: 400 }));
  out.push(p("_______________________________________"));
  out.push(pComPlaceholder("<[NOME DO ENCARREGADO]>"));
  out.push(p("Encarregado(a) pelo Tratamento de Dados Pessoais", { italics: true, size: 18 }));
  out.push(pComPlaceholder("<[NOME DA INSTITUIÇÃO]>", { italics: true, size: 18 }));

  out.push(
    ...caixaExemplo([
      "Prezada Sra. Joana da Silva,",
      "Em 15/03/2027 identificamos acesso não autorizado a uma planilha contendo dados de servidores municipais. Os dados afetados, referentes a você, foram: nome completo, CPF, conta bancária utilizada pra recebimento de salário.",
      "Medidas: revogamos o acesso indevido em 30 minutos · planilha removida · apuração instaurada · ANPD comunicada em 3 dias úteis.",
      "Recomendamos monitorar sua conta bancária. Em dúvidas, fale com Maria Silva (Encarregada) — dpo@vegas.gov.br · (00) 0000-0001.",
      "Prefeitura Municipal de Vegas.",
    ]),
  );
  return out;
}

// ===== Função pública parcial — modelos 6-11 inclusos =====
export function modelosInstitucionais(): (Paragraph | Table)[] {
  return [
    ...modelo06_PoliticaPGP(),
    ...modelo07_ClausulasLGPD(),
    ...modelo08_PoliticaRetencao(),
    ...modelo09_TermoConsentimento(),
    ...modelo10_ComunicacaoANPD(),
    ...modelo11_ComunicacaoTitulares(),
  ];
}

// ===== MODELO 12 — Termômetro (você + sua Instituição) =====
// Formulário GERADO das perguntas oficiais do app (lib/termometro-perguntas.ts)
// — se o questionário mudar, este modelo acompanha sozinho. 2 blocos com
// scores SEPARADOS, espelhando o Termômetro do curso.
function modelo12_Termometro(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  // tabela de um bloco: pergunta → opções "rótulo (pontos)"
  const tabelaBloco = (dims: DimensaoTermometro[]) =>
    tabelaCampos(
      dims.map((d) => [
        `${d.emoji} ${d.titulo}`,
        `<[MARCAR — ${d.opcoes.map((o) => `${o.rotulo} (${o.pontos})`).join(" · ")}]>`,
      ]),
    );

  // faixas com o intervalo numérico (ex.: "40-59 — Bom domínio (…)")
  const bulletsFaixas = (faixas: FaixaTermometro[]) =>
    [...faixas]
      .map((f, i) => {
        const max = i + 1 < faixas.length ? faixas[i + 1].min - 1 : 100;
        return `${f.min}-${max} — ${f.label} (${f.descricao.replace(/\.$/, "")})`;
      })
      .reverse()
      .map((t) => bullet(t));

  out.push(h1Modelo(13, "Termômetro — auto-diagnóstico (você + sua Instituição)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase Preliminar, como linha de base, e periodicamente (semestral/anual) pra evidenciar a evolução. São 2 blocos com scores SEPARADOS: a Parte 1 mede o conhecimento de CADA PESSOA sobre a LGPD (aplicar individualmente — ex.: antes e depois de capacitações internas); a Parte 2 mede em que etapa da jornada de adequação a INSTITUIÇÃO está — uma pergunta por etapa do PGP (responder em consenso pela equipe do PGP, ou tirar a média das respostas individuais).",
    ),
  );

  out.push(h2("Parte 1 — Sobre você (3 perguntas)"));
  out.push(tabelaBloco(DIMENSOES_PESSOAIS));
  out.push(pComPlaceholder("Score pessoal (0-100) = soma dos pontos ÷ 60 × 100 = <[SCORE]>"));

  out.push(h2("Parte 2 — Sobre a sua Instituição (7 perguntas — uma por etapa do PGP)"));
  out.push(tabelaBloco(DIMENSOES_INSTITUICAO));
  out.push(pComPlaceholder("Score institucional (0-100) = soma dos pontos ÷ 140 × 100 = <[SCORE]>"));

  out.push(h3("Faixas do score pessoal (conhecimento)"));
  out.push(...bulletsFaixas(FAIXAS_PESSOAIS));
  out.push(h3("Faixas do score institucional (maturidade)"));
  out.push(...bulletsFaixas(FAIXAS_TERMOMETRO));

  out.push(
    pComPlaceholder("Aplicação realizada em: <[DATA]> · Aplicado por: <[NOME — opcional]>"),
  );

  out.push(
    ...caixaExemplo([
      "Aplicação em 15/01/2027 — servidor(a) da Prefeitura Municipal de Vegas:",
      "Parte 1 (você): 10 + 10 + 5 = 25 pontos → 25 ÷ 60 × 100 = score pessoal 42/100 — Conhecimento em construção.",
      "Parte 2 (instituição): 10 + 10 + 10 + 5 + 5 + 5 + 5 = 50 pontos → 50 ÷ 140 × 100 = score institucional 36/100 — Maturidade Inicial.",
      "Reaplicar em 6 meses pra acompanhar a evolução dos 2 scores.",
    ]),
  );
  return out;
}

// ===== MODELO 13 — Matriz de Priorização (Res. CD/ANPD nº 2/2022) =====
function modelo13_MatrizPriorizacao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(14, "Matriz de Priorização de Processos (Res. CD/ANPD nº 2/2022)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 2 do PGP, pra identificar quais processos são de ALTO RISCO — esses entram primeiro no Inventário (Fase 3) e exigem RIPD (Art. 38). Aplique a regra '1+1' da Resolução a cada processo: é alto risco quando atende a pelo menos UM critério GERAL E a pelo menos UM ESPECÍFICO.",
    ),
  );

  out.push(h2("Formulário pra preencher por processo"));
  out.push(pComPlaceholder("Processo avaliado: <[NOME DO PROCESSO]>", { bold: true, spacingAfter: 240 }));

  out.push(h3("1) Critério GERAL — larga escala (atende se marcar ao menos um)"));
  out.push(
    tabelaCampos([
      ["a) Número significativo de titulares", "<[ (  ) Aplica   (  ) Não aplica ]>"],
      ["b) Volume de dados envolvidos", "<[ (  ) Aplica   (  ) Não aplica ]>"],
      ["c) Duração, frequência e extensão geográfica", "<[ (  ) Aplica   (  ) Não aplica ]>"],
    ]),
  );

  out.push(h3("2) Critério ESPECÍFICO (atende se marcar ao menos um)"));
  out.push(
    tabelaCampos([
      ["a) Tecnologias emergentes ou inovadoras", "<[ (  ) Aplica   (  ) Não aplica ]>"],
      ["b) Vigilância de zonas acessíveis ao público", "<[ (  ) Aplica   (  ) Não aplica ]>"],
      ["c) Decisões unicamente automatizadas / profiling", "<[ (  ) Aplica   (  ) Não aplica ]>"],
      ["d) Dados sensíveis ou de crianças, adolescentes e idosos", "<[ (  ) Aplica   (  ) Não aplica ]>"],
    ]),
  );

  out.push(pComPlaceholder("Veredito (regra 1+1): <[ALTO RISCO se marcou ≥1 Geral E ≥1 Específico — senão, risco padrão]>", { bold: true }));
  out.push(pComPlaceholder("Justificativa: <[Comentário curto — opcional mas recomendado]>"));

  out.push(h3("Ranking dos processos"));
  out.push(p("Liste primeiro os processos de ALTO RISCO; entre eles, os com mais critérios marcados. Esses entram no Inventário detalhado da Fase 3 e exigem RIPD."));

  out.push(
    ...caixaExemplo([
      "Processo: Atendimento no Posto de Saúde Dr. Joaquim Bento",
      "GERAL: número de titulares (Aplica) · volume de dados (Aplica) · duração/extensão (Não aplica).",
      "ESPECÍFICO: tecnologias (Não aplica) · vigilância (Não aplica) · decisões automatizadas (Não aplica) · dados sensíveis ou vulneráveis (Aplica — saúde + idosos).",
      "Veredito: ALTO RISCO (tem ≥1 geral E ≥1 específico). Entra como prioridade nº 1 no Inventário e exige RIPD.",
    ]),
  );
  return out;
}

// ===== MODELO 14 — Ficha de Processo (Inventário) =====
function modelo14_FichaProcesso(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(15, "Ficha de Processo (Inventário)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 3 do PGP, pra cada processo de tratamento mapeado. Documenta o ciclo completo: titulares, dados, finalidade, base legal, retenção, compartilhamentos, medidas. Reproduzir 1 ficha por processo.",
    ),
  );

  out.push(h2("Formulário"));
  out.push(
    tabelaCampos([
      ["Nome do processo", "<[NOME — ex: Atendimento no Posto de Saúde]>"],
      ["Setor responsável", "<[SETOR — ex: Secretaria Municipal de Saúde]>"],
      ["Dono do processo", "<[CARGO — ex: Gerente do Posto Central]>"],
      ["Categorias de titulares", "<[ex: cidadãos atendidos · responsáveis de menores · servidores envolvidos]>"],
      ["Tipos de dados coletados", "<[lista granular — ex: nome, CPF, endereço, telefone, prontuário, prescrições]>"],
      ["Dados sensíveis?", "<[Sim/Não — se sim, listar quais: saúde / opinião política / etc.]>"],
      ["Finalidade", "<[descrição clara e específica]>"],
      ["Base legal (Art. 7º e/ou Art. 11)", "<[ex: Art. 7º III (políticas públicas) + Art. 11 II 'a' (saúde)]>"],
      ["Como os dados são coletados", "<[ex: formulário físico no balcão + cadastro no sistema Saúde+]>"],
      ["Onde são armazenados", "<[ex: sistema Saúde+ (hospedado em data center municipal) + arquivo físico de fichas]>"],
      ["Quem tem acesso", "<[perfis: médico, enfermeiro, recepção, gestor — segregação por perfil]>"],
      ["Compartilhamentos internos", "<[outros setores do órgão que recebem]>"],
      ["Compartilhamentos externos (operadores/órgãos)", "<[empresas contratadas, outros órgãos públicos — com cláusulas LGPD]>"],
      ["Prazo de retenção", "<[ex: 20 anos da última consulta — CFM Res. 1.821/2007]>"],
      ["Procedimento de descarte", "<[ex: anonimização após 20 anos / fragmentação física dos prontuários]>"],
      ["Medidas de segurança técnicas", "<[ex: login individual + perfil + logs + backup criptografado]>"],
      ["Medidas administrativas", "<[ex: treinamento anual obrigatório, termo de responsabilidade individual]>"],
      ["Aprovado pelo DPO em", "<[DATA — após revisão]>"],
    ]),
  );

  out.push(
    ...caixaExemplo([
      "Processo: Atendimento no Posto de Saúde Dr. Joaquim Bento · Setor: SMS · Dono: Dra. Ana (Gerente)",
      "Titulares: cidadãos atendidos (~24mil/ano) + responsáveis de menores. Dados: cadastrais + sensíveis de saúde (prontuário, prescrições, exames).",
      "Base legal: Art. 7º III (políticas públicas — SUS) + Art. 11 II 'a' (tutela da saúde).",
      "Sistema Saúde+ (DC municipal) + prontuário físico. Acesso por perfil (médico/enfermeiro/recepção).",
      "Retenção: 20 anos da última consulta. Descarte: anonimização agregada pra estatística + fragmentação dos físicos.",
      "Aprovado por Maria Silva (Encarregada) em 15/04/2027.",
    ]),
  );
  return out;
}

// ===== MODELO 15 — Ficha de Risco com matriz P × I =====
function modelo15_FichaRisco(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(16, "Ficha de Risco com matriz P × I"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 3 do PGP, junto do Inventário. Pra cada processo, identificar 2-4 riscos principais. Classificar Probabilidade × Impacto na matriz 3x3 (Baixa/Média/Alta).",
    ),
  );

  out.push(h2("Formulário"));
  out.push(
    tabelaCampos([
      ["Risco — título curto", "<[NOME — ex: Acesso indevido por servidor sem necessidade funcional]>"],
      ["Processo relacionado", "<[NOME DO PROCESSO]>"],
      ["Categoria do risco", "<[Confidencialidade / Integridade / Disponibilidade / Princípio da finalidade / Outro]>"],
      ["Descrição (cenário concreto)", "<[Cenário plausível — quem faz o quê, com qual consequência ao titular]>"],
      ["Probabilidade", "<[BAIXA / MÉDIA / ALTA]>"],
      ["Impacto", "<[BAIXO / MÉDIO / ALTO]>"],
      ["Severidade resultante", "<[Da matriz 3x3 — BAIXO / MÉDIO / ALTO]>"],
      ["Medidas de mitigação propostas", "<[Ações concretas pra reduzir probabilidade ou impacto]>"],
      ["Responsável pela mitigação", "<[NOME ou setor]>"],
      ["Prazo de implementação", "<[DATA esperada]>"],
      ["Risco residual após mitigação", "<[BAIXO / MÉDIO — aceitável; ALTO = exige escalada]>"],
    ]),
  );

  out.push(h3("Matriz 3x3 de referência"));
  out.push(p("Probabilidade × Impacto → Severidade:"));
  out.push(bullet("Baixa × Baixo = BAIXO · Baixa × Médio = BAIXO · Baixa × Alto = MÉDIO"));
  out.push(bullet("Média × Baixo = BAIXO · Média × Médio = MÉDIO · Média × Alto = ALTO"));
  out.push(bullet("Alta × Baixo = MÉDIO · Alta × Médio = ALTO · Alta × Alto = ALTO"));

  out.push(
    ...caixaExemplo([
      "Risco: Acesso indevido à folha de pagamento por servidor não-autorizado · Processo: Folha de Pagamento · Categoria: Princípio da finalidade.",
      "Cenário: servidor com acesso amplo consulta dados de colegas por curiosidade.",
      "Probabilidade ALTA × Impacto MÉDIO = Severidade ALTA.",
      "Mitigação: revisão de perfis (princípio do menor privilégio) · ativação de logs de consulta · auditoria trimestral · treinamento + termo individual de responsabilidade.",
      "Responsável: TI + RH. Prazo: 30 dias. Risco residual esperado: BAIXO.",
    ]),
  );
  return out;
}

// ===== MODELO 16 — GAP — Planilha de Avaliação de Controles =====
function modelo16_GAP(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(17, "GAP — Planilha de Avaliação de Controles"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 4 do PGP. Pra cada controle do catálogo, a Instituição se classifica em ADERENTE / PARCIAL / NÃO ADERENTE com justificativa. Cada NÃO ADERENTE vira ação no Plano (Fase 5).",
    ),
  );

  out.push(h2("Formulário — por controle"));
  out.push(
    tabelaCampos([
      ["ID do controle", "<[1-30 do pacote do curso — ou referência do catálogo institucional]>"],
      ["Texto do controle", "<[ex: Encarregado (DPO) designado por ato formal e publicado]>"],
      ["Área / Fase do PGP", "<[ex: Fase 1 — Governança]>"],
      ["Classificação", "<[ADERENTE / PARCIAL / NÃO ADERENTE / APOIO PENDENTE]>"],
      ["Justificativa", "<[Explicação técnica/objetiva da classificação]>"],
      ["Evidências", "<[Documentos, sistemas, processos que comprovam a aderência]>"],
      ["Setor de apoio (se APOIO PENDENTE)", "<[TI / Jurídico / Comunicação / RH / etc.]>"],
      ["Avaliado por", "<[NOME do Encarregado ou Comitê]>"],
      ["Data da avaliação", "<[DATA]>"],
    ]),
  );

  out.push(h3("Pontuação consolidada do GAP"));
  out.push(p("Score = ((aderentes × 100) + (parciais × 50)) / (total avaliado × 100)"));
  out.push(p("Avaliados = aderentes + parciais + não-aderentes (APOIO PENDENTE não conta no denominador)"));
  out.push(p("Faixa: ≥80% maturidade alta · 60-79 média · 40-59 em construção · <40 inicial"));

  out.push(
    ...caixaExemplo([
      "Controle 04 (Fase 1) · Encarregado designado por ato formal · ADERENTE · Justificativa: Portaria nº 03/2026 publicada no DOM-Vegas em 15/03/2026 · Evidências: cópia da Portaria + contatos no portal · Avaliado por: Maria Silva em 20/04/2027.",
      "Controle 22 (Fase 6) · Cláusulas LGPD em contratos com operadores · NÃO ADERENTE · Justificativa: 30 contratos vigentes; só 5 têm cláusulas. Aditamento em andamento pelos demais · Evidência: lista de contratos da Administração · Vira ação no Plano (prazo 90 dias).",
    ]),
  );
  return out;
}

// ===== MODELO 17 — Plano de Ação =====
function modelo17_PlanoAcao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(18, "Plano de Ação"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 5 do PGP. Cada controle NÃO ADERENTE do GAP + cada risco ALTO vira uma ação no Plano. Acompanhamento mensal pelo Comitê de Privacidade.",
    ),
  );

  out.push(h2("Formulário — por ação"));
  out.push(
    tabelaCampos([
      ["Ação", "<[Descrição clara e específica do que será feito]>"],
      ["Origem", "<[GAP / RISCO / DIAGNÓSTICO / MANUAL]>"],
      ["Referência (ID)", "<[ID do controle GAP ou risco que originou]>"],
      ["Responsável", "<[NOME e/ou SETOR responsável]>"],
      ["Prioridade", "<[BAIXA / MÉDIA / ALTA]>"],
      ["Prazo", "<[DATA esperada]>"],
      ["Status atual", "<[ABERTA / EM ANDAMENTO / CONCLUÍDA]>"],
      ["Evidência de conclusão", "<[Preencher quando concluída]>"],
      ["Observações", "<[Eventuais bloqueios, dependências, decisões do Comitê]>"],
    ]),
  );

  out.push(h3("Boas práticas do Plano"));
  out.push(bullet("Cada ação com responsável NOMEADO (não setor genérico). Sem nome, não anda."));
  out.push(bullet("Prazo realista — não defina prazos heróicos que ninguém vai cumprir."));
  out.push(bullet("Acompanhamento MENSAL pelo Comitê de Privacidade — pauta fixa de revisão."));
  out.push(bullet("Ações concluídas devem ser ARQUIVADAS (não excluídas) — vira histórico institucional."));
  out.push(bullet("Ações com mais de 3 meses sem progresso → reavaliar viabilidade ou repriorizar."));

  out.push(
    ...caixaExemplo([
      "Ação: Promover aditivo contratual com cláusulas LGPD em 30 contratos vigentes pré-2020.",
      "Origem: GAP (controle 22). Responsável: Pedro Costa (Procuradoria). Prioridade ALTA. Prazo: 90 dias. Status: EM ANDAMENTO (10/30 concluídos).",
      "Observação: priorizar contratos com operadores que tratam dados sensíveis ou em larga escala.",
    ]),
  );
  return out;
}

// ===== MODELO 18 — RIPD (8 seções estruturadas) =====
function modelo18_RIPD(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(19, "RIPD — Relatório de Impacto à Proteção de Dados"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 6 do PGP, pra processos de ALTO RISCO (Art. 38 LGPD): dados sensíveis em larga escala, vigilância sistemática, decisões automatizadas, dados de crianças/adolescentes, tecnologias inovadoras. Reproduzir 1 RIPD por processo crítico.",
    ),
  );

  out.push(h2("Template — 8 seções"));
  out.push(pComPlaceholder("RIPD — <[NOME DO PROCESSO]>", { bold: true, align: AlignmentType.CENTER, spacingAfter: 240 }));

  out.push(h3("Seção 1 — Identificação do controlador e do Encarregado"));
  out.push(
    pComPlaceholder(
      "Controlador: <[NOME DA INSTITUIÇÃO]>, CNPJ <[CNPJ]>. Encarregado(a): <[NOME]>, contatos <[E-MAIL/TELEFONE]>. Operadores envolvidos: <[LISTAR — empresas/órgãos que processam dados em nome do controlador, com referência aos contratos]>.",
    ),
  );

  out.push(h3("Seção 2 — Descrição do tratamento e finalidades"));
  out.push(
    pComPlaceholder(
      "<[DESCREVER — natureza do tratamento, finalidades específicas, categorias de titulares afetados, fluxos de dados (origem → tratamento → destino)]>.",
    ),
  );

  out.push(h3("Seção 3 — Necessidade e proporcionalidade"));
  out.push(
    pComPlaceholder(
      "<[JUSTIFICAR — por que os dados tratados são os ESTRITAMENTE necessários à finalidade? Há alternativa menos invasiva à privacidade que cumpra a mesma finalidade?]>",
    ),
  );

  out.push(h3("Seção 4 — Riscos identificados aos direitos dos titulares"));
  out.push(
    pComPlaceholder(
      "<[LISTAR — riscos concretos pros titulares: vazamento por acesso indevido, uso para fim incompatível, decisão automatizada equivocada, discriminação, etc.]>",
    ),
  );

  out.push(h3("Seção 5 — Medidas de segurança e mitigação"));
  out.push(
    pComPlaceholder(
      "<[DESCREVER MEDIDAS — técnicas (criptografia, controle de acesso, logs, backup) + administrativas (treinamento, termo de responsabilidade, política interna)]>.",
    ),
  );

  out.push(h3("Seção 6 — Mecanismos pra exercício de direitos do titular"));
  out.push(
    pComPlaceholder(
      "Canal DSR pra este processo: <[E-MAIL/FORMULÁRIO/TELEFONE]>. Prazo de resposta: 15 dias úteis (Art. 19 II LGPD). Documentar como cada direito do Art. 18 é operacionalmente atendido.",
    ),
  );

  out.push(h3("Seção 7 — Decisão e responsabilidades"));
  out.push(
    pComPlaceholder(
      "<[O TRATAMENTO É APROVADO? Sim/Não/Condicional. Quais condições? Quem assina? Responsabilidades dos atores envolvidos (DPO, dono do processo, TI, operadores).]>",
    ),
  );

  out.push(h3("Seção 8 — Revisão e atualização"));
  out.push(p("Este RIPD será revisado em <[PRAZO — recomendado anual]> ou antes em caso de: mudança significativa no fluxo · novo sistema · novo operador · alteração legislativa · incidente relevante."));

  out.push(p("", { spacingAfter: 400 }));
  out.push(pComPlaceholder("<[CIDADE]>, <[DATA]>.", { align: AlignmentType.RIGHT }));
  out.push(p("_______________________________________", { align: AlignmentType.CENTER }));
  out.push(pComPlaceholder("<[NOME DO ENCARREGADO]>", { align: AlignmentType.CENTER }));
  out.push(p("Encarregado(a) pelo Tratamento de Dados Pessoais", { align: AlignmentType.CENTER, italics: true, size: 18 }));

  out.push(
    ...caixaExemplo([
      "RIPD — Atendimento no Posto de Saúde Dr. Joaquim Bento",
      "Controlador: PM Vegas. Encarregada: Maria Silva. Operadores: empresa de TI hospedando o sistema Saúde+ (contrato 022/2024 com cláusulas LGPD).",
      "Tratamento: prontuário eletrônico, agendamento, exames. ~24mil titulares/ano, dados sensíveis de saúde.",
      "Riscos: vazamento por acesso indevido · acesso por servidor sem necessidade funcional · perda do banco em falha técnica.",
      "Mitigação: login individual + segregação por perfil + logs + backup criptografado + treinamento anual + termo de responsabilidade.",
      "Aprovado pela Encarregada em 20/05/2027. Próxima revisão: 20/05/2028.",
    ]),
  );
  return out;
}

// ===== MODELO 19 — Ficha de Operador (Terceiro) =====
function modelo19_FichaOperador(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(20, "Ficha de Operador (Terceiro)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 6 do PGP, pra cada operador (terceiro que trata dados em nome da Instituição). Mantém registro centralizado dos contratos com cláusulas LGPD e do nível de risco. Reproduzir 1 ficha por operador.",
    ),
  );

  out.push(h2("Formulário"));
  out.push(
    tabelaCampos([
      ["Nome do operador", "<[NOME DA EMPRESA/ÓRGÃO]>"],
      ["CNPJ", "<[CNPJ]>"],
      ["Serviço prestado", "<[DESCRIÇÃO — ex: hospedagem do sistema de ouvidoria]>"],
      ["Papel LGPD", "<[OPERADOR / CONTROLADOR CONJUNTO]>"],
      ["Contrato nº", "<[NÚMERO/ANO]>"],
      ["Objeto do contrato", "<[DESCRIÇÃO RESUMIDA]>"],
      ["Vigência (início — fim)", "<[DATA — DATA]>"],
      ["Cláusulas LGPD incluídas?", "<[SIM / NÃO / EM ADITAMENTO]>"],
      ["Tipo de operação contratual", "<[CONTRATO_NOVO_CLAUSULAS / RENOVACAO_ADITIVAR / ADITIVO_NECESSARIO]>"],
      ["Nível de risco", "<[BAIXO / MÉDIO / ALTO]>"],
      ["Critérios do nível de risco", "<[Quais critérios da Res. CD/ANPD nº 2/2022 se aplicam]>"],
      ["Dados pessoais tratados", "<[CATEGORIAS — cadastrais, sensíveis, financeiros, etc.]>"],
      ["Volume de titulares afetados", "<[ESTIMATIVA]>"],
      ["Subcontratação autorizada?", "<[SIM/NÃO — se sim, listar sub-operadores]>"],
      ["Transferência internacional?", "<[SIM/NÃO — se sim, fundamento legal Art. 33 LGPD]>"],
      ["Due Diligence aplicada", "<[Score% — opcional, baseado em questionário]>"],
      ["Cadastrado em / por", "<[DATA — NOME do responsável]>"],
    ]),
  );

  out.push(
    ...caixaExemplo([
      "Operador: Empresa Hipotética Tecnologia LTDA · CNPJ 00.000.000/0001-00",
      "Serviço: hospedagem em nuvem do sistema de Ouvidoria (SaaS) · Papel: OPERADOR · Contrato: 045/2024 · Vigência: 01/01/2024 a 31/12/2026",
      "Cláusulas LGPD: SIM (incluídas na minuta) · Tipo: CONTRATO_NOVO_CLAUSULAS · Nível de risco: MÉDIO",
      "Dados: cadastrais + conteúdo das manifestações da Ouvidoria · Volume: ~1.200 titulares/ano",
      "Subcontratação: não · Transferência internacional: não (DC em SP)",
      "Cadastrado em 15/01/2024 por Pedro Costa (Procuradoria)",
    ]),
  );
  return out;
}

// ===== MODELO 20 — Registro de Solicitação DSR =====
function modelo20_RegistroDSR(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Modelo(21, "Registro de Solicitação DSR (Direitos do Titular)"));
  out.push(
    ...caixaInstrucao(
      "Quando usar",
      "Na Fase 6 do PGP, pra cada solicitação recebida pelo canal DSR. Mantém registro do prazo de resposta (15 dias úteis — Art. 19 II LGPD) e da resposta dada. Reproduzir 1 ficha por solicitação.",
    ),
  );

  out.push(h2("Formulário"));
  out.push(
    tabelaCampos([
      ["Número da solicitação", "<[PROTOCOLO INTERNO]>"],
      ["Data de recebimento", "<[DATA]>"],
      ["Canal de entrada", "<[E-mail / Formulário web / Telefone / Presencial / Carta]>"],
      ["Nome do titular", "<[NOME DO TITULAR]>"],
      ["Contato do titular", "<[E-MAIL ou TELEFONE]>"],
      ["Identidade confirmada?", "<[SIM/NÃO/COM RESSALVAS — método de confirmação]>"],
      ["Tipo de solicitação (Art. 18 LGPD)", "<[CONFIRMAÇÃO / ACESSO / CORREÇÃO / ANONIMIZAÇÃO / BLOQUEIO / ELIMINAÇÃO / PORTABILIDADE / OPOSIÇÃO / INFORMAÇÃO SOBRE COMPARTILHAMENTO / REVOGAÇÃO DE CONSENTIMENTO]>"],
      ["Descrição da solicitação", "<[Texto literal do pedido OU resumo]>"],
      ["Setor envolvido (processo de origem)", "<[QUAL setor trata os dados solicitados]>"],
      ["Status atual", "<[ABERTA / EM ANÁLISE / RESPONDIDA / NEGADA]>"],
      ["Prazo de resposta (15 dias úteis)", "<[DATA LIMITE]>"],
      ["Data da resposta", "<[DATA]>"],
      ["Resposta dada", "<[Texto da resposta enviada ao titular]>"],
      ["Justificativa (se NEGADA)", "<[Fundamento legal pra negativa — Art. 18 §4º / outros]>"],
      ["Responsável pelo atendimento", "<[NOME — DPO ou pessoa designada]>"],
    ]),
  );

  out.push(h3("Indicadores recomendados"));
  out.push(bullet("% de solicitações respondidas dentro do prazo (meta: 100%)"));
  out.push(bullet("Tempo médio de resposta (em dias úteis)"));
  out.push(bullet("Distribuição por tipo de solicitação (qual direito é mais exercido?)"));
  out.push(bullet("Distribuição por canal de entrada"));

  out.push(
    ...caixaExemplo([
      "Protocolo: DSR-2027-014 · Recebida em 10/04/2027 · Canal: e-mail dpo@vegas.gov.br",
      "Titular: João Silva (joao.silva@email.com) · Identidade confirmada via cópia de RG (anexa)",
      "Tipo: ACESSO · Solicita cópia das informações que a PMVegas tem sobre ele em manifestações de Ouvidoria do último ano",
      "Setor envolvido: Ouvidoria · Status: RESPONDIDA · Prazo: 02/05/2027 · Data resposta: 18/04/2027 (8 dias úteis)",
      "Resposta: encaminhada cópia das 3 manifestações em nome do titular, com tarja em dados de terceiros mencionados",
      "Responsável: Maria Silva (Encarregada)",
    ]),
  );
  return out;
}

// ===== Função pública parcial — modelos 12-20 inclusos =====
export function modelosFichasOperacionais(): (Paragraph | Table)[] {
  return [
    ...modelo12_Termometro(),
    ...modelo13_MatrizPriorizacao(),
    ...modelo14_FichaProcesso(),
    ...modelo15_FichaRisco(),
    ...modelo16_GAP(),
    ...modelo17_PlanoAcao(),
    ...modelo18_RIPD(),
    ...modelo19_FichaOperador(),
    ...modelo20_RegistroDSR(),
  ];
}

// =============================================================================
// FUNÇÃO PRINCIPAL — agrega tudo
// =============================================================================

export function gerarPacoteModelos(opts: PacoteOpts = {}): (Paragraph | Table)[] {
  return [
    ...capaPacote(opts),
    ...apresentacaoPacote(),
    ...sumarioPacote(),
    ...modelosDocumentosFormais(),
    ...modelosInstitucionais(),
    ...modelosFichasOperacionais(),
  ];
}
