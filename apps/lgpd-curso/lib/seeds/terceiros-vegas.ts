// Seeds dos 4 operadores pré-cadastrados de Vegas — usados pela tela "Criar turma".
// Cada operador chega ao grupo com situação contratual rascunhada, alinhada
// aos 4 processos do Inventário:
//
//   PM (Prefeitura):
//     - VegaSeg Segurança Patrimonial   → contrato ANTIGO sem cláusulas LGPD
//                                          (vinculado ao Posto Dr. Joaquim Bento)
//     - CIEE                            → contrato NOVO sendo redigido
//                                          (vinculado a Estagiários)
//
//   CM (Câmara):
//     - Buffet & Cerimonial Vegas       → em RENOVAÇÃO, vai aditivar
//                                          (vinculado à Tribuna Livre)
//     - OuviTech Sistemas               → contrato NOVO com dados sensíveis
//                                          (vinculado à Ouvidoria)
//
// Pegadinha pedagógica: cada tipo exige um caminho de adequação diferente
// (aditamento robusto vs cláusulas novas simples). O nível de risco já vem
// pré-classificado conforme Res. ANPD nº 2/2022.

export type TerceiroSeed = {
  nome: string;
  cnpj: string;
  servico: string;
  contato: string;
  papelResponsavel: string; // qual papel é o "dono" — geralmente ADMINISTRATIVO
  contrato: {
    numero: string;
    objeto: string;
    clausulasLgpd: boolean; // false p/ os que precisam de adequação
    tipoOperacao: "ADITIVO_NECESSARIO" | "CONTRATO_NOVO_CLAUSULAS" | "RENOVACAO_ADITIVAR" | "CONTRATO_NOVO_ALTO_RISCO";
    nivelRisco: "BAIXO" | "MEDIO" | "ALTO";
    vigenciaInicioISO?: string; // ex: "2019-03-15" — pode ser antigo
    vigenciaFimISO?: string;
    observacao?: string;
  };
};

export const TERCEIROS_PM: TerceiroSeed[] = [
  {
    nome: "VegaSeg Segurança Patrimonial Ltda",
    cnpj: "12.345.678/0001-90",
    servico:
      "Vigilância armada e patrulhamento 24h do Posto de Saúde Dr. Joaquim Bento. " +
      "Inclui controle de acesso de pacientes e funcionários, monitoramento por câmeras, " +
      "registro de ocorrências e segurança de medicamentos controlados.",
    contato: "comercial@vegaseg.com.br · (27) 3322-1100",
    papelResponsavel: "ADMINISTRATIVO",
    contrato: {
      numero: "CT-PM-007/2019",
      objeto:
        "Prestação de serviços continuados de vigilância patrimonial armada e " +
        "eletrônica nas dependências do Posto de Saúde Municipal Dr. Joaquim Bento. " +
        "Inclui sistema de CFTV com 12 câmeras e gravação em servidor próprio da contratada.",
      clausulasLgpd: false,
      tipoOperacao: "ADITIVO_NECESSARIO",
      // ALTO: dados sensíveis de saúde (acesso a área de prontuários) +
      // vigilância em zona acessível ao público (câmeras pacientes)
      nivelRisco: "ALTO",
      vigenciaInicioISO: "2019-03-15",
      vigenciaFimISO: "2026-03-14",
      observacao:
        "Contrato firmado antes da vigência da LGPD (entrou em vigor 2020-09). " +
        "Não contém qualquer cláusula sobre proteção de dados pessoais. " +
        "Precisa de aditamento contratual urgente — operador acessa área onde " +
        "prontuários ficam armazenados + opera câmeras com gravação de pacientes.",
    },
  },
  {
    nome: "CIEE — Centro de Integração Empresa-Escola",
    cnpj: "61.600.839/0001-55",
    servico:
      "Intermediação de estágios e contratos de aprendizagem. Receber currículos, " +
      "fazer entrevistas iniciais, gerar termo de compromisso de estágio, processar " +
      "folha de bolsa-auxílio e seguro contra acidentes.",
    contato: "atendimento.es@ciee.org.br · (27) 3222-3344",
    papelResponsavel: "ADMINISTRATIVO",
    contrato: {
      numero: "CT-PM-014/2026 (em elaboração)",
      objeto:
        "Convênio para intermediação de estágios remunerados de estudantes do ensino " +
        "médio, técnico e superior junto à Prefeitura Municipal de Vegas, abrangendo " +
        "320 candidatos por seleção (2 vezes/ano).",
      clausulasLgpd: false,
      tipoOperacao: "CONTRATO_NOVO_CLAUSULAS",
      // MÉDIO: larga escala (640 candidatos/ano) + dados socioeconômicos
      // (renda, PCD, baixa renda) mas sem sensíveis de saúde
      nivelRisco: "MEDIO",
      observacao:
        "Contrato novo, em elaboração pelo setor Administrativo. É oportunidade " +
        "ideal pra incluir cláusulas LGPD desde o início (mais barato que aditar depois). " +
        "Setor Administrativo já tem minuta padrão — basta incluir o Anexo de Proteção " +
        "de Dados antes de assinar.",
    },
  },
];

export const TERCEIROS_CM: TerceiroSeed[] = [
  {
    nome: "Buffet & Cerimonial Vegas Eventos Ltda",
    cnpj: "98.765.432/0001-21",
    servico:
      "Serviços de buffet e cerimonial para sessões solenes, audiências públicas " +
      "e Tribuna Livre. Atendimento a convidados, autoridades e cidadãos inscritos. " +
      "Inclui lista de presença manual e foto/vídeo dos eventos.",
    contato: "contato@buffetcerimonial.vegas · (27) 3344-5566",
    papelResponsavel: "ADMINISTRATIVO",
    contrato: {
      numero: "CT-CM-003/2023 (em renovação)",
      objeto:
        "Contratação de serviços de buffet e cerimonial para sessões solenes da Câmara " +
        "Municipal de Vegas, audiências públicas e Tribuna Livre. Vigência atual " +
        "encerra em 30 dias — Procuradoria já abriu processo de renovação.",
      clausulasLgpd: false,
      tipoOperacao: "RENOVACAO_ADITIVAR",
      // BAIXO: dados cadastrais básicos de convidados (nome, contato). Sem dados sensíveis,
      // sem larga escala. Mas operador faz lista de presença + foto/vídeo dos eventos.
      nivelRisco: "BAIXO",
      vigenciaInicioISO: "2023-06-01",
      vigenciaFimISO: "2026-06-15",
      observacao:
        "Renovação contratual é gatilho perfeito pra incluir as cláusulas LGPD " +
        "que faltam. Aproveitar o aditivo de renovação pra também incluir o Anexo " +
        "de Proteção de Dados (única assinatura, menos trabalho).",
    },
  },
  {
    nome: "OuviTech Sistemas Ltda",
    cnpj: "55.111.222/0001-77",
    servico:
      "Sistema SaaS de gestão de ouvidoria. Recebe manifestações por web/email/0800, " +
      "indexa por palavras-chave, faz triagem automática e gera relatórios. " +
      "Hospedagem em nuvem (AWS São Paulo). 1.200 manifestações/ano.",
    contato: "comercial@ouvitech.com.br · (11) 4002-8922",
    papelResponsavel: "ADMINISTRATIVO",
    contrato: {
      numero: "CT-CM-009/2026 (em negociação)",
      objeto:
        "Licenciamento de software SaaS para gestão da Ouvidoria Municipal, com " +
        "hospedagem em nuvem, módulo de triagem automática, integração com e-mail e " +
        "telefonia 0800, e geração de relatórios estatísticos.",
      clausulasLgpd: false,
      tipoOperacao: "CONTRATO_NOVO_ALTO_RISCO",
      // ALTO: larga escala (1200 manifestações/ano) + decisão automatizada
      // (triagem automática) + dados sensíveis em contexto (denúncias podem
      // conter dados de saúde do denunciante + informações sobre terceiros).
      // Vai precisar de cláusulas robustas + RIPD obrigatório.
      nivelRisco: "ALTO",
      observacao:
        "Contrato novo de altíssima criticidade — sistema processa denúncias " +
        "(manifestações podem conter dados sensíveis: saúde do denunciante, " +
        "dados de terceiros, contexto pessoal). Triagem automática de palavras-chave " +
        "é decisão tomada com base em tratamento automatizado (art. 20 LGPD). " +
        "Exige cláusulas robustas + DPO designado no operador + plano de incidentes.",
    },
  },
];

// Mapa: ID do tipo → label amigável + cor
export const TIPO_OPERACAO_INFO: Record<string, { label: string; descricao: string; cor: string; emoji: string }> = {
  ADITIVO_NECESSARIO: {
    label: "Aditivo necessário",
    descricao: "Contrato antigo, sem cláusulas LGPD. Precisa de aditamento.",
    cor: "red",
    emoji: "🔴",
  },
  CONTRATO_NOVO_CLAUSULAS: {
    label: "Contrato novo — sugerir cláusulas",
    descricao: "Contrato sendo redigido. Inclua o Anexo de Proteção de Dados antes de assinar.",
    cor: "blue",
    emoji: "🔵",
  },
  RENOVACAO_ADITIVAR: {
    label: "Renovação — aproveitar pra aditivar",
    descricao: "Vigência expirando. Aproveite a renovação pra incluir cláusulas LGPD.",
    cor: "amber",
    emoji: "🟡",
  },
  CONTRATO_NOVO_ALTO_RISCO: {
    label: "Novo — alto risco",
    descricao: "Contrato novo com dados sensíveis/larga escala. Use cláusulas robustas.",
    cor: "purple",
    emoji: "🟣",
  },
};

export const NIVEL_RISCO_INFO: Record<string, { label: string; cor: string; sugestao: string }> = {
  BAIXO: {
    label: "Baixo",
    cor: "green",
    sugestao: "Conjunto mínimo de cláusulas (3-4 essenciais)",
  },
  MEDIO: {
    label: "Médio",
    cor: "amber",
    sugestao: "Conjunto simples de cláusulas (~7)",
  },
  ALTO: {
    label: "Alto",
    cor: "red",
    sugestao: "Conjunto robusto de cláusulas (~12) + RIPD obrigatório",
  },
};

export function terceirosPorOrgao(orgao: "PM" | "CM"): TerceiroSeed[] {
  return orgao === "PM" ? TERCEIROS_PM : TERCEIROS_CM;
}
