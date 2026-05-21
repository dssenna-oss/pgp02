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

  // ───────────────────────────────────────────────────────────────────────
  // RIPD — Relatório de Impacto à Proteção de Dados (8 seções, Art. 38 LGPD)
  // ───────────────────────────────────────────────────────────────────────
  ripd_secao_1: {
    titulo: "Identificação do agente e Encarregado",
    artigo: "LGPD Art. 41 (Encarregado) + Art. 5º VI/VII (controlador/operador)",
    oQueDiz:
      "O RIPD precisa identificar o controlador (órgão que decide sobre o tratamento), o operador (quem trata em nome de) quando houver, e o Encarregado (DPO) com canal direto.",
    perguntaChave: "Quem é o responsável institucional e quem o titular procura pra exercer direitos?",
    pegadinha:
      "Não basta colocar 'TI'. O controlador é o ÓRGÃO (PM/CM/Tribunal). O Encarregado é uma PESSOA designada por ato formal — com nome, e-mail e telefone diretos.",
    exemplos: [
      "Controlador: Prefeitura Municipal de Vegas (CNPJ 00.000.000/0001-00)",
      "Encarregado: Maria Silva, encarregado@vegas.es.gov.br, (27) 3334-7601",
    ],
    linkAnpd: { texto: "Guia ANPD — Encarregado (PDF)", url: "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-do-encarregado-vf-1.pdf" },
  },
  ripd_secao_2: {
    titulo: "Descrição do tratamento",
    artigo: "LGPD Art. 38 par. único, I + Art. 5º VII (operações)",
    oQueDiz:
      "Descrever de forma objetiva: quais dados são tratados, finalidade, quem faz, qual base legal, prazo de retenção e fluxo. Saí do Inventário do processo.",
    perguntaChave: "Quem coleta o quê, pra que, por quanto tempo e com que base legal?",
    pegadinha:
      "Evite genérico (\"dados pessoais necessários\"). Liste: nome, CPF, RG, endereço, telefone... O nível de detalhe protege o controlador e informa o titular.",
    exemplos: [
      "Atendimento no Posto: nome, CPF, prontuário (sensível), endereço, telefone — pra dispensa de medicamentos — Art. 11 b.VII — retenção 20 anos",
    ],
  },
  ripd_secao_3: {
    titulo: "Necessidade e proporcionalidade",
    artigo: "LGPD Art. 6º III (necessidade) + Art. 6º I (finalidade)",
    oQueDiz:
      "Tratamento só deve usar os dados ESTRITAMENTE necessários pra cumprir a finalidade declarada. Excedeu? Tira do escopo.",
    perguntaChave: "Cada dado coletado é indispensável pra finalidade? Se removê-lo, o processo deixa de funcionar?",
    pegadinha:
      "Coletar 'pode precisar depois' viola o princípio da necessidade. Se não usa hoje, não coleta.",
    exemplos: [
      "Inscrição em estágio NÃO precisa de religião nem orientação política — coletar isso é desproporcional.",
      "Atendimento no SUS PRECISA de prontuário — proporcional pra prestação do serviço.",
    ],
  },
  ripd_secao_4: {
    titulo: "Análise de riscos aos direitos e liberdades dos titulares",
    artigo: "LGPD Art. 38 par. único, III + Art. 5º X (eliminação)",
    oQueDiz:
      "Listar riscos identificáveis (vazamento, acesso indevido, uso desviado, perda) com avaliação de probabilidade × impacto pra direitos do titular.",
    perguntaChave: "Se algo der errado, o quanto isso AFETA o titular? Discriminação? Exposição pública? Constrangimento?",
    pegadinha:
      "Risco não é só técnico. Vazamento de orientação sexual ou exames médicos pode causar dano social/familiar — entra como impacto ALTO mesmo se a probabilidade for baixa.",
    exemplos: [
      "Pendrive sem cripto perdido com prontuários: P=Média × I=Alto = ALTO",
      "Acesso indevido a histórico médico por outros servidores: P=Alta × I=Alto = ALTO",
    ],
  },
  ripd_secao_5: {
    titulo: "Medidas e salvaguardas adotadas",
    artigo: "LGPD Art. 6º VII (segurança) + Art. 46 + Art. 38 par. único, II",
    oQueDiz:
      "Documentar medidas TÉCNICAS (cripto, MFA, logs, backup) E ADMINISTRATIVAS (políticas, treinamento, termos de sigilo, papéis) que mitigam os riscos.",
    perguntaChave: "Pra cada risco mapeado, qual medida específica reduz a probabilidade ou o impacto?",
    pegadinha:
      "Lista genérica de boas práticas vira papelada. O RIPD pede medidas EFETIVAS — quem aplica, como mede, em que prazo.",
    exemplos: [
      "Risco de acesso indevido → Perfil por setor + Logs de acesso + Auditoria mensal + Termo de sigilo na admissão",
    ],
  },
  ripd_secao_6: {
    titulo: "Direitos dos titulares — exercício efetivo",
    artigo: "LGPD Art. 18 (9 direitos) + Art. 19 (prazo 15 dias úteis)",
    oQueDiz:
      "Como o titular exerce os 9 direitos do Art. 18 neste processo: qual canal, qual prazo, quem responde, como comprova identidade.",
    perguntaChave: "O titular sabe como acessar/corrigir/eliminar os dados deste processo específico?",
    pegadinha:
      "Não basta 'fale com o DPO'. Tem que descrever o FLUXO operacional: cadastro registra em ticket? Como autentica o titular? Quem responde em até 15 dias?",
    exemplos: [
      "Atendimento médico: titular requer pelo e-mail do DPO + apresenta documento; resposta em até 15 dias úteis com cópia do prontuário em PDF assinado.",
    ],
  },
  ripd_secao_7: {
    titulo: "Compartilhamentos e transferências internacionais",
    artigo: "LGPD Art. 7º §3º + Art. 33-36 (transferência internacional)",
    oQueDiz:
      "Listar compartilhamentos com outros órgãos/empresas e, se houver, transferências pra fora do Brasil — com base legal e salvaguardas específicas (Art. 33).",
    perguntaChave: "Os dados saem do controlador? Pra quem, com que base, com que segurança?",
    pegadinha:
      "Cloud com servidor fora do Brasil = transferência internacional, mesmo que seja só backup. Precisa Art. 33 (decisão de adequação, cláusulas-padrão, etc).",
    exemplos: [
      "Compartilhamento com SUS estadual (e-SUS): Art. 26 (uso compartilhado entre entes públicos)",
      "Backup em provedor cloud na Irlanda: Art. 33 V (cláusulas contratuais específicas) + cripto em trânsito e repouso",
    ],
  },
  ripd_secao_8: {
    titulo: "Conclusão — risco residual aceitável?",
    artigo: "LGPD Art. 38 par. único (escopo do RIPD) + Art. 32 (consulta ANPD)",
    oQueDiz:
      "Calcular o risco que SOBROU depois de aplicadas as medidas. Decidir: aceita? mitiga mais? consulta a ANPD antes de prosseguir?",
    perguntaChave: "Com as medidas adotadas, o tratamento ainda gera risco ALTO aos direitos do titular?",
    pegadinha:
      "Risco residual ALTO sem mitigação adicional = obrigação de consultar a ANPD (Art. 32). NÃO é opcional. Se o RIPD conclui ALTO e o controlador segue, é prova de dolo se vazar.",
    exemplos: [
      "Vigilância em massa com biometria → mesmo com salvaguardas, risco residual ALTO → consulta prévia à ANPD obrigatória",
      "Atendimento médico com perfil por setor + logs + auditoria → risco residual BAIXO → prosseguir com revisão anual",
    ],
  },

  // ============================================================================
  // GAP Analysis — uma chave geral que explica a régua de classificação
  // ============================================================================
  gap_classificacao: {
    titulo: "Como classificar um controle do GAP",
    artigo: "Boas práticas — Res. CD/ANPD nº 2/2022 + ISO 27701",
    oQueDiz:
      "GAP Analysis mede a aderência REAL da organização a cada controle de proteção de dados. Não estamos medindo onde a organização QUER chegar — só onde ela está HOJE.",
    perguntaChave:
      "Pra cada controle: o controle existe e funciona? SIM completo → ADERENTE. SIM parcial → PARCIAL. NÃO existe → NÃO ADERENTE. NÃO mas vamos implementar → AÇÃO PLANEJADA. Não sei avaliar sozinho → SOLICITAR APOIO.",
    pegadinha:
      "Quem tenta inflar o score (\"ah, esse aqui é Aderente vai\") está se enganando. GAP enviesado vira Plano de Ação que ignora as fraquezas reais — e a ANPD descobre depois.",
    exemplos: [
      "Política de Privacidade publicada na intranet, mas nunca testada? → PARCIAL (existe mas não maduro)",
      "MFA em sistemas críticos? Nenhum sistema tem? → NÃO ADERENTE",
      "Não tem MFA, mas vamos contratar Microsoft 365 com MFA até dezembro? → AÇÃO PLANEJADA",
      "Eu, DPO, não sei se TI fez segregação de rede pelo Firewall → SOLICITAR APOIO de TI",
    ],
    linkAnpd: {
      texto: "Guia ANPD — Segurança da Informação para Agentes de Tratamento (PDF)",
      url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-anpd-seguranca-informacao.pdf",
    },
  },

  // ============================================================================
  // Terceiros (Gestão de Operadores) — 3 abas do drawer
  // ============================================================================
  terceiro_avaliacao_risco: {
    titulo: "Por que avaliar o risco do terceiro?",
    artigo: "LGPD Art. 39 + Res. CD/ANPD nº 2/2022 Art. 4º",
    oQueDiz:
      "Operador trata dados em nome do controlador. Quem responde por incidente do operador é o CONTROLADOR (você). A LGPD obriga avaliação prévia da capacidade do operador de cumprir a lei.",
    perguntaChave:
      "Marque os fatores aplicáveis ao serviço deste operador. O nível (BAIXO/MÉDIO/ALTO) calcula automaticamente e sugere as cláusulas contratuais mínimas.",
    pegadinha:
      "Dado SENSÍVEL com terceiro = risco ALTO automático, mesmo com 1 só pessoa atendida. Volume alto + dado comum também sobe pra ALTO. Nunca rode adequação só com cláusulas padrão sem avaliar o risco — fica vago e o operador não se sente responsável.",
    exemplos: [
      "Lab. Municipal que recebe prontuário pra exame: dado sensível + saúde → ALTO",
      "Empresa de envio de SMS de aviso de consulta: dado comum + volume médio → MÉDIO",
      "Gráfica que imprime carnê de IPTU: dado comum + alto volume → MÉDIO/ALTO conforme exposição",
    ],
  },
  terceiro_due_diligence: {
    titulo: "O que avaliar antes de contratar",
    artigo: "Boas práticas — Res. CD/ANPD nº 2/2022 Art. 4º",
    oQueDiz:
      "Due Diligence = checklist técnico/jurídico ANTES de assinar contrato. Quanto maior o risco do serviço (aba 1), mais rigoroso deve ser o questionário. Resultado: APROVADO / APROVADO COM RESSALVAS / REPROVADO / INCOMPLETO.",
    perguntaChave:
      "O operador tem estrutura mínima de segurança (criptografia, controle de acesso, treinamento) e cláusulas contratuais aderentes à LGPD?",
    pegadinha:
      "DD aprovado não isenta o controlador de responsabilidade. Ainda é responsabilidade SOLIDÁRIA (Art. 42). Mas DD bem feito = defesa em caso de incidente: \"olha, fizemos diligência, o operador descumpriu o que prometeu\".",
    exemplos: [
      "Operador sem certificação ISO 27001 + dado sensível → tipicamente APROVADO COM RESSALVAS (exigir treinamento adicional)",
      "Operador estrangeiro sem representante no Brasil → REPROVADO (transferência internacional precisa de regime adicional Art. 33)",
      "Operador novo (start-up < 2 anos) com infra terceirizada → exige cláusulas extra-fortes de auditoria",
    ],
  },
  terceiro_clausulas: {
    titulo: "Cláusulas LGPD obrigatórias no contrato",
    artigo: "LGPD Art. 39 + DPA (Data Processing Agreement)",
    oQueDiz:
      "Todo contrato com operador precisa ter cláusulas explícitas sobre LGPD. Sem isso, em incidente, o operador escapa e o controlador paga sozinho. As cláusulas sugeridas variam conforme o risco.",
    perguntaChave:
      "Selecione as cláusulas aplicáveis. Mínimo absoluto: confidencialidade + comunicação de incidente + retorno/destruição dos dados ao fim do contrato.",
    pegadinha:
      "Cláusula \"o operador se compromete a cumprir a LGPD\" SOZINHA é cláusula de papel. Precisa especificar prazos (incidente em quanto tempo? destruição em quanto tempo após fim?), formato (relatório anual? auditoria?), penalidades.",
    exemplos: [
      "Operador de saúde: + cláusula de criptografia obrigatória + comunicação de incidente em 24h + auditoria semestral",
      "Operador genérico baixo risco: pacote padrão (confidencialidade + incidente + retorno) basta",
      "Operador estrangeiro: + cláusula de transferência internacional conforme Art. 33",
    ],
  },

  // ============================================================================
  // DSR (Direitos do Titular) — header da lista
  // ============================================================================
  dsr_direitos: {
    titulo: "Os 9 direitos do titular (Art. 18)",
    artigo: "LGPD Art. 18 (direitos do titular)",
    oQueDiz:
      "Todo cidadão tem direito a CONFIRMAÇÃO, ACESSO, CORREÇÃO, ANONIMIZAÇÃO/ELIMINAÇÃO, PORTABILIDADE, ELIMINAÇÃO POR CONSENTIMENTO, INFORMAÇÃO SOBRE COMPARTILHAMENTOS, INFORMAÇÃO SOBRE NÃO-CONSENTIMENTO, REVOGAÇÃO DO CONSENTIMENTO. A organização tem que ter CANAL FUNCIONAL pra receber esses pedidos.",
    perguntaChave:
      "Quem é o titular? O pedido tem fundamento legal (algum dos 9 direitos)? Você tem dados dele? Atenda ou justifique a recusa.",
    pegadinha:
      "Sem CONFIRMAR IDENTIDADE do solicitante, atender o pedido é VAZAMENTO. Pedir RG/CPF antes de responder é OBRIGAÇÃO, não burocracia — protege o titular de impostores.",
    exemplos: [
      "Pedido por e-mail \"quero saber tudo sobre minha filha menor\" → pede comprovação de filiação + CPF da criança antes",
      "Pedido \"exclui meu dado AGORA\" → checar se há base legal que obriga a guardar (ex: prontuário 20 anos)",
      "Pedido \"portar pro plano da concorrência\" → portabilidade é Art. 18 V, mas formato depende do que a outra organização aceita",
    ],
    linkAnpd: {
      texto: "ANPD — Direito dos Titulares",
      url: "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares",
    },
  },
  dsr_prazo: {
    titulo: "Quanto tempo tenho pra responder?",
    artigo: "LGPD Art. 19 (prazo de resposta)",
    oQueDiz:
      "O Art. 19 II dá 15 dias úteis pra resposta a partir do recebimento do pedido. Prorrogação justificada vai até 2 prazos adicionais de 15 dias (total 45 dias).",
    perguntaChave:
      "Quando o pedido chegou? Marque a data. Você tem 15 dias úteis pra responder OU negar OU pedir mais tempo (com justificativa).",
    pegadinha:
      "Silêncio = descumprimento. Mesmo que o pedido seja absurdo (\"quero todos os meus dados\" sem ele ter dado nenhum), responda formalmente: \"não localizamos cadastro seu nesta organização\". Sem resposta = denuncia pra ANPD.",
    exemplos: [
      "Pedido em 01/06 → responder até 22/06 (15 dias úteis)",
      "Pedido complexo (\"todos os meus dados em todos os sistemas\") → pode prorrogar 15+15 com justificativa formal",
      "Pedido fora do escopo (\"quero meu dado do Bolsa Família\") → resposta de competência: \"esse dado é federal, encaminhe pro Ministério X\"",
    ],
  },

  // ============================================================================
  // Aviso de Privacidade — 12 seções (template ANPD)
  // ============================================================================
  aviso_secao_1: {
    titulo: "Seção 1 — Quem somos",
    artigo: "LGPD Art. 9º I",
    oQueDiz: "Identificação completa do controlador: razão social/órgão, CNPJ, endereço da sede, contato institucional.",
    perguntaChave: "Quem é o controlador? (Em órgãos públicos: nome do órgão + CNPJ + secretaria/departamento responsável)",
    pegadinha: "Não basta colocar o nome do órgão. CNPJ é o RG da pessoa jurídica — sem ele, o aviso fica vago. Em órgãos públicos, cite a unidade autônoma (Secretaria X, Câmara Y) com endereço onde o titular pode ir pessoalmente.",
  },
  aviso_secao_2: {
    titulo: "Seção 2 — Encarregado (DPO)",
    artigo: "LGPD Art. 41",
    oQueDiz: "Nome completo do Encarregado titular E do substituto, e-mail dedicado a DSR + telefone direto. Não basta \"falar com nosso jurídico\".",
    perguntaChave: "Quem é o Encarregado nomeado por portaria? Tem substituto? Qual o e-mail/telefone dedicado?",
    pegadinha: "E-mail \"encarregado@prefeitura.xx\" que cai numa caixa coletiva = DPO inexistente. Tem que ser caixa direta do DPO, com expectativa de resposta. Sem isso, Art. 41 §2º considera descumprido.",
  },
  aviso_secao_3: {
    titulo: "Seção 3 — Quais dados tratamos",
    artigo: "LGPD Art. 9º I",
    oQueDiz: "Lista de CATEGORIAS de dados tratados por finalidade. Não precisa ser exaustivo, mas precisa ser representativo. Esta seção é alimentada pelo RIPD dos processos críticos.",
    perguntaChave: "Cite as principais categorias do Inventário: cadastrais, contato, dados sensíveis, dados de menores, biometria, localização, etc.",
    pegadinha: "Listar só \"dados pessoais\" é não dizer nada. ANPD considera não-conforme. Cite categorias específicas (\"endereço\", \"telefone\", \"dados de saúde\", \"foto\") agrupadas por finalidade.",
  },
  aviso_secao_4: {
    titulo: "Seção 4 — Base legal",
    artigo: "LGPD Art. 7º (comuns) + Art. 11 (sensíveis) + Art. 23 (Adm. Pública)",
    oQueDiz: "Pra cada FINALIDADE, declare a base legal específica. Não basta dizer \"interesse legítimo\" sem fundamentar — Art. 10 exige teste de balanceamento.",
    perguntaChave: "Pra cada finalidade do Inventário: qual artigo da LGPD justifica? (Adm. Pública usa muito Art. 7º III e Art. 11 b.II)",
    pegadinha: "Adm. Pública quase NUNCA usa consentimento. Cidadão diante do Estado não tem liberdade real de recusa. Usar consentimento como base = base errada e vulnerável.",
  },
  aviso_secao_5: {
    titulo: "Seção 5 — Por quanto tempo guardamos",
    artigo: "LGPD Art. 15 e 16",
    oQueDiz: "Prazo de retenção por finalidade. Ao fim, eliminar ou anonimizar. Se há retenção obrigatória legal (ex: prontuário 20 anos, CF/88 art. 5º LXIV), cite a norma.",
    perguntaChave: "Qual o prazo pra CADA finalidade? Qual a base legal da retenção (norma específica)?",
    pegadinha: "\"Pelo tempo necessário\" sem prazo = retenção ilegal. ANPD exige prazo. Conservar dados além do prazo SEM nova base legal = infração.",
  },
  aviso_secao_6: {
    titulo: "Seção 6 — Como protegemos",
    artigo: "LGPD Art. 46 + Art. 6º VII (segurança)",
    oQueDiz: "Medidas técnicas e administrativas. Não revele segredos (não diga \"usamos AES-256 com chave X\"), mas mostre que existe controle: criptografia, controle de acesso, logs, treinamento, backup, plano de resposta a incidente.",
    perguntaChave: "Quais medidas existem? (Não invente — declare só o que existe; senão é descumprimento documentado)",
    pegadinha: "Declarar medida que não existe é PROVA contra você em incidente. \"Temos criptografia em repouso\" → ANPD pede e descobre que era senha em planilha Excel → multa agravada.",
  },
  aviso_secao_7: {
    titulo: "Seção 7 — Com quem compartilhamos",
    artigo: "LGPD Art. 9º I e Art. 39",
    oQueDiz: "Lista dos OPERADORES (terceirizados que tratam dados em seu nome) e dos CONTROLADORES PARCEIROS (outros órgãos com quem você compartilha). Alimentada pelo Gestão de Terceiros.",
    perguntaChave: "Quais terceiros recebem seus dados? Cada um precisa de cláusula LGPD no contrato + estar nesta seção.",
    pegadinha: "Listar empresa de TI que mantém o servidor sem contrato com cláusula LGPD = vazamento documentado. ANPD verifica.",
  },
  aviso_secao_8: {
    titulo: "Seção 8 — Transferência internacional",
    artigo: "LGPD Art. 33 a 36 + Res. CD/ANPD nº 19/2024",
    oQueDiz: "Se você usa serviços de nuvem (Google, AWS, Microsoft) com servidores fora do Brasil OU compartilha dados com órgão estrangeiro, isso é TRANSFERÊNCIA INTERNACIONAL. Precisa de base legal específica do Art. 33.",
    perguntaChave: "Há transferência pra fora do Brasil? Sob qual hipótese do Art. 33 (cooperação, adequação, contratual)?",
    pegadinha: "Usar Gmail institucional = transferência internacional pros EUA. Microsoft 365 = idem. Maioria das organizações usa sem perceber. Resolução 19/2024 endureceu — não basta dizer \"a empresa garante\".",
  },
  aviso_secao_9: {
    titulo: "Seção 9 — Cookies e rastreamento",
    artigo: "LGPD Art. 7º + Decisão CD/ANPD sobre Cookies",
    oQueDiz: "Se o portal usa cookies (analytics, marketing, preferências), declare. Banner de cookies + Política de Cookies dedicada se houver cookies não-essenciais.",
    perguntaChave: "O site usa quais cookies? Tem banner de consentimento? Cita aqui e linka pra Política de Cookies?",
    pegadinha: "Cookies essenciais (sessão, segurança) NÃO precisam de consentimento. Mas Google Analytics, Facebook Pixel, cookies de marketing PRECISAM. Coletar sem opt-in = infração.",
  },
  aviso_secao_10: {
    titulo: "Seção 10 — Decisões automatizadas",
    artigo: "LGPD Art. 20",
    oQueDiz: "Se você toma decisão automatizada que afeta o titular (concessão de benefício, classificação de risco, ranking), o titular tem direito a revisão. Declare quais decisões e como contestar.",
    perguntaChave: "Há algum sistema que decide sozinho sobre o cidadão? Como ele pode contestar?",
    pegadinha: "Tecnologias \"de pontuação\" ou \"de risco\" usadas em adm. pública entram aqui. Sem essa seção, decisão automatizada vira nula por descumprimento do Art. 20.",
  },
  aviso_secao_11: {
    titulo: "Seção 11 — Como exercer seus direitos",
    artigo: "LGPD Art. 18 (direitos do titular)",
    oQueDiz: "Canal funcional pra o titular exercer os 9 direitos do Art. 18. E-mail dedicado, formulário web, ou telefone. Prazo de resposta declarado (15 dias úteis).",
    perguntaChave: "Qual o canal? Funciona de verdade? Quem responde? Alimentada por DSR.",
    pegadinha: "Canal de DSR \"caixa-postal@orgao\" sem rotina de leitura = não-conformidade. ANPD audita: enviar pedido teste e medir o tempo de resposta.",
  },
  aviso_secao_12: {
    titulo: "Seção 12 — Atualizações deste Aviso",
    artigo: "LGPD Art. 9º + boas práticas",
    oQueDiz: "Data da última revisão. Onde o titular acompanha histórico de mudanças. Compromisso de revisão periódica (anual recomendado).",
    perguntaChave: "Quando este aviso foi revisado pela última vez? Quem revisou? Onde está o histórico?",
    pegadinha: "Aviso sem data de atualização = aviso \"esquecido\". Mudou base legal? Mudou operador? Mudou retenção? O aviso tem que refletir.",
  },

  // ============================================================================
  // Incidentes — campos do form
  // ============================================================================
  incidente_severidade: {
    titulo: "Como classificar a severidade",
    artigo: "Res. CD/ANPD nº 15/2024",
    oQueDiz: "Severidade combina TIPO DE DADO afetado × VOLUME × REVERSIBILIDADE × EXPOSIÇÃO. Define se há \"risco relevante\" — gatilho da comunicação obrigatória à ANPD.",
    perguntaChave: "Há dado sensível? Há menores? Volume grande? Dado exposto pública/irreversivelmente? SIM em 2+ → CRÍTICA. SIM em 1 → ALTA. Nenhum mas houve incidente → MÉDIA. Quase-incidente contido → BAIXA.",
    pegadinha: "Subestimar severidade pra evitar comunicação = ocultação. Se o incidente vazar e a ANPD descobrir que você minimizou, multa agravada. Conservadoramente, classifique \"pra cima\" — se for menor, ANPD reclassifica sem punir.",
    exemplos: [
      "Pendrive com 2.300 prontuários médicos perdido = ALTA (sensível + alto volume + irreversibilidade)",
      "E-mail enviado com cópia em CCO em vez de CCB pra 1.000 cidadãos = ALTA (exposição pública)",
      "Tentativa de invasão bloqueada pelo firewall = BAIXA (contido, sem dados afetados)",
    ],
  },
  incidente_72h_anpd: {
    titulo: "Comunicação à ANPD em 72h",
    artigo: "LGPD Art. 48 + Res. CD/ANPD nº 15/2024",
    oQueDiz: "Se o incidente puder causar \"risco ou dano relevante\" aos titulares, comunique à ANPD em até 3 DIAS ÚTEIS (Res. 15/2024) a partir da CIÊNCIA pelo controlador. Comunique também aos titulares afetados.",
    perguntaChave: "O incidente foi detectado quando? 72 horas úteis a partir da detecção. Há risco aos titulares? Use o Formulário Inline da Comunicação ANPD.",
    pegadinha: "O prazo conta da DETECÇÃO, não da OCORRÊNCIA. Se aconteceu há 6 meses mas vocês acabaram de descobrir, o relógio começa AGORA. Mas omissão é agravante — então documente a descoberta.",
    linkAnpd: {
      texto: "Res. ANPD nº 15/2024 — Comunicação de Incidentes",
      url: "https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-resolucao-comunicacao-incidentes",
    },
  },
  incidente_comunicado_titular: {
    titulo: "Comunicação aos titulares afetados",
    artigo: "LGPD Art. 48 §1º",
    oQueDiz: "Quando o incidente causar risco aos titulares, eles têm que ser comunicados PESSOAL E DIRETAMENTE (não basta nota no site). E-mail, SMS, carta. Conteúdo: o que aconteceu, dados afetados, medidas tomadas, contato pra dúvidas.",
    perguntaChave: "Quem foi afetado? Como você vai contatar? Use o Formulário Inline da Carta aos Titulares pra montar o texto.",
    pegadinha: "Comunicação aos titulares NÃO é só transparência — é obrigação legal. Sem ela, o titular não consegue tomar medidas (trocar senha, monitorar conta, etc.) e a responsabilidade do controlador cresce.",
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
