// Referências LGPD por campo de formulário + sugestões por processo do Vegas.
// Usado pelos forms dos mini-apps pra:
//   1. Tooltips "?" com artigos LGPD + perguntas-guia + exemplos (pedagógico)
//   2. Botão "Sugerir" que preenche com resposta típica pro processo (desbloqueia)
//
// Filosofia: ensinar, não dar gabarito. As sugestões trazem ALERTA pra revisão.

export type CampoHelp = {
  titulo: string;
  artigo?: string;
  oQueDiz: string;
  perguntaChave: string;
  pegadinha?: string;
  exemplos?: string[];
  linkAnpd?: { texto: string; url: string };
};

export const HELP_POR_CAMPO: Record<string, CampoHelp> = {
  baseLegal: {
    titulo: "Como escolher a base legal",
    artigo: "LGPD Art. 7º (dados comuns) ou Art. 11 (dados sensíveis)",
    oQueDiz:
      "O Art. 7º lista 10 bases pra tratar dados pessoais comuns. O Art. 11 lista 7 bases pra dados sensíveis (saúde, religião, política, biometria, etc.).",
    perguntaChave:
      "Há dado sensível no processo? SIM → use base do Art. 11. NÃO → use base do Art. 7º.",
    pegadinha:
      "Adm. Pública quase nunca usa consentimento — consentimento exige liberdade real de recusar, o que raramente acontece com o cidadão diante do Estado. Use \"Adm. Pública / políticas públicas\" (Art. 7º III ou Art. 11 b.III).",
    exemplos: [
      "Atendimento médico no SUS: Art. 11 b.VII (tutela da saúde)",
      "Seleção de estagiário: Art. 7º III (política pública)",
      "Cadastro de fornecedor: Art. 7º II (obrigação legal de licitar)",
    ],
    linkAnpd: {
      texto: "Guia ANPD — Tratamento de Dados pelo Poder Público (PDF)",
      url: "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-poder-publico-anpd-versao-final.pdf/@@display-file/file",
    },
  },

  tiposDados: {
    titulo: "O que listar aqui",
    artigo: "LGPD Art. 5º I, II e III",
    oQueDiz:
      "Liste CATEGORIAS de dados, não valores individuais. O inventário documenta QUAIS tipos de dado o processo trata.",
    perguntaChave:
      "Quais categorias? Cadastrais · contato · localização · financeiros · profissionais · comportamentais · sensíveis · dados de menores.",
    pegadinha:
      "Se o processo trata MENORES de 18 anos (pediatria, escola, estágio jovem), cite explicitamente — Art. 14 exige cuidado especial e geralmente consentimento de um dos pais.",
    exemplos: [
      "Posto de saúde: cadastrais (nome, CPF, endereço), filiação dos menores, dados de saúde (histórico, exames, alergias — SENSÍVEIS)",
      "Estagiários: cadastrais, foto, dados acadêmicos (histórico, currículo), opcionais socioeconômicos",
      "Ouvidoria: cadastrais (se identificada), conteúdo livre (pode conter terceiros + dados sensíveis)",
    ],
  },

  dadosSensiveis: {
    titulo: "É dado sensível?",
    artigo: "LGPD Art. 5º II",
    oQueDiz:
      "Sensível = dado sobre origem racial/étnica · convicção religiosa · opinião política · filiação a sindicato/organização religiosa/política · saúde · vida sexual · dado genético · dado biométrico.",
    perguntaChave:
      "Algum dos itens acima aparece, mesmo que indiretamente?",
    pegadinha:
      "Cuidado com sensíveis ESCONDIDOS: \"tema livre\" em audiência pública pode revelar opinião política. \"Denúncia de assédio\" pode incluir saúde mental do denunciante. \"Atendimento de pediatria\" combina menores + saúde.",
    exemplos: [
      "Posto de saúde: SIM (histórico médico, exames)",
      "Tribuna Livre da Câmara: SIM (tema da fala revela opinião política)",
      "Sistema de licitação: NÃO (só dados cadastrais do fornecedor)",
    ],
  },

  retencao: {
    titulo: "Quanto tempo guardar",
    artigo: "LGPD Art. 6º III (necessidade) + Art. 15 e 16 (término)",
    oQueDiz:
      "O dado deve ser eliminado após cumprida a finalidade. Exceções pra manter: cumprir lei/regulação, pesquisa, exercício de direitos, uso anonimizado.",
    perguntaChave:
      "Quanto tempo é OBRIGATÓRIO guardar? Quanto tempo é ÚTIL guardar? Use o maior, mas não além disso.",
    pegadinha:
      "Setor público tem prazos LEGAIS específicos que se sobrepõem: prontuário médico = 20 anos (CFM Res. 1.821) · contábil = 5 anos · contrato = 5 anos pós encerramento · ouvidoria/CGU = 5 anos. Não invente prazos.",
    exemplos: [
      "Prontuário do Posto: 20 anos após último atendimento (CFM)",
      "Currículo de estagiário não-selecionado: 1 ano + consentimento explícito na inscrição",
      "Gravação de Tribuna Livre no YouTube: permanente (interesse público histórico)",
    ],
  },

  compartilhamento: {
    titulo: "Com quem você compartilha",
    artigo: "LGPD Art. 26 (controladores conjuntos) · Art. 27 (entre órgãos) · Art. 33-36 (transferência internacional) · Art. 39 (operadores)",
    oQueDiz:
      "Liste TODOS os terceiros que recebem o dado: operadores (terceirizados que tratam por sua conta) · controladores conjuntos · outros órgãos públicos · plataformas (transferência internacional implícita).",
    perguntaChave:
      "Quem mais vê esse dado além da minha equipe? Operador? Outro órgão? Plataforma estrangeira?",
    pegadinha:
      "Você está usando YouTube, Google Drive, AWS, Microsoft 365? Isso é TRANSFERÊNCIA INTERNACIONAL (servidores fora do BR). Precisa cláusula contratual padrão ou outra hipótese do Art. 33.",
    exemplos: [
      "Posto de Saúde: Laboratório terceirizado (operador) + Sec. Estadual de Saúde (controlador conjunto, programa Mais SUS)",
      "Estagiários: CIEE (operador — formaliza contrato)",
      "Tribuna Livre: vereadores recebem pauta (interno) + YouTube transmite e armazena (transferência internacional)",
    ],
  },

  medidasSeguranca: {
    titulo: "Quais medidas implementar",
    artigo: "LGPD Art. 46 (técnicas e administrativas) · Art. 47 (dever continuado) · Art. 48 (notificar incidente)",
    oQueDiz:
      "Medidas devem ser proporcionais ao risco e tipo de dado. Maior risco (sensíveis, menores, alto volume) = mais controles.",
    perguntaChave:
      "Quais TÉCNICAS (controle de acesso, criptografia, backup, logs, MFA) e ADMINISTRATIVAS (treinamento, política, termo de sigilo, classificação) já estão em uso?",
    pegadinha:
      "Não confunda \"temos antivírus\" com \"temos política de segurança\". Medidas técnicas SEM medidas administrativas viram letra morta — alguém configura mal e quebra tudo.",
    exemplos: [
      "Prontuário: controle de acesso por perfil + backup criptografado + logs de acesso ao prontuário + treinamento anual + termo de sigilo",
      "Estagiários: HTTPS + banco isolado + acesso só pra RH + anonimização após 1 ano",
      "Ouvidoria: HTTPS + 2FA pra equipe + restrição de acesso ao histórico encerrado",
    ],
  },
};

// ============================================================================
// Sugestões por processo (slug derivado do nome)
// ============================================================================

export type SugestoesProcesso = {
  baseLegal?: string;
  tiposDados?: string;
  dadosSensiveis?: boolean;
  retencao?: string;
  compartilhamento?: string;
  medidasSeguranca?: string;
};

// O slug é detectado por substring no nome do processo (case-insensitive).
const SUGESTOES_POR_PROCESSO: Record<string, SugestoesProcesso> = {
  "posto de saúde": {
    baseLegal: "art11-b-vii",
    tiposDados:
      "Cadastrais: nome, CPF, RG, endereço, telefone. Filiação dos menores (pediatria). DADOS DE SAÚDE (sensíveis Art. 5º II): histórico médico, exames laboratoriais, alergias, medicamentos em uso, vacinas, diagnósticos. Dados de idosos (Programa Hipertensos).",
    dadosSensiveis: true,
    retencao: "20 anos após último atendimento (CFM Resolução 1.821/2007). Prontuário eletrônico segue mesma regra do físico.",
    compartilhamento:
      "Laboratório Municipal terceirizado (OPERADOR — exige contrato com cláusulas LGPD). Secretaria Estadual de Saúde (CONTROLADOR CONJUNTO — relatórios agregados do programa Mais SUS).",
    medidasSeguranca:
      "Controle de acesso por perfil/setor no Saúde+Municipal. Backup diário criptografado (AES-256). Logs de acesso ao prontuário (quem viu, quando). Treinamento anual da equipe. Termo de sigilo assinado. Política de mesa limpa.",
  },

  "estagiári": {
    baseLegal: "art7-iii",
    tiposDados:
      "Cadastrais: nome, CPF, foto 3x4, endereço, telefone, e-mail. Acadêmicos: histórico, declaração de matrícula, currículo PDF. Socioeconômicos OPCIONAIS: comprovante de renda, declaração de PCD, declaração de baixa renda. Comprovante de residência (pós-seleção).",
    dadosSensiveis: false,
    retencao:
      "Selecionados: 5 anos após fim do estágio (alinhado a contratos administrativos). Currículos de não-selecionados: 1 ano (2 próximas seleções), mediante consentimento explícito coletado na inscrição.",
    compartilhamento:
      "CIEE (OPERADOR — formaliza o contrato de estágio em nome da Prefeitura). Internamente: setor que vai receber o estagiário.",
    medidasSeguranca:
      "Formulário com HTTPS. Banco isolado, acessível só pela equipe de RH. Logs de acesso. Anonimização do currículo após o prazo. Pasta física com cadeado pros comprovantes em papel.",
  },

  "tribuna": {
    baseLegal: "art7-iii",
    tiposDados:
      "Cadastrais: nome, CPF, telefone, e-mail. Endereço completo + cópia digital de comprovante de residência. TEMA DA FALA (potencialmente sensível Art. 5º II — pode revelar opinião política, religiosa, posicionamento). Faixa etária e profissão (opcionais).",
    dadosSensiveis: true,
    retencao:
      "Cadastro de inscrição: 5 anos (alinhado a controle interno e CGU). Gravação no YouTube: permanente (interesse público histórico das sessões).",
    compartilhamento:
      "Pauta enviada aos 15 vereadores + assessorias 24h antes da sessão (interno). Transmissão ao vivo + gravação permanente no YouTube oficial (público; configura TRANSFERÊNCIA INTERNACIONAL — servidores Google fora do BR, Art. 33).",
    medidasSeguranca:
      "Portal HTTPS. Backup do cadastro. CRÍTICO: substituir a planilha Excel solta (sem controle de acesso) por SharePoint com permissões por papel. Logs de acesso ao cadastro.",
  },

  "ouvidoria": {
    baseLegal: "art7-iii",
    tiposDados:
      "Identificação OPCIONAL (manifestação anônima permitida — Art. 11 LAI). Quando identificada: nome, CPF, telefone, e-mail. CONTEÚDO LIVRE (pode citar terceiros nominalmente — servidores, vereadores, cidadãos). Anexos: PDFs, fotos, áudios. Em denúncias de assédio: dados de saúde do denunciante podem aparecer como contexto (SENSÍVEIS).",
    dadosSensiveis: true,
    retencao:
      "Manifestações: 5 anos (CGU, alinhado à LAI). Encerradas: arquivo histórico — definir prazo (sugestão: 10 anos, depois eliminar ou anonimizar).",
    compartilhamento:
      "Equipe da Ouvidoria (3 servidoras — internas). Setor competente (encaminhamento). Apenas por ordem judicial pra externos. NUNCA divulgar identidade do denunciante em assédio.",
    medidasSeguranca:
      "Portal HTTPS. Login com 2FA pra equipe da Ouvidoria. Logs de quem acessou qual manifestação. Termo de sigilo assinado. CRÍTICO: restringir acesso ao histórico encerrado (hoje toda equipe acessa — viola finalidade).",
  },
};

/**
 * Detecta o processo pelo nome e retorna sugestões aplicáveis.
 * Retorna null se nenhum padrão conhecido bater.
 */
export function sugestoesDoProcesso(nomeProcesso: string | null | undefined): SugestoesProcesso | null {
  if (!nomeProcesso) return null;
  const lower = nomeProcesso.toLowerCase();
  for (const [chave, sug] of Object.entries(SUGESTOES_POR_PROCESSO)) {
    if (lower.includes(chave)) return sug;
  }
  return null;
}

// ============================================================================
// HELP — Campos de RISCO (Missão 2)
// Baseado em: Res. ANPD nº 2/2022 · ISO 27005 (gestão de risco) · ISO 27001/27701
// (controles de segurança e privacidade) · NIST CSF · OWASP Risk Rating
// ============================================================================

Object.assign(HELP_POR_CAMPO, {
  riscoDescricao: {
    titulo: "Como descrever um risco",
    artigo: "Res. ANPD nº 2/2022 · ISO/IEC 27005",
    oQueDiz:
      "Risco = combinação de uma AMEAÇA explorando uma VULNERABILIDADE causando IMPACTO. Descrever 'o que pode dar errado' de forma concreta, partindo do cidadão.",
    perguntaChave:
      "Qual evento ruim PODE acontecer? Quem é afetado? O que vaza/quebra/se perde?",
    pegadinha:
      "Risco NÃO é a medida de controle ('falta de criptografia'). Risco É o evento ('vazamento de prontuários por mídia sem criptografia'). Vai pela frase 'se isso falhar, então...'",
    exemplos: [
      "Bom: 'Vazamento de prontuários por pendrive sem criptografia perdido em ônibus'",
      "Bom: 'Acesso indevido a histórico médico por servidor de outro setor via login compartilhado'",
      "Ruim: 'Falta de MFA' (isso é controle, não risco) — formato certo: 'Sequestro de conta admin por ausência de MFA permite vazamento massivo'",
    ],
  } as CampoHelp,

  riscoCategoria: {
    titulo: "Categoria do risco — tríade CID + LGPD",
    artigo: "ISO/IEC 27001 (CID) · LGPD Art. 6º (princípios) · LGPD Art. 18 (direitos)",
    oQueDiz:
      "Confidencialidade = vazar dado · Integridade = adulterar dado · Disponibilidade = perder acesso. LGPD adiciona Base Legal (tratamento ilegítimo) e Direitos do Titular (impedir acesso/correção/eliminação).",
    perguntaChave:
      "O que esse risco fere PRINCIPALMENTE: sigilo, exatidão, acesso, base legal ou direitos do cidadão?",
    pegadinha:
      "Um mesmo risco pode atingir mais de uma categoria (ex: ransomware = Integridade + Disponibilidade). Escolha a PRINCIPAL — o curso usa categoria única pra simplificar.",
    exemplos: [
      "Vazamento de dados = Confidencialidade",
      "Ransomware criptografando prontuários = Disponibilidade (acesso) + Integridade (modificação)",
      "Coleta excessiva sem finalidade clara = Base Legal",
      "Atendimento de pedido de eliminação ignorado = Direitos do Titular",
    ],
  } as CampoHelp,

  riscoProbabilidade: {
    titulo: "Como medir Probabilidade",
    artigo: "ISO/IEC 27005 · NIST SP 800-30 · Res. ANPD nº 2/2022",
    oQueDiz:
      "Probabilidade = frequência esperada do evento ruim acontecer no próximo ano. Considere: (a) histórico no setor · (b) facilidade técnica de explorar · (c) motivação de atacantes · (d) controles atuais.",
    perguntaChave:
      "Em 12 meses, quantas vezes esse risco pode se materializar? BAIXA = improvável (<1x) · MÉDIA = possível (1-3x) · ALTA = esperado (4+x ou já aconteceu).",
    pegadinha:
      "Não confunda 'nunca aconteceu aqui' com Baixa. Setor público é alvo crescente (Lei 14.129/2021 obriga digitalização). Se outros municípios já sofreram = Alta probabilidade local também.",
    exemplos: [
      "Phishing em servidor sem treinamento anual: ALTA (campanhas semanais no Brasil)",
      "Pendrive perdido com prontuário: MÉDIA (acontece sem política BYOD)",
      "Invasão por APT estatal estrangeira: BAIXA (alvo improvável pra município pequeno)",
    ],
  } as CampoHelp,

  riscoImpacto: {
    titulo: "Como medir Impacto",
    artigo: "LGPD Art. 38 (RIPD) · Res. ANPD nº 15/2024 (incidentes graves) · ISO 27005",
    oQueDiz:
      "Impacto = quanto dano se materializar. Avalie sobre o CIDADÃO (não a instituição): danos físicos, financeiros, morais, discriminação, vigilância indevida.",
    perguntaChave:
      "Se vazar/quebrar/falhar: cidadão sofre desconforto (BAIXO), tem direito violado / problema concreto (MÉDIO), ou tem dano grave / irreversível (ALTO)?",
    pegadinha:
      "Volume + sensibilidade = multiplicador. Vazar 100 emails = baixo. Vazar 2.300 prontuários com diagnósticos = alto. Vazar dado de menor de idade = ALTO sempre (Art. 14 LGPD).",
    exemplos: [
      "Vazamento de e-mail de contato (sem mais nada): BAIXO",
      "Vazamento de CPF + endereço de servidor: MÉDIO (golpes direcionados, doxxing)",
      "Vazamento de prontuário de paciente HIV+: ALTO (discriminação, demissão, suicídio em casos extremos)",
      "Vazamento de denúncia anônima de assédio com identificação do denunciante: ALTO (retaliação)",
    ],
  } as CampoHelp,

  riscoMitigacao: {
    titulo: "Como planejar a mitigação",
    artigo: "ISO/IEC 27001 (controles SI) · ISO/IEC 27701 (controles privacidade) · NIST CSF · OWASP",
    oQueDiz:
      "Mitigação = ações concretas pra reduzir Probabilidade OU Impacto. Combine controles TÉCNICOS (criptografia, MFA, segregação) com ADMINISTRATIVOS (política, treinamento, contrato).",
    perguntaChave:
      "Pra reduzir esse risco: o que faz baixar a chance de acontecer + o que faz baixar o dano se acontecer? Quem é responsável? Em quanto tempo?",
    pegadinha:
      "Mitigação eficaz é VERIFICÁVEL. 'Treinar a equipe' é fraco — 'Treinamento anual obrigatório com lista de presença + teste prático no fim' é forte. Sempre tenha um responsável e um prazo.",
    exemplos: [
      "Pra vazamento por pendrive: Política BYOD escrita + MFA no Saúde+Municipal + treinamento sobre mídias removíveis + bloqueio de USB no AD",
      "Pra acesso indevido por servidor de outro setor: Perfis de acesso por setor + logs de acesso a prontuário + auditoria mensal de acessos + termo de sigilo",
      "Pra phishing: Treinamento anual + simulação trimestral + filtro anti-phishing no e-mail + DMARC/SPF",
    ],
  } as CampoHelp,
});

// ============================================================================
// Sugestões de RISCO TÍPICO por processo — alimenta botão "✨ Sugerir" no form
// ============================================================================

export type SugestaoRiscoTipico = {
  riscoTitulo: string;
  descricao: string;
  categoria: "CONFIDENCIALIDADE" | "INTEGRIDADE" | "DISPONIBILIDADE" | "BASE_LEGAL" | "DIREITOS_TITULAR";
  probabilidade: "BAIXA" | "MEDIA" | "ALTA";
  impacto: "BAIXO" | "MEDIO" | "ALTO";
  mitigationPlan: string;
};

const RISCOS_TIPICOS_POR_PROCESSO: Record<string, SugestaoRiscoTipico> = {
  "posto de saúde": {
    riscoTitulo: "Vazamento de prontuários por mídia removível sem criptografia",
    descricao:
      "Servidor leva backup ou consulta exames em pendrive não criptografado. Pendrive é perdido em ônibus municipal ou roubado da bolsa. Inclui histórico médico, alergias, medicamentos de pacientes (dados sensíveis Art. 5º II LGPD).",
    categoria: "CONFIDENCIALIDADE",
    probabilidade: "MEDIA",
    impacto: "ALTO",
    mitigationPlan:
      "Política BYOD escrita proibindo mídia removível pessoal. MFA obrigatório no Saúde+Municipal. Treinamento anual sobre mídias removíveis com simulação. Bloqueio de USB no AD pra estações administrativas (libera só pra TI/manutenção). Backup só pela TI com criptografia AES-256. Termo de sigilo assinado com cláusula específica de mídia.",
  },

  "estagiári": {
    riscoTitulo: "Vazamento do banco de currículos de candidatos com CPF e comprovante de residência",
    descricao:
      "Banco de currículos do processo seletivo de estagiários (320 inscritos/semestre) é exposto por configuração errada de pasta compartilhada, acesso indevido de servidor ou phishing direcionado ao RH. Inclui dados cadastrais completos + foto + comprovantes opcionais (renda, PCD).",
    categoria: "CONFIDENCIALIDADE",
    probabilidade: "BAIXA",
    impacto: "MEDIO",
    mitigationPlan:
      "Acesso restrito ao grupo RH no AD. Anonimização do currículo após 1 ano (retira CPF, RG, endereço, mantém formação pra estatística). Backup criptografado. Logs de acesso à pasta. Treinamento sobre phishing pra equipe RH. Política de retenção formal (5 anos pro contrato, 1 ano pra currículo de não-selecionado).",
  },

  "tribuna": {
    riscoTitulo: "Exposição involuntária do tema da fala dos inscritos em transmissão pública",
    descricao:
      "Cadastro de inscritos da Tribuna Livre inclui 'tema da fala' que pode revelar opinião política, religiosa ou crítica institucional (dado sensível Art. 5º II). Lista é compartilhada por e-mail com 15 vereadores 24h antes — risco de vazamento informal. Gravação no YouTube fica permanente.",
    categoria: "CONFIDENCIALIDADE",
    probabilidade: "ALTA",
    impacto: "MEDIO",
    mitigationPlan:
      "Aviso prévio claro no formulário sobre transmissão pública e gravação permanente. Substituir planilha Excel por sistema com controle de acesso (SharePoint ou similar). Política formal vedando reencaminhamento da lista pelos vereadores. Anonimização de inscritos que pedirem após a sessão (remove nome do cadastro mas mantém vídeo público — bem informado).",
  },

  "ouvidoria": {
    riscoTitulo: "Identificação indevida de denunciante anônimo em casos de assédio",
    descricao:
      "Manifestações anônimas de assédio podem conter dados que permitam identificar o denunciante (relato com detalhes, anexos com metadados, IP coletado). Servidor da equipe da Ouvidoria ou outro encaminhado pode revelar (intencional ou não). Resultado: retaliação ao denunciante.",
    categoria: "CONFIDENCIALIDADE",
    probabilidade: "MEDIA",
    impacto: "ALTO",
    mitigationPlan:
      "Não coletar IP do navegador no formulário anônimo. Pseudonimizar denúncias antes de encaminhar (remover metadados de anexos, sumarizar relato). Termo de sigilo específico pra equipe Ouvidoria + sanção por descumprimento. Login com 2FA pra equipe. Logs de acesso a cada denúncia (quem viu quando). Treinamento anual sobre Lei 13.460/2017 (Código de Defesa do Usuário do Serviço Público).",
  },
};

export function riscoTipicoDoProcesso(nomeProcesso: string | null | undefined): SugestaoRiscoTipico | null {
  if (!nomeProcesso) return null;
  const lower = nomeProcesso.toLowerCase();
  for (const [chave, sug] of Object.entries(RISCOS_TIPICOS_POR_PROCESSO)) {
    if (lower.includes(chave)) return sug;
  }
  return null;
}
