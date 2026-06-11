// Caderno do Curso — conteúdo institucional + dados-modelo de referência.
//
// Usado pelo gerador do DOCX entregue ao grupo no fim do curso. Tem 2 papéis:
//
// 1. CONTEÚDO INSTITUCIONAL — texto educativo curto pra cada fase (descrição,
//    como proceder, checklist resumido). Pras Fases 3-7 a engine já reaproveita
//    `lib/conteudo-fases.ts`; aqui complementamos as Fases Preliminar/1/2 que
//    NÃO estão lá.
//
// 2. DADOS-MODELO — exemplos defensáveis que a engine usa pra preencher seções
//    "O que vocês fizeram" quando o grupo não chegou a fazer aquela prática.
//    Cada bloco vem com selo "📌 Modelo de referência — substitua pela realidade
//    da sua Instituição", deixando claro que NÃO é dado real.

import type { DescricaoBloco } from "./conteudo-fases";

// =============================================================================
// CONTEÚDO INSTITUCIONAL — Fase Preliminar / 1 / 2 (não estão em conteudo-fases)
// =============================================================================

export const CONTEUDO_PRELIMINAR: DescricaoBloco[] = [
  {
    tipo: "paragrafo",
    texto:
      "A Fase Preliminar é o degrau zero do Programa de Governança em Privacidade. Antes de mapear processos, antes de designar Encarregado, antes de qualquer instrumento técnico, o órgão precisa ter a Alta Gestão CONVENCIDA de que LGPD é prioridade institucional — não tarefa de TI nem capricho do Jurídico.",
  },
  {
    tipo: "paragrafo",
    texto:
      "Sem esse patrocínio explícito do dirigente máximo, qualquer esforço posterior fica órfão: a Comissão não se reúne, o orçamento não sai, as áreas técnicas não cooperam, e o DPO vira figura decorativa. Por isso o curso começa AQUI, antes mesmo da nomeação formal do Encarregado.",
  },
  {
    tipo: "subtitulo",
    texto: "Como proceder",
  },
  {
    tipo: "lista",
    itens: [
      "Aplicar o Termômetro Institucional: auto-diagnóstico de maturidade percebida em 5 dimensões (conhecimento, apoio da gestão, cultura, recursos, urgência). Identifica de onde se está partindo.",
      "Escrever a Carta para a Alta Gestão: documento institucional curto com destinatário, justificativa legal, riscos de não-cumprimento, pedido de apoio concreto e assinatura do Encarregado (ou da liderança que conduzirá o trabalho).",
      "Apresentar um Roadmap inicial de 90 dias com marcos verificáveis — mostrar que existe um plano concreto, não promessas genéricas.",
      "Obter comprometimento formal: idealmente um Ato/Despacho do dirigente máximo aprovando o início do PGP e prevendo recursos.",
    ],
  },
  {
    tipo: "callout",
    callout: {
      tom: "info",
      titulo: "O que essa fase ENTREGA",
      texto:
        "Não é documento técnico — é decisão institucional. Sai da Fase Preliminar com (a) consciência da equipe sobre o ponto de partida, (b) apoio formal da Alta Gestão por escrito, e (c) cronograma inicial acordado. Sem isso, as Fases 1-7 viram exercício formal sem tração real.",
    },
  },
];

export const CONTEUDO_FASE_1: DescricaoBloco[] = [
  {
    tipo: "paragrafo",
    texto:
      "A Fase 1 cumpre uma obrigação direta da LGPD: o Art. 41 determina ao controlador a indicação de um Encarregado pelo Tratamento de Dados Pessoais (DPO). No setor público, essa indicação deve ser feita por ato formal — Portaria, Decreto ou Despacho — publicado no diário oficial e com canal de contato divulgado ao cidadão.",
  },
  {
    tipo: "paragrafo",
    texto:
      "A Resolução CD/ANPD nº 18/2024 detalha os critérios pra designação: perfil técnico-jurídico compatível, autonomia funcional, ausência de conflito de interesse e acesso direto à alta administração. A escolha não é livre — precisa de justificativa que demonstre aderência a esses critérios.",
  },
  {
    tipo: "subtitulo",
    texto: "Como proceder",
  },
  {
    tipo: "lista",
    itens: [
      "Identificar candidato com perfil técnico-jurídico compatível (não precisa ser advogado; precisa entender LGPD, segurança da informação e a realidade dos processos do órgão).",
      "Documentar a justificativa da escolha (vai constar no Ato de Designação).",
      "Cadastrar contatos do Encarregado: nome, e-mail institucional, telefone, endereço pra atendimento presencial. Esses dados são públicos por força do Art. 41 §1º.",
      "Designar Encarregado Substituto pra continuidade em férias/afastamento (recomendação da ANPD).",
      "Emitir Ato de Designação formal e publicá-lo no diário oficial.",
      "Divulgar os contatos do Encarregado no Aviso de Privacidade público e na intranet do órgão.",
    ],
  },
  {
    tipo: "callout",
    callout: {
      tom: "aviso",
      titulo: "Erro comum",
      texto:
        "Designar o Encarregado verbalmente, sem ato formal publicado, é incumprimento direto da LGPD. Em fiscalização ANPD, a primeira pergunta é 'cadê o ato?'. Se não tem, todas as defesas posteriores caem.",
    },
  },
];

export const CONTEUDO_FASE_2: DescricaoBloco[] = [
  {
    tipo: "paragrafo",
    texto:
      "A Fase 2 prepara o terreno pro mapeamento detalhado da Fase 3. Não é Inventário ainda — é o LEVANTAMENTO PRELIMINAR de onde a Instituição trata dados e quais processos entram primeiro na fila.",
  },
  {
    tipo: "paragrafo",
    texto:
      "Em órgãos públicos, a tentação é tentar mapear TUDO de uma vez — o que afoga a equipe e atrasa entregas. A Resolução CD/ANPD nº 2/2022 traz critérios objetivos pra priorização: dados sensíveis, dados de crianças/adolescentes, larga escala, decisões automatizadas, alto impacto sobre os titulares. A Fase 2 aplica esses critérios pra definir quais 2-3 processos serão mapeados em detalhe primeiro.",
  },
  {
    tipo: "subtitulo",
    texto: "Como proceder",
  },
  {
    tipo: "lista",
    itens: [
      "Levantar a lista bruta de setores que tratam dados pessoais (Saúde, RH, Tributário, Ouvidoria, TI, Comunicação, etc.). Não é exaustivo — é varredura inicial.",
      "Para cada setor, identificar 1-2 processos críticos típicos (atendimento ao cidadão, folha de pagamento, sistema de prontuários, transmissão de sessão, etc.).",
      "Aplicar a Matriz de Priorização da Resolução nº 2/2022 a esses processos — pontuar por dados sensíveis, volume, vulnerabilidade dos titulares, etc.",
      "Selecionar os 2-3 processos mais críticos pra começar a Fase 3.",
      "Construir o Roadmap de 90 dias detalhando como os processos prioritários serão mapeados e o que segue depois.",
      "Acordar o cronograma com a Alta Gestão e formalizar.",
    ],
  },
];

// =============================================================================
// DADOS-MODELO — preenchimento defensável pra seções "O que vocês fizeram" vazias
// =============================================================================
//
// Cada modelo tem o selo "📌 Modelo de referência" aplicado pela engine antes
// de inserir no DOCX. Os textos são institucionalmente defensáveis, baseados em
// templates da ANPD e práticas reais do setor público.

// Ids = bloco INSTITUCIONAL do Termômetro (lib/termometro-perguntas.ts) —
// as 7 etapas da jornada do PGP. Scores na escala normalizada 0-100.
export const MODELO_TERMOMETRO_INICIO = {
  i_gestao: "desenvolvimento",
  i_encarregado: "desenvolvimento",
  i_inventario: "desenvolvimento",
  i_riscos: "inicial",
  i_gap: "inicial",
  i_plano: "inicial",
  i_monitoramento: "inicial",
  score: 36,
  interpretacao:
    "Diagnóstico típico de órgão público brasileiro de pequeno-médio porte iniciando a jornada: a gestão reconhece o tema e alguém cuida informalmente, mas as etapas estruturantes (inventário, riscos, GAP, plano e monitoramento) ainda não começaram com método.",
};

export const MODELO_TERMOMETRO_FIM = {
  i_gestao: "estabelecido",
  i_encarregado: "estabelecido",
  i_inventario: "estabelecido",
  i_riscos: "desenvolvimento",
  i_gap: "estabelecido",
  i_plano: "desenvolvimento",
  i_monitoramento: "desenvolvimento",
  score: 64,
  interpretacao:
    "Evolução esperada após um ciclo inicial de estruturação: Encarregado nomeado, inventário e levantamento de lacunas feitos. Riscos, execução do plano e monitoramento demandam ciclos mais longos pra se consolidarem.",
};

export const MODELO_INVENTARIO_PROCESSOS = [
  {
    nome: "Atendimento ao Cidadão — Ouvidoria",
    setor: "Ouvidoria",
    finalidade:
      "Receber, processar e responder manifestações de cidadãos (reclamações, sugestões, denúncias, elogios e pedidos de informação) sobre serviços públicos prestados pelo órgão.",
    baseLegal:
      "Art. 7º, II (cumprimento de obrigação legal — Lei nº 13.460/2017, Código de Defesa do Usuário do Serviço Público) e Art. 7º, III (execução de políticas públicas).",
    tiposDados:
      "Nome, CPF, e-mail, telefone, endereço, conteúdo da manifestação (pode incluir dados sensíveis quando o cidadão relata situação de saúde, opinião política ou orientação religiosa).",
    dadosSensiveis: true,
    retencao:
      "5 anos a partir do encerramento da manifestação (prazo prescricional padrão da Administração Pública). Manifestações encerradas com providência judicial seguem prazo processual específico.",
    compartilhamento:
      "Compartilhamento interno entre Ouvidoria e secretaria responsável pelo objeto da manifestação. Compartilhamento externo apenas mediante requisição legal (CGU, MP, Judiciário).",
    medidasSeguranca:
      "Sistema de Ouvidoria com login individualizado por servidor, registro de acessos, criptografia em trânsito, backup criptografado. Acesso restrito ao núcleo da Ouvidoria + servidor designado por secretaria.",
  },
  {
    nome: "Folha de Pagamento — Servidores",
    setor: "RH",
    finalidade:
      "Processar mensalmente a folha de pagamento dos servidores (ativos, inativos e pensionistas), incluindo cálculo de vencimentos, descontos legais, contribuições previdenciárias e tributos.",
    baseLegal:
      "Art. 7º, II (cumprimento de obrigação legal — Estatuto dos Servidores, CLT, legislação previdenciária e tributária).",
    tiposDados:
      "Nome, CPF, RG, PIS/PASEP, conta bancária, dados de dependentes (incluindo crianças), conta de FGTS, descontos judiciais (pensão alimentícia), dados de saúde (atestados, licenças médicas).",
    dadosSensiveis: true,
    retencao:
      "75 anos para fins previdenciários (legislação previdenciária federal). Atestados médicos seguem prazo de 5 anos após o evento (resoluções CFM).",
    compartilhamento:
      "Receita Federal, INSS, Tribunal de Contas, sindicatos (para descontos autorizados), instituição bancária pagadora.",
    medidasSeguranca:
      "Sistema de folha (SIAPE ou equivalente) com login individualizado, segregação de função entre quem cadastra e quem aprova, logs auditáveis, backup criptografado em data center próprio ou contratado com cláusulas LGPD.",
  },
];

export const MODELO_RISCOS = [
  {
    riscoTitulo: "Vazamento de dados sensíveis por compartilhamento indevido",
    descricao:
      "Servidor da Ouvidoria encaminha por e-mail comum (sem criptografia) uma manifestação que contém relato de problema de saúde do cidadão, para colega de outra secretaria. O e-mail é interceptado, ou o destinatário compartilha o conteúdo sem autorização.",
    categoria: "Confidencialidade",
    severityLevel: "P:M;I:A;S:ALTO",
    mitigationPlan:
      "Treinamento sobre dados sensíveis e canais seguros de comunicação interna; substituição de e-mail por sistema corporativo com controle de acesso; checklist no fluxo de encaminhamento que exija anonimização de dados sensíveis quando possível.",
  },
  {
    riscoTitulo: "Acesso indevido à folha de pagamento por servidor não autorizado",
    descricao:
      "Servidor com acesso amplo ao sistema de folha consulta dados de colegas por curiosidade ou pra obter informação sobre processos sigilosos (pensões judiciais, descontos compulsórios), sem que isso seja necessário ao exercício de sua função.",
    categoria: "Princípio da finalidade / necessidade",
    severityLevel: "P:A;I:M;S:ALTO",
    mitigationPlan:
      "Revisão dos perfis de acesso no sistema (princípio do menor privilégio); ativação de logs de consulta por CPF; auditoria periódica das consultas; treinamento + termo de responsabilidade individual.",
  },
];

export const MODELO_GAP_RESPOSTAS = [
  {
    controleId: 4,
    resposta: "ADERENTE",
    justificativa:
      "Encarregado designado por Portaria publicada no diário oficial. Contatos divulgados no Aviso de Privacidade público do portal institucional.",
  },
  {
    controleId: 10,
    resposta: "PARCIAL",
    justificativa:
      "Inventário foi iniciado e cobre os 2 processos críticos identificados na Fase 2, mas ainda não foi estendido para a totalidade dos setores. Revisão programada pra o próximo ciclo.",
  },
  {
    controleId: 22,
    resposta: "NAO_ADERENTE",
    justificativa:
      "Levantamento dos contratos vigentes em curso. Maioria dos contratos com operadores foi celebrada antes da LGPD entrar em vigor — necessário promover aditamento com cláusulas mínimas de proteção de dados.",
  },
];

export const MODELO_ACOES_PLANO = [
  {
    acao: "Promover aditivo contratual com cláusulas LGPD em todos os contratos vigentes celebrados antes de 2020",
    responsavel: "Procuradoria Jurídica + Administrativo",
    prazoSemanas: 12,
    prioridade: "ALTA",
    origem: "GAP",
  },
  {
    acao: "Implementar segregação de função no sistema de folha (perfil 'cadastrar' separado de 'aprovar')",
    responsavel: "TI + RH",
    prazoSemanas: 8,
    prioridade: "ALTA",
    origem: "RISCO",
  },
  {
    acao: "Capacitação anual obrigatória em LGPD pra todos os servidores que tratam dados pessoais",
    responsavel: "RH + DPO",
    prazoSemanas: 16,
    prioridade: "MEDIA",
    origem: "GAP",
  },
];

export const MODELO_RIPD = {
  titulo: "RIPD — Folha de Pagamento de Servidores",
  inventoryRef: "Folha de Pagamento — Servidores",
  secoes: [
    {
      numero: 1,
      titulo: "Identificação do Controlador e do Encarregado",
      conteudo:
        "Controlador: a Instituição (qualificada no Aviso de Privacidade). Encarregado: nome do DPO designado por ato formal, contatos disponíveis no Aviso de Privacidade público. Operadores envolvidos: sistema de folha contratado (SIAPE ou equivalente), instituição bancária pagadora.",
    },
    {
      numero: 2,
      titulo: "Descrição do tratamento e finalidades",
      conteudo:
        "Processamento mensal da folha de pagamento de servidores ativos, inativos e pensionistas. Finalidade: cumprimento de obrigação legal (pagamento de vencimentos e recolhimento de tributos/contribuições previdenciárias). Categorias de titulares: servidores efetivos, comissionados, terceirizados sob a Administração, aposentados, pensionistas e dependentes.",
    },
    {
      numero: 3,
      titulo: "Necessidade e proporcionalidade",
      conteudo:
        "Os dados tratados são os estritamente necessários ao cálculo da remuneração, retenções fiscais, contribuições previdenciárias e identificação dos beneficiários. Dados de saúde (atestados, licenças) são coletados apenas quando há registro de afastamento e descartados ao final do prazo legal.",
    },
    {
      numero: 4,
      titulo: "Riscos identificados aos direitos dos titulares",
      conteudo:
        "(1) Acesso indevido por servidores sem necessidade funcional. (2) Vazamento de informações sensíveis (saúde, descontos judiciais). (3) Erro de cadastro com impacto financeiro pro servidor.",
    },
    {
      numero: 5,
      titulo: "Medidas de segurança e mitigação",
      conteudo:
        "Sistema com login individualizado, segregação de função (cadastra ≠ aprova), logs auditáveis com retenção mínima de 6 meses, backup criptografado, contrato com o operador do sistema com cláusulas LGPD, treinamento anual obrigatório da equipe.",
    },
    {
      numero: 6,
      titulo: "Mecanismos pra exercício de direitos dos titulares",
      conteudo:
        "Servidor pode solicitar acesso, correção, anonimização ou portabilidade dos seus dados pelo canal DSR do órgão (e-mail/formulário público). Prazo de resposta: 15 dias úteis (Art. 19, II LGPD).",
    },
    {
      numero: 7,
      titulo: "Decisão e responsabilidades",
      conteudo:
        "O tratamento é necessário e proporcional. Medidas de mitigação implementadas reduzem os riscos identificados a nível aceitável. Aprovado pelo Encarregado em conjunto com Secretaria de Administração.",
    },
    {
      numero: 8,
      titulo: "Revisão e atualização",
      conteudo:
        "Este RIPD será revisado a cada 12 meses ou antes, caso haja mudança significativa no fluxo (novo sistema, novo operador, alteração legislativa).",
    },
  ],
};

export const MODELO_OPERADORES = [
  {
    nome: "Empresa Hipotética de Tecnologia LTDA",
    cnpj: "00.000.000/0001-00",
    servico: "Hospedagem do sistema interno de ouvidoria (SaaS)",
    papel: "OPERADOR",
    contrato: {
      numero: "045/2024",
      objeto: "Hospedagem em nuvem do sistema de ouvidoria, com SLA de disponibilidade e plano de backup criptografado.",
      vigenciaAnos: 3,
      clausulasLgpd: true,
      tipoOperacao: "CONTRATO_NOVO_CLAUSULAS",
      nivelRisco: "MEDIO",
    },
  },
];

export const MODELO_DSR = [
  {
    titularNome: "Cidadão hipotético",
    titularContato: "cidadao@email.com",
    tipoSolicitacao: "ACESSO",
    descricao:
      "Solicitação de cópia das informações que a Instituição tem registradas sobre o titular, especialmente referentes a manifestações enviadas à Ouvidoria no último ano.",
    status: "RESPONDIDA",
    respostaTexto:
      "Encaminhada cópia do extrato de manifestações registradas em nome do titular, com tarja em dados de terceiros mencionados nas manifestações. Prazo cumprido: 8 dias úteis.",
  },
];

export const MODELO_INCIDENTE = {
  titulo: "Acesso indevido a planilha de cadastro de servidores",
  descricao:
    "Servidor com acesso amplo ao sistema acessou planilha de cadastro contendo dados de 250 colegas (CPF, conta bancária, dados de dependentes) e fez cópia local sem autorização institucional. Detectado por auditoria de logs ~5 dias depois.",
  severidade: "ALTA",
  status: "ENCERRADO",
  comunicadoAnpd: true,
  comunicadoTitular: true,
  formularioAnpd: {
    naturezaDados: ["Dados de identificação", "Dados financeiros", "Dados de dependentes"],
    titularesNumero: "Aproximadamente 250",
    medidasMitigacao: [
      "Revogação imediata do acesso do servidor envolvido",
      "Apuração disciplinar instaurada",
      "Notificação individual aos titulares afetados em até 7 dias",
      "Revisão dos perfis de acesso no sistema",
    ],
  },
};

export const MODELO_PRI_EQUIPE = [
  { papel: "DPO", contato24h: "(99) 99999-0001", cobertura: "Primário" },
  { papel: "TI", contato24h: "(99) 99999-0002", cobertura: "Primário" },
  { papel: "JURIDICO", contato24h: "(99) 99999-0003", cobertura: "Primário" },
  { papel: "COMUNICACAO", contato24h: "(99) 99999-0004", cobertura: "Primário" },
  { papel: "ALTA_GESTAO", contato24h: "(99) 99999-0005", cobertura: "Aprovador" },
];

export const MODELO_PRI_RACI: Array<{ etapaNist: string; papel: string; tipo: string }> = [
  { etapaNist: "DETECTAR", papel: "TI", tipo: "R" },
  { etapaNist: "DETECTAR", papel: "DPO", tipo: "I" },
  { etapaNist: "CONTER", papel: "TI", tipo: "R" },
  { etapaNist: "CONTER", papel: "DPO", tipo: "A" },
  { etapaNist: "ERRADICAR", papel: "TI", tipo: "R" },
  { etapaNist: "ERRADICAR", papel: "JURIDICO", tipo: "C" },
  { etapaNist: "RECUPERAR", papel: "TI", tipo: "R" },
  { etapaNist: "RECUPERAR", papel: "DONO_PROCESSO", tipo: "C" },
  { etapaNist: "LICOES", papel: "DPO", tipo: "R" },
  { etapaNist: "LICOES", papel: "ALTA_GESTAO", tipo: "I" },
];

export const MODELO_AVISO_PRIVACIDADE_RESUMO =
  "Aviso de Privacidade contendo: identificação do controlador e do Encarregado, finalidades de tratamento por categoria de dados, bases legais, formas de exercer direitos do titular (canal DSR), prazos de retenção e medidas gerais de segurança. Publicado no portal externo em página acessível em até 2 cliques a partir da home, com data da última atualização visível.";

// =============================================================================
// PRÓXIMOS PASSOS POR FASE — recomendações pra dar continuidade ao trabalho
// =============================================================================

export const PROXIMOS_PASSOS_POR_FASE: Record<string, string[]> = {
  PRELIMINAR: [
    "Repetir o Termômetro Institucional a cada 6 meses pra acompanhar a evolução real da maturidade.",
    "Apresentar a Carta da Alta Gestão em reunião de Comitê Gestor — não basta enviar por e-mail, é importante haver discussão e registro em ata.",
    "Construir um Plano de Comunicação Interna de LGPD: pílulas mensais por e-mail, banner na intranet, vídeo institucional curto. Vira parte do Programa Permanente de Educação em Privacidade.",
  ],
  FASE_1: [
    "Publicar o Ato de Designação do Encarregado no Diário Oficial e arquivar a edição como prova documental.",
    "Constituir formalmente o Comitê de Privacidade por ato administrativo, com representantes das áreas-chave (TI, Jurídico, Comunicação, RH, áreas de negócio).",
    "Estabelecer calendário fixo de reuniões do Comitê (mensais no início, trimestrais quando consolidado).",
    "Divulgar os contatos do Encarregado em todos os canais externos do órgão: portal, redes sociais, materiais impressos, painéis físicos.",
  ],
  FASE_2: [
    "Atualizar a Matriz de Priorização semestralmente — processos mudam, novos sistemas entram, prioridades evoluem.",
    "Usar a Carta de Serviços do órgão como fonte de descoberta de processos: cada serviço listado vira potencialmente 1 processo a mapear.",
    "Acompanhar o cumprimento do Roadmap de 90 dias em reuniões mensais do Comitê de Privacidade.",
  ],
  FASE_3: [
    "Estender o Inventário gradualmente pra TODOS os setores — meta razoável: 5 processos novos mapeados por trimestre.",
    "Submeter cada processo à aprovação formal do Encarregado antes de declarar como 'consolidado'.",
    "Reavaliar a matriz de Risco anualmente — riscos mudam à medida que sistemas, terceiros e contextos mudam.",
    "Documentar mitigações implementadas e o efeito mensurável delas no nível de risco residual.",
  ],
  FASE_4: [
    "Aprofundar a Análise de GAP estendendo dos controles do curso pra o catálogo completo da LGPD (Guia ANPD, Resolução nº 2/2022, ABNT 27701).",
    "Cada controle NÃO ADERENTE deve virar 1 ação no Plano com responsável e prazo — sem ação, não há fechamento de GAP.",
    "Repetir o GAP anualmente como instrumento de monitoramento da maturidade.",
  ],
  FASE_5: [
    "Formalizar o Programa de Governança em Privacidade (PGP) como Política institucional aprovada pelo dirigente máximo.",
    "Estabelecer ciclo de revisão anual do PGP com relatório formal ao gabinete.",
    "Vincular o orçamento do PGP ao planejamento estratégico do órgão (PPA/LDO/LOA).",
  ],
  FASE_6: [
    "Garantir que todos os processos do Inventário com risco alto tenham RIPD elaborado e aprovado.",
    "Promover aditamento contratual com cláusulas LGPD em todos os contratos vigentes com operadores.",
    "Divulgar o canal DSR em todos os pontos de contato com o cidadão (portal, atendimento presencial, materiais físicos).",
    "Manter o Aviso de Privacidade público atualizado a cada mudança significativa de tratamento.",
    "Documentar e treinar a equipe nas políticas de retenção e anonimização.",
  ],
  FASE_7: [
    "Realizar simulado de incidente pelo menos 1 vez ao ano — tabletop exercise com cenário plausível.",
    "Atualizar o PRI a cada mudança significativa de equipe, sistema ou perímetro.",
    "Estabelecer fluxo claro pra comunicação à ANPD (formulário pronto, lista de informações obrigatórias, aprovação interna).",
    "Manter histórico de incidentes registrados (mesmo os de baixa severidade) — vira insumo pra a revisão anual do PGP.",
  ],
};

// Texto curto que vai no rodapé de cada bloco de DADOS-MODELO inserido no DOCX.
export const SELO_MODELO =
  "📌 Modelo de referência — substitua pelos dados reais da sua Instituição";
