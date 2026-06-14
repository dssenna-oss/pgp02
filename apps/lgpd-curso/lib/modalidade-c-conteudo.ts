// Modalidade C (híbrida: telão + físico + celular leve) — CONTEÚDO (data).
//
// Material da Onda 1: decks de cards imprimíveis, fichas de encaminhamento,
// crachás de papel, colas de referência e o roteiro do facilitador.
//
// Princípio: facilitador conduz no telão; participantes praticam DECISÕES via
// cards físicos + micro-toques no celular; produção pesada vira material pra
// levar (os 5 documentos institucionais). Desenhado após o 1º curso real
// revelar que a Modalidade A não se sustenta sem notebook/Wi-Fi e com evasão.
//
// Tudo criado DO ZERO alinhado ao app atual (decisão do user 2026-05-27) —
// não deriva da Modalidade B impressa (desatualizada).

// =============================================================================
// CRACHÁS — 5 papéis (mantidos da Modalidade A)
// =============================================================================

export type CrachaPapel = {
  papel: string;
  emoji: string;
  responsabilidade: string;
  noGrupo: string; // o que essa pessoa faz nas atividades físicas
};

export const CRACHAS: CrachaPapel[] = [
  {
    papel: "DPO / Encarregado(a)",
    emoji: "🛡️",
    responsabilidade: "Conduz o grupo, aprova ou devolve o trabalho, articula os setores e tem a palavra final.",
    noGrupo: "Recebe as fichas 'Submeter ao DPO', revisa, devolve ou aprova. Pede apoio ao TI/Jurídico quando precisa. Assina o que for aprovado.",
  },
  {
    papel: "Dono do Processo A (ex: Saúde)",
    emoji: "🏥",
    responsabilidade: "Conhece a rotina do 1º processo crítico do órgão. Sabe quais dados são coletados e por quê.",
    noGrupo: "Monta o rascunho do Inventário do seu processo com os cards e submete ao DPO. Conhece os detalhes que ninguém mais sabe.",
  },
  {
    papel: "Dono do Processo B (ex: RH)",
    emoji: "👥",
    responsabilidade: "Conhece a rotina do 2º processo crítico. Mesma lógica do Dono A, para outro processo.",
    noGrupo: "Monta o rascunho do Inventário do 2º processo e submete ao DPO.",
  },
  {
    papel: "TI / Tecnologia",
    emoji: "💻",
    responsabilidade: "Apoia o DPO em segurança: controle de acesso, backup, criptografia, logs.",
    noGrupo: "Recebe 'Pedido de apoio' do DPO em questões técnicas (medidas de segurança, sistemas) e devolve com 'Parecer técnico'.",
  },
  {
    papel: "Comunicação / Jurídico",
    emoji: "⚖️",
    responsabilidade: "Apoia o DPO em bases legais, clareza do Aviso ao cidadão e comunicação com a ANPD.",
    noGrupo: "Recebe 'Pedido de apoio' do DPO em questões jurídicas/comunicação e devolve com 'Parecer técnico'.",
  },
];

// =============================================================================
// FICHAS DE ENCAMINHAMENTO — circulam fisicamente entre os papéis
// =============================================================================

export type FichaEncaminhamento = {
  id: string;
  emoji: string;
  titulo: string;
  de: string;
  para: string;
  campos: string[]; // linhas pra preencher à mão
  explicacao: string;
};

export const FICHAS_ENCAMINHAMENTO: FichaEncaminhamento[] = [
  {
    id: "submeter",
    emoji: "📤",
    titulo: "Submeter ao DPO",
    de: "Dono do Processo / Contribuidor",
    para: "DPO",
    campos: ["Processo: ___________________________", "Quem submete: ______________________", "Data/hora: __________________________"],
    explicacao: "Use quando terminar de montar o rascunho do seu processo e quiser que o DPO revise.",
  },
  {
    id: "devolver",
    emoji: "🔄",
    titulo: "Devolver com motivo",
    de: "DPO",
    para: "Dono do Processo / Contribuidor",
    campos: ["Processo: ___________________________", "Motivo da devolução: ________________", "________________________________________"],
    explicacao: "Use quando o DPO encontrar algo a corrigir. Devolver NÃO é punição — é parte do método.",
  },
  {
    id: "apoio",
    emoji: "🆘",
    titulo: "Pedido de apoio",
    de: "DPO",
    para: "TI ou Comunicação/Jurídico",
    campos: ["Setor acionado: ( ) TI   ( ) Comunicação/Jurídico", "O que preciso saber: ________________", "________________________________________"],
    explicacao: "Use quando o DPO não tiver o conhecimento técnico/jurídico e precisar de apoio do setor.",
  },
  {
    id: "parecer",
    emoji: "💬",
    titulo: "Parecer técnico",
    de: "TI ou Comunicação/Jurídico",
    para: "DPO",
    campos: ["Sobre: ______________________________", "Parecer: ____________________________", "________________________________________"],
    explicacao: "Resposta do setor de apoio ao pedido do DPO.",
  },
  {
    id: "aprovado",
    emoji: "✅",
    titulo: "Aprovado pelo DPO",
    de: "DPO",
    para: "(arquivo do grupo)",
    campos: ["Processo/Documento: _________________", "Aprovado por (DPO): _________________", "Data/hora: __________________________"],
    explicacao: "Carimbo final. O documento aprovado pelo DPO vira entregável do grupo.",
  },
];

// =============================================================================
// DECKS DE CARDS — por fase
// =============================================================================

export type Card = {
  titulo: string;
  conteudo: string;
  // tag opcional pra agrupar/colorir o card
  tag?: string;
};

export type Deck = {
  fase: string;
  atividade: string;
  instrucao: string; // o que o grupo faz com estes cards
  cards: Card[];
};

export const DECKS: Deck[] = [
  // ─── FASE PRELIMINAR — Discussão da Carta pra Alta Gestão ────────────────
  {
    fase: "Fase Preliminar — Sensibilização e Engajamento",
    atividade: "Discussão rápida: Carta para a Alta Gestão (~10 min)",
    instrucao:
      "NÃO precisam escrever o documento — o modelo completo está no Pacote de Modelos (Modelo 03) pra vocês adaptarem e entregarem no órgão. Aqui é só DISCUSSÃO: respondam as 3 perguntas dos cards pensando na realidade da SUA Instituição e compartilhem 1 resposta com a turma. Objetivo: perceber que sem o apoio da Alta Gestão, o PGP não anda.",
    cards: [
      { titulo: "💬 O pedido", conteudo: "Se vocês entregassem uma Carta ao(à) Prefeito(a)/Presidente do seu órgão HOJE, qual seria o PEDIDO concreto? (designar o Encarregado? orçamento? constituir o Comitê? incluir LGPD na agenda de gestão?)", tag: "discussao" },
      { titulo: "💬 O risco", conteudo: "Qual é o MAIOR risco de o seu órgão NÃO se adequar à LGPD? (sanção da ANPD? incidente com dados de cidadãos? dano à imagem? apontamento do Tribunal de Contas / Ministério Público?)", tag: "discussao" },
      { titulo: "💬 O argumento", conteudo: "Qual argumento convenceria a SUA Alta Gestão a priorizar isso? (responsabilização do gestor? exemplo de outro órgão multado? exigência em auditoria? confiança do cidadão?)", tag: "discussao" },
      { titulo: "📌 Pra levar", conteudo: "O modelo COMPLETO da Carta (5 campos com texto-base pra adaptar) está no Pacote de Modelos — Modelo 03. Levem pra escrever no órgão com calma.", tag: "referencia" },
    ],
  },
  // ─── FASE 1 — Montar o Ato de Designação ─────────────────────────────────
  {
    fase: "Fase 1 — Formação das equipes de trabalho",
    atividade: "Montar o Ato de Designação (ordenar os blocos)",
    instrucao:
      "Os 8 blocos abaixo formam um Ato de Designação do Encarregado, mas estão FORA DE ORDEM. Ordenem na sequência correta de um ato administrativo. Depois, discutam os critérios do card 'Perfil do Encarregado' e justifiquem quem será o DPO (o crachá já define quem OPERA o app; aqui o grupo decide o PORQUÊ da escolha).",
    cards: [
      { titulo: "Bloco — Cabeçalho", conteudo: "ATO DE DESIGNAÇÃO Nº __/____ (Designação do Encarregado pelo Tratamento de Dados Pessoais)", tag: "ordem-1" },
      { titulo: "Bloco — Ementa", conteudo: "Designa o(a) Encarregado(a) pelo Tratamento de Dados Pessoais (DPO) do órgão, em cumprimento ao art. 41 da Lei nº 13.709/2018 (LGPD).", tag: "ordem-2" },
      { titulo: "Bloco — Considerandos", conteudo: "CONSIDERANDO a LGPD (art. 41) · a Resolução CD/ANPD nº 18/2024 · a necessidade de canal formal com a ANPD e os titulares.", tag: "ordem-3" },
      { titulo: "Bloco — Art. 1º (designa)", conteudo: "Designar [NOME] como Encarregado(a). Parágrafo único: canal de contato (e-mail, telefone, endereço).", tag: "ordem-4" },
      { titulo: "Bloco — Art. 2º (justificativa)", conteudo: "A escolha considerou: perfil técnico-jurídico, autonomia funcional, acesso à alta administração.", tag: "ordem-5" },
      { titulo: "Bloco — Art. 3º (atribuições)", conteudo: "Compete ao Encarregado: aceitar reclamações, receber comunicações da ANPD, orientar a equipe (art. 41 §2º).", tag: "ordem-6" },
      { titulo: "Bloco — Art. 4º (vigência)", conteudo: "Este ato entra em vigor na data de sua publicação.", tag: "ordem-7" },
      { titulo: "Bloco — Assinatura", conteudo: "Autoridade máxima do órgão + ciência do(a) designado(a).", tag: "ordem-8" },
      { titulo: "Perfil do Encarregado (referência)", conteudo: "Quem do grupo tem: perfil técnico-jurídico? autonomia? acesso à alta gestão? sem conflito de interesse? Validem e justifiquem a escolha do DPO.", tag: "referencia" },
    ],
  },
  // ─── FASE 2 — Setores + Priorização ──────────────────────────────────────
  {
    fase: "Fase 2 — Diagnóstico Inicial",
    atividade: "Selecionar setores que tratam dados + ordenar processos por prioridade",
    instrucao:
      "Parte 1: separem os cards de SETOR que tratam dados pessoais no seu órgão (a Carta de Serviços ajuda a lembrar). Parte 2: peguem os cards de PROCESSO e ordenem do MAIS prioritário (topo) ao menos. Usem a cola da Matriz de Priorização.",
    cards: [
      { titulo: "Setor — Saúde", conteudo: "Prontuários, agendamentos, programas de saúde. Trata dados SENSÍVEIS.", tag: "setor" },
      { titulo: "Setor — RH / Gestão de Pessoas", conteudo: "Folha de pagamento, contratação, processos seletivos.", tag: "setor" },
      { titulo: "Setor — Tributário", conteudo: "Cadastro fiscal de contribuintes, IPTU/ISS.", tag: "setor" },
      { titulo: "Setor — Educação", conteudo: "Matrículas, registros escolares, dados de responsáveis e crianças.", tag: "setor" },
      { titulo: "Setor — Assistência Social", conteudo: "Cadastro de famílias, programas sociais. Dados de vulneráveis.", tag: "setor" },
      { titulo: "Setor — Ouvidoria", conteudo: "Manifestações, denúncias, reclamações.", tag: "setor" },
      { titulo: "Setor — TI", conteudo: "Gestão de acessos, logs, sistemas.", tag: "setor" },
      { titulo: "Setor — Comunicação", conteudo: "Mailing institucional, redes sociais, transmissões.", tag: "setor" },
      { titulo: "Processo — Atendimento no Posto de Saúde", conteudo: "Dados de saúde (sensíveis), grande volume, idosos. Pra posicionar na fila.", tag: "processo" },
      { titulo: "Processo — Folha de Pagamento", conteudo: "Dados bancários + dependentes (crianças). Obrigação legal.", tag: "processo" },
      { titulo: "Processo — Ouvidoria", conteudo: "Manifestações (eventualmente sensíveis). Volume médio.", tag: "processo" },
      { titulo: "Processo — Newsletter institucional", conteudo: "Mailing. Dados cadastrais simples. Volume alto, sensibilidade baixa.", tag: "processo" },
    ],
  },
  // ─── FASE 3 — Inventário + Riscos (o coração) ────────────────────────────
  {
    fase: "Fase 3 — Mapeamento e Análise de Riscos",
    atividade: "Montar a Ficha de Inventário de 1 processo + posicionar Riscos na matriz P×I",
    instrucao:
      "Parte 1 (Inventário): cada Dono de Processo monta a ficha encaixando os cards nos campos certos (titulares, dados, finalidade, base legal, retenção, compartilhamento, medidas). Depois SUBMETE ao DPO (ficha 📤). Parte 2 (Riscos): peguem os cards de RISCO e posicionem no tabuleiro da matriz 3×3 (Probabilidade × Impacto). A cor da casa indica a severidade.",
    cards: [
      { titulo: "Campo — Titulares", conteudo: "Quem são as pessoas? (cidadãos, servidores, crianças...)", tag: "campo-inv" },
      { titulo: "Campo — Dados coletados", conteudo: "Quais dados? (nome, CPF, saúde, conta bancária...)", tag: "campo-inv" },
      { titulo: "Campo — Finalidade", conteudo: "Pra quê? (prestar o serviço, cumprir obrigação...)", tag: "campo-inv" },
      { titulo: "Campo — Base legal", conteudo: "Qual hipótese da LGPD autoriza? (use a cola de Bases Legais)", tag: "campo-inv" },
      { titulo: "Campo — Retenção", conteudo: "Por quanto tempo guardamos?", tag: "campo-inv" },
      { titulo: "Campo — Compartilhamentos", conteudo: "Com quem dividimos? (outros órgãos, operadores...)", tag: "campo-inv" },
      { titulo: "Campo — Medidas de segurança", conteudo: "Como protegemos? (acesso por perfil, backup, logs...)", tag: "campo-inv" },
      { titulo: "Base legal — Art. 7º II", conteudo: "Cumprimento de obrigação legal (ex: folha de pagamento).", tag: "base-legal" },
      { titulo: "Base legal — Art. 7º III", conteudo: "Execução de política pública (ex: atendimento em UBS).", tag: "base-legal" },
      { titulo: "Base legal — Art. 7º I", conteudo: "Consentimento (só pra tratamento FACULTATIVO — ex: newsletter).", tag: "base-legal" },
      { titulo: "Base legal — Art. 11", conteudo: "Dados SENSÍVEIS (saúde, etc.) — exige base adicional do art. 11.", tag: "base-legal" },
      { titulo: "Risco — Vazamento de dados de saúde", conteudo: "Probabilidade Média × Impacto Alto. Onde posicionar?", tag: "risco" },
      { titulo: "Risco — Acesso indevido à folha", conteudo: "Probabilidade Alta × Impacto Médio. Onde posicionar?", tag: "risco" },
      { titulo: "Risco — Erro de cadastro", conteudo: "Probabilidade Média × Impacto Baixo. Onde posicionar?", tag: "risco" },
      { titulo: "Risco — Perda de backup", conteudo: "Probabilidade Baixa × Impacto Alto. Onde posicionar?", tag: "risco" },
    ],
  },
  // ─── FASE 4 — GAP ─────────────────────────────────────────────────────────
  {
    fase: "Fase 4 — Análise de Conformidade (GAP)",
    atividade: "Classificar cada controle",
    instrucao:
      "Para cada card de CONTROLE, coloquem ao lado um card de classificação: ADERENTE (verde), PARCIAL (amarelo) ou NÃO ADERENTE (vermelho). Discutam em grupo. Cada NÃO ADERENTE vira uma ação na Fase 5.",
    cards: [
      { titulo: "Controle — Encarregado designado por ato formal", conteudo: "Existe portaria publicada designando o DPO?", tag: "controle" },
      { titulo: "Controle — Inventário atualizado (12 meses)", conteudo: "O inventário de processos está em dia?", tag: "controle" },
      { titulo: "Controle — Base legal documentada por processo", conteudo: "Cada processo tem base legal justificada?", tag: "controle" },
      { titulo: "Controle — Cláusulas LGPD nos contratos", conteudo: "Contratos com operadores têm cláusulas do art. 39?", tag: "controle" },
      { titulo: "Controle — Canal DSR divulgado", conteudo: "Existe canal pro cidadão exercer direitos?", tag: "controle" },
      { titulo: "Controle — Aviso de Privacidade publicado", conteudo: "Há aviso no portal externo (art. 9º)?", tag: "controle" },
      { titulo: "Controle — Plano de resposta a incidente", conteudo: "Existe PRI formalizado e testado?", tag: "controle" },
      { titulo: "Controle — Equipe treinada (12 meses)", conteudo: "Houve capacitação em LGPD no último ano?", tag: "controle" },
      { titulo: "Classificação — ADERENTE", conteudo: "Implementado e funcionando. (verde)", tag: "classificacao" },
      { titulo: "Classificação — PARCIAL", conteudo: "Existe mas não está consolidado. (amarelo)", tag: "classificacao" },
      { titulo: "Classificação — NÃO ADERENTE", conteudo: "Ausente ou inadequado. Vira ação. (vermelho)", tag: "classificacao" },
    ],
  },
  // ─── FASE 5 — Plano de Ação ───────────────────────────────────────────────
  {
    fase: "Fase 5 — Plano de Ação",
    atividade: "Transformar lacunas em ações",
    instrucao:
      "Peguem cada controle classificado como NÃO ADERENTE (Fase 4) e cada risco ALTO (Fase 3) e preencham um card de AÇÃO em branco: o que fazer, quem é responsável, prazo e prioridade. O DPO distribui os responsáveis.",
    cards: [
      { titulo: "Card de Ação (em branco)", conteudo: "Ação: _________________________\nResponsável: ___________________\nPrazo: ____  Prioridade: ( )Alta ( )Média ( )Baixa\nOrigem: ( )GAP ( )Risco", tag: "acao" },
      { titulo: "Card de Ação (em branco)", conteudo: "Ação: _________________________\nResponsável: ___________________\nPrazo: ____  Prioridade: ( )Alta ( )Média ( )Baixa\nOrigem: ( )GAP ( )Risco", tag: "acao" },
      { titulo: "Card de Ação (em branco)", conteudo: "Ação: _________________________\nResponsável: ___________________\nPrazo: ____  Prioridade: ( )Alta ( )Média ( )Baixa\nOrigem: ( )GAP ( )Risco", tag: "acao" },
      { titulo: "Card de Ação (em branco)", conteudo: "Ação: _________________________\nResponsável: ___________________\nPrazo: ____  Prioridade: ( )Alta ( )Média ( )Baixa\nOrigem: ( )GAP ( )Risco", tag: "acao" },
    ],
  },
  // ─── FASE 7 — Incidente + PRI ─────────────────────────────────────────────
  {
    fase: "Fase 7 — Monitoramento e Resposta a Incidentes",
    atividade: "Montar a linha do tempo do incidente + a matriz RACI do PRI",
    instrucao:
      "Quando o facilitador 'disparar' o Incidente Surpresa, ordenem os cards de ETAPA na sequência da resposta (NIST) e definam, na matriz RACI, quem é Responsável (R), Aprovador (A), Consultado (C) e Informado (I) em cada etapa. O cronômetro de 72h estará no telão.",
    cards: [
      { titulo: "Etapa — DETECTAR", conteudo: "Identificar o incidente (logs, denúncia, auditoria).", tag: "etapa-nist" },
      { titulo: "Etapa — CONTER", conteudo: "Isolar o sistema, revogar acessos comprometidos.", tag: "etapa-nist" },
      { titulo: "Etapa — ERRADICAR", conteudo: "Achar a causa-raiz, fechar a vulnerabilidade.", tag: "etapa-nist" },
      { titulo: "Etapa — RECUPERAR", conteudo: "Restaurar de backup íntegro, monitorar.", tag: "etapa-nist" },
      { titulo: "Etapa — LIÇÕES APRENDIDAS", conteudo: "Registrar, comunicar ANPD/titulares, melhorar o PRI.", tag: "etapa-nist" },
      { titulo: "Papel — DPO", conteudo: "Posicione na matriz RACI.", tag: "papel-raci" },
      { titulo: "Papel — TI", conteudo: "Posicione na matriz RACI.", tag: "papel-raci" },
      { titulo: "Papel — Jurídico", conteudo: "Posicione na matriz RACI.", tag: "papel-raci" },
      { titulo: "Papel — Comunicação", conteudo: "Posicione na matriz RACI.", tag: "papel-raci" },
      { titulo: "Papel — Alta Gestão", conteudo: "Posicione na matriz RACI.", tag: "papel-raci" },
    ],
  },
];

// =============================================================================
// CARDS-SURPRESA (entregues pelo facilitador no momento certo)
// =============================================================================

export const CARD_DSR_SURPRESA: Card = {
  titulo: "🔔 DSR SURPRESA — chegou uma solicitação de titular!",
  conteudo:
    "\"Olá, sou cidadão atendido pelo órgão. Quero acesso a TODOS os dados que vocês têm sobre mim, e quero que apaguem meu cadastro.\" — Como o grupo responde? Pensem: precisa confirmar a identidade? Dá pra apagar tudo (e a obrigação legal de guardar?)? Qual o prazo? (15 dias úteis — Art. 19 II)",
};

export const CARD_INCIDENTE_SURPRESA: Card = {
  titulo: "🚨 INCIDENTE SURPRESA — vazamento detectado!",
  conteudo:
    "\"Um servidor copiou pra um pendrive pessoal uma planilha com nome, CPF e conta bancária de 250 servidores, e o pendrive sumiu.\" — O cronômetro de 72h começou. Montem a resposta: detectar→conter→erradicar→recuperar→lições. Precisa comunicar a ANPD? E os titulares? (Art. 48 + Res. 15/2024)",
};

// =============================================================================
// COLAS DE REFERÊNCIA (ficam na mesa durante as atividades)
// =============================================================================

export const COLA_BASES_LEGAIS = {
  titulo: "Cola — Bases legais no Setor Público (resumo)",
  linhas: [
    "REGRA DE OURO: comece sempre por obrigação legal (Art. 7º II) ou política pública (Art. 7º III). Cobrem 80-90% dos casos.",
    "Art. 7º II — Cumprimento de obrigação legal (ex: folha, tributos, previdência).",
    "Art. 7º III — Execução de política pública (ex: saúde, educação, assistência).",
    "Art. 7º V — Execução de contrato (ex: licitação, contratação).",
    "Art. 7º IV — Proteção da vida (urgência).",
    "Art. 7º VI — Exercício de direitos em processo.",
    "Art. 7º IX — Legítimo interesse (EXCEPCIONAL no setor público; exige teste de balanceamento).",
    "Art. 7º I — Consentimento (só pra tratamento FACULTATIVO; nunca pra serviço obrigatório).",
    "Art. 11 — Dados SENSÍVEIS (saúde, etc.): exige base ADICIONAL do art. 11 (ex: 'a' obrigação legal; 'f' tutela da saúde).",
  ],
};

export const COLA_MATRIZ_PXI = {
  titulo: "Cola — Matriz de Severidade (Probabilidade × Impacto)",
  // 3x3: linhas = Probabilidade (Alta/Média/Baixa), colunas = Impacto (Baixo/Médio/Alto)
  legenda: "Severidade = soma de pontos (Baixo/Baixa=1, Médio/Média=2, Alto/Alta=3). Até 3 = BAIXO · 4 = MÉDIO · 5-6 = ALTO.",
  matriz: [
    ["", "Impacto Baixo", "Impacto Médio", "Impacto Alto"],
    ["Prob. Alta", "MÉDIO", "ALTO", "ALTO"],
    ["Prob. Média", "BAIXO", "MÉDIO", "ALTO"],
    ["Prob. Baixa", "BAIXO", "BAIXO", "MÉDIO"],
  ],
};

export const COLA_PRIORIZACAO = {
  titulo: "Cola — Critérios de Priorização (Res. CD/ANPD nº 2/2022)",
  linhas: [
    "Regra '1+1': é ALTO RISCO quando há ≥1 critério GERAL E ≥1 ESPECÍFICO.",
    "GERAL (larga escala — basta 1): a) número significativo de titulares · b) volume de dados · c) duração, frequência e extensão geográfica.",
    "ESPECÍFICO (basta 1): a) tecnologias emergentes/inovadoras · b) vigilância de zonas acessíveis ao público · c) decisões unicamente automatizadas/profiling · d) dados sensíveis ou de crianças, adolescentes e idosos.",
    "Processos de ALTO RISCO entram primeiro no Inventário (Fase 3) e exigem RIPD (Art. 38).",
  ],
};

// =============================================================================
// ROTEIRO DO FACILITADOR — 16 momentos com tempos
// =============================================================================

export type MomentoRoteiro = {
  dia: 1 | 2;
  numero: number;
  titulo: string;
  duracao: string;
  meio: string; // 📺 telão · 🃏 cards · 📱 celular · presencial
  oQueFacilitadorFaz: string;
  oQueParticipantesFazem: string;
  material: string;
};

export const ROTEIRO: MomentoRoteiro[] = [
  {
    dia: 1, numero: 1, titulo: "Abertura + Checagem de infraestrutura + Formação de grupos", duracao: "35 min", meio: "📺 + presencial",
    oQueFacilitadorFaz: "CHECAGEM (5 min, use o Guia de Decisão Rápida): tem projetor? maioria com notebook? Wi-Fi testado em 2-3 celulares? → decide A, B ou C. NA DÚVIDA, C. Depois apresenta o curso e a dinâmica escolhida. Forma grupos de 5 e distribui os crachás. Explica a REGRA DE REPOSIÇÃO: se um papel faltar, outra pessoa do grupo assume a ficha — nada trava.",
    oQueParticipantesFazem: "Confirmam o que trouxeram (notebook? celular com internet?). Sentam em grupos, pegam os crachás, se apresentam pelos papéis.",
    material: "Guia de Decisão Rápida · Crachás (5 papéis) · plaquinha colorida do grupo",
  },
  {
    dia: 1, numero: 2, titulo: "Quiz Diagnóstico", duracao: "20 min", meio: "📱 celular",
    oQueFacilitadorFaz: "Projeta o QR Code do quiz no telão. Acompanha o painel agregado.",
    oQueParticipantesFazem: "Respondem o quiz no celular (anônimo).",
    material: "App (quiz) · QR no telão",
  },
  {
    dia: 1, numero: 3, titulo: "Termômetro Institucional (início) — abre a Fase Preliminar", duracao: "10 min", meio: "📱 celular",
    oQueFacilitadorFaz: "Abre a Fase Preliminar medindo a maturidade percebida ANTES de qualquer conteúdo (repetem no fim do curso pra ver o salto).",
    oQueParticipantesFazem: "Cada participante responde o Termômetro no celular (2 blocos: sobre você + sobre a sua instituição real).",
    material: "App (Termômetro)",
  },
  {
    dia: 1, numero: 4, titulo: "Fase Preliminar (1/2) — Fundamentos: Histórico, Estrutura e Desafios (art. 1–65)", duracao: "40 min", meio: "📺 telão + 📱 celular",
    oQueFacilitadorFaz: "Capacitação ANTES de abordar a gestão (bottom-up do serviço público): conduz os slides de Histórico e Estrutura da LGPD (abre direto no notebook, em 'Slides das fases'). Depois aplica os Desafios LGPD (Trilha do Conhecimento): no card do Telão, atalho '📋 Atividade ao vivo', escolhe a faixa (art. 1-11 … 51-65) e projeta o agregado pra comentar.",
    oQueParticipantesFazem: "Acompanham os slides de Histórico e Estrutura. Recebem o card da Trilha (imagem) e descobrem o número de cada artigo pela descrição, registrando no celular.",
    material: "Slides Histórico/Estrutura (notebook) · cards da Trilha (1 por grupo) · App (Desafios)",
  },
  {
    dia: 1, numero: 5, titulo: "Fase Preliminar (2/2) — Sensibilização + Carta à Alta Gestão", duracao: "40 min", meio: "📺 telão + 🃏 cards",
    oQueFacilitadorFaz: "DESFECHO da Preliminar (gancho bottom-up: eles acabaram de se capacitar — agora vão engajar quem decide). Apresenta os slides (por que LGPD importa no setor público, riscos de não fazer, papel da Alta Gestão). Depois distribui o deck da Preliminar e conduz a DISCUSSÃO RÁPIDA da Carta (~10 min): cada grupo debate as 3 perguntas e compartilha 1 resposta com a turma — os ARGUMENTOS vêm do que aprenderam no momento anterior. NÃO produzem o documento — ele vai no Pacote pra levar.",
    oQueParticipantesFazem: "Assistem a sensibilização. Discutem em grupo: qual o PEDIDO à Alta Gestão? qual o maior RISCO de não fazer? qual ARGUMENTO convence a gestão? Compartilham 1 resposta.",
    material: "Slides (telão) · deck Fase Preliminar (3 cards de discussão + card 'pra levar')",
  },
  {
    dia: 1, numero: 6, titulo: "Fase 1 — Formação das equipes de trabalho", duracao: "30 min", meio: "🃏 cards",
    oQueFacilitadorFaz: "Apresenta o art. 41 no telão. Distribui o deck da Fase 1. Conduz a discussão sobre o perfil do DPO. Depois projeta no telão os MODELOS (Ato de Designação + Portaria do Comitê Gestor): a Fase 1 forma as EQUIPES — comitê + encarregado, não só uma pessoa. A versão editável vai no Pacote de Modelos pra levar.",
    oQueParticipantesFazem: "Ordenam os 8 blocos do Ato de Designação. Discutem os critérios do Perfil do Encarregado e justificam quem será o DPO (o crachá já define quem opera o app; aqui decidem o porquê da escolha).",
    material: "Deck Fase 1 · cola (nenhuma)",
  },
  {
    dia: 1, numero: 7, titulo: "Fase 2 — Diagnóstico Inicial", duracao: "45 min", meio: "🃏 cards + 📱 celular",
    oQueFacilitadorFaz: "Apresenta a priorização (Res. 2/2022) no telão. Distribui o deck da Fase 2. Dispara a votação de critérios no celular (resultado no telão).",
    oQueParticipantesFazem: "Selecionam os cards de SETOR que tratam dados. Ordenam os PROCESSOS por prioridade. Votam os critérios no celular.",
    material: "Deck Fase 2 · cola de Priorização · App (votação)",
  },
  {
    dia: 1, numero: 8, titulo: "Fase 3 — Mapeamento e Análise de Riscos", duracao: "120 min", meio: "🃏 cards + 📱 + fichas",
    oQueFacilitadorFaz: "Apresenta o Inventário no telão. Distribui o deck da Fase 3, o tabuleiro da matriz P×I e as fichas de encaminhamento. Conduz o fluxo Contribuidor→DPO→TI.",
    oQueParticipantesFazem: "Donos de processo montam a ficha de Inventário e SUBMETEM ao DPO (ficha 📤). DPO revisa, pede apoio (🆘), aprova (✅). Posicionam os riscos na matriz P×I. Classificam base legal e 'é sensível?' no celular.",
    material: "Deck Fase 3 · fichas de encaminhamento · tabuleiro P×I · colas (Bases Legais, Matriz) · App",
  },
  {
    dia: 2, numero: 9, titulo: "Retomada + Fase 4 (GAP)", duracao: "45 min", meio: "🃏 cards + 📱 celular",
    oQueFacilitadorFaz: "Retoma o dia 1 (reorganiza grupos se necessário — material físico do dia 1 serve de referência). Apresenta o GAP no telão. Distribui o deck da Fase 4. Dispara votação de aderência (% no telão).",
    oQueParticipantesFazem: "Classificam cada controle (ADERENTE/PARCIAL/NÃO ADERENTE). Votam a aderência no celular.",
    material: "Deck Fase 4 · App (votação)",
  },
  {
    dia: 2, numero: 10, titulo: "Fase 5 — Plano de Ação", duracao: "30 min", meio: "🃏 cards",
    oQueFacilitadorFaz: "Apresenta o conceito de plano. Distribui os cards de ação em branco.",
    oQueParticipantesFazem: "Transformam GAPs NÃO ADERENTES + riscos ALTOS em cards de ação (o quê, quem, prazo, prioridade). DPO distribui responsáveis.",
    material: "Deck Fase 5 (cards de ação)",
  },
  {
    dia: 2, numero: 11, titulo: "Fase 6 — Execução + DSR Surpresa", duracao: "45 min", meio: "📱 celular + 🃏 surpresa",
    oQueFacilitadorFaz: "Apresenta os instrumentos (RIPD, Aviso, DSR, Terceiros). Dispara no celular: ordenar 8 seções do RIPD, ordenar a Política, teste de balanceamento de legítimo interesse. No meio, ENTREGA o card DSR Surpresa.",
    oQueParticipantesFazem: "Fazem as micro-atividades no celular. Reagem ao DSR Surpresa decidindo como responder (confirmar identidade? prazo? dá pra apagar tudo?).",
    material: "App (Modo Atividade — Onda 2) · card DSR Surpresa",
  },
  {
    dia: 2, numero: 12, titulo: "Fase 7 — Incidente Surpresa + PRI", duracao: "40 min", meio: "🃏 cards + 📺 cronômetro",
    oQueFacilitadorFaz: "DISPARA o Incidente Surpresa (lê o card em voz alta, liga o cronômetro de 72h no telão, clima de tensão). Distribui o deck da Fase 7.",
    oQueParticipantesFazem: "Ordenam as etapas NIST, montam a matriz RACI, decidem: comunica ANPD? titulares? Apresentam a resposta antes do cronômetro zerar.",
    material: "Card Incidente Surpresa · deck Fase 7 · cronômetro (telão)",
  },
  {
    dia: 2, numero: 13, titulo: "Caça às Pegadinhas", duracao: "20 min", meio: "📱 celular",
    oQueFacilitadorFaz: "Apresenta a missão final. Projeta o pódio do Olho Clínico no telão.",
    oQueParticipantesFazem: "Fazem o quiz Caça às Pegadinhas no celular.",
    material: "App (Caça às Pegadinhas)",
  },
  {
    dia: 2, numero: 14, titulo: "Termômetro Institucional (fim)", duracao: "10 min", meio: "📱 celular",
    oQueFacilitadorFaz: "Pede que repitam o Termômetro. Projeta a evolução início × fim no telão.",
    oQueParticipantesFazem: "Respondem o Termômetro novamente. Veem a própria evolução.",
    material: "App (Termômetro)",
  },
  {
    dia: 2, numero: 15, titulo: "Reflexão Final (debrief)", duracao: "20 min", meio: "presencial",
    oQueFacilitadorFaz: "Conduz a discussão coletiva: o que aprenderam? o que vão fazer no órgão? Conecta a evolução do Termômetro com o trabalho.",
    oQueParticipantesFazem: "Compartilham percepções. Cada grupo diz 1 próximo passo concreto na Instituição.",
    material: "—",
  },
  {
    dia: 2, numero: 16, titulo: "Encerramento + entrega dos materiais", duracao: "15 min", meio: "📺 telão",
    oQueFacilitadorFaz: "Entrega/explica os 5 documentos pra levar (Caderno, Resumo, Cartilha, Pacote de Modelos, Planilha). Distribui os Certificados.",
    oQueParticipantesFazem: "Recebem os materiais e o certificado. Sabem como continuar no órgão.",
    material: "Os 5 documentos institucionais (já no app) · Certificados",
  },
];

// =============================================================================
// GUIA DE DECISÃO RÁPIDA — qual modalidade usar (decisão NA SALA)
// =============================================================================
// O facilitador não sabe antes qual modalidade vai dar — decide nos primeiros
// minutos na sala. Princípio: C é o piso seguro (sempre preparado); A é upgrade
// condicional. Na dúvida, C.

export const GUIA_DECISAO = {
  titulo: "Guia de Decisão Rápida — Qual modalidade usar?",
  principio:
    "Você nem sempre sabe antes qual modalidade vai dar (depende do que a sala oferece no dia). Por isso: PREPARE-SE SEMPRE PRA MODALIDADE C (leve o kit impresso). A Modalidade C funciona em QUALQUER cenário. A Modalidade A é um 'upgrade' que só vale quando a infraestrutura permite. Regra de ouro: na dúvida, C.",
  checklist: {
    titulo: "Checklist dos primeiros 15 minutos na sala",
    passos: [
      "1. Tem projetor/telão funcionando? → NÃO: considere Modalidade B (100% offline, placar manual). SIM: siga (A ou C).",
      "2. A MAIORIA dos participantes trouxe notebook/tablet? → NÃO: Modalidade C. SIM: siga.",
      "3. Tem Wi-Fi confiável pra todos (TESTE abrindo o app em 2-3 celulares)? → NÃO: Modalidade C. SIM: Modalidade A é possível.",
      "4. Ainda em dúvida? → Modalidade C. Ela nunca deixa você na mão.",
    ],
  },
  cenarios: [
    ["Projetor + notebook/tablet por grupo + Wi-Fi confiável", "Modalidade A (digital completo no app)"],
    ["Projetor + só celular + internet instável", "Modalidade C (telão + cards físicos + celular leve)"],
    ["Sem projetor e sem internet", "Modalidade B (100% impresso, placar manual)"],
    ["Sala mista (alguns com notebook, outros não)", "Modalidade C pra TODOS — nunca misture digitação com cards no mesmo grupo"],
  ],
  naoFaca: [
    "NÃO comece em A e migre pra C no meio do curso (ex: Wi-Fi caiu). Decida na ABERTURA, antes de iniciar as fases.",
    "NÃO misture: se uns digitam no app e outros usam cards, o trabalho em grupo quebra. Padronize a sala inteira.",
    "NÃO deixe de imprimir o kit da Mod. C 'porque provavelmente vai dar A'. O kit impresso é o seu seguro — leve sempre.",
  ],
  regraOuro:
    "Prepare-se sempre pra C. Suba pra A só com CERTEZA de que a sala inteira tem infraestrutura. Decida na abertura, em 15 min. Os 5 documentos institucionais e o Telão servem às 3 modalidades — você nunca perde esse material.",
};

// Resumo das decisões de design (pra constar no roteiro)
export const NOTA_DESIGN =
  "Modalidade C: o facilitador conduz no telão; os participantes praticam DECISÕES (cards físicos + micro-toques no celular), não digitação. A produção pesada vira material pra levar (os 5 documentos). Resiliente a: sem notebook (produção física), sem Wi-Fi (cards offline, celular pontual), evasão/rearranjo (atividades autocontidas por fase + regra de reposição de papéis).";
