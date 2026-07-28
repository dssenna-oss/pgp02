// Perguntas ESPECÍFICAS de cada documento (o que o Perfil não cobre).
// E2 cobre os 6 Documentos Formais; os demais ganham config na E3 — sem
// config, o documento ainda é preenchido com o Perfil (regras globais).
//
// `alvoPrefixo` = início do texto interno do [PLACEHOLDER] que a resposta
// preenche. `sequencial` cobre tokens repetidos posicionais (ex.: [NOME] na
// Portaria — I é o DPO do Perfil, II-VI vêm das perguntas, na ordem).

export type PerguntaDoc = {
  id: string;
  label: string;
  dica?: string;
  tipo: "texto" | "textarea";
  alvoPrefixo?: string; // ausente quando a resposta entra só via `sequencial`
};

export type ConfigDoc = {
  numero: number;
  perguntas: PerguntaDoc[];
  sequencial?: { token: string; ordem: ("@dpoNome" | string)[] };
  // Nota de uso mostrada no lugar (ou além) do formulário — usada nas fichas
  // de trabalho (1 por processo/risco/solicitação) e nos docs de hora-do-
  // incidente, onde os [colchetes] restantes são preenchidos no Word, caso a caso.
  nota?: string;
};

export const CONFIG_DOCS: ConfigDoc[] = [
  {
    numero: 1, // Ato de Designação
    perguntas: [
      { id: "numeroAto", label: "Número do ato", dica: "Ex.: 03/2026", tipo: "texto", alvoPrefixo: "NÚMERO/AAAA" },
      { id: "justificativa", label: "Justificativa da escolha do Encarregado", dica: "Perfil técnico-jurídico, autonomia, acesso à alta administração…", tipo: "textarea", alvoPrefixo: "JUSTIFICATIVA DA ESCOLHA" },
    ],
  },
  {
    numero: 2, // Portaria do Comitê
    perguntas: [
      { id: "numeroPortaria", label: "Número da portaria", dica: "Ex.: 12/2026", tipo: "texto", alvoPrefixo: "NÚMERO/AAAA" },
      { id: "membroTI", label: "Membro — Tecnologia da Informação (TI)", tipo: "texto" },
      { id: "membroJuridico", label: "Membro — área Jurídica / Procuradoria", tipo: "texto" },
      { id: "membroRH", label: "Membro — Gestão de Pessoas (RH)", tipo: "texto" },
      { id: "membroComunicacao", label: "Membro — Comunicação", tipo: "texto" },
      { id: "membroProcessos", label: "Membro — áreas donas dos processos críticos", dica: "Ex.: Saúde, Tributário, Assistência Social", tipo: "texto" },
      { id: "periodicidade", label: "Periodicidade das reuniões", dica: "Ex.: trimestralmente", tipo: "texto", alvoPrefixo: "PERIODICIDADE" },
    ],
    sequencial: {
      token: "[NOME]",
      ordem: ["@dpoNome", "membroTI", "membroJuridico", "membroRH", "membroComunicacao", "membroProcessos"],
    },
  },
  {
    numero: 3, // Carta à Alta Gestão — sai pronta só com o Perfil
    perguntas: [],
  },
  {
    numero: 4, // Roadmap de 90 dias
    perguntas: [
      { id: "responsavel", label: "Responsável pelas entregas do cronograma", dica: "Ex.: Encarregado(a) + Comitê de Privacidade — preenche a coluna \"responsável\" das 13 semanas", tipo: "texto", alvoPrefixo: "a definir" },
    ],
  },
  {
    numero: 5, // Aviso de Privacidade
    perguntas: [
      { id: "finalidades", label: "Principais finalidades do tratamento", dica: "Ex.: prestação de serviços públicos, atendimento ao cidadão, cumprimento de obrigações legais", tipo: "textarea", alvoPrefixo: "FINALIDADES" },
      { id: "listaDados", label: "Quais dados a instituição trata", dica: "Ex.: dados cadastrais (nome, CPF), de contato (e-mail, telefone) e, em serviços de saúde, dados sensíveis", tipo: "textarea", alvoPrefixo: "LISTA" },
      { id: "prazoAtendimento", label: "Prazo de guarda — dados de atendimento", dica: "Ex.: 5 anos", tipo: "texto", alvoPrefixo: "X anos" },
      { id: "prazoSaude", label: "Prazo de guarda — dados de saúde", dica: "Ex.: 20 anos", tipo: "texto", alvoPrefixo: "Y anos" },
      { id: "prazoDemais", label: "Prazo de guarda — demais dados", dica: "Ex.: 5 anos", tipo: "texto", alvoPrefixo: "Z anos" },
    ],
  },
  {
    numero: 6, // Documento do PRI
    perguntas: [
      { id: "canal", label: "Canal interno pra reportar incidentes", dica: "Ex.: e-mail dpo@instituicao.gov.br + telefone (00) 0000-0000", tipo: "texto", alvoPrefixo: "CANAL" },
      { id: "contato24h", label: "Contato de emergência 24h da equipe de resposta", dica: "Nome · e-mail · celular", tipo: "texto", alvoPrefixo: "NOME · E-MAIL · CELULAR 24h" },
    ],
  },

  // ── Grupo 2 — Documentos Institucionais ────────────────────────────────────
  {
    numero: 7, // Política do PGP
    perguntas: [
      { id: "diarioOficial", label: "Onde os atos da instituição são publicados", dica: "Ex.: Diário Oficial do Município", tipo: "texto", alvoPrefixo: "DIÁRIO OFICIAL" },
      { id: "periodicidade", label: "Periodicidade das reuniões de acompanhamento", dica: "Ex.: mensalmente", tipo: "texto", alvoPrefixo: "PERIODICIDADE" },
      { id: "areas", label: "Áreas envolvidas na governança", dica: "Ex.: TI, Jurídico, Comunicação, RH, áreas de negócio", tipo: "texto", alvoPrefixo: "ÁREAS" },
    ],
  },
  {
    numero: 8, // Cláusulas LGPD pra contratos
    perguntas: [],
    nota: "Este aditamento já sai pronto — não tem campos a preencher. Anexe aos contratos novos e às renovações com operadores (a Ficha de Operador, Modelo 20, ajuda a mapear quais).",
  },
  {
    numero: 9, // Retenção e Descarte
    perguntas: [],
    nota: "Os prazos [entre colchetes] são SUGESTÕES com base legal indicada. Antes de aprovar, confirme cada um com o setor de arquivo e o jurídico da sua instituição — tabela de temporalidade local prevalece.",
  },
  {
    numero: 10, // Termo de Consentimento
    perguntas: [
      { id: "finalidade", label: "Finalidade específica do consentimento", dica: "Ex.: envio de informativo institucional mensal sobre eventos culturais", tipo: "textarea", alvoPrefixo: "ESPECÍFICA" },
      { id: "dados", label: "Dados coletados pra essa finalidade", dica: "Ex.: nome, e-mail, telefone, imagem em vídeo de evento", tipo: "texto", alvoPrefixo: "LISTA ESPECÍFICA" },
      { id: "prazo", label: "Até quando os dados serão tratados", dica: "Ex.: até que o titular solicite descadastro", tipo: "texto", alvoPrefixo: "ESPECÍFICO" },
      { id: "compartilhamento", label: "Compartilhamento com terceiros (se houver)", dica: "Ex.: empresa contratada pra hospedagem do mailing — nome + cláusula", tipo: "texto", alvoPrefixo: "se houver, ESPECIFICAR" },
    ],
    nota: "O [NOME DO TITULAR] fica em aberto de propósito: é preenchido por cada pessoa que assina o termo. Lembre: um termo POR finalidade.",
  },
  {
    numero: 11, // Comunicação de Incidente à ANPD
    perguntas: [],
    nota: "Documento de HORA DO INCIDENTE: o cabeçalho institucional já sai preenchido; os campos do ocorrido (datas, descrição, riscos, medidas) você completa no Word quando — e se — precisar, com o prazo de 3 dias úteis da Res. CD/ANPD nº 15/2024 correndo. Deixe-o baixado e à mão.",
  },
  {
    numero: 12, // Comunicação aos Titulares
    perguntas: [],
    nota: "Companheira da comunicação à ANPD: a carta às pessoas afetadas. Cabeçalho e contatos do Encarregado já saem prontos; o relato do incidente é preenchido caso a caso, em linguagem simples.",
  },

  // ── Grupo 3 — Fichas Operacionais (1 por registro; duplique no Word) ──────
  {
    numero: 13, // Termômetro
    perguntas: [],
    nota: "Formulário de auto-diagnóstico pra DISTRIBUIR (imprima ou copie): cada participante marca as próprias respostas e soma o score. Ótimo pra abrir a jornada e repetir depois de 6 meses.",
  },
  {
    numero: 14, // Matriz de Priorização
    perguntas: [],
    nota: "Ficha de trabalho: UMA por processo avaliado. Baixe o Word e duplique a página pra cada processo — alto risco = marcou ao menos 1 critério Geral E 1 Específico (regra da Res. CD/ANPD nº 2/2022).",
  },
  {
    numero: 15, // Ficha de Processo
    perguntas: [],
    nota: "Uma ficha por processo inventariado — comece pelos priorizados na Matriz (Modelo 14) e duplique no Word.",
  },
  {
    numero: 16, // Ficha de Risco
    perguntas: [],
    nota: "Uma ficha por risco identificado. A severidade sai da matriz Probabilidade × Impacto; riscos ALTOS pedem escalada — e alimentam o RIPD (Modelo 19).",
  },
  {
    numero: 17, // GAP
    perguntas: [],
    nota: "Uma ficha por controle avaliado (o curso trabalha com 10 a 30). O resultado alimenta direto o Plano de Ação (Modelo 18).",
  },
  {
    numero: 18, // Plano de Ação
    perguntas: [],
    nota: "Uma ficha por ação. Origem típica: controles NÃO ADERENTES do GAP e riscos ALTOS das Fichas de Risco.",
  },
  {
    numero: 19, // RIPD
    perguntas: [],
    nota: "Um RIPD por processo de ALTO RISCO (a Matriz do Modelo 14 aponta quais). O cabeçalho institucional já sai preenchido; a análise das 8 seções é feita processo a processo, com o Comitê.",
  },
  {
    numero: 20, // Ficha de Operador
    perguntas: [],
    nota: "Uma ficha por operador/contrato que trata dados em nome da instituição. Use junto com as Cláusulas LGPD (Modelo 08) pros aditivos.",
  },
  {
    numero: 21, // Registro DSR
    perguntas: [],
    nota: "Um registro por solicitação de titular recebida — protocolo, prazo e resposta documentados (art. 18 e art. 19 da LGPD). O canal informado no seu Aviso de Privacidade é a porta de entrada.",
  },
];

export function getConfigDoc(numero: number): ConfigDoc | null {
  return CONFIG_DOCS.find((c) => c.numero === numero) ?? null;
}
