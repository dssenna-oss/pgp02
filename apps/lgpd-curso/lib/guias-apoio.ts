// Guias de apoio do facilitador — telas pensadas pra PROJEÇÃO que explicam,
// campo a campo, como preencher cada missão. O facilitador projeta o guia da
// missão pra ajudar todos os grupos de uma vez, sem ir de mesa em mesa.
//
// IMPORTANTE: este arquivo NÃO contém conteúdo jurídico próprio. Ele só
// referencia as chaves de HELP_POR_CAMPO (lib/lgpd-refs.ts) — a MESMA fonte
// dos tooltips "?" dos mini-apps. Fonte única de verdade: o que o guia mostra
// é igual ao que o participante já vê na ajuda de cada campo, só que ampliado
// e organizado pra leitura à distância. Não entrega gabarito.

import { processosPorOrgao, type ProcessoSeed } from "./seeds/processos-vegas";

export type ProcessoContexto = {
  id: string;
  orgao: "PM" | "CM";
  nome: string;
  setor: string;
  finalidade: string;
};

export type BlocoGuia = {
  // Sub-ferramenta dentro da missão (ex.: RIPD, Aviso). Vazio em guia simples.
  titulo?: string;
  nota?: string;
  // Chaves de HELP_POR_CAMPO (lib/lgpd-refs.ts), na ordem de preenchimento.
  campoKeys: string[];
};

export type Guia = {
  slug: string;
  missao: string;
  fase: string;
  titulo: string;
  resumo: string; // chamada curta, aparece na sidebar e no índice
  intro: string;
  ordem?: string; // ordem de preenchimento sugerida, mostrada em destaque
  blocos: BlocoGuia[];
  comProcessos?: boolean; // Inventário: mostra o seletor dos 4 processos
};

const seq = (prefixo: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${prefixo}${i + 1}`);

function contexto(orgao: "PM" | "CM", p: ProcessoSeed, i: number): ProcessoContexto {
  return {
    id: `${orgao.toLowerCase()}-${i + 1}`,
    orgao,
    nome: p.nome,
    setor: p.setor,
    finalidade: p.finalidade,
  };
}

// Os 4 processos pré-cadastrados — contexto que o facilitador projeta.
export const PROCESSOS_CONTEXTO: ProcessoContexto[] = [
  ...processosPorOrgao("PM").map((p, i) => contexto("PM", p, i)),
  ...processosPorOrgao("CM").map((p, i) => contexto("CM", p, i)),
];

export const GUIAS: Guia[] = [
  {
    slug: "inventario",
    missao: "Missão 1",
    fase: "Fase 3 — Mapeamento e Análise de Riscos",
    titulo: "Inventário de Dados",
    resumo: "Como completar os 4 processos pré-cadastrados",
    intro:
      "Cada processo já chega rascunhado pela metade — nome, setor e finalidade preenchidos. " +
      "O grupo completa o resto. A lição é pensar na ordem certa: o titular antes do dado, a " +
      "finalidade antes da base legal.",
    ordem: "titulares → dados coletados → finalidade → base legal → retenção → compartilhamentos",
    comProcessos: true,
    blocos: [
      {
        campoKeys: [
          "baseLegal",
          "tiposDados",
          "dadosSensiveis",
          "retencao",
          "compartilhamento",
          "medidasSeguranca",
        ],
      },
    ],
  },
  {
    slug: "riscos",
    missao: "Missão 2",
    fase: "Fase 3 — Mapeamento e Análise de Riscos",
    titulo: "Análise de Riscos",
    resumo: "Como descrever e posicionar um risco na matriz 3×3",
    intro:
      "Risco não é abstrato — é o que pode acontecer com o cidadão se algo falhar. O grupo " +
      "confirma 2-3 riscos por processo e posiciona cada um na matriz 3×3 (Probabilidade × Impacto).",
    blocos: [
      {
        campoKeys: [
          "riscoDescricao",
          "riscoCategoria",
          "riscoProbabilidade",
          "riscoImpacto",
          "riscoMitigacao",
        ],
      },
    ],
  },
  {
    slug: "gap",
    missao: "Missão 3",
    fase: "Fase 4 — GAP Analysis",
    titulo: "GAP Analysis",
    resumo: "Como classificar cada controle com honestidade",
    intro:
      "Medir a maturidade real vale mais que parecer maduro. Para cada controle, o grupo " +
      "responde com honestidade e justifica em uma linha.",
    blocos: [{ campoKeys: ["gap_classificacao"] }],
  },
  {
    slug: "fase-6",
    missao: "Missão 4",
    fase: "Fase 6 — Execução",
    titulo: "RIPD, Terceiros, Direitos e Aviso",
    resumo: "As 4 ferramentas da Fase 6, na ordem certa",
    intro:
      "O Aviso de Privacidade é uma síntese — ele depende do RIPD, da lista de Terceiros e do " +
      "canal de Direitos do Titular. Por isso o grupo preenche estes três ANTES do Aviso. " +
      "Grupos que pularem direto pro Aviso vão produzir um documento vago.",
    ordem: "RIPD → Gestão de Terceiros → Direitos do Titular → Aviso de Privacidade",
    blocos: [
      {
        titulo: "RIPD — Relatório de Impacto à Proteção de Dados",
        nota: "8 seções no modelo da ANPD. Pré-requisito: Inventário aprovado + Riscos mapeados (Art. 38 LGPD).",
        campoKeys: seq("ripd_secao_", 8),
      },
      {
        titulo: "Gestão de Terceiros",
        nota: "Avalia operadores que tratam dados por conta do órgão (Art. 39 LGPD).",
        campoKeys: ["terceiro_avaliacao_risco", "terceiro_due_diligence", "terceiro_clausulas"],
      },
      {
        titulo: "Direitos do Titular (DSR)",
        nota: "Canal para o cidadão exercer os direitos dos Arts. 18 e 19 da LGPD.",
        campoKeys: ["dsr_direitos", "dsr_prazo"],
      },
      {
        titulo: "Aviso de Privacidade",
        nota: "12 seções no modelo da ANPD. É a síntese — só vale se o que está prometido EXISTE.",
        campoKeys: seq("aviso_secao_", 12),
      },
    ],
  },
  {
    slug: "incidentes",
    missao: "Missão 5",
    fase: "Fase 7 — Monitoramento",
    titulo: "Resposta a Incidentes",
    resumo: "Classificar severidade e comunicar no prazo",
    intro:
      "O incidente vai acontecer — a pergunta é se o grupo estará pronto. Registrar, classificar " +
      "a severidade e comunicar ANPD e titulares no prazo da Res. CD/ANPD nº 15/2024.",
    blocos: [
      {
        campoKeys: ["incidente_severidade", "incidente_72h_anpd", "incidente_comunicado_titular"],
      },
    ],
  },
];

export function getGuia(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

// Nome do campo/seção EXATAMENTE como o participante o vê no formulário do
// mini-app. Resolve a ambiguidade dos títulos de ajuda (ex.: "O que listar
// aqui"), que foram escritos pro tooltip "?" — onde o nome do campo já está
// ao lado. No guia, o título da ajuda vira o subtítulo e o rótulo do campo
// vira o cabeçalho, dizendo EM QUE campo a informação entra.
// Chaves sem entrada aqui (RIPD/Aviso) já têm o nome da seção no título da
// própria ajuda — caem no fallback.
export const ROTULO_CAMPO: Record<string, string> = {
  // Inventário
  baseLegal: "Base legal (Art. 7º / 11)",
  tiposDados: "Tipos de dados coletados",
  dadosSensiveis: "Contém dados pessoais sensíveis?",
  retencao: "Prazo de retenção",
  compartilhamento: "Compartilhamentos",
  medidasSeguranca: "Medidas de segurança",
  // Análise de Riscos
  riscoDescricao: "Descrição do risco",
  riscoCategoria: "Categoria",
  riscoProbabilidade: "Probabilidade",
  riscoImpacto: "Impacto",
  riscoMitigacao: "Plano de mitigação",
  // GAP Analysis
  gap_classificacao: "Classificação de cada controle",
  // Gestão de Terceiros
  terceiro_avaliacao_risco: "Avaliação de risco do terceiro",
  terceiro_due_diligence: "Due diligence",
  terceiro_clausulas: "Cláusulas LGPD no contrato",
  // Direitos do Titular (DSR)
  dsr_direitos: "Tipo de direito solicitado",
  dsr_prazo: "Prazo de resposta",
  // Incidentes
  incidente_severidade: "Severidade do incidente",
  incidente_72h_anpd: "Comunicação à ANPD",
  incidente_comunicado_titular: "Comunicação aos titulares",
};
