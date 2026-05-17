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
