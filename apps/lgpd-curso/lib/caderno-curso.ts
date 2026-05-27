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
import { DIMENSOES_TERMOMETRO, faixaQualitativa } from "./termometro-perguntas";
import { CRITERIOS_PRIORIZACAO, faixaPriorizacao } from "./criterios-priorizacao";
import { getControleById } from "./gap-catalogo";
import { gerarRoadmap90Dias } from "./roadmap-gerador";
import { gerarCartaAutoPreenchida } from "./carta-alta-gestao";
import { calcularMaturidade, nivelMaturidade, type KpisGrupo } from "./maturidade";

// =============================================================================
// Tipo dos dados de entrada (formato do retorno do prisma.cursoGrupo.findUnique
// no endpoint /api/curso/caderno/docx — campos relevantes documentados).
// =============================================================================

export type GrupoCadernoData = {
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
  out.push(bullet("Fase 1 — Designação do Encarregado (DPO)"));
  out.push(bullet("Fase 2 — Diagnóstico Inicial"));
  out.push(bullet("Fase 3 — Mapeamento e Análise de Riscos"));
  out.push(bullet("Fase 4 — Análise de Conformidade (GAP Analysis)"));
  out.push(bullet("Fase 5 — Programa de Governança em Privacidade"));
  out.push(bullet("Fase 6 — Execução (RIPD, Operadores, DSR, Aviso, Políticas)"));
  out.push(bullet("Fase 7 — Monitoramento e Resposta a Incidentes"));
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
  const tInicio = data.grupo.company.termometroInicio;
  const tFim = data.grupo.company.termometroFim;
  if (tInicio || tFim) {
    out.push(seloFeitoPeloGrupo());
    out.push(...renderTermometro(tInicio, tFim));
  } else {
    out.push(seloModelo());
    out.push(
      p(
        "Pelos dados-modelo, o diagnóstico de partida deste grupo seria semelhante ao perfil abaixo (auto-diagnóstico em 5 dimensões — escala Inicial / Em desenvolvimento / Estabelecido / Avançado):",
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

function renderTermometro(inicio: any, fim: any): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const blocos: Array<{ titulo: string; dado: any }> = [];
  if (inicio) blocos.push({ titulo: "Diagnóstico inicial (início do curso)", dado: inicio });
  if (fim) blocos.push({ titulo: "Diagnóstico final (fim do curso)", dado: fim });
  for (const bloco of blocos) {
    out.push(h3(bloco.titulo));
    out.push(pComBold(`Score: **${bloco.dado.score || 0}/100** — ${faixaQualitativa(bloco.dado.score || 0).label}`));
    const linhas: Array<[string, string]> = [];
    for (const dim of DIMENSOES_TERMOMETRO) {
      const d = (bloco.dado.dimensoes || []).find((x: any) => x.id === dim.id);
      if (!d) continue;
      const op = dim.opcoes.find((o) => o.id === d.opcaoEscolhida);
      linhas.push([`${dim.emoji} ${dim.titulo}`, `${op?.rotulo || "?"} (${d.pontos} pts)`]);
    }
    if (linhas.length > 0) out.push(tabelaCampos(linhas));
  }
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
// FASE 1 — Designação do Encarregado (DPO)
// =============================================================================

function renderFase1(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 1 — Designação do Encarregado (DPO)"));
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
  out.push(h1("Fase 4 — Análise de Conformidade (GAP Analysis)"));
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
  out.push(h1("Fase 5 — Programa de Governança em Privacidade"));
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
// FASE 6 — Execução (RIPD, Operadores, DSR, Aviso)
// =============================================================================

function renderFase6(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 6 — Execução (Instrumentos)"));
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
// FASE 7 — Monitoramento e Resposta a Incidentes
// =============================================================================

function renderFase7(data: GrupoCadernoData): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h1("Fase 7 — Monitoramento e Resposta a Incidentes"));
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
