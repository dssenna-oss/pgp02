// Cartilha do PGP — conteúdo institucional que NÃO depende do trabalho de
// nenhum grupo do curso. Pra qualquer Instituição Pública usar como base
// de implementação da LGPD.
//
// Estrutura é só DADOS (textos longos). A engine `lib/caderno-curso.ts`
// chama essas constantes na função `gerarCartilhaInstitucional()`.
//
// Capítulos:
//   A. Carta de Serviços como base do Inventário
//   B. Modelos de documentos adicionais (Política PGP, Comunicação ANPD,
//      Cláusulas LGPD, Política de Retenção, Termo de Consentimento)
//   C. Armadilhas comuns (10 pegadinhas com explicação)
//   D. Glossário LGPD essencial
//   E. Base legal — guia decisivo
//   F. Adaptação por porte do órgão
//   G. Calendário recomendado de revisões
//   H. Checklist final do PGP (25 perguntas)
//   I. FAQ — perguntas frequentes do curso
//   J. Referências externas curadas
//   K. Roteiros de implementação por prazo

// =============================================================================
// A — CARTA DE SERVIÇOS COMO BASE DO INVENTÁRIO
// =============================================================================

export const CONTEUDO_A_CARTA_SERVICOS = {
  titulo: "A Carta de Serviços como fonte de descoberta de processos",
  paragrafos: [
    "Uma das maiores dificuldades das Instituições no início do PGP é a pergunta: \"por onde começar o Inventário?\". A resposta mais pragmática e eficiente está num documento que TODO órgão público brasileiro é obrigado a manter pela Lei nº 13.460/2017 (Código de Defesa do Usuário do Serviço Público): a Carta de Serviços.",
    "A Carta de Serviços lista TODOS os serviços que o órgão presta ao cidadão — e cada serviço prestado envolve, quase invariavelmente, tratamento de dados pessoais por trás. Usá-la como ponto de partida do Inventário garante cobertura abrangente sem reinventar a roda.",
  ],
  metodo: {
    titulo: "Método prático em 5 passos",
    passos: [
      "Localizar a Carta de Serviços vigente — geralmente publicada no portal institucional ou na intranet. Se não houver, é tarefa anterior do órgão (obrigação legal antes mesmo da LGPD).",
      "Listar todos os serviços oferecidos — atendimento ao cidadão, ouvidoria, programas sociais, alvarás, tributos, saúde, educação, cultura, etc. Para órgão pequeno, costuma haver 20-40 serviços; para órgãos médios, 80-150.",
      "Para cada serviço, fazer 6 perguntas: (1) quais dados pessoais são coletados? (2) de quem? (cidadão? servidor? terceiro?) (3) com que finalidade? (4) base legal? (5) quanto tempo guardamos? (6) com quem compartilhamos?",
      "Cada serviço onde houver tratamento de dados vira potencialmente UM processo no Inventário. Serviços muito similares (ex: vários alvarás com o mesmo fluxo) podem virar 1 processo único.",
      "Priorizar os processos identificados aplicando a Matriz da Resolução CD/ANPD nº 2/2022 (volume, sensibilidade, vulneráveis, exposição, tecnologias, compartilhamentos). Começar pelos de maior pontuação.",
    ],
  },
  exemplos: [
    {
      servicoCarta: "Atendimento na Unidade Básica de Saúde",
      processoInventario: "Atendimento médico ambulatorial — Posto de Saúde",
      dadosTipicos: "Cadastrais (nome, CPF, endereço) + dados sensíveis de saúde (anamnese, prescrições, exames, prontuário eletrônico)",
      baseLegalSugerida: "Art. 7º III + Art. 11 II 'a' (execução de políticas públicas + tutela da saúde)",
    },
    {
      servicoCarta: "Inscrição em programa social de transferência de renda",
      processoInventario: "Gestão do programa de auxílio social municipal",
      dadosTipicos: "Cadastrais + composição familiar + renda + crianças e adolescentes (vulneráveis)",
      baseLegalSugerida: "Art. 7º III + Art. 14 (proteção da criança e adolescente)",
    },
    {
      servicoCarta: "Manifestação na Ouvidoria",
      processoInventario: "Atendimento ao Cidadão — Ouvidoria",
      dadosTipicos: "Cadastrais + conteúdo da manifestação (eventualmente dados sensíveis)",
      baseLegalSugerida: "Art. 7º II (Lei nº 13.460/2017)",
    },
  ],
  dicaFinal:
    "No app principal (lgpd-pgp), há recurso \"Sugerir processos da Carta\" que extrai automaticamente os serviços da página da Carta de Serviços do órgão e propõe processos pré-rascunhados pra revisão. Mesmo sem essa automação, o método manual leva 1-2 dias de trabalho e gera Inventário muito mais completo que partir do zero.",
};

// =============================================================================
// B — MODELOS DE DOCUMENTOS ADICIONAIS
// =============================================================================

export const CONTEUDO_B_MODELO_POLITICA_PGP = {
  titulo: "Modelo — Política do Programa de Governança em Privacidade",
  intro:
    "Documento mater do PGP. Aprovado por ato formal do dirigente máximo do órgão. Cita os demais instrumentos (Inventário, Riscos, GAP, Plano, RIPDs, Operadores, DSR, Aviso, PRI) como anexos vinculados.",
  secoes: [
    {
      titulo: "1. Objetivo",
      texto:
        "Esta Política estabelece o Programa de Governança em Privacidade (PGP) de [NOME DA INSTITUIÇÃO], em cumprimento à Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD), regulamentando o tratamento de dados pessoais no âmbito de suas atividades.",
    },
    {
      titulo: "2. Abrangência",
      texto:
        "Aplica-se a todas as unidades, servidores, estagiários, terceirizados e demais agentes que, no exercício de funções vinculadas a [NOME DA INSTITUIÇÃO], realizem tratamento de dados pessoais — sob qualquer forma (digital ou física), sob qualquer base legal.",
    },
    {
      titulo: "3. Princípios",
      texto:
        "O tratamento de dados pessoais observa os princípios do Art. 6º da LGPD: finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação e responsabilização. Esses princípios são parâmetros obrigatórios pra todas as decisões operacionais.",
    },
    {
      titulo: "4. Governança",
      texto:
        "O PGP é conduzido pelo Encarregado pelo Tratamento de Dados Pessoais (DPO), designado por ato formal (Art. 41 LGPD), com apoio do Comitê de Privacidade — instância multidisciplinar com representantes das áreas de TI, Jurídico, Comunicação, RH e áreas de negócio. O Comitê reúne-se [PERIODICIDADE] e delibera sobre decisões estratégicas.",
    },
    {
      titulo: "5. Instrumentos do PGP",
      texto:
        "Integram o PGP, como anexos vinculados, os seguintes instrumentos: (a) Inventário de Tratamentos de Dados Pessoais; (b) Análise de Riscos de Privacidade; (c) Análise de Conformidade (GAP); (d) Plano de Ação; (e) Relatórios de Impacto à Proteção de Dados (RIPD) dos processos de alto risco; (f) Cadastro de Operadores com cláusulas LGPD; (g) Canal e procedimento de exercício de Direitos do Titular (DSR); (h) Aviso de Privacidade público; (i) Plano de Resposta a Incidentes (PRI). Esses instrumentos são revisados [PERIODICIDADE].",
    },
    {
      titulo: "6. Responsabilidades",
      texto:
        "(a) Dirigente máximo: aprova o PGP, garante recursos, responde por sanções (Art. 52 LGPD); (b) Encarregado: conduz operacionalmente, aceita reclamações, comunica-se com ANPD e titulares; (c) Comitê: delibera estrategicamente; (d) Gestores de área: aplicam as orientações nas operações; (e) Servidores: cumprem as políticas, reportam incidentes; (f) Operadores: cumprem as cláusulas LGPD dos contratos.",
    },
    {
      titulo: "7. Revisão e atualização",
      texto:
        "Esta Política é revisada [PERIODICIDADE — recomendado anualmente] ou antes, caso haja: (a) alteração legislativa; (b) decisão da ANPD com efeito sobre o PGP; (c) incidente de severidade ALTA ou CRÍTICA; (d) reorganização institucional relevante.",
    },
    {
      titulo: "8. Vigência",
      texto:
        "Esta Política entra em vigor na data de sua publicação no diário oficial e revoga disposições em contrário.",
    },
  ],
};

export const CONTEUDO_B_COMUNICACAO_ANPD = {
  titulo: "Modelo — Comunicação de Incidente à ANPD",
  intro:
    "Modelo de comunicação à Autoridade Nacional de Proteção de Dados (ANPD) em caso de incidente de segurança com dados pessoais, conforme Art. 48 da LGPD e Resolução CD/ANPD nº 15/2024. Prazo: até 3 dias úteis após o conhecimento do incidente.",
  campos: [
    "Identificação do controlador: nome, CNPJ, endereço, dados do Encarregado",
    "Data e horário em que o incidente ocorreu (se conhecido) e em que foi detectado",
    "Descrição da natureza dos dados pessoais afetados",
    "Categorias e número aproximado de titulares afetados",
    "Indicação das medidas técnicas e de segurança utilizadas",
    "Riscos relacionados ao incidente",
    "Medidas adotadas para mitigar os efeitos",
    "Indicação do motivo do atraso, caso a comunicação não tenha sido imediata",
    "Identificação do responsável pela comunicação",
  ],
  rodape:
    "A comunicação é feita pelo portal da ANPD (gov.br/anpd → Comunicações à Autoridade). Para incidentes de severidade ALTA ou CRÍTICA, comunicar TAMBÉM aos titulares afetados em até 7 dias úteis (modelo de comunicação ao titular vem como anexo).",
};

export const CONTEUDO_B_CLAUSULAS_LGPD = {
  titulo: "Modelo — Cláusulas LGPD para contratos com operadores",
  intro:
    "Cláusulas mínimas obrigatórias (Art. 39 LGPD) para inclusão em contratos com terceiros que tratam dados pessoais em nome da Instituição (operadores). Para contratos vigentes celebrados antes de 2020, promover aditamento. Para contratos novos, incluir desde a redação.",
  clausulas: [
    {
      titulo: "Cláusula 1 — Objeto do tratamento",
      texto:
        "O OPERADOR realizará tratamento de dados pessoais exclusivamente para os fins descritos no objeto principal deste contrato, ficando vedado qualquer tratamento estranho a esse escopo, salvo expressa autorização prévia e por escrito da CONTRATANTE.",
    },
    {
      titulo: "Cláusula 2 — Segurança e confidencialidade",
      texto:
        "O OPERADOR adotará medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, perdas acidentais, alterações indevidas ou divulgação inadequada, em conformidade com os Arts. 46 a 49 da LGPD.",
    },
    {
      titulo: "Cláusula 3 — Comunicação de incidentes",
      texto:
        "O OPERADOR comunicará à CONTRATANTE, imediatamente após o conhecimento e em prazo não superior a 24 (vinte e quatro) horas, qualquer incidente de segurança envolvendo dados pessoais sob seu tratamento, fornecendo as informações necessárias para subsidiar a comunicação à ANPD e aos titulares afetados.",
    },
    {
      titulo: "Cláusula 4 — Subcontratação",
      texto:
        "O OPERADOR não subcontratará terceiros para o tratamento dos dados pessoais sem prévia autorização escrita da CONTRATANTE. Em caso de autorização, o sub-operador assumirá as mesmas obrigações deste contrato por meio de instrumento escrito.",
    },
    {
      titulo: "Cláusula 5 — Direitos dos titulares",
      texto:
        "O OPERADOR auxiliará a CONTRATANTE no atendimento das solicitações dos titulares de dados (Art. 18 LGPD), em prazo não superior a 5 (cinco) dias úteis a contar da requisição.",
    },
    {
      titulo: "Cláusula 6 — Retenção e devolução/destruição",
      texto:
        "Encerrada a relação contratual, o OPERADOR devolverá à CONTRATANTE ou destruirá, conforme orientação desta, todos os dados pessoais sob seu tratamento, em prazo não superior a 30 (trinta) dias, salvo determinação legal em contrário.",
    },
    {
      titulo: "Cláusula 7 — Auditoria",
      texto:
        "A CONTRATANTE poderá, mediante aviso prévio de 15 dias úteis, realizar auditoria das medidas de segurança implementadas pelo OPERADOR, diretamente ou por terceiro independente.",
    },
    {
      titulo: "Cláusula 8 — Responsabilidade",
      texto:
        "O OPERADOR responde civilmente pelos danos decorrentes do descumprimento das obrigações deste contrato, nos termos do Art. 42 da LGPD, sem prejuízo das sanções administrativas e judiciais cabíveis.",
    },
  ],
};

export const CONTEUDO_B_POLITICA_RETENCAO = {
  titulo: "Modelo — Política de Retenção e Descarte de Dados Pessoais",
  intro:
    "A LGPD exige (Art. 16) que os dados pessoais sejam eliminados após o término do tratamento, salvo hipóteses específicas. Esta política define prazos por categoria de dado e procedimento de descarte seguro.",
  conteudo: [
    "1. PRINCÍPIO GERAL — Os dados pessoais não devem ser mantidos por tempo superior ao necessário para o cumprimento da finalidade. Findo o tratamento, eliminar, anonimizar ou justificar a retenção em hipótese legal específica.",
    "2. HIPÓTESES QUE AUTORIZAM RETENÇÃO (Art. 16 LGPD) — (a) cumprimento de obrigação legal ou regulatória; (b) estudo por órgão de pesquisa (com anonimização sempre que possível); (c) transferência a terceiro respeitada a Lei; (d) uso exclusivo do controlador, com anonimização.",
    "3. PRAZOS POR CATEGORIA (parâmetros típicos do setor público):",
    "   • Dados de servidores ativos — durante o vínculo + prazo previdenciário (até 75 anos para fins de aposentadoria/pensão).",
    "   • Dados de servidores inativos / pensionistas — durante o pagamento de benefícios + prazos previdenciários aplicáveis.",
    "   • Dados de candidatos não selecionados em concursos / seleções — 1 ano após o término da validade do edital.",
    "   • Atendimento ao cidadão / Ouvidoria — 5 anos após o encerramento (prazo prescricional padrão).",
    "   • Dados de saúde (prontuários) — 20 anos da última consulta (CFM Resolução 1.821/2007 e correlatas).",
    "   • Dados fiscais / tributários — prazos da legislação tributária (geralmente 5 anos).",
    "   • Logs de acesso a sistemas — 6 meses a 5 anos conforme criticidade do sistema.",
    "   • Imagens de CFTV — 30 a 90 dias, salvo investigação em curso.",
    "   • Dados de licitantes não vencedores — 5 anos após o encerramento do certame (legislação licitatória).",
    "4. PROCEDIMENTO DE DESCARTE — Documental: fragmentação ou incineração com registro. Digital: exclusão lógica + sobrescrita ou descarte físico do meio. Em todos os casos, lavrar termo de descarte com data, responsável e categoria descartada.",
    "5. ANONIMIZAÇÃO COMO ALTERNATIVA — Quando viável, anonimizar em vez de descartar (Art. 12 LGPD) — dado anonimizado sai do escopo da LGPD. Anonimização precisa ser irreversível (não basta pseudonimização).",
    "6. REVISÃO ANUAL — Esta política é revisada anualmente, especialmente pra adequar prazos a alterações legislativas e novos sistemas implantados.",
  ],
};

export const CONTEUDO_B_TERMO_CONSENTIMENTO = {
  titulo: "Modelo — Termo de Consentimento do Titular",
  intro:
    "Modelo a usar nos casos específicos em que a base legal apropriada é o consentimento (Art. 7º I ou Art. 11 I LGPD). Importante: no Setor Público, consentimento é base legal EXCEPCIONAL — a regra é Art. 7º II (obrigação legal) ou Art. 7º III (execução de políticas públicas). Use consentimento APENAS quando o tratamento for facultativo do ponto de vista do cidadão (ex: cadastro voluntário em newsletter, autorização para uso de imagem em material promocional).",
  campos: [
    "[NOME DA INSTITUIÇÃO], inscrita no CNPJ sob nº [XXX], com sede em [ENDEREÇO], na qualidade de Controlador (Art. 5º VI LGPD), solicita o consentimento de [NOME DO TITULAR] para o tratamento dos seguintes dados pessoais:",
    "DADOS TRATADOS: [lista específica — ex: nome, e-mail, telefone, imagem]",
    "FINALIDADE: [específica — ex: envio de informativo institucional sobre eventos culturais]",
    "PRAZO DE RETENÇÃO: [específico — ex: até que o titular solicite descadastro]",
    "COMPARTILHAMENTOS: [se houver — ex: nenhum / com a empresa contratada para hospedagem do mailing]",
    "DIREITOS DO TITULAR: o titular pode, a qualquer tempo, revogar este consentimento e exercer os direitos do Art. 18 da LGPD (acesso, correção, anonimização, eliminação, portabilidade, oposição, informações sobre compartilhamento), pelo canal: [E-MAIL DO ENCARREGADO].",
    "DECLARAÇÃO: declaro ter sido informado(a) sobre o tratamento dos meus dados pessoais e concordo livremente, de forma específica e inequívoca (Art. 5º XII LGPD), com o tratamento descrito acima.",
    "Local, data: ____________________________",
    "Assinatura do(a) titular: ____________________________",
  ],
  alerta:
    "ATENÇÃO: NÃO usar consentimento para tratamento obrigatório de cadastro de cidadão atendido por serviço público — nesse caso a base legal correta é o Art. 7º II ou III. Consentimento exige possibilidade REAL de recusa sem prejuízo do atendimento. Consentimento marcado por padrão (opt-out) é inválido (Art. 8º).",
};

// =============================================================================
// C — ARMADILHAS COMUNS (10 pegadinhas)
// =============================================================================
// Reusa PEGADINHAS_PROCESSOS (4) + CATALOGO_ERROS_PLANTADOS (6).
// A engine compõe a partir dos catálogos existentes; aqui só damos a INTRO
// pedagógica da seção.

export const CONTEUDO_C_INTRO_PEGADINHAS = {
  titulo: "Armadilhas comuns no setor público",
  paragrafos: [
    "Determinadas práticas de tratamento de dados pessoais aparecem com frequência nos órgãos públicos brasileiros — algumas por inércia (\"sempre foi assim\"), outras por interpretação incorreta da Lei, outras por excesso de zelo na direção errada. Este capítulo reúne 10 armadilhas observadas em múltiplas Instituições, com explicação do erro, base legal aplicável e como evitar.",
    "Use este capítulo durante a revisão do Inventário e do Aviso de Privacidade. Para cada processo / cada seção do Aviso, perguntar: \"caímos em alguma dessas?\" — exercício rápido que pega muitos problemas que escapam ao olhar técnico.",
    "As 4 primeiras armadilhas envolvem CONFIGURAÇÕES DE PROCESSOS (saúde, RH, comunicação, ouvidoria). As 6 últimas envolvem CONFIGURAÇÕES DO AVISO DE PRIVACIDADE — texto que vai ao cidadão.",
  ],
  fechamento:
    "Nenhuma destas armadilhas é \"erro de gestor mal-intencionado\" — todas são erros humanos comuns que aparecem porque a LGPD ainda é Lei nova, com pouca jurisprudência consolidada, e o setor público tem cultura própria muito enraizada. Por isso a revisão estruturada importa: o erro escapa do olhar técnico individual, mas não escapa do checklist coletivo.",
};

// =============================================================================
// D — GLOSSÁRIO LGPD ESSENCIAL
// =============================================================================

export const CONTEUDO_D_GLOSSARIO: Array<{ termo: string; definicao: string; artigo?: string }> = [
  { termo: "Dado pessoal", definicao: "Informação relacionada a pessoa natural identificada ou identificável. Inclui nome, CPF, e-mail, foto, geolocalização, IP — qualquer dado que possa identificar uma pessoa direta ou indiretamente.", artigo: "Art. 5º I" },
  { termo: "Dado pessoal sensível", definicao: "Dado sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou organização de caráter religioso/filosófico/político, dado de saúde, dado da vida sexual, dado genético ou biométrico, quando vinculado a pessoa natural.", artigo: "Art. 5º II" },
  { termo: "Dado anonimizado", definicao: "Dado relativo a titular que NÃO possa ser identificado, considerando a utilização de meios técnicos razoáveis e disponíveis na ocasião do tratamento. Sai do escopo da LGPD.", artigo: "Art. 5º III · Art. 12" },
  { termo: "Banco de dados", definicao: "Conjunto estruturado de dados pessoais, estabelecido em um ou mais locais, em suporte eletrônico ou físico.", artigo: "Art. 5º IV" },
  { termo: "Titular", definicao: "Pessoa natural a quem se referem os dados pessoais objeto de tratamento.", artigo: "Art. 5º V" },
  { termo: "Controlador", definicao: "Pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais. No setor público, é o próprio órgão (ex: Prefeitura, Câmara, Tribunal, Autarquia).", artigo: "Art. 5º VI" },
  { termo: "Operador", definicao: "Pessoa natural ou jurídica que realiza o tratamento de dados pessoais em nome do controlador. Ex: empresa contratada pra hospedar o sistema de prontuários, processadora da folha de pagamento.", artigo: "Art. 5º VII" },
  { termo: "Encarregado (DPO)", definicao: "Pessoa indicada pelo controlador para atuar como canal de comunicação entre o controlador, os titulares e a Autoridade Nacional (ANPD).", artigo: "Art. 5º VIII · Art. 41" },
  { termo: "Tratamento", definicao: "Toda operação realizada com dados pessoais: coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, modificação, comunicação, transferência, difusão ou extração.", artigo: "Art. 5º X" },
  { termo: "Anonimização", definicao: "Utilização de meios técnicos razoáveis e disponíveis no momento do tratamento, por meio dos quais um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo. DIFERENTE de pseudonimização (que mantém a possibilidade de reidentificação).", artigo: "Art. 5º XI" },
  { termo: "Consentimento", definicao: "Manifestação LIVRE, INFORMADA e INEQUÍVOCA pela qual o titular concorda com o tratamento de seus dados pessoais para uma finalidade determinada. Caixa pré-marcada NÃO é consentimento válido.", artigo: "Art. 5º XII · Art. 8º" },
  { termo: "Base legal (hipótese de tratamento)", definicao: "Fundamento jurídico que autoriza o tratamento. Pra dados comuns são 10 hipóteses (Art. 7º); pra dados sensíveis são 8 hipóteses mais restritivas (Art. 11). Toda atividade de tratamento precisa de UMA base legal documentada.", artigo: "Art. 7º · Art. 11" },
  { termo: "Finalidade", definicao: "Princípio do tratamento. Os dados só podem ser tratados pra propósitos legítimos, específicos, explícitos e informados ao titular — sem possibilidade de tratamento posterior incompatível.", artigo: "Art. 6º I" },
  { termo: "Necessidade", definicao: "Princípio do tratamento. Limitação ao mínimo necessário pra atingir a finalidade — dados pertinentes, proporcionais e não excessivos.", artigo: "Art. 6º III" },
  { termo: "Transparência", definicao: "Princípio do tratamento. Garantia ao titular de informações claras, precisas e facilmente acessíveis sobre o tratamento e seus respectivos agentes.", artigo: "Art. 6º VI" },
  { termo: "Direitos do Titular (DSR)", definicao: "Conjunto de direitos garantidos ao titular: confirmação de tratamento, acesso, correção, anonimização/bloqueio/eliminação, portabilidade, informação sobre compartilhamento, revogação de consentimento. Atendimento em 15 dias úteis.", artigo: "Art. 18 · Art. 19 II" },
  { termo: "Incidente de segurança", definicao: "Qualquer evento adverso confirmado, relacionado à violação na segurança de dados pessoais — acesso não autorizado, perda, alteração, eliminação, comunicação ou difusão indevida. Comunicar à ANPD em até 3 dias úteis; aos titulares afetados em até 7 dias úteis.", artigo: "Art. 48 · Res. CD/ANPD 15/2024" },
  { termo: "RIPD (Relatório de Impacto)", definicao: "Documento que descreve o tratamento de dados pessoais que pode gerar riscos às liberdades civis e direitos fundamentais. Obrigatório pra tratamentos de alto risco (dados sensíveis, larga escala, decisões automatizadas, vigilância sistemática).", artigo: "Art. 5º XVII · Art. 38" },
  { termo: "ANPD (Autoridade Nacional)", definicao: "Autoridade Nacional de Proteção de Dados — órgão da Administração Pública federal responsável por zelar pela proteção de dados pessoais, fiscalizar o cumprimento da LGPD, aplicar sanções.", artigo: "Art. 55-A" },
  { termo: "Comitê de Privacidade", definicao: "Instância multidisciplinar interna do órgão (TI, Jurídico, Comunicação, RH, áreas de negócio) que apoia o Encarregado nas decisões estratégicas do PGP. Recomendado em todos os órgãos médios e grandes.", artigo: "Boas práticas + Res. 18/2024" },
  { termo: "Privacy by Design / Default", definicao: "Princípio segundo o qual a proteção de dados deve ser considerada DESDE A CONCEPÇÃO de qualquer novo sistema, processo ou serviço — e configurada por padrão. Princípio refletido no Art. 46.", artigo: "Art. 46" },
  { termo: "Programa de Governança em Privacidade (PGP)", definicao: "Conjunto integrado de instrumentos institucionais (Inventário, Riscos, GAP, Plano, RIPDs, Operadores, DSR, Aviso, PRI) que organizam a conformidade da Instituição à LGPD. Aprovado por ato formal do dirigente máximo.", artigo: "Art. 50" },
  { termo: "PRI (Plano de Resposta a Incidentes)", definicao: "Documento institucional que define equipe responsável, fluxo de decisão, matriz RACI por etapa NIST (Detectar, Conter, Erradicar, Recuperar, Lições) e modelos de comunicação pra resposta a incidentes de segurança com dados pessoais.", artigo: "Art. 46 + Art. 48" },
  { termo: "Aviso de Privacidade", definicao: "Documento público (no portal externo da Instituição) que informa ao titular como seus dados são tratados — finalidades, bases legais, retenção, compartilhamentos, canal de exercício de direitos.", artigo: "Art. 9º" },
  { termo: "Inventário de Tratamentos", definicao: "Registro estruturado de TODOS os processos de tratamento de dados pessoais da Instituição — finalidade, base legal, tipos de dados, retenção, compartilhamentos, medidas de segurança por processo.", artigo: "Art. 37" },
  { termo: "Tratamento por órgão público", definicao: "Tratamento realizado por pessoa jurídica de direito público em decorrência de competência legal ou execução de políticas públicas. Tem regime parcialmente próprio — Capítulo IV da LGPD (Arts. 23-32).", artigo: "Cap. IV (Art. 23-32)" },
  { termo: "Compartilhamento de dados (setor público)", definicao: "Uso compartilhado de dados pessoais por órgão público com outros órgãos ou pessoas jurídicas. Permitido se houver finalidade específica, execução de políticas públicas e atribuições legais — sempre informado ao titular.", artigo: "Art. 26" },
  { termo: "Transferência internacional", definicao: "Transferência de dados pessoais para país estrangeiro. Permitida apenas em hipóteses específicas: adequação reconhecida pela ANPD, garantias contratuais, normas corporativas globais, consentimento específico, cumprimento de obrigação legal, execução de política pública, defesa em processo, proteção da vida do titular.", artigo: "Art. 33 · Res. CD/ANPD 20/2024" },
  { termo: "Sanção administrativa", definicao: "Penalidades aplicadas pela ANPD em caso de descumprimento: advertência, publicização da infração, multa de até 2% do faturamento (limitada a R$ 50 milhões por infração), bloqueio ou eliminação dos dados, suspensão parcial ou total das atividades.", artigo: "Art. 52 · Res. CD/ANPD 4/2023" },
  { termo: "Vulneráveis (dados de)", definicao: "Crianças, adolescentes, idosos e demais grupos em situação de vulnerabilidade. Tratamento exige cuidados específicos: dados de crianças/adolescentes só com consentimento de um dos pais ou responsável legal; melhor interesse da criança como princípio.", artigo: "Art. 14" },
];

// =============================================================================
// E — BASE LEGAL — GUIA DECISIVO
// =============================================================================

export const CONTEUDO_E_BASE_LEGAL = {
  titulo: "Base legal — guia decisivo para o Setor Público",
  intro: [
    "Toda atividade de tratamento de dados precisa de uma base legal documentada. A LGPD oferece 10 hipóteses para dados comuns (Art. 7º) e 8 hipóteses mais restritivas para dados sensíveis (Art. 11). No setor público, NEM TODAS são utilizáveis ou recomendadas — algumas são típicas do setor privado.",
    "Use o fluxograma abaixo pra decidir a base legal apropriada pra cada processo no Inventário. Quando há múltiplas opções aplicáveis, escolher a mais específica e estável (cumprimento de obrigação legal > execução de política pública > legítimo interesse).",
  ],
  fluxograma: {
    titulo: "Fluxograma de decisão",
    perguntas: [
      {
        pergunta: "1. O tratamento envolve dados pessoais SENSÍVEIS (saúde, opinião política, religião, biometria, etc.)?",
        sim: "Vai pro Art. 11. Base mais comum no setor público: Art. 11 II 'a' (cumprimento de obrigação legal pelo controlador) OU Art. 11 II 'b' (tratamento compartilhado de dados necessários à execução de políticas públicas previstas em leis e regulamentos) OU Art. 11 II 'f' (tutela da saúde, exclusivamente em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária).",
        nao: "Vai pro Art. 7º (próxima pergunta).",
      },
      {
        pergunta: "2. O tratamento decorre de OBRIGAÇÃO LEGAL ou REGULAMENTAR específica (ex: registrar contribuição previdenciária, manter livro fiscal, processar folha de pagamento)?",
        sim: "Base legal: Art. 7º II (cumprimento de obrigação legal ou regulatória). É a base MAIS estável — citar a lei específica que obriga (ex: Lei nº 8.112/90 art. X, Lei nº 8.666/93 art. Y, etc.).",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "3. O tratamento é necessário pra EXECUTAR UMA POLÍTICA PÚBLICA prevista em lei, regulamento ou contrato (ex: atender em UBS, oferecer programa social, fiscalizar atividade econômica)?",
        sim: "Base legal: Art. 7º III (tratamento e uso compartilhado de dados necessários à execução de políticas públicas previstas em leis e regulamentos ou respaldadas em contratos, convênios ou instrumentos congêneres). É a base TÍPICA do setor público pra serviços ao cidadão.",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "4. O tratamento é necessário pra EXECUÇÃO DE CONTRATO ou DE PROCEDIMENTOS PRELIMINARES a contrato em que o titular seja parte (ex: licitação, contratação direta)?",
        sim: "Base legal: Art. 7º V (execução de contrato ou procedimentos preliminares relacionados).",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "5. É indispensável pra PROTEGER A VIDA OU INCOLUMIDADE FÍSICA do titular ou de terceiro (ex: atendimento de urgência, comunicação a familiares em risco)?",
        sim: "Base legal: Art. 7º IV (proteção da vida ou incolumidade física). Excepcional — usar quando houver risco imediato.",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "6. É pra EXERCÍCIO REGULAR DE DIREITOS em processo judicial, administrativo ou arbitral (ex: prova em ação judicial)?",
        sim: "Base legal: Art. 7º VI (exercício regular de direitos em processo judicial, administrativo ou arbitral).",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "7. É necessário pra atender LEGÍTIMOS INTERESSES do controlador ou de terceiro?",
        sim: "Base legal: Art. 7º IX (legítimo interesse). CUIDADO: no setor público é uso EXCEPCIONAL. Exige teste de balanceamento documentado (LIA — Legitimate Interest Assessment). Não substitui base mais específica quando esta existir.",
        nao: "Próxima pergunta.",
      },
      {
        pergunta: "8. O tratamento é FACULTATIVO do ponto de vista do cidadão (ele pode escolher se quer ou não, sem prejuízo do serviço público principal)?",
        sim: "Base legal: Art. 7º I (consentimento). É a base MAIS FRÁGIL — pode ser revogada a qualquer momento. Usar apenas em tratamentos genuinamente facultativos (newsletter voluntária, autorização de imagem em material promocional).",
        nao: "Reavaliar — provavelmente cabe Art. 7º II ou III. Não há tratamento sem base legal.",
      },
    ],
  },
  erros: {
    titulo: "Erros comuns de classificação",
    lista: [
      "❌ Usar consentimento pra atendimento OBRIGATÓRIO de cidadão (ex: ficha cadastral pra ser atendido na UBS). O cidadão não pode escolher — então não é consentimento. Base correta: Art. 7º III + Art. 11 II 'f' (saúde).",
      "❌ Usar interesse legítimo no setor público sem teste de balanceamento. Interesse legítimo exige documentação demonstrando que a finalidade legítima do controlador supera os direitos do titular naquele contexto.",
      "❌ Pular Art. 11 quando há dados sensíveis. Mesmo que haja base no Art. 7º, dados sensíveis exigem base ADICIONAL do Art. 11.",
      "❌ Generalizar uma só base pra todo o órgão. Cada processo do Inventário deve ter base ESPECÍFICA — não basta dizer \"obrigação legal\" sem citar a lei.",
    ],
  },
  dica:
    "REGRA DE OURO: começar sempre pelo Art. 7º II (obrigação legal específica) ou Art. 7º III (política pública). Essas duas bases cobrem 80-90% dos tratamentos típicos do setor público. Consentimento e legítimo interesse só pra casos genuinamente facultativos ou excepcionais.",
};

// =============================================================================
// G — CALENDÁRIO RECOMENDADO DE REVISÕES
// =============================================================================

export const CONTEUDO_G_CALENDARIO: Array<{
  instrumento: string;
  periodicidade: string;
  porQue: string;
  alemDisso: string;
}> = [
  {
    instrumento: "Inventário de Tratamentos",
    periodicidade: "Anual + atualização contínua",
    porQue: "Processos novos, sistemas trocados, áreas reorganizadas — sem atualização contínua, o Inventário envelhece rápido.",
    alemDisso: "Cada novo sistema/processo deve entrar no Inventário ANTES do início do tratamento (privacy by design).",
  },
  {
    instrumento: "Análise de Riscos",
    periodicidade: "Anual + após incidente significativo",
    porQue: "Riscos mudam com tecnologia, terceiros e contexto. Após incidente, reavaliar a probabilidade dos riscos correlatos.",
    alemDisso: "Mudanças significativas nos processos do Inventário disparam reavaliação de riscos associados.",
  },
  {
    instrumento: "GAP Analysis",
    periodicidade: "Anual",
    porQue: "Conformidade é alvo móvel — novas resoluções ANPD, decisões judiciais, jurisprudência. Repetir o GAP mostra evolução.",
    alemDisso: "Cada 'NÃO ADERENTE' deve gerar ação no Plano com responsável e prazo. Sem ação, lacuna persiste indefinidamente.",
  },
  {
    instrumento: "Plano de Ação",
    periodicidade: "Mensal (acompanhamento) + revisão trimestral",
    porQue: "Plano sem acompanhamento vira papel. Reuniões mensais do Comitê pra acompanhar status; trimestrais pra repriorizar.",
    alemDisso: "Ações concluídas devem ser arquivadas, não excluídas — histórico institucional.",
  },
  {
    instrumento: "RIPDs",
    periodicidade: "Anual + após mudança significativa no processo",
    porQue: "Novo sistema, novo operador, alteração legislativa — exigem reavaliação do impacto.",
    alemDisso: "RIPD desatualizado é problema em fiscalização: ANPD pergunta data da última revisão.",
  },
  {
    instrumento: "Cláusulas LGPD nos contratos com operadores",
    periodicidade: "Por contrato — verificação anual + na renovação",
    porQue: "Contratos antigos (pré-2020) frequentemente não têm cláusulas LGPD. Promover aditamento progressivamente.",
    alemDisso: "Novos contratos devem incluir cláusulas LGPD desde a redação.",
  },
  {
    instrumento: "Canal DSR (Direitos do Titular)",
    periodicidade: "Verificação mensal de funcionamento + revisão anual do procedimento",
    porQue: "Canal precisa estar VIVO — testar o e-mail/formulário todo mês. Sem funcionamento, ANPD considera descumprimento direto do Art. 18.",
    alemDisso: "Indicador trimestral: % de solicitações respondidas em até 15 dias úteis (Art. 19 II).",
  },
  {
    instrumento: "Aviso de Privacidade público",
    periodicidade: "A cada mudança no Inventário + revisão semestral",
    porQue: "Aviso desatualizado em relação ao Inventário é informação incorreta ao titular (Art. 6º VI).",
    alemDisso: "Inclui data da última atualização visível na página pública.",
  },
  {
    instrumento: "Plano de Resposta a Incidentes (PRI)",
    periodicidade: "Anual + após incidente real",
    porQue: "Equipe muda (servidores trocam de função), tecnologia muda, fluxo muda. PRI desatualizado falha na hora certa.",
    alemDisso: "Recomendado: simulado anual (tabletop exercise) com cenário plausível. Sem simulado, plano é só papel.",
  },
  {
    instrumento: "Política do PGP (documento mater)",
    periodicidade: "Anual",
    porQue: "Aprovação anual pelo dirigente máximo cria ritual institucional. Política sem revisão é política esquecida.",
    alemDisso: "Anexar relatório executivo (1-2 páginas) com o status de cada instrumento.",
  },
  {
    instrumento: "Capacitação da equipe",
    periodicidade: "Anual + onboarding obrigatório",
    porQue: "Capacitação não é evento único. Equipe muda. Lei muda. Necessário pulsing periódico.",
    alemDisso: "Onboarding obrigatório PRA NOVOS SERVIDORES antes de tratar dados pessoais (Art. 50 § 2º I 'c').",
  },
];

// =============================================================================
// J — REFERÊNCIAS EXTERNAS CURADAS
// =============================================================================

export const CONTEUDO_J_REFERENCIAS: Array<{
  categoria: string;
  itens: Array<{ titulo: string; descricao: string; url?: string }>;
}> = [
  {
    categoria: "Legislação fundamental",
    itens: [
      { titulo: "Lei nº 13.709/2018 — LGPD (texto integral)", descricao: "Texto consolidado no Planalto. Leitura obrigatória pra Encarregado e Comitê.", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" },
      { titulo: "Lei nº 12.527/2011 — LAI", descricao: "Lei de Acesso à Informação. Convive com a LGPD no setor público — transparência ativa não dispensa proteção de dados pessoais.", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" },
      { titulo: "Lei nº 13.460/2017 — Defesa do Usuário", descricao: "Código de Defesa do Usuário do Serviço Público. Define direito à Carta de Serviços.", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm" },
      { titulo: "Marco Civil da Internet (Lei nº 12.965/2014)", descricao: "Convive com a LGPD nas atividades de tratamento via Internet.", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" },
    ],
  },
  {
    categoria: "Resoluções da ANPD",
    itens: [
      { titulo: "Resolução CD/ANPD nº 2/2022", descricao: "Agentes de pequeno porte (microempresa, EPP, startups, pessoas físicas). Critérios de alto risco. Aplicável ao setor público?", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/legislacao/resolucoes" },
      { titulo: "Resolução CD/ANPD nº 4/2023", descricao: "Regulamento de dosimetria e aplicação de sanções administrativas.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/legislacao/resolucoes" },
      { titulo: "Resolução CD/ANPD nº 15/2024", descricao: "Comunicação de incidente de segurança com dados pessoais.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/legislacao/resolucoes" },
      { titulo: "Resolução CD/ANPD nº 18/2024", descricao: "Atuação do Encarregado pelo Tratamento de Dados Pessoais.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/legislacao/resolucoes" },
      { titulo: "Resolução CD/ANPD nº 20/2024", descricao: "Transferência internacional de dados pessoais.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/legislacao/resolucoes" },
    ],
  },
  {
    categoria: "Guias e materiais didáticos da ANPD",
    itens: [
      { titulo: "Guia Orientativo — Atuação do Encarregado", descricao: "Detalhamento prático das atribuições do DPO, perfil recomendado, conflito de interesse.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guias-orientativos" },
      { titulo: "Guia Orientativo — Tratamento por órgãos públicos", descricao: "Capítulo IV da LGPD aplicado às especificidades do setor público.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guias-orientativos" },
      { titulo: "Guia Orientativo — Segurança da Informação", descricao: "Medidas técnicas e administrativas mínimas pra proteção de dados pessoais.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guias-orientativos" },
      { titulo: "Guia Orientativo — Cookies e Proteção de Dados", descricao: "Aplicação da LGPD a tecnologias de rastreamento em sítios eletrônicos.", url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guias-orientativos" },
    ],
  },
  {
    categoria: "Materiais didáticos complementares",
    itens: [
      { titulo: "Trilha LGPD Descomplicada — Clube do Servidor", descricao: "Biblioteca de e-books interativos pra as 7 Fases do PGP. Recomendado pra capacitação contínua da equipe.", url: "https://heyzine.com/shelf/trilha_lgpd_descomplicada.html" },
      { titulo: "Cartilha LGPD pra agentes públicos (CGU)", descricao: "Material da Controladoria-Geral da União com foco em servidores públicos.", url: "https://www.gov.br/cgu/pt-br" },
      { titulo: "ABNT NBR ISO/IEC 27701:2019", descricao: "Sistema de Gestão de Privacidade da Informação. Padrão internacional referenciado em diversos guias ANPD.", url: "https://www.abntcatalogo.com.br" },
    ],
  },
];

// =============================================================================
// F — ADAPTAÇÃO POR PORTE DO ÓRGÃO
// =============================================================================

export const CONTEUDO_F_PORTE = {
  titulo: "Adaptação por porte do órgão",
  intro: [
    "A LGPD aplica-se igualmente a órgãos pequenos e grandes — mas o COMO implementar tem que se adaptar à realidade institucional. Tentar replicar em uma Prefeitura de 50 servidores o modelo de uma Câmara Federal é receita pra falha (e o contrário também).",
    "Esta seção orienta as decisões operacionais por porte. Lembrar: porte NÃO determina o que precisa cumprir, apenas COMO cumprir.",
  ],
  faixas: [
    {
      porte: "Pequeno (até 30 servidores)",
      perfil: "Câmaras municipais de cidades pequenas, autarquias compactas, conselhos profissionais regionais. Equipe enxuta, sem TI especializada, orçamento limitado.",
      orientacoes: [
        "**Encarregado**: pode ser servidor com acumulo de função (jurídico + DPO, ou administração + DPO). Designar formalmente mesmo assim — a função existe na Lei.",
        "**Comitê de Privacidade**: 3 membros (DPO + um da área técnica + um da área-fim). Reuniões trimestrais.",
        "**Inventário**: focar em 5-10 processos críticos. Cobertura total leva tempo — priorizar por risco.",
        "**GAP**: usar pacote enxuto (10-15 controles essenciais), não os 30/119 completos.",
        "**RIPDs**: só pra processos genuinamente sensíveis (saúde, dados de crianças). Não exagerar.",
        "**Aviso de Privacidade**: 1 modelo institucional simples, atualizado a cada mudança real.",
        "**PRI**: equipe = a mesma do Comitê de Privacidade. Sem CSIRT especializado.",
        "**Treinamento**: capacitação anual coletiva (2-3h) — não consultoria cara.",
      ],
      orcamento: "Pode caber em rubrica de capacitação existente. Investimentos extras: ~R$ 5-15 mil/ano (treinamento, eventual consultoria pontual).",
    },
    {
      porte: "Médio (30 a 200 servidores)",
      perfil: "Prefeituras de cidades médias, Câmaras municipais maiores, autarquias regionais, tribunais regionais menores. TI estruturada, jurídico próprio.",
      orientacoes: [
        "**Encarregado**: ideal dedicar 30-50% do tempo de um servidor pra função (não 100%, mas com horas reservadas). Pode ter Substituto formal.",
        "**Comitê de Privacidade**: 5-7 membros (DPO + TI + Jurídico + Comunicação + 1-2 áreas-fim). Reuniões mensais.",
        "**Inventário**: 20-50 processos esperados. Cobrir Saúde, Educação, Tributário, RH, Assistência Social, Tributação.",
        "**GAP**: pacote intermediário (30-50 controles). Pode estender pra controles específicos do setor.",
        "**RIPDs**: ~5-10 elaborados nos primeiros 12 meses (processos críticos).",
        "**Aviso de Privacidade**: 1 institucional + Avisos específicos por serviço de alto impacto.",
        "**PRI**: equipe formalizada (5-7 papéis) com matriz RACI clara. Simulado anual.",
        "**Treinamento**: trilha de capacitação anual + onboarding obrigatório + pílulas mensais (e-mail/intranet).",
      ],
      orcamento: "Rubrica específica recomendada. Investimentos: ~R$ 30-80 mil/ano (treinamento + ferramentas + eventual consultoria).",
    },
    {
      porte: "Grande (200+ servidores)",
      perfil: "Prefeituras de cidades grandes/capitais, Câmaras Estaduais e Federal, Tribunais de Justiça/Contas, Autarquias federais, agências reguladoras. Estrutura tecnológica robusta, jurídico especializado.",
      orientacoes: [
        "**Encarregado**: função DEDICADA (100% tempo) + Substituto + equipe de apoio (2-5 servidores). Pode ser servidor de carreira específica.",
        "**Comitê de Privacidade**: 10-15 membros com representação de TODAS as áreas-chave. Reuniões mensais + grupos de trabalho temáticos.",
        "**Inventário**: 100+ processos. Ferramenta dedicada (planilha não basta). Revisão contínua.",
        "**GAP**: pacote completo (119+ controles). Avaliação multi-setor com pareceres técnicos formais.",
        "**RIPDs**: programa estruturado — todos os processos de alto risco com RIPD aprovado.",
        "**Aviso de Privacidade**: institucional + Avisos por serviço (10-30 avisos específicos).",
        "**PRI**: CSIRT formalizado, simulados semestrais, integração com SIEM, contrato com forense externo.",
        "**Treinamento**: capacitação contínua, plataforma EAD própria, certificação interna, indicadores de cobertura.",
      ],
      orcamento: "Rubrica específica obrigatória. Investimentos: R$ 150 mil/ano +, com possível contratação de ferramentas SaaS (Privacy Management Platform), consultoria especializada, infraestrutura.",
    },
  ],
  rodape:
    "Estas orientações são parâmetros — adaptar à realidade específica. Característica que pode SOBRESCREVER o porte: tratamento de dados sensíveis em larga escala (ex: Secretaria Estadual de Saúde tem porte 'grande' independentemente do nº de servidores administrativos).",
};

// =============================================================================
// H — CHECKLIST FINAL DO PGP (25 perguntas)
// =============================================================================

export const CONTEUDO_H_CHECKLIST: Array<{ secao: string; itens: string[] }> = [
  {
    secao: "Fase Preliminar — Sensibilização",
    itens: [
      "A Alta Gestão (dirigente máximo) tem ciência formal do PGP e demonstra apoio institucional?",
      "A equipe envolvida no tratamento de dados recebeu capacitação nos últimos 12 meses?",
      "Há documento que registra o ponto de partida da maturidade institucional (auto-diagnóstico, termômetro)?",
    ],
  },
  {
    secao: "Fase 1 — Governança",
    itens: [
      "O Encarregado pelo Tratamento de Dados Pessoais (DPO) foi designado por ato formal e publicado no diário oficial?",
      "Os contatos do Encarregado estão divulgados no portal institucional (Art. 41 §1º)?",
      "Existe Encarregado Substituto designado pra continuidade em férias/afastamentos?",
      "O Comitê de Privacidade foi instituído por ato formal com representantes das áreas-chave?",
    ],
  },
  {
    secao: "Fase 2 — Diagnóstico Inicial",
    itens: [
      "Foi feito levantamento preliminar dos setores que tratam dados pessoais no órgão?",
      "Foi aplicada Matriz de Priorização (Res. ANPD nº 2/2022) aos processos identificados?",
    ],
  },
  {
    secao: "Fase 3 — Mapeamento e Riscos",
    itens: [
      "Existe Inventário de Tratamentos atualizado nos últimos 12 meses?",
      "Cada processo do Inventário tem base legal documentada e específica?",
      "Foi realizada Análise de Riscos com matriz Probabilidade × Impacto pros processos críticos?",
    ],
  },
  {
    secao: "Fase 4 — GAP Analysis",
    itens: [
      "Foi feita análise de conformidade (GAP) com pelo menos 10 controles essenciais?",
      "Cada controle NÃO ADERENTE virou ação no Plano com responsável e prazo?",
    ],
  },
  {
    secao: "Fase 5 — Plano de Ação",
    itens: [
      "Existe Plano de Ação consolidado com responsável e prazo por ação?",
      "Há acompanhamento periódico do Plano (mensal ou trimestral)?",
    ],
  },
  {
    secao: "Fase 6 — Execução",
    itens: [
      "Existem RIPDs elaborados pros processos de alto risco (dados sensíveis, larga escala)?",
      "Os contratos com operadores (terceiros que tratam dados) contêm cláusulas LGPD (Art. 39)?",
      "Existe canal pra exercício de Direitos do Titular (DSR) divulgado e funcional?",
      "Há monitoramento do prazo de 15 dias úteis pra resposta a solicitações DSR (Art. 19 II)?",
      "O Aviso de Privacidade está publicado no portal externo, acessível ao cidadão (Art. 9º)?",
      "Existe Política de Retenção e descarte com prazos por categoria de dado (Art. 16)?",
    ],
  },
  {
    secao: "Fase 7 — Monitoramento e Resposta",
    itens: [
      "Existe Plano de Resposta a Incidentes (PRI) formalizado, com equipe definida e matriz RACI?",
      "O PRI foi testado nos últimos 12 meses (simulado)?",
    ],
  },
];

// =============================================================================
// I — FAQ (perguntas frequentes do curso)
// =============================================================================

export const CONTEUDO_I_FAQ: Array<{ pergunta: string; resposta: string }> = [
  {
    pergunta: "Meu órgão é pequeno (menos de 50 servidores). Preciso mesmo de Encarregado?",
    resposta:
      "SIM. A LGPD não dispensa o Encarregado em função do porte. O que muda é COMO designar: em órgão pequeno, pode ser servidor com acúmulo de função (jurídico + DPO, por exemplo), mas é obrigatório formalizar por ato. A Resolução CD/ANPD nº 18/2024 detalha os critérios — perfil técnico-jurídico compatível, autonomia funcional, ausência de conflito de interesse.",
  },
  {
    pergunta: "O Encarregado pode ser servidor temporário ou comissionado?",
    resposta:
      "Pode, mas com ressalvas. A Resolução CD/ANPD nº 18/2024 não veda servidor temporário/comissionado, MAS aponta que o cargo deve garantir AUTONOMIA FUNCIONAL — a função exige proteção contra retaliação por suas decisões técnicas (Art. 41 §3º). Servidor demissível ad nutum sem garantias específicas tem autonomia comprometida, na prática. Recomendação: preferir servidor de carreira; se for comissionado/temporário, garantir cláusula contratual de estabilidade na função pelo prazo do mandato.",
  },
  {
    pergunta: "Posso usar legítimo interesse (Art. 7º IX) no setor público?",
    resposta:
      "PODE, mas é base EXCEPCIONAL no setor público. A regra é usar bases mais específicas: Art. 7º II (obrigação legal) ou Art. 7º III (execução de políticas públicas). Quando usar legítimo interesse, é OBRIGATÓRIO documentar o teste de balanceamento (LIA): a finalidade legítima do controlador supera os direitos do titular naquele contexto específico? Sem essa documentação, a ANPD pode considerar tratamento sem base legal.",
  },
  {
    pergunta: "Por quanto tempo guardo o dado de cidadão atendido?",
    resposta:
      "DEPENDE da categoria do dado e da legislação aplicável. Parâmetros típicos: dados gerais de atendimento = 5 anos (prazo prescricional padrão); dados de saúde (prontuários) = 20 anos da última consulta (CFM Resolução 1.821/2007); dados fiscais/tributários = 5 anos (legislação tributária); dados previdenciários = até 75 anos. Após o prazo: eliminar, anonimizar ou justificar retenção em hipótese específica (Art. 16). Política de Retenção institucional documenta os prazos por categoria.",
  },
  {
    pergunta: "Tenho que pedir consentimento pra tratar dado de servidor?",
    resposta:
      "NÃO. Tratamento de dados de servidor (folha, ponto, prontuário funcional, etc.) decorre de OBRIGAÇÃO LEGAL (Art. 7º II — Lei nº 8.112/90 ou estatuto local + legislação previdenciária/tributária/fiscal). Consentimento é base inadequada porque o servidor não pode RECUSAR sem prejuízo do vínculo. Usar consentimento APENAS pra tratamentos genuinamente facultativos: newsletter institucional voluntária, autorização pra uso de imagem em material promocional, programa opcional de benefícios.",
  },
  {
    pergunta: "Quando preciso elaborar RIPD?",
    resposta:
      "Quando o tratamento pode gerar riscos às liberdades civis e direitos fundamentais (Art. 38 LGPD). Critérios práticos: (a) trata dados pessoais SENSÍVEIS — saúde, opinião política, etnia, biometria; (b) trata dados de CRIANÇAS/ADOLESCENTES sistematicamente; (c) LARGA ESCALA — milhares ou milhões de titulares; (d) DECISÕES AUTOMATIZADAS com efeitos jurídicos; (e) MONITORAMENTO SISTEMÁTICO — CFTV, geolocalização contínua; (f) TECNOLOGIAS INOVADORAS — IA, biometria. Se 1 ou mais critérios → RIPD recomendado.",
  },
  {
    pergunta: "O que fazer se ocorrer um incidente (vazamento)?",
    resposta:
      "Fluxo em 7 passos: (1) DETECTAR e isolar o sistema/processo afetado; (2) ACIONAR o PRI — equipe ETIR, DPO, TI, Jurídico, Alta Gestão; (3) CLASSIFICAR a severidade — fatores objetivos (acesso, sensíveis, vulneráveis, volume, exposição); (4) COMUNICAR à ANPD em até 3 dias úteis se severidade ALTA/CRÍTICA (Art. 48 + Res. 15/2024); (5) COMUNICAR aos titulares afetados em até 7 dias úteis se ALTA/CRÍTICA; (6) MITIGAR — medidas técnicas (revogar acesso, alterar senhas, restaurar backup) + administrativas (apuração, treinamento); (7) DOCUMENTAR tudo em registro interno — vira insumo da revisão anual do PGP.",
  },
  {
    pergunta: "Preciso publicar Aviso de Privacidade mesmo sendo órgão público?",
    resposta:
      "SIM. A obrigação de informação ao titular (Art. 9º LGPD) aplica-se a TODOS os controladores, incluindo órgãos públicos. O Aviso de Privacidade é a forma operacional de cumprir esse direito — texto público no portal externo informando quem trata, com que finalidade, base legal, retenção, compartilhamentos e como exercer direitos. Recomendado: 1 Aviso institucional + Avisos específicos pra serviços de maior impacto.",
  },
  {
    pergunta: "Carta de Serviços já não basta — por que preciso de Inventário também?",
    resposta:
      "Carta de Serviços (Lei nº 13.460/2017) descreve o que o órgão OFERECE ao cidadão. Inventário (Art. 37 LGPD) descreve COMO o órgão TRATA dados pessoais por trás de cada serviço. Cumprem funções diferentes: Carta = transparência sobre serviços; Inventário = conformidade no tratamento de dados. A Carta é fonte EXCELENTE pra construir o Inventário (cada serviço = potencialmente 1 processo), mas não substitui.",
  },
  {
    pergunta: "Posso compartilhar dados de cidadãos com outros órgãos públicos?",
    resposta:
      "PODE, com regras. Art. 26 LGPD permite uso compartilhado de dados entre órgãos públicos quando: (a) há finalidade específica de execução de políticas públicas e atribuição legal; (b) o tratamento posterior é compatível com a finalidade original (não pode ser uso secundário estranho); (c) o titular é informado (no Aviso de Privacidade). Compartilhamento com ente privado: Art. 26 §1º exige autorização específica em lei (ex: cessão de dados pra empresa contratada — só com cláusulas LGPD no contrato).",
  },
  {
    pergunta: "O que faço com os contratos antigos sem cláusulas LGPD?",
    resposta:
      "ADITAMENTO. Promover aditivo contratual incluindo as cláusulas mínimas do Art. 39 LGPD (segurança, comunicação de incidentes, subcontratação, direitos do titular, retenção/devolução, auditoria, responsabilidade). Ver modelo de cláusulas no capítulo VII desta Cartilha. Não é necessário rescindir — basta aditar. Pra contratos com valor significativo ou tratamento de dados sensíveis, priorizar nos primeiros 90 dias do programa de adequação.",
  },
  {
    pergunta: "Posso enviar newsletter institucional pra quem usou os serviços do órgão?",
    resposta:
      "DEPENDE. Se a newsletter está dentro da finalidade original do tratamento (ex: informações sobre o serviço que ele usou), pode dentro da mesma base legal. Se é finalidade DIFERENTE (ex: informativo cultural mensal pra quem fez uma denúncia na Ouvidoria), exige CONSENTIMENTO específico — não cabe usar legítimo interesse genérico. Caixa pré-marcada de aceite é inválida (Art. 8º). Opt-in real obrigatório.",
  },
  {
    pergunta: "Sou Câmara/Tribunal — a LGPD aplica-se a sessões públicas e transmissões?",
    resposta:
      "Aplica-se com particularidades. Sessões públicas e seus registros têm base no princípio da publicidade do Art. 37 da Constituição — finalidade pública legítima. PORÉM: (a) participantes (não autoridades) precisam ser INFORMADOS no formulário de inscrição que haverá transmissão e qual o alcance; (b) uso secundário (ex: reels editados pra Instagram) exige base própria — não cabe na finalidade da transmissão original; (c) dados sensíveis eventualmente mencionados em sessão merecem cuidado redacional na divulgação.",
  },
  {
    pergunta: "Tenho que comunicar TODO incidente à ANPD, mesmo os pequenos?",
    resposta:
      "NÃO. Art. 48 LGPD e Res. CD/ANPD nº 15/2024 exigem comunicação quando o incidente PODE ACARRETAR RISCO OU DANO RELEVANTE aos titulares. Incidentes de severidade BAIXA (afetam poucos titulares com dados não-sensíveis e medidas de mitigação rápidas) podem ficar só no registro interno. Severidade MÉDIA/ALTA/CRÍTICA: comunicar ANPD (e aos titulares se ALTA/CRÍTICA). Usar fatores objetivos pra classificar (acesso confirmado, sensíveis, vulneráveis, volume, exposição).",
  },
  {
    pergunta: "Quanto custa implementar a LGPD?",
    resposta:
      "Depende fortemente do porte. Pequeno (~30 servidores): R$ 5-15 mil/ano em treinamento e consultoria pontual. Médio (~100 servidores): R$ 30-80 mil/ano com treinamento estruturado e eventual ferramenta. Grande (200+): R$ 150 mil+/ano com plataforma SaaS, consultoria especializada, infraestrutura. CUSTO ZERO é miragem — mas custo BAIXO é viável em órgão pequeno com servidor capacitado.",
  },
  {
    pergunta: "Como diferenciar Inventário, RIPD, GAP e Plano de Ação?",
    resposta:
      "São instrumentos distintos e complementares: **Inventário** descreve TUDO que é tratado (quais dados, quais processos, qual base legal); **GAP** avalia O QUE FALTA (quais controles obrigatórios não cumprimos ainda); **RIPD** avalia o RISCO RESIDUAL nos processos de alto impacto (o que pode dar errado e como mitigar); **Plano de Ação** organiza COMO CORRIGIR as lacunas do GAP + os riscos altos identificados. Inventário e GAP são panoramas; RIPD é zoom no crítico; Plano é execução.",
  },
  {
    pergunta: "A LGPD pode multar órgão público?",
    resposta:
      "Sim, mas as sanções são adaptadas ao setor público. A ANPD pode aplicar: advertência, publicização da infração, bloqueio/eliminação dos dados, suspensão parcial/total das atividades de tratamento. MULTAS PECUNIÁRIAS (Art. 52 §1º) aplicam-se a entes privados — pra entes públicos, a sanção financeira tem efeito orçamentário-disciplinar (responsabilização do gestor). Em sede de Justiça, indenizações civis (Art. 42) por dano coletivo/individual são aplicáveis a órgãos públicos.",
  },
  {
    pergunta: "Como capacitar a equipe sem orçamento dedicado?",
    resposta:
      "5 caminhos com custo zero ou muito baixo: (1) Materiais GRATUITOS da ANPD (Guias Orientativos no portal); (2) ENAP — cursos online gratuitos de LGPD pra servidores públicos; (3) Trilha LGPD Descomplicada — e-books gratuitos na biblioteca pública; (4) Capacitação INTERNA — DPO capacita Comitê, Comitê capacita áreas (cascata); (5) Pílulas semanais por e-mail — 1 pergunta por semana sobre situações reais. Trilha vem antes do orçamento, não depois.",
  },
  {
    pergunta: "Quando devo revisar o PGP?",
    resposta:
      "Ciclo recomendado: revisão ANUAL completa (todos os instrumentos) + atualização CONTÍNUA conforme eventos disparadores: (a) novo sistema ou processo; (b) alteração legislativa; (c) decisão ANPD com efeito sobre o programa; (d) incidente de severidade ALTA/CRÍTICA; (e) reorganização institucional relevante. Revisão sem atualização contínua envelhece rápido — o programa precisa respirar com a Instituição.",
  },
];

// =============================================================================
// K — ROTEIROS DE IMPLEMENTAÇÃO POR PRAZO
// =============================================================================

export const CONTEUDO_K_ROTEIROS = {
  titulo: "Roteiros de implementação por prazo",
  intro:
    "A escolha do prazo de implementação depende do contexto: pressão externa (auditoria, fiscalização, incidente recente) acelera; orçamento e cultura institucional condicionam. Aqui 3 roteiros típicos — escolher o mais realista pra sua Instituição.",
  roteiros: [
    {
      prazo: "30 dias — EMERGENCIAL",
      cenario:
        "Pressão externa imediata: notificação ANPD, fiscalização TCE/CGU, incidente público, mudança de gestão exigindo demonstração rápida. Foco em ENTREGAS MÍNIMAS DEFENSÁVEIS — não programa maduro.",
      marcos: [
        "Semana 1 — Designar Encarregado por ato formal + publicar contatos no portal + iniciar Inventário (5 processos mais críticos)",
        "Semana 2 — Concluir 5 processos no Inventário + identificar 3 riscos altos + Plano de Ação inicial",
        "Semana 3 — Publicar Aviso de Privacidade básico (institucional) + estabelecer canal DSR (e-mail funcional) + comunicar incidentes anteriores se aplicável",
        "Semana 4 — Sessão da Alta Gestão aprovando Política do PGP (versão inicial) + cronograma dos próximos 90 dias",
      ],
      entregaveis: "Ato de Designação publicado · Inventário de 5 processos · Aviso de Privacidade público · Canal DSR funcional · Política do PGP versão inicial assinada.",
    },
    {
      prazo: "90 dias — ESTRUTURADO",
      cenario:
        "Sem pressão externa imediata, mas com determinação institucional de implementar bem. É o prazo MAIS RECOMENDADO pra a maioria das Instituições — equilibra qualidade e velocidade.",
      marcos: [
        "Semanas 1-2 — Termômetro Institucional + Carta pra Alta Gestão + designar Encarregado e Comitê",
        "Semanas 3-4 — Levantamento de setores + Matriz de Priorização (Res. ANPD nº 2/2022) + selecionar processos prioritários",
        "Semanas 5-7 — Inventário detalhado dos 10-15 processos prioritários (base legal, tipos de dados, retenção, compartilhamentos, medidas)",
        "Semanas 8-9 — Análise de Riscos + GAP Analysis (pacote 30 controles)",
        "Semanas 10-11 — Plano de Ação consolidado + iniciar RIPDs dos processos de alto risco",
        "Semana 12 — Publicar Aviso de Privacidade · estruturar canal DSR · cadastrar Operadores com cláusulas LGPD · esboçar PRI",
        "Semana 13 — Sessão da Alta Gestão: aprovação formal do PGP completo + apresentação dos próximos 90 dias de execução",
      ],
      entregaveis: "PGP completo aprovado · Inventário com 10-15 processos · RIPDs dos críticos · Aviso · DSR · Operadores com cláusulas · PRI inicial.",
    },
    {
      prazo: "12 meses — CONSOLIDAÇÃO",
      cenario:
        "Pra órgãos que já têm PGP inicial implementado (típico dos 90 dias) e querem AMADURECER. Foco em cobertura ampliada, capacitação contínua e ciclo de melhoria.",
      marcos: [
        "Trimestre 1 — Estender Inventário pra todos os setores (meta: 50%+ dos processos institucionais cobertos)",
        "Trimestre 2 — RIPDs pra todos os processos de alto risco · GAP completo (119 controles) · adequação dos contratos antigos com operadores",
        "Trimestre 3 — Programa permanente de capacitação · simulado anual de incidente (tabletop) · revisão semestral do PGP",
        "Trimestre 4 — Cobertura total do Inventário · indicadores institucionais (% DSR no prazo, % contratos com cláusulas, % servidores capacitados) · auditoria anual interna · relatório executivo à Alta Gestão",
      ],
      entregaveis: "PGP maduro com indicadores · Inventário com 80-100% de cobertura · Programa de capacitação contínuo · Auditoria interna anual · Política revisada.",
    },
  ],
  recomendacao:
    "Priorizar o **roteiro de 90 dias** como padrão. Emergencial só em pressão real (não é regra). Doze meses é continuidade, não início — começar SEMPRE com algum entregável visível em 30-90 dias pra criar tração institucional.",
};
