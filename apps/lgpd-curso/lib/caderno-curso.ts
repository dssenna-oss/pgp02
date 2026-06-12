// Caderno do Curso — engine de geração do DOCX consolidado.
//
// Recebe dados completos do grupo (Company + relações) e produz a estrutura
// de parágrafos/tabelas pro DOCX final. Cada uma das 8 etapas (Preliminar + 7
// Fases) tem 3 partes:
//   1. Conteúdo institucional (educativo)
//   2. O que vocês fizeram (dados reais do grupo)
//   3. Próximos passos (recomendações)
//
// Quando o grupo não fez uma prática, a engine preenche com dados-modelo do
// `caderno-modelo.ts` marcados com selo "📌 Modelo de referência".

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
  PageBreak,
} from "docx";
import type { DescricaoBloco } from "./conteudo-fases";
import { CONTEUDO_FASES, getConteudoFase } from "./conteudo-fases";
import {
  CONTEUDO_PRELIMINAR,
  CONTEUDO_FASE_1,
  CONTEUDO_FASE_2,
  MODELO_TERMOMETRO_INICIO,
  MODELO_TERMOMETRO_FIM,
  MODELO_INVENTARIO_PROCESSOS,
  MODELO_RISCOS,
  MODELO_GAP_RESPOSTAS,
  MODELO_ACOES_PLANO,
  MODELO_RIPD,
  MODELO_OPERADORES,
  MODELO_DSR,
  MODELO_INCIDENTE,
  MODELO_PRI_EQUIPE,
  MODELO_PRI_RACI,
  MODELO_AVISO_PRIVACIDADE_RESUMO,
  PROXIMOS_PASSOS_POR_FASE,
  SELO_MODELO,
} from "./caderno-modelo";
import { DIMENSOES_TERMOMETRO, DIMENSOES_PESSOAIS, DIMENSOES_INSTITUICAO, faixaQualitativa, faixaPessoal, montarTurmaTermometro, type TurmaTermometro } from "./termometro-perguntas";
import { CRITERIOS_PRIORIZACAO, faixaPriorizacao } from "./criterios-priorizacao";
import { getControleById } from "./gap-catalogo";
import { gerarRoadmap90Dias } from "./roadmap-gerador";
import { gerarCartaAutoPreenchida } from "./carta-alta-gestao";
import { calcularMaturidade, nivelMaturidade, type KpisGrupo } from "./maturidade";
import {
  CONTEUDO_A_CARTA_SERVICOS,
  CONTEUDO_B_MODELO_POLITICA_PGP,
  CONTEUDO_B_COMUNICACAO_ANPD,
  CONTEUDO_B_CLAUSULAS_LGPD,
  CONTEUDO_B_POLITICA_RETENCAO,
  CONTEUDO_B_TERMO_CONSENTIMENTO,
  CONTEUDO_C_INTRO_PEGADINHAS,
  CONTEUDO_D_GLOSSARIO,
  CONTEUDO_E_BASE_LEGAL,
  CONTEUDO_F_PORTE,
  CONTEUDO_G_CALENDARIO,
  CONTEUDO_H_CHECKLIST,
  CONTEUDO_I_FAQ,
  CONTEUDO_J_REFERENCIAS,
  CONTEUDO_K_ROTEIROS,
} from "./cartilha-conteudo";
import { PEGADINHAS_PROCESSOS } from "./processos-pegadinhas";
import { CATALOGO_ERROS_PLANTADOS } from "./aviso-erros-plantados";

// =============================================================================
// Tipo dos dados de entrada (formato do retorno do prisma.cursoGrupo.findUnique
// no endpoint /api/curso/caderno/docx — campos relevantes documentados).
// =============================================================================

export type GrupoCadernoData = {
  // Respostas INDIVIDUAIS do Termômetro dos membros do grupo (cada um avaliou
  // a si — scorePessoal — e o próprio órgão real — score). Injetado pelo
  // loader da rota /caderno/docx. Ausente/vazio = ninguém preencheu → fallback
  // de modelo.
  termometros?: Array<{ userId: string; momento: string; score: number; scorePessoal: number }>;
  grupo: {
    id: string;
    numero: number;
    orgao: string;
    turma: { nome: string; cidade: string };
    company: {
      id: string;
      name: string;
      cnpj: string | null;
      orgao: string | null;
      cidade: string | null;
      dpoName: string | null;
      dpoEmail: string | null;
      dpoTelefone: string | null;
      dpoEndereco: string | null;
      dpoSubstitutoNome: string | null;
      dpoSubstitutoEmail: string | null;
      dpoSubstitutoTelefone: string | null;
      dpoJustificativaEscolha: string | null;
      setoresDiscutidos: any;
      priorizacaoProcessos: any;
      termometroInicio: any;
      termometroFim: any;
      cartaAltaGestao: any;
      users: Array<{ name: string; papel: string | null; role: string }>;
      inventories: Array<{
        id: string;
        nome: string;
        setor: string | null;
        finalidade: string | null;
        baseLegal: string | null;
        tiposDados: string | null;
        dadosSensiveis: boolean | null;
        retencao: string | null;
        compartilhamento: string | null;
        medidasSeguranca: string | null;
        status: string;
      }>;
      risks: Array<{
        id: string;
        riscoTitulo: string;
        descricao: string | null;
        categoria: string | null;
        severityLevel: string | null;
        mitigationPlan: string | null;
        status: string;
        inventory: { nome: string } | null;
      }>;
      gapAnswers: Array<{
        controleId: number;
        controleTexto: string;
        area: string;
        resposta: string;
        justificativa: string | null;
        setorApoio: string | null;
      }>;
      actions: Array<{
        acao: string;
        responsavel: string | null;
        prazo: Date | null;
        status: string;
        prioridade: string | null;
        origem: string;
      }>;
      ripds: Array<{
        titulo: string;
        inventoryRef: string | null;
        status: string;
        sections: Array<{ numero: number; titulo: string; conteudo: string | null }>;
      }>;
      operators: Array<{
        nome: string;
        cnpj: string | null;
        servico: string | null;
        papel: string | null;
        contracts: Array<{
          numero: string | null;
          objeto: string | null;
          vigenciaInicio: Date | null;
          vigenciaFim: Date | null;
          clausulasLgpd: boolean;
          tipoOperacao: string | null;
          nivelRisco: string | null;
        }>;
      }>;
      dsrRequests: Array<{
        titularNome: string;
        titularContato: string;
        tipoSolicitacao: string;
        descricao: string | null;
        status: string;
        respostaTexto: string | null;
      }>;
      policies: Array<{
        slug: string;
        titulo: string;
        status: string;
        publicSlug: string | null;
        conteudoMd: string;
      }>;
      incidents: Array<{
        titulo: string;
        descricao: string | null;
        severidade: string;
        status: string;
        ocorridoEm: Date | null;
        detectadoEm: Date | null;
        comunicadoAnpd: boolean;
        comunicadoTitular: boolean;
        formularioAnpd: any;
        formularioTitulares: any;
      }>;
      priMembros: Array<{
        nome: string;
        papel: string;
        contato24h: string | null;
        email: string | null;
        cobertura: string | null;
      }>;
      priRaci: Array<{ etapaNist: string; papel: string; tipo: string }>;
    };
  };
};

// =============================================================================
// Helpers de docx-js — estilos consistentes em todo o documento
// =============================================================================

const COR_TITULO = "1E40AF"; // azul institucional
const COR_FASE_HEADER = "1E293B";
const COR_ACCENT = "2563EB";
const COR_MODELO_BG = "FEF3C7"; // amarelo claro pra blocos modelo
const COR_FEZ_BG = "D1FAE5"; // verde claro pra blocos do grupo

function h1(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 480, after: 240 },
    pageBreakBefore: true,
    children: [new TextRun({ text: texto, bold: true, size: 36, color: COR_TITULO })],
  });
}

function h2(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text: texto, bold: true, size: 28, color: COR_ACCENT })],
  });
}

function h3(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: texto, bold: true, size: 24 })],
  });
}

function p(
  texto: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    align?: typeof AlignmentType[keyof typeof AlignmentType];
    size?: number;
    color?: string;
    spacingAfter?: number;
    indent?: number;
  } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 140 },
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

// Aplica negrito a trechos delimitados por **...** (igual markdown).
function pComBold(texto: string, opts: { spacingAfter?: number } = {}): Paragraph {
  const runs: TextRun[] = [];
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  for (const parte of partes) {
    if (!parte) continue;
    if (parte.startsWith("**") && parte.endsWith("**")) {
      runs.push(new TextRun({ text: parte.slice(2, -2), bold: true, size: 22 }));
    } else {
      runs.push(new TextRun({ text: parte, size: 22 }));
    }
  }
  return new Paragraph({
    spacing: { after: opts.spacingAfter ?? 140 },
    children: runs,
  });
}

function bullet(texto: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text: texto, size: 22 })],
  });
}

function calloutBlock(tom: "aviso" | "info" | "sucesso" | "dica", titulo: string | undefined, texto: string): Paragraph[] {
  const cores: Record<string, { fundo: string; texto: string }> = {
    aviso: { fundo: "FEF2F2", texto: "991B1B" },
    info: { fundo: "EFF6FF", texto: "1E40AF" },
    sucesso: { fundo: "ECFDF5", texto: "065F46" },
    dica: { fundo: "FFFBEB", texto: "92400E" },
  };
  const c = cores[tom];
  const paras: Paragraph[] = [];
  if (titulo) {
    paras.push(
      new Paragraph({
        shading: { type: ShadingType.CLEAR, fill: c.fundo },
        spacing: { before: 120, after: 0 },
        indent: { left: 200, right: 200 },
        children: [new TextRun({ text: titulo, bold: true, color: c.texto, size: 22 })],
      }),
    );
  }
  paras.push(
    new Paragraph({
      shading: { type: ShadingType.CLEAR, fill: c.fundo },
      spacing: { before: 0, after: 240 },
      indent: { left: 200, right: 200 },
      children: [new TextRun({ text: texto, color: c.texto, size: 22 })],
    }),
  );
  return paras;
}

function tabelaCampos(linhas: Array<[string, string]>): Table {
  const rows = linhas.map(
    ([rotulo, valor]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: rotulo, bold: true, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: valor || "—", size: 20 })],
              }),
            ],
          }),
        ],
      }),
  );
  return new Table({
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
  });
}

function seloModelo(): Paragraph {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: COR_MODELO_BG },
    spacing: { before: 120, after: 200 },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: SELO_MODELO, italics: true, size: 20, color: "92400E" }),
    ],
  });
}

function seloFeitoPeloGrupo(): Paragraph {
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: COR_FEZ_BG },
    spacing: { before: 120, after: 200 },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({
        text: "✅ Conteúdo produzido pelo grupo durante o curso",
        italics: true,
        size: 20,
        color: "065F46",
      }),
    ],
  });
}

// Renderiza array de DescricaoBloco do conteudo-fases.ts
function renderDescricaoBlocos(blocos: DescricaoBloco[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of blocos) {
    if (b.tipo === "paragrafo") {
      out.push(pComBold(b.texto));
    } else if (b.tipo === "subtitulo") {
      out.push(h3(b.texto));
    } else if (b.tipo === "lista") {
      for (const item of b.itens) out.push(bullet(item));
    } else if (b.tipo === "callout") {
      out.push(...calloutBlock(b.callout.tom, b.callout.titulo, b.callout.texto));
    }
  }
  return out;
}

// =============================================================================
// SEÇÕES — Capa · Introdução · Encerramento
// =============================================================================

function capa(data: GrupoCadernoData): Paragraph[] {
  const c = data.grupo.company;
  const turma = data.grupo.turma;
  const orgaoNome = data.grupo.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 4000, after: 240 },
      children: [
        new TextRun({ text: "CADERNO DO CURSO", bold: true, size: 56, color: COR_TITULO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 },
      children: [
        new TextRun({
          text: "Programa de Governança em Privacidade",
          italics: true,
          size: 32,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: c.name, bold: true, size: 32 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [
        new TextRun({
          text: `${orgaoNome} de ${turma.cidade} — Grupo ${data.grupo.numero}`,
          italics: true,
          size: 24,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: `Turma: ${turma.nome}`, size: 22, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [
        new TextRun({ text: `Documento elaborado em ${hoje}`, size: 22, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "PGP Treinamento · Curso prático de Lei Geral de Proteção de Dados",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  ];
}

function introducao(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Apresentação"));
  out.push(
    pComBold(
      "Este Caderno consolida o material institucional do curso de LGPD e os documentos produzidos por este grupo ao longo das missões. Foi gerado automaticamente a partir do trabalho realizado nas práticas e é entregue ao final do curso pra servir de **referência institucional** na continuidade da adequação à LGPD na sua Instituição.",
    ),
  );
  out.push(h2("Como ler este Caderno"));
  out.push(
    pComBold(
      "O Caderno está organizado nas **8 etapas do Programa de Governança em Privacidade**: a Fase Preliminar (sensibilização) e as Fases 1 a 7. Cada etapa tem três blocos:",
    ),
  );
  out.push(bullet("📚 Conteúdo institucional — explicação curta da fase, base legal e como proceder."));
  out.push(bullet("✅ O que vocês fizeram — registro do que este grupo produziu durante o curso."));
  out.push(bullet("➡️ Próximos passos — recomendações concretas pra dar continuidade no dia-a-dia."));
  out.push(
    ...calloutBlock(
      "info",
      "Sobre os blocos amarelos",
      "Onde a Instituição ainda não produziu o conteúdo (porque o curso é uma simulação rápida), o Caderno inclui um Modelo de Referência defensável. Esses blocos vêm marcados em amarelo com o selo \"📌 Modelo de referência — substitua pelos dados reais da sua Instituição\". Use-os como ponto de partida, NÃO como entrega final.",
    ),
  );
  out.push(h2("Estrutura do Caderno"));
  out.push(bullet("Fase Preliminar — Sensibilização e Engajamento"));
  out.push(bullet("Fase 1 — Formação das equipes de trabalho"));
  out.push(bullet("Fase 2 — Diagnóstico Inicial"));
  out.push(bullet("Fase 3 — Mapeamento e Análise de Riscos"));
  out.push(bullet("Fase 4 — GAP Analysis"));
  out.push(bullet("Fase 5 — Plano de Ação e Adequação"));
  out.push(bullet("Fase 6 — Execução"));
  out.push(bullet("Fase 7 — Monitoramento Contínuo e Melhoria"));
  out.push(p(""));
  // Painel de Maturidade
  const kpis = calcularKpis(data);
  const score = calcularMaturidade(kpis);
  const nivel = nivelMaturidade(score);
  out.push(h2("Painel de Maturidade do grupo"));
  out.push(
    pComBold(
      `Score de Maturidade: **${score}/100** — ${nivel.label} ${nivel.emoji}`,
    ),
  );
  out.push(p("Quadro-resumo dos instrumentos produzidos:", { spacingAfter: 80 }));
  out.push(
    tabelaCampos([
      ["Processos no Inventário", `${kpis.inventario.total} (aprovados: ${kpis.inventario.aprovados})`],
      ["Riscos identificados", `${kpis.riscos.total} (aprovados: ${kpis.riscos.aprovados})`],
      ["Controles GAP respondidos", `${kpis.gap.respondidos} (score: ${kpis.gap.score}%)`],
      ["RIPDs", `${kpis.ripds.total} (aprovados: ${kpis.ripds.aprovados})`],
      ["Operadores cadastrados", `${kpis.terceiros.total} (com cláusulas LGPD: ${kpis.terceiros.comClausula})`],
      ["Solicitações DSR", `${kpis.dsr.total}`],
      ["Aviso de Privacidade", kpis.aviso.status === "PUBLICADO" ? "Publicado" : kpis.aviso.status === "RASCUNHO" ? "Em rascunho" : "Não iniciado"],
      ["Incidentes registrados", `${kpis.incidentes.total} (comunicados ANPD: ${kpis.incidentes.comunicadosAnpd})`],
    ]),
  );
  return out;
}

function calcularKpis(data: GrupoCadernoData): KpisGrupo {
  const c = data.grupo.company;
  const gapAderentes = c.gapAnswers.filter((g) => g.resposta === "ADERENTE").length;
  const gapParciais = c.gapAnswers.filter((g) => g.resposta === "PARCIAL").length;
  const aviso = c.policies.find((pol) => pol.slug === "aviso-privacidade");
  return {
    inventario: {
      total: c.inventories.length,
      aprovados: c.inventories.filter((i) => i.status === "APROVADO").length,
      submetidos: c.inventories.filter((i) => i.status === "SUBMETIDO").length,
      devolvidos: c.inventories.filter((i) => i.status === "DEVOLVIDO").length,
    },
    riscos: {
      total: c.risks.length,
      aprovados: c.risks.filter((r) => r.status === "APROVADO").length,
      submetidos: c.risks.filter((r) => r.status === "SUBMETIDO").length,
    },
    gap: {
      respondidos: c.gapAnswers.length,
      aderentes: gapAderentes,
      parciais: gapParciais,
      score: c.gapAnswers.length > 0
        ? Math.round(((gapAderentes * 100 + gapParciais * 50) / (c.gapAnswers.length * 100)) * 100)
        : 0,
    },
    ripds: {
      total: c.ripds.length,
      aprovados: c.ripds.filter((r) => r.status === "APROVADO").length,
    },
    terceiros: {
      total: c.operators.length,
      comClausula: c.operators.filter((o) => o.contracts.some((ct) => ct.clausulasLgpd)).length,
    },
    dsr: { total: c.dsrRequests.length },
    aviso: {
      status: (aviso?.status as any) || null,
      publicSlug: aviso?.publicSlug || null,
      conteudoChars: aviso?.conteudoMd?.length || 0,
    },
    incidentes: {
      total: c.incidents.length,
      comunicadosAnpd: c.incidents.filter((i) => i.comunicadoAnpd).length,
      comunicadosTitular: c.incidents.filter((i) => i.comunicadoTitular).length,
    },
  };
}

// =============================================================================
// FASE PRELIMINAR — Sensibilização e Engajamento
// =============================================================================

// Agrega os termômetros INDIVIDUAIS dos membros do grupo num panorama (mini-
// versão do painel da turma do facilitador), nas 2 leituras: conhecimento
// pessoal da equipe + etapa da jornada das instituições. null = ninguém fez.
function agregarTermometroGrupo(data: GrupoCadernoData): TurmaTermometro | null {
  const respostas = data.termometros ?? [];
  type Par = { inicioInst?: number; fimInst?: number; inicioPess?: number; fimPess?: number };
  const porUser = new Map<string, Par>();
  for (const r of respostas) {
    const slot = porUser.get(r.userId) ?? {};
    if (r.momento === "INICIO") {
      slot.inicioInst = r.score;
      slot.inicioPess = r.scorePessoal ?? 0;
    } else if (r.momento === "FIM") {
      slot.fimInst = r.score;
      slot.fimPess = r.scorePessoal ?? 0;
    }
    porUser.set(r.userId, slot);
  }
  const inst = { scoresInicio: [] as number[], scoresFim: [] as number[], saltos: [] as number[] };
  const pess = { scoresInicio: [] as number[], scoresFim: [] as number[], saltos: [] as number[] };
  let preenchidosInicio = 0;
  let preenchidosFim = 0;
  let comAmbos = 0;
  for (const p of porUser.values()) {
    const temInicio = typeof p.inicioInst === "number";
    const temFim = typeof p.fimInst === "number";
    if (temInicio) {
      preenchidosInicio++;
      inst.scoresInicio.push(p.inicioInst!);
      pess.scoresInicio.push(p.inicioPess ?? 0);
    }
    if (temFim) {
      preenchidosFim++;
      inst.scoresFim.push(p.fimInst!);
      pess.scoresFim.push(p.fimPess ?? 0);
    }
    if (temInicio && temFim) {
      comAmbos++;
      inst.saltos.push(p.fimInst! - p.inicioInst!);
      pess.saltos.push((p.fimPess ?? 0) - (p.inicioPess ?? 0));
    }
  }
  if (preenchidosInicio === 0 && preenchidosFim === 0) return null;
  const totalParticipantes = (data.grupo.company.users ?? []).filter((u) => u.role !== "ADMIN").length;
  return montarTurmaTermometro({
    totalParticipantes,
    preenchidosInicio,
    preenchidosFim,
    comAmbos,
    pessoal: pess,
    instituicao: inst,
  });
}

// Renderiza o panorama do grupo no DOCX (mini-versão do painel da turma):
// 2 leituras — conhecimento pessoal da equipe + etapa da jornada das
// instituições — com médias, saltos e distribuições por faixa.
function renderDistribuicaoGrupo(tg: TurmaTermometro): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const temFim = tg.preenchidosFim > 0;

  // helper: tabela de distribuição (melhor faixa primeiro)
  function tabelaDist(bloco: TurmaTermometro["pessoal"]): Table {
    const fIni = [...bloco.distInicio].reverse();
    const fFim = [...bloco.distFim].reverse();
    const linhas: Array<[string, string]> = fIni.map((ini, i) => [
      ini.label,
      temFim ? `início: ${ini.n} · fim: ${fFim[i]?.n ?? 0}` : `${ini.n} participante(s)`,
    ]);
    return tabelaCampos(linhas);
  }

  // 1. Conhecimento pessoal da equipe
  out.push(p("👤 Conhecimento da equipe sobre a LGPD (auto-percepção):", { bold: true }));
  const mediasPess: Array<[string, string]> = [];
  if (tg.pessoal.mediaInicio !== null)
    mediasPess.push(["Média no início", `${tg.pessoal.mediaInicio}/100 — ${faixaPessoal(tg.pessoal.mediaInicio).label}`]);
  if (tg.pessoal.mediaFim !== null)
    mediasPess.push(["Média no fim", `${tg.pessoal.mediaFim}/100 — ${faixaPessoal(tg.pessoal.mediaFim).label}`]);
  if (tg.pessoal.saltoMedio !== null)
    mediasPess.push(["Salto médio de conhecimento", `${tg.pessoal.saltoMedio > 0 ? "+" : ""}${tg.pessoal.saltoMedio} pontos (entre ${tg.comAmbos} que fizeram início e fim)`]);
  if (mediasPess.length) out.push(tabelaCampos(mediasPess));
  out.push(tabelaDist(tg.pessoal));

  // 2. Etapa da jornada das instituições
  out.push(p("🏛️ Estágio das instituições na jornada de adequação (cada participante avaliou o próprio órgão — o leque mostra a diversidade real):", { bold: true }));
  const mediasInst: Array<[string, string]> = [];
  if (tg.instituicao.mediaInicio !== null)
    mediasInst.push(["Maturidade média no início", `${tg.instituicao.mediaInicio}/100 — ${faixaQualitativa(tg.instituicao.mediaInicio).label}`]);
  if (tg.instituicao.mediaFim !== null)
    mediasInst.push(["Maturidade média no fim", `${tg.instituicao.mediaFim}/100 — ${faixaQualitativa(tg.instituicao.mediaFim).label}`]);
  if (tg.instituicao.saltoMedio !== null)
    mediasInst.push(["Salto médio das instituições", `${tg.instituicao.saltoMedio > 0 ? "+" : ""}${tg.instituicao.saltoMedio} pontos`]);
  if (mediasInst.length) out.push(tabelaCampos(mediasInst));
  out.push(tabelaDist(tg.instituicao));
  return out;
}

function renderFasePreliminar(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase Preliminar — Sensibilização e Engajamento"));
  // 1. Conteúdo institucional
  out.push(h2("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_PRELIMINAR));
  // 2. O que vocês fizeram
  out.push(h2("✅ O que vocês fizeram"));
  // 2a. Termômetro Institucional
  out.push(h3("Termômetro Institucional"));
  const panoramaGrupo = agregarTermometroGrupo(data);
  if (panoramaGrupo) {
    out.push(seloFeitoPeloGrupo());
    out.push(
      p(
        `Cada participante respondeu em 2 blocos: quanto EU conheço a LGPD (3 perguntas) e em que etapa da jornada o MEU órgão real está (7 perguntas espelhando as Fases do PGP). Repetido no fim do curso, mostra os 2 saltos. ${panoramaGrupo.preenchidosInicio} de ${panoramaGrupo.totalParticipantes} responderam o início${panoramaGrupo.preenchidosFim ? ` e ${panoramaGrupo.preenchidosFim} o fim` : ""}. Panorama do grupo:`,
      ),
    );
    out.push(...renderDistribuicaoGrupo(panoramaGrupo));
  } else {
    out.push(seloModelo());
    out.push(
      p(
        "Pelos dados-modelo, o diagnóstico de partida deste grupo seria semelhante ao perfil abaixo (auto-diagnóstico da instituição em 7 etapas do PGP — escala Inicial / Em desenvolvimento / Estabelecido / Avançado):",
      ),
    );
    out.push(...renderTermometroModelo(MODELO_TERMOMETRO_INICIO, "Diagnóstico inicial"));
    out.push(...renderTermometroModelo(MODELO_TERMOMETRO_FIM, "Diagnóstico final (esperado após um ciclo)"));
  }
  // 2b. Carta para a Alta Gestão
  out.push(h3("Carta para a Alta Gestão"));
  const carta = data.grupo.company.cartaAltaGestao;
  if (carta && carta.justificativa) {
    out.push(seloFeitoPeloGrupo());
    out.push(...renderCarta(carta));
  } else {
    out.push(seloModelo());
    const c = data.grupo.company;
    const cartaModelo = gerarCartaAutoPreenchida({
      orgao: (data.grupo.orgao as "PM" | "CM") || "PM",
      cidade: data.grupo.turma.cidade,
      nomeOrgao: c.name,
      dpoName: c.dpoName,
    });
    out.push(...renderCarta(cartaModelo));
  }
  // 3. Próximos passos
  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.PRELIMINAR) out.push(bullet(passo));
  return out;
}

function renderTermometroModelo(modelo: any, titulo: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h3(titulo));
  out.push(pComBold(`Score: **${modelo.score}/100** — ${faixaQualitativa(modelo.score).label}`));
  out.push(p(modelo.interpretacao, { italics: true }));
  const linhas: Array<[string, string]> = [];
  for (const dim of DIMENSOES_TERMOMETRO) {
    const escolhida = modelo[dim.id];
    if (!escolhida) continue;
    const op = dim.opcoes.find((o) => o.id === escolhida);
    linhas.push([`${dim.emoji} ${dim.titulo}`, op?.rotulo || "?"]);
  }
  if (linhas.length > 0) out.push(tabelaCampos(linhas));
  return out;
}

function renderCarta(carta: any): Paragraph[] {
  const out: Paragraph[] = [];
  out.push(p(carta.destinatario || "—", { bold: true }));
  out.push(p(""));
  out.push(p("Justificativa", { bold: true, color: COR_ACCENT }));
  for (const linha of (carta.justificativa || "").split("\n")) {
    if (linha.trim()) out.push(p(linha));
  }
  out.push(p("Riscos de não-cumprimento", { bold: true, color: COR_ACCENT }));
  for (const linha of (carta.riscosNaoFazer || "").split("\n")) {
    if (linha.trim()) out.push(p(linha));
  }
  out.push(p("Pedido", { bold: true, color: COR_ACCENT }));
  for (const linha of (carta.pedido || "").split("\n")) {
    if (linha.trim()) out.push(p(linha));
  }
  out.push(p(""));
  for (const linha of (carta.assinatura || "").split("\n")) {
    if (linha.trim()) out.push(p(linha, { italics: true }));
  }
  return out;
}

// =============================================================================
// FASE 1 — Formação das equipes de trabalho (Encarregado/DPO)
// =============================================================================

function renderFase1(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 1 — Formação das equipes de trabalho"));
  out.push(h2("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_FASE_1));
  out.push(h2("✅ O que vocês fizeram"));
  const c = data.grupo.company;
  if (c.dpoName) {
    out.push(seloFeitoPeloGrupo());
    out.push(h3("Encarregado(a) designado(a)"));
    out.push(
      tabelaCampos([
        ["Nome", c.dpoName || "—"],
        ["E-mail", c.dpoEmail || "—"],
        ["Telefone", c.dpoTelefone || "—"],
        ["Endereço de atendimento", c.dpoEndereco || "—"],
      ]),
    );
    if (c.dpoSubstitutoNome) {
      out.push(h3("Encarregado(a) Substituto(a)"));
      out.push(
        tabelaCampos([
          ["Nome", c.dpoSubstitutoNome || "—"],
          ["E-mail", c.dpoSubstitutoEmail || "—"],
          ["Telefone", c.dpoSubstitutoTelefone || "—"],
        ]),
      );
    }
    out.push(h3("Justificativa da escolha"));
    out.push(
      p(
        c.dpoJustificativaEscolha ||
          "Servidor(a) com perfil técnico-jurídico compatível e autonomia funcional pra exercer as atribuições previstas no Art. 41 da LGPD.",
      ),
    );
  } else {
    out.push(seloModelo());
    out.push(h3("Encarregado(a) designado(a)"));
    out.push(
      tabelaCampos([
        ["Nome", "(a designar formalmente)"],
        ["E-mail", "dpo@instituicao.gov.br"],
        ["Telefone", "(00) 0000-0000"],
        ["Endereço", "(endereço institucional do órgão)"],
      ]),
    );
    out.push(h3("Justificativa da escolha (modelo)"));
    out.push(
      p(
        "Servidor(a) com perfil técnico-jurídico compatível, autonomia funcional e acesso direto à alta administração, atendendo às recomendações da Autoridade Nacional de Proteção de Dados — ANPD (Resolução CD/ANPD nº 18/2024) para a designação do Encarregado em órgãos da Administração Pública.",
      ),
    );
  }
  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_1) out.push(bullet(passo));
  return out;
}

// =============================================================================
// FASE 2 — Diagnóstico Inicial
// =============================================================================

function renderFase2(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 2 — Diagnóstico Inicial"));
  out.push(h2("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_FASE_2));

  out.push(h2("✅ O que vocês fizeram"));

  // Setores discutidos
  out.push(h3("Setores que tratam dados pessoais"));
  const setores = data.grupo.company.setoresDiscutidos;
  if (setores && Array.isArray(setores.setores) && setores.setores.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const s of setores.setores) {
      if (s.discutido) {
        out.push(bullet(`${s.id}${s.observacao ? ` — ${s.observacao}` : ""}`));
      }
    }
  } else {
    out.push(seloModelo());
    out.push(p("Lista típica de setores que tratam dados pessoais em um órgão municipal:"));
    const setoresModelo = [
      "Recursos Humanos — folha de pagamento, contratação, processos seletivos",
      "Atendimento ao Cidadão / Ouvidoria — manifestações, denúncias, reclamações",
      "Tributário — cadastro fiscal de contribuintes, IPTU/ISS",
      "Saúde — prontuários eletrônicos, agendamentos, vacinação",
      "Educação — matrículas, registros escolares, dados de responsáveis",
      "Assistência Social — cadastro de famílias, programas sociais",
      "Tecnologia da Informação — gestão de acessos, logs, sistemas",
      "Comunicação — mailing institucional, redes sociais, transmissões",
    ];
    for (const s of setoresModelo) out.push(bullet(s));
  }

  // Matriz de priorização
  out.push(h3("Matriz de priorização de processos"));
  const pri = data.grupo.company.priorizacaoProcessos;
  if (pri && Array.isArray(pri.processos) && pri.processos.length > 0) {
    out.push(seloFeitoPeloGrupo());
    out.push(
      p(
        "Aplicação dos critérios da Resolução CD/ANPD nº 2/2022 aos processos identificados:",
      ),
    );
    for (const proc of pri.processos) {
      out.push(h3(`Processo: ${proc.processoId || "(sem identificador)"}`));
      out.push(pComBold(`Score: **${proc.score}/18** — ${faixaPriorizacao(proc.score).label}`));
      const linhas: Array<[string, string]> = [];
      for (const c of CRITERIOS_PRIORIZACAO) {
        const escolhido = proc.criterios?.[c.id];
        if (!escolhido) continue;
        const op = c.opcoes.find((o) => o.id === escolhido);
        linhas.push([`${c.emoji} ${c.titulo}`, op?.rotulo || "?"]);
      }
      if (linhas.length > 0) out.push(tabelaCampos(linhas));
      if (proc.justificativa) {
        out.push(p(`Justificativa: ${proc.justificativa}`, { italics: true }));
      }
    }
  } else {
    out.push(seloModelo());
    out.push(
      p(
        "A Matriz aplica 6 critérios da Res. CD/ANPD nº 2/2022 (volume, sensibilidade, vulneráveis, exposição, tecnologias, compartilhamentos) — 3 níveis cada — pontuando 1-3. Score final 0-18: 0-6 BAIXA, 7-12 MÉDIA, 13-18 ALTA prioridade. Os processos com maior score entram primeiro no Inventário detalhado da Fase 3.",
      ),
    );
  }

  // Roadmap de 90 dias
  out.push(h3("Roadmap de 90 dias"));
  const orgao: "PM" | "CM" = data.grupo.orgao === "CM" ? "CM" : "PM";
  const marcos = gerarRoadmap90Dias(orgao);
  out.push(p("Cronograma sugerido pra os 90 dias seguintes ao curso (13 semanas):", { spacingAfter: 100 }));
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cellHeader("Sem.", 8),
            cellHeader("Fase", 18),
            cellHeader("Atividade-chave", 44),
            cellHeader("Entrega", 30),
          ],
        }),
        ...marcos.map((m) =>
          new TableRow({
            children: [
              cellTexto(String(m.semana), AlignmentType.CENTER),
              cellTexto(m.fase),
              cellTexto(m.titulo),
              cellTexto(m.entrega),
            ],
          }),
        ),
      ],
    }),
  );

  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_2) out.push(bullet(passo));
  return out;
}

function cellHeader(texto: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: COR_FASE_HEADER },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: texto, bold: true, color: "FFFFFF", size: 20 })],
      }),
    ],
  });
}

function cellTexto(texto: string, align?: typeof AlignmentType[keyof typeof AlignmentType]): TableCell {
  return new TableCell({
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: texto, size: 18 })],
      }),
    ],
  });
}

// =============================================================================
// FASE 3 — Mapeamento e Análise de Riscos
// =============================================================================

function renderFase3(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 3 — Mapeamento e Análise de Riscos"));
  out.push(h2("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-3");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }
  out.push(h2("✅ O que vocês fizeram"));

  // Inventário
  out.push(h3("Inventário de Processos"));
  const inv = data.grupo.company.inventories;
  if (inv.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const i of inv) {
      out.push(h3(i.nome));
      out.push(
        tabelaCampos([
          ["Status", traduzirStatus(i.status)],
          ["Setor", i.setor || "—"],
          ["Finalidade", i.finalidade || "—"],
          ["Base legal", i.baseLegal || "—"],
          ["Tipos de dados", i.tiposDados || "—"],
          ["Dados sensíveis", i.dadosSensiveis ? "Sim" : "Não"],
          ["Retenção", i.retencao || "—"],
          ["Compartilhamento", i.compartilhamento || "—"],
          ["Medidas de segurança", i.medidasSeguranca || "—"],
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    for (const m of MODELO_INVENTARIO_PROCESSOS) {
      out.push(h3(m.nome));
      out.push(
        tabelaCampos([
          ["Setor", m.setor],
          ["Finalidade", m.finalidade],
          ["Base legal", m.baseLegal],
          ["Tipos de dados", m.tiposDados],
          ["Dados sensíveis", m.dadosSensiveis ? "Sim" : "Não"],
          ["Retenção", m.retencao],
          ["Compartilhamento", m.compartilhamento],
          ["Medidas de segurança", m.medidasSeguranca],
        ]),
      );
    }
  }

  // Análise de Riscos
  out.push(h3("Análise de Riscos"));
  const riscos = data.grupo.company.risks;
  if (riscos.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const r of riscos) {
      out.push(h3(r.riscoTitulo));
      out.push(
        tabelaCampos([
          ["Processo relacionado", r.inventory?.nome || "—"],
          ["Categoria", r.categoria || "—"],
          ["Severidade", formatarSeveridade(r.severityLevel)],
          ["Status", traduzirStatus(r.status)],
          ["Descrição", r.descricao || "—"],
          ["Plano de mitigação", r.mitigationPlan || "—"],
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    for (const m of MODELO_RISCOS) {
      out.push(h3(m.riscoTitulo));
      out.push(
        tabelaCampos([
          ["Categoria", m.categoria],
          ["Severidade", formatarSeveridade(m.severityLevel)],
          ["Descrição", m.descricao],
          ["Plano de mitigação", m.mitigationPlan],
        ]),
      );
    }
  }

  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_3) out.push(bullet(passo));
  return out;
}

function formatarSeveridade(sev: string | null | undefined): string {
  if (!sev) return "—";
  // formato: P:M;I:A;S:ALTO
  const partes = sev.split(";");
  const p = partes.find((x) => x.startsWith("P:"))?.slice(2);
  const i = partes.find((x) => x.startsWith("I:"))?.slice(2);
  const s = partes.find((x) => x.startsWith("S:"))?.slice(2);
  const probMap: Record<string, string> = { B: "Baixa", M: "Média", A: "Alta" };
  const impMap: Record<string, string> = { B: "Baixo", M: "Médio", A: "Alto" };
  return `Probabilidade ${probMap[p || ""] || p || "?"} × Impacto ${impMap[i || ""] || i || "?"} = ${s || "?"}`;
}

function traduzirStatus(s: string): string {
  const map: Record<string, string> = {
    RASCUNHO: "Rascunho",
    SUBMETIDO: "Submetido ao DPO",
    APROVADO: "Aprovado pelo DPO",
    DEVOLVIDO: "Devolvido pelo DPO",
    ABERTA: "Aberta",
    EM_ANALISE: "Em análise",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    RESPONDIDA: "Respondida",
    NEGADA: "Negada",
    PUBLICADO: "Publicado",
    ENCERRADO: "Encerrado",
  };
  return map[s] || s;
}

// =============================================================================
// FASE 4 — GAP Analysis
// =============================================================================

function renderFase4(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 4 — GAP Analysis"));
  out.push(h2("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-4");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }
  out.push(h2("✅ O que vocês fizeram"));
  const gap = data.grupo.company.gapAnswers;
  if (gap.length > 0) {
    out.push(seloFeitoPeloGrupo());
    const aderentes = gap.filter((g) => g.resposta === "ADERENTE").length;
    const parciais = gap.filter((g) => g.resposta === "PARCIAL").length;
    const naoAderentes = gap.filter((g) => g.resposta === "NAO_ADERENTE").length;
    const score = Math.round(((aderentes * 100 + parciais * 50) / (gap.length * 100)) * 100);
    out.push(pComBold(`Score GAP: **${score}%** — ${aderentes} aderentes, ${parciais} parciais, ${naoAderentes} não aderentes (de ${gap.length} controles avaliados).`));
    for (const g of gap) {
      const controle = getControleById(g.controleId);
      out.push(h3(`${g.resposta === "ADERENTE" ? "✅" : g.resposta === "PARCIAL" ? "🟡" : g.resposta === "NAO_ADERENTE" ? "🔴" : "⏳"} ${controle?.texto || g.controleTexto}`));
      out.push(
        tabelaCampos([
          ["Área", g.area],
          ["Classificação", traduzirResposta(g.resposta)],
          ["Justificativa", g.justificativa || "—"],
          ...(g.setorApoio ? ([["Setor de apoio acionado", g.setorApoio]] as Array<[string, string]>) : []),
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    out.push(p("Exemplo de aplicação do GAP a 3 controles típicos:"));
    for (const m of MODELO_GAP_RESPOSTAS) {
      const controle = getControleById(m.controleId);
      out.push(h3(controle?.texto || `Controle ${m.controleId}`));
      out.push(
        tabelaCampos([
          ["Área", controle?.area || "—"],
          ["Classificação", traduzirResposta(m.resposta)],
          ["Justificativa", m.justificativa],
        ]),
      );
    }
  }
  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_4) out.push(bullet(passo));
  return out;
}

function traduzirResposta(r: string): string {
  const map: Record<string, string> = {
    ADERENTE: "Aderente — controle implementado e em funcionamento",
    PARCIAL: "Parcial — controle existe mas não está consolidado",
    NAO_ADERENTE: "Não aderente — controle ausente ou inadequado",
    APOIO_PENDENTE: "Apoio pendente — depende de avaliação de outro setor",
  };
  return map[r] || r;
}

// =============================================================================
// FASE 5 — Plano de Ação
// =============================================================================

function renderFase5(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 5 — Plano de Ação e Adequação"));
  out.push(h2("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-5");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }
  out.push(h2("✅ O que vocês fizeram"));
  out.push(h3("Plano de Ação"));
  const acoes = data.grupo.company.actions;
  if (acoes.length > 0) {
    out.push(seloFeitoPeloGrupo());
    out.push(...renderTabelaAcoes(acoes.map((a) => ({
      acao: a.acao,
      responsavel: a.responsavel || "—",
      prazo: a.prazo ? a.prazo.toLocaleDateString("pt-BR") : "—",
      prioridade: a.prioridade || "—",
      status: traduzirStatus(a.status),
      origem: a.origem,
    }))));
  } else {
    out.push(seloModelo());
    out.push(p("Exemplos de ações típicas geradas a partir de GAPs Não-Aderentes e Riscos Altos:"));
    const hoje = new Date();
    out.push(...renderTabelaAcoes(MODELO_ACOES_PLANO.map((a) => {
      const prazoDate = new Date(hoje);
      prazoDate.setDate(prazoDate.getDate() + a.prazoSemanas * 7);
      return {
        acao: a.acao,
        responsavel: a.responsavel,
        prazo: prazoDate.toLocaleDateString("pt-BR"),
        prioridade: a.prioridade,
        status: "Aberta",
        origem: a.origem,
      };
    })));
  }
  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_5) out.push(bullet(passo));
  return out;
}

function renderTabelaAcoes(acoes: Array<{
  acao: string;
  responsavel: string;
  prazo: string;
  prioridade: string;
  status: string;
  origem: string;
}>): (Paragraph | Table)[] {
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            cellHeader("Ação", 40),
            cellHeader("Responsável", 18),
            cellHeader("Prazo", 12),
            cellHeader("Prioridade", 12),
            cellHeader("Status", 12),
            cellHeader("Origem", 6),
          ],
        }),
        ...acoes.map((a) => new TableRow({
          children: [
            cellTexto(a.acao),
            cellTexto(a.responsavel),
            cellTexto(a.prazo, AlignmentType.CENTER),
            cellTexto(a.prioridade, AlignmentType.CENTER),
            cellTexto(a.status, AlignmentType.CENTER),
            cellTexto(a.origem, AlignmentType.CENTER),
          ],
        })),
      ],
    }),
  ];
}

// =============================================================================
// FASE 6 — Execução (conteúdo: RIPD, Operadores, DSR, Aviso)
// =============================================================================

function renderFase6(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 6 — Execução"));
  out.push(h2("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-6");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }
  out.push(h2("✅ O que vocês fizeram"));

  // RIPDs
  out.push(h3("Relatórios de Impacto à Proteção de Dados (RIPD)"));
  const ripds = data.grupo.company.ripds;
  if (ripds.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const r of ripds) {
      out.push(h3(`${r.titulo} (${traduzirStatus(r.status)})`));
      if (r.inventoryRef) out.push(p(`Processo: ${r.inventoryRef}`, { italics: true }));
      const sortedSections = [...r.sections].sort((a, b) => a.numero - b.numero);
      for (const s of sortedSections) {
        out.push(p(`${s.numero}. ${s.titulo}`, { bold: true, color: COR_ACCENT }));
        out.push(p(s.conteudo || "—"));
      }
    }
  } else {
    out.push(seloModelo());
    out.push(h3(MODELO_RIPD.titulo));
    out.push(p(`Processo: ${MODELO_RIPD.inventoryRef}`, { italics: true }));
    for (const s of MODELO_RIPD.secoes) {
      out.push(p(`${s.numero}. ${s.titulo}`, { bold: true, color: COR_ACCENT }));
      out.push(p(s.conteudo));
    }
  }

  // Operadores
  out.push(h3("Operadores (Terceiros)"));
  const operadores = data.grupo.company.operators;
  if (operadores.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const o of operadores) {
      out.push(h3(o.nome));
      const ct = o.contracts[0];
      out.push(
        tabelaCampos([
          ["CNPJ", o.cnpj || "—"],
          ["Serviço prestado", o.servico || "—"],
          ["Papel", o.papel || "—"],
          ...(ct ? [
            ["Contrato nº", ct.numero || "—"],
            ["Objeto", ct.objeto || "—"],
            ["Cláusulas LGPD", ct.clausulasLgpd ? "Sim" : "Não"],
            ["Nível de risco", ct.nivelRisco || "—"],
          ] as Array<[string, string]> : []),
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    for (const m of MODELO_OPERADORES) {
      out.push(h3(m.nome));
      out.push(
        tabelaCampos([
          ["CNPJ", m.cnpj],
          ["Serviço prestado", m.servico],
          ["Papel", m.papel],
          ["Contrato nº", m.contrato.numero],
          ["Objeto", m.contrato.objeto],
          ["Cláusulas LGPD", m.contrato.clausulasLgpd ? "Sim" : "Não"],
          ["Nível de risco", m.contrato.nivelRisco],
        ]),
      );
    }
  }

  // Canal DSR
  out.push(h3("Canal DSR (Direitos do Titular)"));
  const dsr = data.grupo.company.dsrRequests;
  if (dsr.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const d of dsr) {
      out.push(h3(`${d.tipoSolicitacao} — ${d.titularNome}`));
      out.push(
        tabelaCampos([
          ["Contato do titular", d.titularContato],
          ["Tipo", d.tipoSolicitacao],
          ["Status", traduzirStatus(d.status)],
          ["Descrição", d.descricao || "—"],
          ["Resposta", d.respostaTexto || "—"],
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    for (const m of MODELO_DSR) {
      out.push(h3(`${m.tipoSolicitacao} — ${m.titularNome}`));
      out.push(
        tabelaCampos([
          ["Contato do titular", m.titularContato],
          ["Status", traduzirStatus(m.status)],
          ["Descrição", m.descricao],
          ["Resposta", m.respostaTexto],
        ]),
      );
    }
  }

  // Aviso de Privacidade
  out.push(h3("Aviso de Privacidade"));
  const aviso = data.grupo.company.policies.find((pol) => pol.slug === "aviso-privacidade");
  if (aviso && aviso.status === "PUBLICADO") {
    out.push(seloFeitoPeloGrupo());
    out.push(
      tabelaCampos([
        ["Status", "Publicado"],
        ["URL pública", aviso.publicSlug ? `/p/${aviso.publicSlug}` : "—"],
        ["Tamanho do texto", `${aviso.conteudoMd.length} caracteres`],
      ]),
    );
    out.push(p("Trecho inicial:", { bold: true, color: COR_ACCENT }));
    const trecho = aviso.conteudoMd.slice(0, 1000);
    for (const linha of trecho.split("\n")) {
      if (linha.trim()) out.push(p(linha));
    }
    if (aviso.conteudoMd.length > 1000) {
      out.push(p("[...]", { italics: true }));
    }
  } else if (aviso) {
    out.push(seloFeitoPeloGrupo());
    out.push(p(`Status: ${traduzirStatus(aviso.status)}. Aviso ainda não publicado.`, { italics: true }));
  } else {
    out.push(seloModelo());
    out.push(p(MODELO_AVISO_PRIVACIDADE_RESUMO));
  }

  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_6) out.push(bullet(passo));
  return out;
}

// =============================================================================
// FASE 7 — Monitoramento Contínuo e Melhoria
// =============================================================================

function renderFase7(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 7 — Monitoramento Contínuo e Melhoria"));
  out.push(h2("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-7");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }
  out.push(h2("✅ O que vocês fizeram"));

  // Incidentes registrados
  out.push(h3("Incidentes registrados"));
  const incidentes = data.grupo.company.incidents;
  if (incidentes.length > 0) {
    out.push(seloFeitoPeloGrupo());
    for (const i of incidentes) {
      out.push(h3(i.titulo));
      out.push(
        tabelaCampos([
          ["Severidade", i.severidade],
          ["Status", traduzirStatus(i.status)],
          ["Ocorrido em", i.ocorridoEm ? i.ocorridoEm.toLocaleDateString("pt-BR") : "—"],
          ["Detectado em", i.detectadoEm ? i.detectadoEm.toLocaleDateString("pt-BR") : "—"],
          ["Comunicado à ANPD", i.comunicadoAnpd ? "Sim" : "Não"],
          ["Comunicado ao titular", i.comunicadoTitular ? "Sim" : "Não"],
          ["Descrição", i.descricao || "—"],
        ]),
      );
    }
  } else {
    out.push(seloModelo());
    out.push(h3(MODELO_INCIDENTE.titulo));
    out.push(
      tabelaCampos([
        ["Severidade", MODELO_INCIDENTE.severidade],
        ["Status", traduzirStatus(MODELO_INCIDENTE.status)],
        ["Comunicado à ANPD", MODELO_INCIDENTE.comunicadoAnpd ? "Sim" : "Não"],
        ["Comunicado ao titular", MODELO_INCIDENTE.comunicadoTitular ? "Sim" : "Não"],
        ["Descrição", MODELO_INCIDENTE.descricao],
        ["Medidas de mitigação", MODELO_INCIDENTE.formularioAnpd.medidasMitigacao.map((m: string) => `• ${m}`).join("\n")],
      ]),
    );
  }

  // PRI — Plano de Resposta a Incidentes
  out.push(h3("Plano de Resposta a Incidentes (PRI)"));
  const priMembros = data.grupo.company.priMembros;
  const priRaci = data.grupo.company.priRaci;
  if (priMembros.length > 0 || priRaci.length > 0) {
    out.push(seloFeitoPeloGrupo());
    if (priMembros.length > 0) {
      out.push(p("Equipe de Tratamento de Incidentes (ETIR):", { bold: true }));
      for (const m of priMembros) {
        out.push(bullet(`${m.papel} — ${m.nome}${m.contato24h ? ` (${m.contato24h})` : ""}${m.cobertura ? ` · ${m.cobertura}` : ""}`));
      }
    }
    if (priRaci.length > 0) {
      out.push(p("Matriz RACI por etapa NIST:", { bold: true, spacingAfter: 80 }));
      out.push(...renderTabelaRaci(priRaci));
    }
  } else {
    out.push(seloModelo());
    out.push(p("Equipe de Tratamento de Incidentes (ETIR) — modelo:", { bold: true }));
    for (const m of MODELO_PRI_EQUIPE) {
      out.push(bullet(`${m.papel} — ${m.contato24h} · ${m.cobertura}`));
    }
    out.push(p("Matriz RACI por etapa NIST — modelo:", { bold: true, spacingAfter: 80 }));
    out.push(...renderTabelaRaci(MODELO_PRI_RACI));
  }

  out.push(h2("➡️ Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_7) out.push(bullet(passo));
  return out;
}

function renderTabelaRaci(raci: Array<{ etapaNist: string; papel: string; tipo: string }>): (Paragraph | Table)[] {
  // Agrupa por etapa NIST
  const etapas = ["DETECTAR", "CONTER", "ERRADICAR", "RECUPERAR", "LICOES"];
  const etapaLabels: Record<string, string> = {
    DETECTAR: "Detectar",
    CONTER: "Conter",
    ERRADICAR: "Erradicar",
    RECUPERAR: "Recuperar",
    LICOES: "Lições aprendidas",
  };
  const tipoLabels: Record<string, string> = {
    R: "R (responsável)",
    A: "A (aprovador)",
    C: "C (consultado)",
    I: "I (informado)",
  };
  const linhas: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [cellHeader("Etapa", 25), cellHeader("Papel", 30), cellHeader("Tipo", 45)],
    }),
  ];
  for (const e of etapas) {
    const itens = raci.filter((x) => x.etapaNist === e);
    for (const r of itens) {
      linhas.push(
        new TableRow({
          children: [
            cellTexto(etapaLabels[r.etapaNist] || r.etapaNist),
            cellTexto(r.papel),
            cellTexto(tipoLabels[r.tipo] || r.tipo),
          ],
        }),
      );
    }
  }
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
      rows: linhas,
    }),
  ];
}

// =============================================================================
// ENCERRAMENTO
// =============================================================================

function encerramento(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Encerramento"));
  out.push(
    pComBold(
      "Este Caderno consolida o trabalho realizado pelo grupo durante o curso e oferece um ponto de partida estruturado pra continuar a adequação à LGPD na sua Instituição.",
    ),
  );
  out.push(
    pComBold(
      "**A jornada não termina aqui.** O Programa de Governança em Privacidade é um ciclo contínuo de avaliação, ajuste e melhoria. Os blocos marcados com selo amarelo (\"📌 Modelo de referência\") precisam ser revisados e adaptados à realidade real do seu órgão antes de virarem entrega institucional.",
    ),
  );
  out.push(h2("Sugestões para os próximos 90 dias"));
  out.push(bullet("Apresentar este Caderno em reunião do Comitê de Privacidade e definir prioridades concretas."));
  out.push(bullet("Atualizar os blocos amarelos com dados reais da Instituição — começando pela Fase 1 (designação do Encarregado)."));
  out.push(bullet("Cumprir o Roadmap de 90 dias com revisões mensais."));
  out.push(bullet("Repetir o Termômetro Institucional ao final do trimestre pra evidenciar a evolução."));
  out.push(bullet("Manter o canal DSR funcional e responder dentro do prazo de 15 dias úteis."));
  out.push(h2("Contato e referências"));
  out.push(pComBold("Documentação oficial:"));
  out.push(bullet("Lei nº 13.709/2018 (LGPD) — texto integral disponível em planalto.gov.br"));
  out.push(bullet("Resolução CD/ANPD nº 2/2022 — agentes de pequeno porte e alto risco"));
  out.push(bullet("Resolução CD/ANPD nº 15/2024 — comunicação de incidentes"));
  out.push(bullet("Resolução CD/ANPD nº 18/2024 — atuação do Encarregado"));
  out.push(bullet("Guia ANPD do Encarregado e Guias temáticos — anpd.gov.br"));
  out.push(p(""));
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "PGP Treinamento · Curso prático de LGPD",
          italics: true,
          size: 20,
          color: "94A3B8",
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Documento gerado automaticamente a partir do trabalho do grupo",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  );
  return out;
}

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

export function gerarCadernoCompleto(data: GrupoCadernoData): (Paragraph | Table)[] {
  return [
    ...capa(data),
    ...introducao(data),
    ...renderFasePreliminar(data),
    ...renderFase1(data),
    ...renderFase2(data),
    ...renderFase3(data),
    ...renderFase4(data),
    ...renderFase5(data),
    ...renderFase6(data),
    ...renderFase7(data),
    ...encerramento(data),
  ];
}

// =============================================================================
// CADERNO EXECUTIVO (B) — versão curta (~12 páginas) pra Alta Gestão/chefia.
//
// Subset do Completo focado em status + métricas + recomendações estratégicas.
// Sem o conteúdo educativo das 8 fases. Tom corporativo, cor verde-azulado
// pra diferenciar do Completo (azul institucional). Mantém o destaque dos
// dados-modelo (selo amarelo) pra ser honesto com a chefia sobre o que é
// realização do grupo vs. exemplo de referência.
// =============================================================================

const COR_EXEC_TITULO = "065F46"; // verde escuro corporativo
const COR_EXEC_ACCENT = "047857";

function h1Exec(texto: string, pageBreak: boolean = true): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    pageBreakBefore: pageBreak,
    children: [new TextRun({ text: texto, bold: true, size: 36, color: COR_EXEC_TITULO })],
  });
}

function h2Exec(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text: texto, bold: true, size: 26, color: COR_EXEC_ACCENT })],
  });
}

function pExec(texto: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: texto,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 22,
      }),
    ],
  });
}

function statusBadge(status: "ok" | "parcial" | "pendente", texto: string): Paragraph {
  const cores = {
    ok: { fundo: "D1FAE5", texto: "065F46", emoji: "✅" },
    parcial: { fundo: "FEF3C7", texto: "92400E", emoji: "🟡" },
    pendente: { fundo: "FEE2E2", texto: "991B1B", emoji: "🔴" },
  };
  const c = cores[status];
  return new Paragraph({
    shading: { type: ShadingType.CLEAR, fill: c.fundo },
    spacing: { before: 80, after: 80 },
    indent: { left: 200, right: 200 },
    children: [
      new TextRun({ text: `${c.emoji} ${texto}`, color: c.texto, size: 22, bold: true }),
    ],
  });
}

function capaExec(data: GrupoCadernoData): Paragraph[] {
  const c = data.grupo.company;
  const turma = data.grupo.turma;
  const orgaoNome = data.grupo.orgao === "PM" ? "Prefeitura Municipal" : "Câmara Municipal";
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3200, after: 200 },
      children: [
        new TextRun({
          text: "RELATÓRIO EXECUTIVO",
          bold: true,
          size: 48,
          color: COR_EXEC_TITULO,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Programa de Governança em Privacidade",
          italics: true,
          size: 28,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "Síntese para a Alta Gestão",
          italics: true,
          size: 22,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: c.name, bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1000 },
      children: [
        new TextRun({
          text: `${orgaoNome} de ${turma.cidade} — Grupo ${data.grupo.numero}`,
          italics: true,
          size: 22,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Turma: ${turma.nome}`, size: 22, color: "475569" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [
        new TextRun({ text: `Documento elaborado em ${hoje}`, size: 22, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "PGP Treinamento · Curso prático de Lei Geral de Proteção de Dados",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  ];
}

function sumarioExecutivo(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const kpis = calcularKpis(data);
  const score = calcularMaturidade(kpis);
  const nivel = nivelMaturidade(score);
  const c = data.grupo.company;

  out.push(h1Exec("Sumário Executivo"));
  out.push(
    pExec(
      "Este Relatório Executivo sintetiza o trabalho de adequação à LGPD realizado pelo grupo durante o curso prático de Programa de Governança em Privacidade (PGP). É documento complementar ao Caderno Completo, organizado pra leitura rápida pela Alta Gestão e suporte à tomada de decisões estratégicas.",
    ),
  );

  out.push(h2Exec("Maturidade do PGP"));
  out.push(
    pExec(`Score consolidado: ${score}/100 — ${nivel.label} ${nivel.emoji}`, { bold: true, size: 26 }),
  );
  out.push(
    pExec(
      "Métrica calculada a partir dos instrumentos produzidos pelo grupo nas 8 etapas do PGP (Inventário, GAP, Aviso, RIPDs, Riscos, Terceiros, DSR), com pesos institucionais ajustados conforme a centralidade de cada item na adequação.",
      { italics: true, size: 20 },
    ),
  );

  // Evolução do Termômetro — agregado anônimo dos membros do grupo (cada um
  // avaliou a si e ao próprio órgão real; aqui só médias e saltos pra leitura
  // rápida da Alta Gestão).
  const panoramaExec = agregarTermometroGrupo(data);
  if (panoramaExec) {
    out.push(h2Exec("Evolução da Maturidade Percebida"));
    out.push(
      pExec(
        `Cada participante respondeu sobre si (conhecimento da LGPD) e sobre o próprio órgão real (etapa da jornada de adequação) — ${panoramaExec.preenchidosInicio} responderam no início${panoramaExec.preenchidosFim ? `, ${panoramaExec.preenchidosFim} no fim` : ""}. Médias do grupo:`,
      ),
    );
    const pe = panoramaExec.pessoal;
    const ie = panoramaExec.instituicao;
    const linhas: Array<[string, string]> = [];
    if (pe.mediaInicio !== null) linhas.push(["👤 Conhecimento da equipe no início", `${pe.mediaInicio}/100 — ${faixaPessoal(pe.mediaInicio).label}`]);
    if (pe.mediaFim !== null) linhas.push(["👤 Conhecimento da equipe no fim", `${pe.mediaFim}/100 — ${faixaPessoal(pe.mediaFim).label}`]);
    if (pe.saltoMedio !== null) linhas.push(["👤 Δ Salto de conhecimento", `${pe.saltoMedio > 0 ? "+" : ""}${pe.saltoMedio} pontos`]);
    if (ie.mediaInicio !== null) linhas.push(["🏛️ Maturidade das instituições no início", `${ie.mediaInicio}/100 — ${faixaQualitativa(ie.mediaInicio).label}`]);
    if (ie.mediaFim !== null) linhas.push(["🏛️ Maturidade das instituições no fim", `${ie.mediaFim}/100 — ${faixaQualitativa(ie.mediaFim).label}`]);
    if (ie.saltoMedio !== null) linhas.push(["🏛️ Δ Salto das instituições", `${ie.saltoMedio > 0 ? "+" : ""}${ie.saltoMedio} pontos`]);
    out.push(tabelaCampos(linhas));
  }

  out.push(h2Exec("Highlights"));
  out.push(...renderHighlights(kpis, c));

  return out;
}

function renderHighlights(kpis: KpisGrupo, company: GrupoCadernoData["grupo"]["company"]): Paragraph[] {
  const highlights: string[] = [];
  if (company.dpoName) {
    highlights.push(`Encarregado(a) designado(a): ${company.dpoName}.`);
  } else {
    highlights.push("Encarregado(a) ainda não designado(a) formalmente — pendência prioritária.");
  }
  if (kpis.inventario.aprovados > 0) {
    highlights.push(`${kpis.inventario.aprovados} processo${kpis.inventario.aprovados > 1 ? "s" : ""} aprovado${kpis.inventario.aprovados > 1 ? "s" : ""} no Inventário (de ${kpis.inventario.total} cadastrado${kpis.inventario.total > 1 ? "s" : ""}).`);
  } else if (kpis.inventario.total > 0) {
    highlights.push(`${kpis.inventario.total} processo${kpis.inventario.total > 1 ? "s" : ""} em mapeamento; aprovação formal do Encarregado ainda pendente.`);
  } else {
    highlights.push("Inventário ainda não iniciado — etapa estruturante a priorizar.");
  }
  if (kpis.gap.respondidos > 0) {
    highlights.push(`GAP Analysis aplicado a ${kpis.gap.respondidos} controles — aderência geral em ${kpis.gap.score}%.`);
  }
  if (kpis.aviso.status === "PUBLICADO") {
    highlights.push("Aviso de Privacidade publicado no portal externo (Art. 9 LGPD).");
  } else {
    highlights.push("Aviso de Privacidade ainda não publicado — exigência direta da LGPD.");
  }
  if (kpis.incidentes.total > 0) {
    highlights.push(`${kpis.incidentes.total} incidente${kpis.incidentes.total > 1 ? "s" : ""} registrado${kpis.incidentes.total > 1 ? "s" : ""} no curso (simulação) — fluxo de resposta exercitado.`);
  }
  return highlights.map((h) => bullet(h));
}

function painelConsolidado(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const kpis = calcularKpis(data);
  out.push(h1Exec("Painel de Indicadores"));
  out.push(
    pExec(
      "Quadro consolidado dos instrumentos produzidos durante o curso, com indicação do estágio de cada um. Métricas comparáveis em revisões periódicas pra acompanhar a evolução institucional.",
    ),
  );
  out.push(
    tabelaCampos([
      ["Inventário de Processos", `${kpis.inventario.total} cadastrados · ${kpis.inventario.aprovados} aprovados pelo DPO · ${kpis.inventario.submetidos} aguardando revisão`],
      ["Análise de Riscos", `${kpis.riscos.total} riscos identificados · ${kpis.riscos.aprovados} aprovados pelo DPO`],
      ["GAP Analysis", `${kpis.gap.respondidos} controles avaliados · ${kpis.gap.aderentes} aderentes · ${kpis.gap.parciais} parciais · score ${kpis.gap.score}%`],
      ["RIPDs (Relatórios de Impacto)", `${kpis.ripds.total} elaborados · ${kpis.ripds.aprovados} aprovados pelo DPO`],
      ["Operadores (Terceiros)", `${kpis.terceiros.total} cadastrados · ${kpis.terceiros.comClausula} com cláusulas LGPD`],
      ["Canal DSR (Direitos do Titular)", `${kpis.dsr.total} solicitações registradas`],
      ["Aviso de Privacidade", kpis.aviso.status === "PUBLICADO" ? "Publicado no portal externo" : kpis.aviso.status === "RASCUNHO" ? "Em rascunho (não publicado)" : "Não iniciado"],
      ["Incidentes de Segurança", `${kpis.incidentes.total} registrados · ${kpis.incidentes.comunicadosAnpd} comunicados à ANPD · ${kpis.incidentes.comunicadosTitular} comunicados aos titulares`],
    ]),
  );
  return out;
}

// ───── Status compacto por fase (1 página cada) ──────────────────────────────

function statusFasePreliminar(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase Preliminar — Sensibilização e Engajamento"));
  // Termômetro
  const panoramaStatus = agregarTermometroGrupo(data);
  if (panoramaStatus) {
    out.push(statusBadge("ok", `Termômetro aplicado — ${panoramaStatus.preenchidosInicio}/${panoramaStatus.totalParticipantes} participantes avaliaram a si e ao próprio órgão`));
    const ps = panoramaStatus.pessoal;
    const is = panoramaStatus.instituicao;
    const linhas: Array<[string, string]> = [];
    if (ps.mediaInicio !== null) linhas.push(["👤 Conhecimento da equipe (média)", `${ps.mediaInicio}/100${ps.mediaFim !== null ? ` → ${ps.mediaFim}/100` : ""}`]);
    if (is.mediaInicio !== null) linhas.push(["🏛️ Maturidade das instituições (média)", `${is.mediaInicio}/100${is.mediaFim !== null ? ` → ${is.mediaFim}/100` : ""}`]);
    if (ps.saltoMedio !== null) linhas.push(["Saltos médios (equipe · instituições)", `${ps.saltoMedio > 0 ? "+" : ""}${ps.saltoMedio} · ${(is.saltoMedio ?? 0) > 0 ? "+" : ""}${is.saltoMedio ?? 0} pontos`]);
    out.push(tabelaCampos(linhas));
  } else {
    out.push(statusBadge("pendente", "Termômetro Institucional pendente — recomendado aplicar como linha de base"));
  }
  // Carta Alta Gestão
  if (c.cartaAltaGestao && c.cartaAltaGestao.justificativa) {
    const finalizada = c.cartaAltaGestao.finalizadaEm;
    out.push(statusBadge(finalizada ? "ok" : "parcial", finalizada ? "Carta para a Alta Gestão finalizada" : "Carta para a Alta Gestão em rascunho"));
  } else {
    out.push(statusBadge("pendente", "Carta para a Alta Gestão pendente"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.PRELIMINAR.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase1(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 1 — Formação das equipes de trabalho"));
  if (c.dpoName) {
    out.push(statusBadge("ok", "Encarregado(a) designado(a)"));
    out.push(
      tabelaCampos([
        ["Nome", c.dpoName],
        ["E-mail", c.dpoEmail || "—"],
        ["Telefone", c.dpoTelefone || "—"],
        ["Encarregado(a) Substituto(a)", c.dpoSubstitutoNome || "Não designado(a) — recomendado"],
      ]),
    );
  } else {
    out.push(statusBadge("pendente", "Encarregado(a) ainda não designado(a) formalmente — Art. 41 LGPD"));
    out.push(pExec(
      "A designação por ato formal (Portaria/Decreto) publicado em diário oficial é exigência direta da LGPD. Sem ela, todas as defesas institucionais posteriores ficam comprometidas em fiscalização da ANPD.",
      { italics: true },
    ));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_1.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase2(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 2 — Diagnóstico Inicial"));
  // Setores
  const setores = c.setoresDiscutidos;
  const qtdSetores = setores && Array.isArray(setores.setores) ? setores.setores.filter((s: any) => s.discutido).length : 0;
  if (qtdSetores > 0) {
    out.push(statusBadge("ok", `${qtdSetores} setor${qtdSetores > 1 ? "es" : ""} discutido${qtdSetores > 1 ? "s" : ""} pelo grupo`));
  } else {
    out.push(statusBadge("pendente", "Levantamento de setores não realizado"));
  }
  // Priorização
  const pri = c.priorizacaoProcessos;
  const qtdProc = pri && Array.isArray(pri.processos) ? pri.processos.length : 0;
  if (qtdProc > 0) {
    out.push(statusBadge("ok", `${qtdProc} processo${qtdProc > 1 ? "s" : ""} pontuado${qtdProc > 1 ? "s" : ""} na Matriz de Priorização (Res. CD/ANPD nº 2/2022)`));
    const topProcessos = [...pri.processos].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 3);
    out.push(pExec("Top processos prioritários:", { bold: true }));
    for (const p of topProcessos) {
      out.push(bullet(`${p.processoId || "(processo)"} — score ${p.score}/18 (${faixaPriorizacao(p.score).label})`));
    }
  } else {
    out.push(statusBadge("pendente", "Matriz de Priorização não aplicada"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_2.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase3(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 3 — Mapeamento e Análise de Riscos"));
  // Inventário
  const inv = c.inventories;
  const aprovados = inv.filter((i) => i.status === "APROVADO").length;
  if (aprovados > 0) {
    out.push(statusBadge("ok", `${aprovados} processo${aprovados > 1 ? "s" : ""} aprovado${aprovados > 1 ? "s" : ""} no Inventário`));
  } else if (inv.length > 0) {
    out.push(statusBadge("parcial", `${inv.length} processo${inv.length > 1 ? "s" : ""} em mapeamento — aprovação formal pendente`));
  } else {
    out.push(statusBadge("pendente", "Inventário não iniciado"));
  }
  if (inv.length > 0) {
    out.push(pExec("Processos cadastrados:", { bold: true }));
    for (const i of inv.slice(0, 5)) {
      out.push(bullet(`${i.nome} (${traduzirStatus(i.status)})`));
    }
    if (inv.length > 5) out.push(pExec(`... e mais ${inv.length - 5} processo${inv.length - 5 > 1 ? "s" : ""}.`, { italics: true }));
  }
  // Riscos
  const riscos = c.risks;
  if (riscos.length > 0) {
    out.push(statusBadge("ok", `${riscos.length} risco${riscos.length > 1 ? "s" : ""} de privacidade identificado${riscos.length > 1 ? "s" : ""}`));
    const altos = riscos.filter((r) => r.severityLevel?.includes("S:ALTO")).length;
    if (altos > 0) out.push(pExec(`${altos} risco${altos > 1 ? "s" : ""} classificado${altos > 1 ? "s" : ""} como ALTO — exige${altos > 1 ? "m" : ""} atenção prioritária da Alta Gestão.`, { italics: true }));
  } else {
    out.push(statusBadge("pendente", "Análise de Riscos não realizada"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_3.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase4(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 4 — GAP Analysis"));
  const gap = c.gapAnswers;
  if (gap.length > 0) {
    const aderentes = gap.filter((g) => g.resposta === "ADERENTE").length;
    const parciais = gap.filter((g) => g.resposta === "PARCIAL").length;
    const naoAderentes = gap.filter((g) => g.resposta === "NAO_ADERENTE").length;
    const score = Math.round(((aderentes * 100 + parciais * 50) / (gap.length * 100)) * 100);
    out.push(statusBadge("ok", `${gap.length} controles avaliados — aderência ${score}%`));
    out.push(
      tabelaCampos([
        ["Controles aderentes", `${aderentes} de ${gap.length} (${Math.round((aderentes / gap.length) * 100)}%)`],
        ["Controles parciais", `${parciais} (precisam consolidação)`],
        ["Controles NÃO aderentes", `${naoAderentes} (lacunas críticas a tratar)`],
      ]),
    );
    if (naoAderentes > 0) {
      out.push(pExec(`Os ${naoAderentes} controles não-aderentes devem virar ações no Plano da Fase 5 com responsável e prazo definidos. Sem ação, a lacuna persiste.`, { italics: true }));
    }
  } else {
    out.push(statusBadge("pendente", "Análise de GAP não iniciada"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_4.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase5(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 5 — Plano de Ação e Adequação"));
  const acoes = c.actions;
  if (acoes.length > 0) {
    const abertas = acoes.filter((a) => a.status === "ABERTA").length;
    const emAndamento = acoes.filter((a) => a.status === "EM_ANDAMENTO").length;
    const concluidas = acoes.filter((a) => a.status === "CONCLUIDA").length;
    const altas = acoes.filter((a) => a.prioridade === "ALTA").length;
    out.push(statusBadge("ok", `${acoes.length} aç${acoes.length > 1 ? "ões" : "ão"} no Plano de Ação`));
    out.push(
      tabelaCampos([
        ["Abertas (não iniciadas)", String(abertas)],
        ["Em andamento", String(emAndamento)],
        ["Concluídas", String(concluidas)],
        ["Prioridade ALTA", `${altas} (atenção da Alta Gestão)`],
      ]),
    );
  } else {
    out.push(statusBadge("pendente", "Plano de Ação institucional ainda não consolidado"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_5.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase6(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 6 — Execução"));
  // RIPD
  if (c.ripds.length > 0) {
    const aprovados = c.ripds.filter((r) => r.status === "APROVADO").length;
    out.push(statusBadge(aprovados > 0 ? "ok" : "parcial", `${c.ripds.length} RIPD${c.ripds.length > 1 ? "s" : ""} elaborado${c.ripds.length > 1 ? "s" : ""}${aprovados > 0 ? ` · ${aprovados} aprovado${aprovados > 1 ? "s" : ""} pelo DPO` : ""}`));
  } else {
    out.push(statusBadge("pendente", "RIPDs não elaborados — exigência Art. 38 LGPD pra processos de alto risco"));
  }
  // Operadores
  if (c.operators.length > 0) {
    const comClausula = c.operators.filter((o) => o.contracts.some((ct) => ct.clausulasLgpd)).length;
    out.push(statusBadge(comClausula === c.operators.length ? "ok" : "parcial", `${c.operators.length} operador${c.operators.length > 1 ? "es" : ""} cadastrado${c.operators.length > 1 ? "s" : ""} · ${comClausula} com cláusulas LGPD nos contratos`));
  } else {
    out.push(statusBadge("pendente", "Operadores (terceiros) ainda não cadastrados"));
  }
  // DSR
  if (c.dsrRequests.length > 0) {
    out.push(statusBadge("ok", `Canal DSR exercitado — ${c.dsrRequests.length} solicitaç${c.dsrRequests.length > 1 ? "ões" : "ão"} registrada${c.dsrRequests.length > 1 ? "s" : ""}`));
  } else {
    out.push(statusBadge("pendente", "Canal DSR (Direitos do Titular) ainda não exercitado"));
  }
  // Aviso
  const aviso = c.policies.find((p) => p.slug === "aviso-privacidade");
  if (aviso && aviso.status === "PUBLICADO") {
    out.push(statusBadge("ok", "Aviso de Privacidade publicado no portal externo"));
  } else if (aviso) {
    out.push(statusBadge("parcial", "Aviso de Privacidade em rascunho — pendente publicação"));
  } else {
    out.push(statusBadge("pendente", "Aviso de Privacidade ainda não elaborado"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_6.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function statusFase7(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const c = data.grupo.company;
  out.push(h1Exec("Fase 7 — Monitoramento Contínuo e Melhoria"));
  // Incidentes
  if (c.incidents.length > 0) {
    const comAnpd = c.incidents.filter((i) => i.comunicadoAnpd).length;
    out.push(statusBadge("ok", `${c.incidents.length} incidente${c.incidents.length > 1 ? "s" : ""} registrado${c.incidents.length > 1 ? "s" : ""} · ${comAnpd} comunicado${comAnpd > 1 ? "s" : ""} à ANPD`));
  } else {
    out.push(statusBadge("parcial", "Nenhum incidente registrado no curso — fluxo de resposta ainda não exercitado"));
  }
  // PRI
  if (c.priMembros.length > 0 || c.priRaci.length > 0) {
    out.push(statusBadge("ok", `Plano de Resposta a Incidentes (PRI) estruturado · ${c.priMembros.length} membro${c.priMembros.length > 1 ? "s" : ""} na equipe · ${c.priRaci.length} entrada${c.priRaci.length > 1 ? "s" : ""} na matriz RACI`));
  } else {
    out.push(statusBadge("pendente", "PRI ainda não estruturado — recomendado antes de qualquer incidente real"));
  }
  out.push(h2Exec("Próximos passos"));
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_7.slice(0, 3)) out.push(bullet(passo));
  return out;
}

function conclusaoExecutiva(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const kpis = calcularKpis(data);
  const score = calcularMaturidade(kpis);
  const nivel = nivelMaturidade(score);
  out.push(h1Exec("Recomendações à Alta Gestão"));
  out.push(
    pExec(
      `A maturidade atual do PGP foi avaliada em ${score}/100 — ${nivel.label}. O caminho pra consolidação demanda apoio explícito da Alta Gestão em três frentes principais:`,
    ),
  );
  out.push(h2Exec("1. Sustentação institucional"));
  out.push(bullet("Formalizar o Programa de Governança em Privacidade (PGP) como Política institucional aprovada por ato do dirigente máximo."));
  out.push(bullet("Constituir/consolidar o Comitê de Privacidade com representantes das áreas-chave (TI, Jurídico, Comunicação, RH, áreas de negócio)."));
  out.push(bullet("Estabelecer agenda mensal de acompanhamento do PGP no nível da chefia superior."));

  out.push(h2Exec("2. Recursos"));
  out.push(bullet("Prever rubrica específica no orçamento pra adequação LGPD (capacitação contínua, ferramentas, eventual consultoria)."));
  out.push(bullet("Alocar pessoal dedicado: Encarregado(a) + Substituto(a) + apoio técnico — não basta acúmulo de função."));
  out.push(bullet("Garantir treinamento periódico obrigatório (mínimo anual) pra todos os servidores que tratam dados pessoais."));

  out.push(h2Exec("3. Próximos 90 dias"));
  out.push(bullet("Aprovar o Plano de Ação consolidado (Fase 5) e atribuir responsáveis formais por cada ação prioritária."));
  out.push(bullet("Publicar/atualizar o Aviso de Privacidade no portal externo (exigência Art. 9 LGPD)."));
  out.push(bullet("Promover aditamento contratual com cláusulas LGPD em contratos vigentes com operadores celebrados antes de 2020 (Art. 39 LGPD)."));
  out.push(bullet("Repetir o Termômetro Institucional ao final do ciclo pra evidenciar a evolução da maturidade."));

  out.push(h2Exec("Conclusão"));
  out.push(
    pExec(
      "A LGPD deixou de ser opção e tornou-se obrigação institucional, com responsabilização direta do(a) gestor(a) máximo(a) em caso de descumprimento. O patrocínio explícito da Alta Gestão é o que diferencia órgãos que TÊM PGP de órgãos que apenas têm DPO designado. O trabalho realizado pelo grupo durante o curso é base estruturada — a próxima etapa depende de decisões estratégicas que somente a chefia superior pode tomar.",
    ),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "Para detalhamento completo de cada instrumento, consultar o Caderno do Curso (versão completa).",
          italics: true,
          size: 20,
          color: "64748B",
        }),
      ],
    }),
  );
  return out;
}

export function gerarCadernoExecutivo(data: GrupoCadernoData): (Paragraph | Table)[] {
  return [
    ...capaExec(data),
    ...sumarioExecutivo(data),
    ...painelConsolidado(data),
    ...statusFasePreliminar(data),
    ...statusFase1(data),
    ...statusFase2(data),
    ...statusFase3(data),
    ...statusFase4(data),
    ...statusFase5(data),
    ...statusFase6(data),
    ...statusFase7(data),
    ...conclusaoExecutiva(data),
  ];
}

// =============================================================================
// CARTILHA INSTITUCIONAL (C) — manual genérico ~100-150pg pra qualquer órgão
//
// Diferente de A e B, a Cartilha NÃO depende de nenhum grupo do curso. Reusa
// 100% das funções de render das fases, passando um GrupoCadernoData mockado
// pra forçar uso dos dados-MODELO em todas as seções. Adiciona capítulos
// extras (A-K) específicos da Cartilha em torno das 8 fases.
//
// Cor de capa: roxo/índigo (diferencia visualmente dos outros 2 documentos).
// Imports da cartilha estão no topo do arquivo, junto dos demais.
// =============================================================================

const COR_CARTILHA_TITULO = "5B21B6"; // roxo/índigo escuro
const COR_CARTILHA_ACCENT = "7C3AED";

export type CartilhaOpts = {
  nomeInstituicao?: string;
  tipoOrgao?: "PM" | "CM" | "AUTARQUIA" | "TRIBUNAL" | "OUTRO";
};

// Helpers específicos da cartilha
function h1Cartilha(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    pageBreakBefore: true,
    children: [new TextRun({ text: texto, bold: true, size: 38, color: COR_CARTILHA_TITULO })],
  });
}

function h2Cartilha(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text: texto, bold: true, size: 28, color: COR_CARTILHA_ACCENT })],
  });
}

function h3Cartilha(texto: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: texto, bold: true, size: 24, color: "1E1B4B" })],
  });
}

// (mockGrupoData foi removido — as fases da Cartilha agora têm funções
// dedicadas que NÃO reusam renderFaseN do Caderno. Ver renderFase*Cartilha
// mais abaixo no arquivo.)

// ─── Capa + Apresentação ────────────────────────────────────────────────────

function capaCartilha(opts: CartilhaOpts): Paragraph[] {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const inst = opts.nomeInstituicao?.trim();
  const tipoTexto = opts.tipoOrgao === "PM" ? "Prefeitura Municipal"
    : opts.tipoOrgao === "CM" ? "Câmara Municipal"
    : opts.tipoOrgao === "AUTARQUIA" ? "Autarquia"
    : opts.tipoOrgao === "TRIBUNAL" ? "Tribunal"
    : opts.tipoOrgao === "OUTRO" ? "Instituição Pública"
    : null;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 200 },
      children: [
        new TextRun({ text: "CARTILHA DO PGP", bold: true, size: 56, color: COR_CARTILHA_TITULO }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Programa de Governança em Privacidade",
          italics: true,
          size: 30,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "Guia de Implementação da LGPD em Instituições Públicas",
          italics: true,
          size: 24,
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
    tipoTexto && inst
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 1200 },
          children: [
            new TextRun({ text: tipoTexto, italics: true, size: 22, color: "64748B" }),
          ],
        })
      : new Paragraph({ spacing: { after: 800 }, children: [new TextRun({ text: "" })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 },
      children: [
        new TextRun({ text: `Edição de ${hoje}`, size: 22, color: "475569" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "PGP Treinamento · Material institucional de apoio à conformidade LGPD",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  ];
}

function apresentacaoCartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Apresentação"));
  out.push(
    pComBold(
      "Esta Cartilha consolida, em formato pragmático e auto-suficiente, o caminho de implementação da **Lei nº 13.709/2018** — Lei Geral de Proteção de Dados Pessoais (LGPD) — em Instituições Públicas brasileiras. É material institucional pra uso INDEPENDENTE: não exige treinamento prévio, não depende de aplicativo, não requer conhecimento técnico avançado. O Encarregado e o Comitê de Privacidade do órgão podem usá-la como base de partida pra estruturar o Programa de Governança em Privacidade (PGP) da Instituição.",
    ),
  );
  out.push(h2Cartilha("O que esta Cartilha NÃO é"));
  out.push(bullet("NÃO é parecer jurídico institucional — orienta, não vincula a Instituição perante a ANPD."));
  out.push(bullet("NÃO substitui consulta a especialistas em casos de dúvida significativa."));
  out.push(bullet("NÃO é exaustiva — a LGPD tem 65 artigos + dezenas de Resoluções; aqui condensamos o essencial pra o setor público."));
  out.push(bullet("NÃO é receita única — Instituições diferem em porte, contexto e cultura; adaptar é parte do trabalho."));
  out.push(h2Cartilha("Como usar"));
  out.push(pComBold("**Leitura em sequência** — pra quem está começando do zero. Cada fase do PGP (Preliminar + 7 fases) está organizada em sequência. Lendo do início ao fim, fica claro o método completo."));
  out.push(pComBold("**Consulta pontual** — pra dúvidas específicas. Use o sumário pra ir direto ao instrumento que está estruturando: Inventário · Riscos · GAP · Plano · RIPD · Aviso · DSR · Operadores · Incidentes · PRI."));
  out.push(pComBold("**Apoio à capacitação** — pra capacitar a equipe. Os capítulos FAQ (perguntas frequentes), Glossário, Base Legal e Armadilhas Comuns servem de material didático em treinamentos internos."));
  out.push(h2Cartilha("Estrutura"));
  out.push(bullet("8 etapas do PGP (Preliminar + Fases 1-7) com conteúdo institucional e modelos — a jornada completa, em sequência"));
  out.push(bullet("Modelos de documentos: Política do PGP · Comunicação ANPD · Cláusulas LGPD · Retenção · Consentimento"));
  out.push(bullet("Capítulos de consulta (no final): Glossário LGPD essencial (30 termos) · Base Legal — guia decisivo (Art. 7º + Art. 11)"));
  out.push(bullet("Armadilhas comuns no setor público (10 situações reais)"));
  out.push(bullet("Adaptação por porte (pequeno · médio · grande)"));
  out.push(bullet("Calendário de revisões recomendado"));
  out.push(bullet("Checklist final do PGP (25 perguntas)"));
  out.push(bullet("FAQ — perguntas frequentes (15+ respostas detalhadas)"));
  out.push(bullet("Referências externas curadas"));
  out.push(bullet("Roteiros de implementação por prazo (30 dias · 90 dias · 12 meses)"));
  return out;
}

// ─── D — Glossário ──────────────────────────────────────────────────────────

function renderGlossario(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Glossário LGPD essencial"));
  out.push(pComBold("**30 termos críticos** organizados por ordem alfabética com definição compatível com a Lei. Use como referência rápida durante a leitura desta Cartilha e nas reuniões do Comitê de Privacidade."));
  const ordenados = [...CONTEUDO_D_GLOSSARIO].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
  for (const item of ordenados) {
    out.push(p(item.termo, { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(item.definicao));
    if (item.artigo) {
      out.push(p(`Base: ${item.artigo}`, { italics: true, size: 18, color: "64748B" }));
    }
  }
  return out;
}

// ─── E — Base legal — guia decisivo ─────────────────────────────────────────

function renderBaseLegal(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha(CONTEUDO_E_BASE_LEGAL.titulo));
  for (const par of CONTEUDO_E_BASE_LEGAL.intro) out.push(pComBold(par));
  out.push(h2Cartilha(CONTEUDO_E_BASE_LEGAL.fluxograma.titulo));
  for (const item of CONTEUDO_E_BASE_LEGAL.fluxograma.perguntas) {
    out.push(p(item.pergunta, { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p("→ SIM: " + item.sim, { spacingAfter: 80 }));
    out.push(p("→ NÃO: " + item.nao, { spacingAfter: 160 }));
  }
  out.push(h2Cartilha(CONTEUDO_E_BASE_LEGAL.erros.titulo));
  for (const e of CONTEUDO_E_BASE_LEGAL.erros.lista) out.push(bullet(e));
  out.push(...calloutBlock("dica", "Regra de ouro", CONTEUDO_E_BASE_LEGAL.dica));
  return out;
}

// ─── A — Carta de Serviços como base do Inventário ─────────────────────────

function renderCartaServicos(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_A_CARTA_SERVICOS.titulo));
  for (const par of CONTEUDO_A_CARTA_SERVICOS.paragrafos) out.push(pComBold(par));
  out.push(h3Cartilha(CONTEUDO_A_CARTA_SERVICOS.metodo.titulo));
  for (let i = 0; i < CONTEUDO_A_CARTA_SERVICOS.metodo.passos.length; i++) {
    out.push(bullet(`${i + 1}. ${CONTEUDO_A_CARTA_SERVICOS.metodo.passos[i]}`));
  }
  out.push(h3Cartilha("Exemplos típicos de mapeamento Carta → Inventário"));
  for (const ex of CONTEUDO_A_CARTA_SERVICOS.exemplos) {
    out.push(p(`Serviço na Carta: ${ex.servicoCarta}`, { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(
      tabelaCampos([
        ["Vira processo", ex.processoInventario],
        ["Dados típicos", ex.dadosTipicos],
        ["Base legal sugerida", ex.baseLegalSugerida],
      ]),
    );
  }
  out.push(...calloutBlock("dica", "Dica final", CONTEUDO_A_CARTA_SERVICOS.dicaFinal));
  return out;
}

// ─── B — Modelos de documentos adicionais ──────────────────────────────────

function renderModeloPoliticaPGP(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_B_MODELO_POLITICA_PGP.titulo));
  out.push(p(CONTEUDO_B_MODELO_POLITICA_PGP.intro, { italics: true }));
  for (const sec of CONTEUDO_B_MODELO_POLITICA_PGP.secoes) {
    out.push(h3Cartilha(sec.titulo));
    out.push(p(sec.texto));
  }
  return out;
}

function renderModeloClausulasLGPD(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_B_CLAUSULAS_LGPD.titulo));
  out.push(p(CONTEUDO_B_CLAUSULAS_LGPD.intro, { italics: true }));
  for (const c of CONTEUDO_B_CLAUSULAS_LGPD.clausulas) {
    out.push(p(c.titulo, { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(c.texto));
  }
  return out;
}

function renderModeloPoliticaRetencao(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_B_POLITICA_RETENCAO.titulo));
  out.push(p(CONTEUDO_B_POLITICA_RETENCAO.intro, { italics: true }));
  for (const par of CONTEUDO_B_POLITICA_RETENCAO.conteudo) out.push(p(par));
  return out;
}

function renderModeloConsentimento(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_B_TERMO_CONSENTIMENTO.titulo));
  out.push(p(CONTEUDO_B_TERMO_CONSENTIMENTO.intro, { italics: true }));
  for (const c of CONTEUDO_B_TERMO_CONSENTIMENTO.campos) out.push(p(c));
  out.push(...calloutBlock("aviso", "Atenção", CONTEUDO_B_TERMO_CONSENTIMENTO.alerta));
  return out;
}

function renderModeloComunicacaoAnpd(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h2Cartilha(CONTEUDO_B_COMUNICACAO_ANPD.titulo));
  out.push(p(CONTEUDO_B_COMUNICACAO_ANPD.intro, { italics: true }));
  out.push(p("Campos obrigatórios:", { bold: true }));
  for (const c of CONTEUDO_B_COMUNICACAO_ANPD.campos) out.push(bullet(c));
  out.push(p(CONTEUDO_B_COMUNICACAO_ANPD.rodape, { italics: true }));
  return out;
}

// ─── C — Armadilhas comuns (10 pegadinhas) ─────────────────────────────────

function renderArmadilhas(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha(CONTEUDO_C_INTRO_PEGADINHAS.titulo));
  for (const par of CONTEUDO_C_INTRO_PEGADINHAS.paragrafos) out.push(pComBold(par));
  out.push(h2Cartilha("Armadilhas em processos (4)"));
  for (const peg of PEGADINHAS_PROCESSOS) {
    out.push(h3Cartilha(`${peg.orgao === "PM" ? "Prefeitura — " : "Câmara — "}${peg.rotuloCurto}`));
    out.push(p("Situação típica:", { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(`"${peg.trechoBriefing}"`, { italics: true }));
    out.push(p("Por que é armadilha:", { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(peg.porqueEpegadinha));
    out.push(p(`Base legal aplicável: ${peg.artigoLgpd}`, { italics: true, size: 18, color: "64748B" }));
    out.push(p(`Como evitar / Como discutir: ${peg.dicaDoFacilitador}`, { italics: true }));
  }
  out.push(h2Cartilha("Armadilhas no Aviso de Privacidade (6)"));
  for (const erro of CATALOGO_ERROS_PLANTADOS) {
    out.push(h3Cartilha(erro.rotulo));
    out.push(p(`Onde aparece: ${erro.secao}`, { italics: true, color: "64748B" }));
    out.push(p("Por que é armadilha:", { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(erro.descricaoPedagogica));
    out.push(p(`Base legal: ${erro.artigoLgpd}`, { italics: true, size: 18, color: "64748B" }));
    out.push(p(`Como evitar: ${erro.dicaDoFacilitador}`, { italics: true }));
  }
  out.push(...calloutBlock("info", "Lembrete", CONTEUDO_C_INTRO_PEGADINHAS.fechamento));
  return out;
}

// ─── F — Adaptação por porte ────────────────────────────────────────────────

function renderAdaptacaoPorte(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha(CONTEUDO_F_PORTE.titulo));
  for (const par of CONTEUDO_F_PORTE.intro) out.push(pComBold(par));
  for (const faixa of CONTEUDO_F_PORTE.faixas) {
    out.push(h2Cartilha(faixa.porte));
    out.push(p(faixa.perfil, { italics: true }));
    out.push(h3Cartilha("Orientações operacionais"));
    for (const o of faixa.orientacoes) out.push(pComBold(o));
    out.push(p("Orçamento aproximado:", { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(faixa.orcamento));
  }
  out.push(...calloutBlock("info", "Atenção", CONTEUDO_F_PORTE.rodape));
  return out;
}

// ─── G — Calendário de revisões ─────────────────────────────────────────────

function renderCalendarioRevisoes(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Calendário recomendado de revisões"));
  out.push(
    pComBold(
      "Conformidade LGPD não é projeto com fim — é processo contínuo. Esta tabela orienta a periodicidade típica de revisão de cada instrumento do PGP. Adapte conforme o porte e os eventos disparadores específicos da sua Instituição.",
    ),
  );
  for (const item of CONTEUDO_G_CALENDARIO) {
    out.push(h3Cartilha(item.instrumento));
    out.push(
      tabelaCampos([
        ["Periodicidade", item.periodicidade],
        ["Por que", item.porQue],
        ["Além disso", item.alemDisso],
      ]),
    );
  }
  return out;
}

// ─── H — Checklist final do PGP ─────────────────────────────────────────────

function renderChecklistFinal(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Checklist final do PGP"));
  out.push(
    pComBold(
      "**25 perguntas de auto-avaliação** organizadas pelas 8 etapas do PGP. Marque ✅ se cumprido, 🟡 se parcial e 🔴 se pendente. Score auto-avaliativo: 23-25 ✅ = PGP maduro; 18-22 = consolidação; 12-17 = em construção; abaixo de 12 = início. Repetir a cada 6 meses pra acompanhar evolução.",
    ),
  );
  for (const secao of CONTEUDO_H_CHECKLIST) {
    out.push(h2Cartilha(secao.secao));
    for (const item of secao.itens) {
      out.push(p(`☐ ${item}`));
    }
  }
  return out;
}

// ─── I — FAQ ─────────────────────────────────────────────────────────────────

function renderFAQ(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Perguntas frequentes (FAQ)"));
  out.push(
    pComBold(
      "Compilação de **perguntas que aparecem com frequência** em treinamentos, atendimentos do canal DSR e reuniões do Comitê de Privacidade. As respostas têm caráter orientativo — não substituem parecer jurídico institucional em casos de dúvida significativa.",
    ),
  );
  for (let i = 0; i < CONTEUDO_I_FAQ.length; i++) {
    const item = CONTEUDO_I_FAQ[i];
    out.push(h3Cartilha(`${i + 1}. ${item.pergunta}`));
    out.push(p(item.resposta));
  }
  return out;
}

// ─── J — Referências externas curadas ──────────────────────────────────────

function renderReferenciasExternas(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Referências externas curadas"));
  out.push(
    pComBold(
      "Lista mínima e curada. Não busca exaustividade — busca ENTREGAR aquilo que efetivamente é usado no dia-a-dia da implementação. A ANPD publica regularmente novos materiais; consultar o portal `gov.br/anpd` periodicamente.",
    ),
  );
  for (const cat of CONTEUDO_J_REFERENCIAS) {
    out.push(h2Cartilha(cat.categoria));
    for (const item of cat.itens) {
      out.push(p(item.titulo, { bold: true, color: COR_CARTILHA_ACCENT }));
      out.push(p(item.descricao));
      if (item.url) out.push(p(item.url, { italics: true, size: 18, color: "64748B" }));
    }
  }
  return out;
}

// ─── K — Roteiros de implementação por prazo ───────────────────────────────

function renderRoteirosPorPrazo(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha(CONTEUDO_K_ROTEIROS.titulo));
  out.push(pComBold(CONTEUDO_K_ROTEIROS.intro));
  for (const r of CONTEUDO_K_ROTEIROS.roteiros) {
    out.push(h2Cartilha(r.prazo));
    out.push(p(r.cenario, { italics: true }));
    out.push(h3Cartilha("Marcos"));
    for (const m of r.marcos) out.push(bullet(m));
    out.push(p("Entregáveis:", { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(r.entregaveis));
  }
  out.push(...calloutBlock("dica", "Recomendação", CONTEUDO_K_ROTEIROS.recomendacao));
  return out;
}

// ─── Encerramento ───────────────────────────────────────────────────────────

function encerramentoCartilha(): (Paragraph | Table)[] {
  return [
    h1Cartilha("Encerramento"),
    pComBold(
      "Esta Cartilha condensa, em formato pragmático, a experiência prática de implementação da LGPD em órgãos públicos brasileiros. **Não é o ponto final** — é ponto de partida estruturado pra que cada Instituição construa o seu próprio Programa de Governança em Privacidade.",
    ),
    pComBold(
      "**Três princípios institucionais** valem destacar no fechamento:",
    ),
    bullet("**Patrocínio da Alta Gestão** é condição prévia. Sem decisão estratégica explícita do dirigente máximo, qualquer esforço técnico vira papel."),
    bullet("**O programa respira com a Instituição.** Inventário, GAP, Plano e PRI são instrumentos vivos — exigem manutenção. Programa congelado envelhece em meses."),
    bullet("**Cultura supera procedimento.** Documentos bem feitos sem cultura institucional são apenas papel. A capacitação contínua e o exemplo das chefias importam mais que qualquer checklist."),
    h2Cartilha("Onde buscar ajuda"),
    bullet("**ANPD** — Autoridade Nacional, primeira fonte oficial. Portal `gov.br/anpd` reúne Resoluções, Guias e canal de comunicações."),
    bullet("**ENAP** — Escola Nacional de Administração Pública, cursos gratuitos pra servidores sobre LGPD."),
    bullet("**Comunidade técnica** — grupos de DPOs do setor público trocam experiências em listas e fóruns. Privacy by Design não é solitário."),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "Boa jornada na implementação do PGP da sua Instituição.",
          italics: true,
          size: 22,
          color: "475569",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "PGP Treinamento · Cartilha institucional",
          italics: true,
          size: 18,
          color: "94A3B8",
        }),
      ],
    }),
  ];
}

// ─── Renders dedicados das 8 fases pra Cartilha ────────────────────────────
//
// Funções específicas pra o modo Cartilha. NÃO reusam renderFaseN do Caderno
// porque aquelas funções têm linguagem de RELATÓRIO ("✅ O que vocês fizeram",
// score "50/100 — Maturidade em Desenvolvimento", "Encarregado ainda não
// designado"). A Cartilha é GUIA — apresenta modelos como referência
// institucional positiva, sem framework de diagnóstico.

function tituloModelos(): Paragraph {
  return h2Cartilha("📐 Modelos de referência");
}

function tituloComoAplicar(): Paragraph {
  return h2Cartilha("🎯 Como aplicar na sua Instituição");
}

function renderFasePreliminarCartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase Preliminar — Sensibilização e Engajamento"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_PRELIMINAR));

  out.push(tituloModelos());

  // Termômetro — apresentar como FERRAMENTA, sem score. As perguntas vêm do
  // arquivo oficial (termometro-perguntas.ts): mudou o questionário, a
  // Cartilha acompanha sozinha.
  out.push(h3Cartilha("Termômetro — ferramenta de auto-diagnóstico (você + sua Instituição)"));
  out.push(
    p(
      "Ferramenta de auto-diagnóstico em 2 blocos com scores separados: o primeiro mede o conhecimento de CADA PESSOA sobre a LGPD (3 perguntas); o segundo mede em que etapa da jornada de adequação a INSTITUIÇÃO está (7 perguntas — uma por etapa do PGP). Aplicar no início do trabalho (linha de base) e repetir periodicamente (semestral / anual) pra evidenciar a evolução. Cada pergunta tem 4 alternativas em escala crescente.",
    ),
  );
  out.push(p("Parte 1 — Sobre você (conhecimento pessoal):", { bold: true, color: COR_CARTILHA_ACCENT }));
  for (const dim of DIMENSOES_PESSOAIS) {
    out.push(p(`${dim.emoji} ${dim.titulo}`, { bold: true }));
  }
  out.push(p("Parte 2 — Sobre a sua Instituição (uma pergunta por etapa do PGP):", { bold: true, color: COR_CARTILHA_ACCENT }));
  for (const dim of DIMENSOES_INSTITUICAO) {
    out.push(p(`${dim.emoji} ${dim.titulo}`, { bold: true }));
    out.push(p(dim.hint.replace(/^No curso: /, "Etapa correspondente: "), { italics: true, size: 20 }));
  }
  out.push(
    p(
      "O formulário completo (com as 4 alternativas de cada pergunta, a pontuação e as faixas de resultado) está no Pacote de Modelos — Modelo 12.",
      { italics: true },
    ),
  );

  // Carta para a Alta Gestão — apresentar como ESTRUTURA, com texto modelo
  out.push(h3Cartilha("Carta para a Alta Gestão — estrutura recomendada"));
  out.push(
    p(
      "Documento institucional curto apresentado ao dirigente máximo no início do trabalho de adequação. Tem 5 campos principais. Os textos abaixo são apenas EXEMPLOS — adaptar à realidade do órgão.",
    ),
  );
  out.push(
    tabelaCampos([
      ["1. Destinatário", "Identificação formal do dirigente máximo (Prefeito(a), Presidente, Reitor(a), conforme órgão)"],
      ["2. Justificativa legal", "Síntese das obrigações decorrentes da LGPD aplicáveis ao órgão — citação dos artigos relevantes (1º, 23-32, 41)"],
      ["3. Riscos de não-cumprimento", "Sanções administrativas, responsabilização civil em incidentes, repercussão midiática, apontamentos do TC e MP"],
      ["4. Pedido concreto", "Designação formal do Encarregado · Constituição do Comitê · Alocação de recursos · Inclusão na agenda estratégica"],
      ["5. Assinatura", "Responsável pela condução do trabalho (Encarregado, ou líder técnico-jurídico, na fase pré-designação)"],
    ]),
  );

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.PRELIMINAR) out.push(bullet(passo));
  return out;
}

function renderFase1Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 1 — Formação das equipes de trabalho"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_FASE_1));

  out.push(tituloModelos());
  out.push(h3Cartilha("Ato de Designação — estrutura típica"));
  out.push(
    p(
      "O Ato de Designação é o documento formal que cumpre o Art. 41 da LGPD. Estrutura típica de Portaria/Decreto em órgão público brasileiro:",
    ),
  );
  out.push(
    tabelaCampos([
      ["Cabeçalho", "ATO DE DESIGNAÇÃO Nº MM/AAAA — (Designação do Encarregado pelo Tratamento de Dados Pessoais)"],
      ["Ementa", "Designa o Encarregado em cumprimento ao Art. 41 da Lei nº 13.709/2018"],
      ["Considerandos", "(a) Lei nº 13.709/2018 · (b) Resolução CD/ANPD nº 18/2024 · (c) necessidade de canal formal com ANPD e titulares"],
      ["Art. 1º", "Designa fulano(a) como Encarregado(a) — Parágrafo único: contatos (e-mail, telefone, endereço)"],
      ["Art. 2º", "Justificativa da escolha — perfil técnico-jurídico, autonomia, acesso à alta administração"],
      ["Art. 3º", "Atribuições conforme Art. 41 §2º da LGPD"],
      ["Art. 4º", "Vigência — entra em vigor na publicação"],
      ["Assinatura", "Autoridade máxima do órgão + ciência do designado(a)"],
    ]),
  );
  out.push(h3Cartilha("Critérios da Resolução CD/ANPD nº 18/2024"),);
  out.push(bullet("Perfil técnico-jurídico compatível — não exige formação em Direito, exige domínio prático de LGPD"));
  out.push(bullet("Autonomia funcional — proteção contra retaliação por decisões técnicas"));
  out.push(bullet("Ausência de conflito de interesse — não deve ser auditado pela própria função"));
  out.push(bullet("Acesso direto à alta administração — sem intermediação burocrática"));
  out.push(bullet("Encarregado Substituto — recomendado pra continuidade em férias/afastamentos"));

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_1) out.push(bullet(passo));
  return out;
}

function renderFase2Cartilha(orgao: "PM" | "CM"): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 2 — Diagnóstico Inicial"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  out.push(...renderDescricaoBlocos(CONTEUDO_FASE_2));

  out.push(tituloModelos());

  out.push(h3Cartilha("Levantamento de setores — exemplo ilustrativo"));
  out.push(
    p(
      "Lista típica de setores que tratam dados pessoais em um órgão municipal. Adaptar à estrutura específica da Instituição:",
    ),
  );
  const setoresExemplo = [
    "Recursos Humanos — folha de pagamento, contratação, processos seletivos",
    "Atendimento ao Cidadão / Ouvidoria — manifestações, denúncias, reclamações",
    "Tributário — cadastro fiscal de contribuintes, IPTU/ISS",
    "Saúde — prontuários eletrônicos, agendamentos, programas de saúde",
    "Educação — matrículas, registros escolares, dados de responsáveis",
    "Assistência Social — cadastro de famílias, programas sociais",
    "Tecnologia da Informação — gestão de acessos, logs, sistemas",
    "Comunicação — mailing institucional, redes sociais, transmissões",
  ];
  for (const s of setoresExemplo) out.push(bullet(s));

  out.push(h3Cartilha("Matriz de Priorização — Resolução CD/ANPD nº 2/2022"));
  out.push(
    p(
      "Critérios pra priorizar quais processos entram primeiro no Inventário detalhado da Fase 3. Cada critério pontua em 3 níveis (1/2/3). Score final 0-18: 0-6 BAIXA, 7-12 MÉDIA, 13-18 ALTA prioridade.",
    ),
  );
  const linhasCriterios: Array<[string, string]> = CRITERIOS_PRIORIZACAO.map((c) => [
    `${c.emoji} ${c.titulo}`,
    c.hint,
  ]);
  out.push(tabelaCampos(linhasCriterios));

  out.push(h3Cartilha("Roadmap de 90 dias — exemplo gerado automaticamente"));
  out.push(
    p(
      "Cronograma sugerido pra os 90 dias seguintes ao início do trabalho — distribui as 7 Fases do PGP em 13 marcos semanais. Modelo abaixo serve como referência; adaptar prazos à capacidade operacional da Instituição.",
    ),
  );
  const marcos = gerarRoadmap90Dias(orgao);
  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "94A3B8" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [cellHeader("Sem.", 8), cellHeader("Fase", 18), cellHeader("Atividade-chave", 44), cellHeader("Entrega", 30)],
        }),
        ...marcos.map((m) =>
          new TableRow({
            children: [
              cellTexto(String(m.semana), AlignmentType.CENTER),
              cellTexto(m.fase),
              cellTexto(m.titulo),
              cellTexto(m.entrega),
            ],
          }),
        ),
      ],
    }),
  );

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_2) out.push(bullet(passo));
  return out;
}

function renderFase3Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 3 — Mapeamento e Análise de Riscos"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-3");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3Cartilha("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }

  out.push(tituloModelos());

  out.push(h3Cartilha("Inventário — 2 processos modelo"));
  out.push(
    p(
      "Dois exemplos completos de processo no Inventário, com os 9 campos preenchidos. Use como referência da granularidade esperada na hora de mapear processos da sua Instituição:",
    ),
  );
  for (const m of MODELO_INVENTARIO_PROCESSOS) {
    out.push(h3Cartilha(`Exemplo: ${m.nome}`));
    out.push(
      tabelaCampos([
        ["Setor", m.setor],
        ["Finalidade", m.finalidade],
        ["Base legal", m.baseLegal],
        ["Tipos de dados", m.tiposDados],
        ["Dados sensíveis", m.dadosSensiveis ? "Sim" : "Não"],
        ["Retenção", m.retencao],
        ["Compartilhamento", m.compartilhamento],
        ["Medidas de segurança", m.medidasSeguranca],
      ]),
    );
  }

  out.push(h3Cartilha("Análise de Riscos — 2 riscos modelo (matriz P × I)"));
  out.push(
    p(
      "Dois exemplos de risco mapeado pra os processos modelo acima, com severidade (Probabilidade × Impacto) e plano de mitigação:",
    ),
  );
  for (const m of MODELO_RISCOS) {
    out.push(h3Cartilha(`Exemplo: ${m.riscoTitulo}`));
    out.push(
      tabelaCampos([
        ["Categoria", m.categoria],
        ["Severidade", formatarSeveridade(m.severityLevel)],
        ["Descrição", m.descricao],
        ["Plano de mitigação", m.mitigationPlan],
      ]),
    );
  }

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_3) out.push(bullet(passo));
  return out;
}

function renderFase4Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 4 — GAP Analysis"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-4");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3Cartilha("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }

  out.push(tituloModelos());
  out.push(h3Cartilha("Aplicação do GAP — 3 controles modelo"));
  out.push(
    p(
      "Para cada controle do catálogo GAP, a Instituição se classifica em ADERENTE / PARCIAL / NÃO ADERENTE com justificativa. Exemplos:",
    ),
  );
  for (const m of MODELO_GAP_RESPOSTAS) {
    const controle = getControleById(m.controleId);
    out.push(h3Cartilha(controle?.texto || `Controle ${m.controleId}`));
    out.push(
      tabelaCampos([
        ["Área", controle?.area || "—"],
        ["Classificação", traduzirResposta(m.resposta)],
        ["Justificativa", m.justificativa],
      ]),
    );
  }

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_4) out.push(bullet(passo));
  return out;
}

function renderFase5Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 5 — Plano de Ação e Adequação"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-5");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3Cartilha("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }

  out.push(tituloModelos());
  out.push(h3Cartilha("Plano de Ação — 3 ações modelo"));
  out.push(
    p(
      "Cada controle GAP não-aderente e cada risco alto deve virar uma ação no Plano com responsável, prazo e prioridade. Exemplos:",
    ),
  );
  const hoje = new Date();
  out.push(
    ...renderTabelaAcoes(
      MODELO_ACOES_PLANO.map((a) => {
        const prazoDate = new Date(hoje);
        prazoDate.setDate(prazoDate.getDate() + a.prazoSemanas * 7);
        return {
          acao: a.acao,
          responsavel: a.responsavel,
          prazo: prazoDate.toLocaleDateString("pt-BR"),
          prioridade: a.prioridade,
          status: "Aberta",
          origem: a.origem,
        };
      }),
    ),
  );

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_5) out.push(bullet(passo));
  return out;
}

function renderFase6Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 6 — Execução"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-6");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3Cartilha("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }

  out.push(tituloModelos());

  out.push(h3Cartilha("RIPD — estrutura completa em 8 seções"));
  out.push(
    p(
      "Relatório de Impacto à Proteção de Dados (Art. 38 LGPD). Obrigatório pros processos de alto risco. Estrutura recomendada pela ANPD:",
    ),
  );
  out.push(p(`Processo do exemplo: ${MODELO_RIPD.inventoryRef}`, { italics: true, color: "64748B" }));
  for (const s of MODELO_RIPD.secoes) {
    out.push(p(`${s.numero}. ${s.titulo}`, { bold: true, color: COR_CARTILHA_ACCENT }));
    out.push(p(s.conteudo));
  }

  out.push(h3Cartilha("Operadores — exemplo de cadastro"));
  out.push(
    p(
      "Todos os terceiros que tratam dados pessoais em nome do controlador (operadores) devem ser cadastrados com contratos contendo as cláusulas LGPD do Art. 39. Exemplo:",
    ),
  );
  for (const m of MODELO_OPERADORES) {
    out.push(h3Cartilha(`Exemplo: ${m.nome}`));
    out.push(
      tabelaCampos([
        ["CNPJ", m.cnpj],
        ["Serviço prestado", m.servico],
        ["Papel", m.papel],
        ["Contrato nº", m.contrato.numero],
        ["Objeto", m.contrato.objeto],
        ["Cláusulas LGPD", m.contrato.clausulasLgpd ? "Sim" : "Não"],
        ["Nível de risco", m.contrato.nivelRisco],
      ]),
    );
  }

  out.push(h3Cartilha("Canal DSR — exemplo de solicitação atendida"));
  out.push(
    p(
      "Toda Instituição precisa de canal funcional pra exercício de Direitos do Titular (Art. 18 LGPD). Resposta em até 15 dias úteis (Art. 19 II). Exemplo de registro:",
    ),
  );
  for (const m of MODELO_DSR) {
    out.push(h3Cartilha(`Exemplo: ${m.tipoSolicitacao} — ${m.titularNome}`));
    out.push(
      tabelaCampos([
        ["Contato do titular", m.titularContato],
        ["Status", traduzirStatus(m.status)],
        ["Descrição", m.descricao],
        ["Resposta", m.respostaTexto],
      ]),
    );
  }

  out.push(h3Cartilha("Aviso de Privacidade — conteúdo recomendado"));
  out.push(p(MODELO_AVISO_PRIVACIDADE_RESUMO));

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_6) out.push(bullet(passo));
  return out;
}

function renderFase7Cartilha(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1Cartilha("Fase 7 — Monitoramento Contínuo e Melhoria"));
  out.push(h2Cartilha("📚 Conteúdo institucional"));
  const conteudo = getConteudoFase("fase-7");
  if (conteudo) {
    out.push(...renderDescricaoBlocos(conteudo.descricao));
    out.push(h3Cartilha("Como proceder"));
    out.push(...renderDescricaoBlocos(conteudo.comoProc));
  }

  out.push(tituloModelos());

  out.push(h3Cartilha("Registro de incidente — exemplo"));
  out.push(
    p(
      "Estrutura típica de registro de incidente conforme Art. 48 LGPD + Resolução CD/ANPD nº 15/2024:",
    ),
  );
  out.push(
    tabelaCampos([
      ["Título do incidente", MODELO_INCIDENTE.titulo],
      ["Severidade", MODELO_INCIDENTE.severidade],
      ["Status (encerrado)", traduzirStatus(MODELO_INCIDENTE.status)],
      ["Comunicado à ANPD", MODELO_INCIDENTE.comunicadoAnpd ? "Sim — em até 3 dias úteis" : "Não"],
      ["Comunicado aos titulares", MODELO_INCIDENTE.comunicadoTitular ? "Sim — em até 7 dias úteis (severidade ALTA/CRÍTICA)" : "Não"],
      ["Descrição", MODELO_INCIDENTE.descricao],
      [
        "Medidas de mitigação aplicadas",
        MODELO_INCIDENTE.formularioAnpd.medidasMitigacao.map((m: string) => `• ${m}`).join("\n"),
      ],
    ]),
  );

  out.push(h3Cartilha("Plano de Resposta a Incidentes (PRI) — estrutura recomendada"));
  out.push(
    p(
      "Documento institucional que define a equipe responsável (ETIR) e a matriz de responsabilidades por etapa NIST (Detectar / Conter / Erradicar / Recuperar / Lições aprendidas). Tem que estar pronto ANTES do incidente acontecer.",
    ),
  );
  out.push(p("Equipe de Tratamento de Incidentes — composição típica:", { bold: true, color: COR_CARTILHA_ACCENT }));
  for (const m of MODELO_PRI_EQUIPE) {
    out.push(bullet(`${m.papel} — função: ${m.cobertura}. Contato 24h obrigatório (preferencialmente celular institucional)`));
  }
  out.push(p("Matriz RACI por etapa NIST — distribuição típica:", { bold: true, color: COR_CARTILHA_ACCENT }));
  out.push(...renderTabelaRaci(MODELO_PRI_RACI));

  out.push(tituloComoAplicar());
  for (const passo of PROXIMOS_PASSOS_POR_FASE.FASE_7) out.push(bullet(passo));
  return out;
}

// ─── Função principal ───────────────────────────────────────────────────────

export function gerarCartilhaInstitucional(opts: CartilhaOpts = {}): (Paragraph | Table)[] {
  const orgao = opts.tipoOrgao === "CM" ? "CM" : "PM";
  return [
    ...capaCartilha(opts),
    ...apresentacaoCartilha(),
    // A JORNADA primeiro: o leitor entra direto nas 8 etapas após a
    // Apresentação. Glossário e Base Legal são material de CONSULTA —
    // moram no bloco final, junto de Armadilhas/FAQ/Checklist (decisão
    // do user 2026-06-12: o começo com "dicionário + lei" era árido).
    // 8 fases — funções dedicadas (sem linguagem de relatório)
    ...renderFasePreliminarCartilha(),
    ...renderFase1Cartilha(),
    ...renderFase2Cartilha(orgao),
    // Carta de Serviços encaixa lógicamente após a Fase 2
    ...renderCartaServicos(),
    ...renderFase3Cartilha(),
    ...renderFase4Cartilha(),
    ...renderFase5Cartilha(),
    // Política PGP encaixa antes da Fase 6 (documento-mater do programa)
    ...renderModeloPoliticaPGP(),
    ...renderFase6Cartilha(),
    // Cláusulas + Retenção + Consentimento são instrumentos da Fase 6
    ...renderModeloClausulasLGPD(),
    ...renderModeloPoliticaRetencao(),
    ...renderModeloConsentimento(),
    ...renderFase7Cartilha(),
    // Comunicação ANPD é da Fase 7
    ...renderModeloComunicacaoAnpd(),
    // Capítulos de CONSULTA — abrem com Glossário + Base Legal (movidos
    // do início; ver comentário acima)
    ...renderGlossario(),
    ...renderBaseLegal(),
    ...renderArmadilhas(),
    ...renderAdaptacaoPorte(),
    ...renderCalendarioRevisoes(),
    ...renderChecklistFinal(),
    ...renderFAQ(),
    ...renderReferenciasExternas(),
    ...renderRoteirosPorPrazo(),
    ...encerramentoCartilha(),
  ];
}
