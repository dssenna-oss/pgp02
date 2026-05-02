/**
 * Schema do form interno de Inventário de Dados.
 *
 * Espelha o questionário base disponível em:
 * https://docs.google.com/forms/d/e/1FAIpQLSfvASokeVLEBQH1bmsQxterGmiYsmmIWyFDPA3niojVBs8gwA/viewform
 *
 * É a fonte de verdade do wizard. Para mudar uma pergunta, edite este
 * arquivo — o wizard, validador e auto-derivação leem dele.
 *
 * As respostas são salvas em `DataInventory.formAnswers` (Json) com
 * o formato definido em `FormAnswers` no fim deste arquivo.
 */

// ============================================================
// TIPOS
// ============================================================

export type FieldType =
  | "text-short"      // input text
  | "text-long"       // textarea
  | "single-choice"   // radio
  | "multi-choice";   // checkboxes

/** Origem dos dados pra pré-preenchimento (NextAuth session). */
export type AutoFillSource = "session.name" | "session.email";

/** Renderização condicional: campo só aparece se outro campo tiver dado match. */
export interface FieldDependency {
  fieldId: string;
  values: string[]; // qualquer um destes ativa o campo
}

export interface FormField {
  id: string;
  label: string;
  description?: string;
  type: FieldType;
  required: boolean;
  /** Para single-choice / multi-choice. */
  options?: string[];
  /** Permite o user escrever uma opção "Outro" (multi-choice). */
  allowOther?: boolean;
  /** Pré-preencher do user logado. */
  autoFillFrom?: AutoFillSource;
  /** Renderização condicional. */
  dependsOn?: FieldDependency;
  /** Texto de exemplo dentro do input. */
  placeholder?: string;
}

export interface FormSection {
  kind: "section";
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  /**
   * Quando true, cada field da seção é renderizado num accordion
   * colapsável (default fechado). Útil pra seções muito longas
   * (ex: Sec 3 com 17 grupos de checkboxes).
   */
  collapseFields?: boolean;
}

export interface OnboardingStep {
  kind: "onboarding";
  id: "onboarding";
  title: string;
  blocks: Array<{ title: string; body: string }>;
}

export type WizardStep = OnboardingStep | FormSection;

// ============================================================
// SCHEMA — definição completa das telas do wizard
// ============================================================

export const INVENTARIO_FORM_SCHEMA: WizardStep[] = [
  // -------- TELA 0: ONBOARDING --------
  // Texto literal do Google Form (Instruções, Atenção, Glossário).
  {
    kind: "onboarding",
    id: "onboarding",
    title: "Antes de começar",
    blocks: [
      {
        title: "Instruções",
        body: `As perguntas a seguir compõem a primeira etapa do mapeamento de dados pessoais da  EMPRESA. para adequação a Lei Geral de Proteção de Dados Pessoais ("LGPD" ou Lei nº 13.709). Cabe destacar, que você foi selecionado  para responder esse questionário pela sua liderança. O objetivo do questionário é:

1. Identificar os processos em sua área que utilizam dados pessoais;
2. Identificar quais dados pessoais são utilizados em sua área;
3. Entender a finalidade de uso dos dados pessoais; e
4. Mapear brevemente o ciclo de vida dos dados pessoais dentro de sua área. `,
      },
      {
        title: "Atenção!",
        body: `Você deverá preencher o formulário para os processos de negócio sob sua responsabilidade.
Por gentileza pedimos que trate este tema com prioridade.
Para cada processo de tratamento de dados pessoais você deve preencher um formulário.`,
      },
      {
        title: "Glossário",
        body: `Para te ajudar durante o preenchimento do questionário considerar as definições
abaixo:

- Dado pessoal: É toda informação que identifica uma pessoa/indivíduo ou torna uma pessoa identificável;
- Dado pessoal sensível: Dados sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, saúde, vida sexual, genética ou biometria, quando vinculado a pessoa natural;
- Titular: Dono da informação - cliente, funcionário ou terceiro;
- Finalidade: É o motivo pelo qual a EMPRESA coleta ou utiliza um dado pessoal, por exemplo: para fins de análise de crédito.

Em caso de dúvidas, favor entre em contato com:
INDICAR O CANAL DE CONTATO`,
      },
    ],
  },

  // -------- SEÇÃO 1: IDENTIFICAÇÃO DO RESPONDENTE --------
  {
    kind: "section",
    id: "sec1",
    title: "1. Identificação do Respondente",
    description:
      "Confirme seus dados — Nome e e-mail vêm do seu cadastro. Preencha cargo e departamento.",
    fields: [
      {
        id: "respondent_name",
        label: "Nome",
        type: "text-long",
        required: true,
        autoFillFrom: "session.name",
      },
      {
        id: "respondent_role",
        label: "Cargo",
        type: "text-short",
        required: true,
      },
      {
        id: "respondent_email",
        label: "E-mail",
        type: "text-short",
        required: true,
        autoFillFrom: "session.email",
      },
      {
        id: "respondent_department",
        label: "Departamento",
        type: "text-short",
        required: true,
      },
    ],
  },

  // -------- SEÇÃO 2: PROCESSO --------
  {
    kind: "section",
    id: "sec2",
    title: "2. Identificação do Processo",
    description:
      "Identifique o processo da sua área que utiliza dados pessoais. Cada processo deve ter um formulário separado.",
    fields: [
      {
        id: "process_name",
        label: "Nome do Processo",
        type: "text-long",
        required: true,
        placeholder: "Ex: Recrutamento e Seleção",
      },
      {
        id: "process_purpose",
        label:
          "Descreva de forma detalhada a finalidade do tratamento dos dados pessoais. Neste item é importante que você indique como realiza a coleta do dado, como utiliza ex: São usados os dados dos colaboradores para realizar ações internas (evento de dia das mulheres).",
        type: "text-long",
        required: true,
      },
      {
        id: "process_volume",
        label:
          "Qual o volume médio de titulares envolvidos nesta atividade de tratamento?",
        type: "multi-choice",
        required: true,
        options: [
          "De 0 - 100",
          "De 101 - 1.000",
          "De 1.001 - 10.000",
          "De 10.001 - 100.000",
          "De 100.001 - 1.000.000,00",
          "Acima de 1.000.000,00",
          "Não tenho como informar",
        ],
      },
    ],
  },

  // -------- SEÇÃO 3: TIPIFICAÇÃO DOS DADOS --------
  {
    kind: "section",
    id: "sec3",
    title: "3. Tipificação dos Dados Tratados pelo Processo",
    description:
      "Assinale quais dados pessoais são utilizados neste processo. Caso uma categoria não se aplique, marque N/A. Clique em cada categoria para expandir.",
    collapseFields: true,
    fields: [
      {
        id: "data_names",
        label: "Nomes e Iniciais",
        type: "multi-choice",
        required: true,
        options: [
          "Primeiro nome",
          "Nome do meio",
          "Sobrenome",
          "Apenas iniciais",
          "N/A",
        ],
      },
      {
        id: "data_personal",
        label: "Características Pessoais",
        type: "multi-choice",
        required: true,
        options: [
          "Idade",
          "Data e Local de Nascimento",
          "Gênero",
          "Altura",
          "Peso",
          "Nacionalidade",
          "Naturalidade",
          "Estado Civil",
          "Lazer e interesses",
          "Fotografias",
          "Informação biométrica",
          "Número de filhos",
          "Raça ou Origem Étnica",
          "Histórico / vida sexual",
          "N/A",
        ],
      },
      {
        id: "data_filiation",
        label: "Filiação",
        type: "multi-choice",
        required: true,
        options: ["Nome do Mãe", "Nome do Pai", "N/A"],
      },
      {
        id: "data_official_ids",
        label: "Identificação gerada por órgãos oficiais",
        type: "multi-choice",
        required: true,
        options: [
          "CPF",
          "RG (número, data de emissão e órgão expedidor)",
          "CNH (número, data de emissão e órgão expedidor)",
          "CTPS",
          "Carteira SUS",
          "Bolsa Família",
          "Número de passaporte",
          "Visto de entrada em outros países",
          "PIS/PASEP",
          "Certidão de Nascimento",
          "N/A",
        ],
      },
      {
        id: "data_residential",
        label: "Informações Residenciais",
        type: "multi-choice",
        required: true,
        options: [
          "Endereço Residencial",
          "Telefone Residencial",
          "Número de fax Residencial",
          "E-mail pessoal",
          "Número de celular pessoal",
          "Mídias sociais",
          "N/A",
        ],
      },
      {
        id: "data_education",
        label: "Escolaridade",
        type: "multi-choice",
        required: true,
        options: [
          "Diplomas e escolaridade",
          "Licenças e associação profissional",
          "Histórico acadêmico",
          "N/A",
        ],
      },
      {
        id: "data_professional",
        label: "Informações Profissionais",
        type: "multi-choice",
        required: true,
        options: [
          "Ocupação/Cargo",
          "Endereço comercial",
          "Telefone comercial",
          "Fax comercial",
          "E-mail comercial",
          "Celular comercial",
          "Número de Identificação do Empregador (ex: matrícula)",
          "Exame médico admissional",
          "Exame médico periódico",
          "Exame médico demissional",
          "Carta de referência",
          "Número de Identificação de pagamento de imposto de renda",
          "Reivindicações / reclamações do funcionário dentro da instituição",
          "Histórico empregatício declarado pelo funcionário",
          "Histórico empregatício obtido através de análise / troca de informações com pessoas fora da empresa.",
          "N/A",
        ],
      },
      {
        id: "data_financial",
        label: "Informações Financeiras",
        type: "multi-choice",
        required: true,
        options: [
          "Dados bancários (banco, agência e conta)",
          "Histórico de transações financeiras",
          "Score de crédito",
          "Histórico do uso de seguro (qualquer tipo)",
          "Salário e outros rendimentos",
          "Dados de renda familiar mensal e patrimônio",
          "Dados de Cartão de Crédito",
          "N/A",
        ],
      },
      {
        id: "data_legal",
        label: "Informações Jurídicas",
        type: "multi-choice",
        required: true,
        options: [
          "Dados de renda familiar mensal e patrimônio",
          "Processos em andamento / concluídos envolvendo o titular",
          "N/A",
        ],
      },
      {
        id: "data_children",
        label: "Informações sobre Crianças ou Adolescentes",
        description: "Crianças (até 12 anos incompletos)",
        type: "multi-choice",
        required: true,
        options: ["Nome", "Idade", "Sexo", "Endereço", "E-mail", "N/A"],
      },
      {
        id: "data_children_consent",
        label: "Houve consentimento de um dos pais ou responsável legal?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não", "Não sei informar", "N/A"],
      },
      {
        id: "data_teens",
        label: "Adolescentes (entre 12 e 18 anos)",
        type: "multi-choice",
        required: true,
        options: ["Nome", "Idade", "Sexo", "Endereço", "E-mail", "N/A"],
      },
      {
        id: "data_preferences",
        label: "Preferências",
        type: "multi-choice",
        required: true,
        options: [
          "Crenças religiosas ou filosóficas",
          "Posicionamento político",
          "Filiação sindical",
          "Filiação política",
          "Orientação sexual",
          "Preferência de compra",
          "Preferências de navegação na internet",
          "Perfil comportamental",
          "N/A",
        ],
      },
      {
        id: "data_mobile",
        label: "Informações sobre dispositivos móveis (tais como: celular, tablet, etc.)",
        type: "multi-choice",
        required: true,
        options: [
          "Geolocalização",
          "Áudio/Vídeo",
          "Registro de ligações",
          "Identificador único de dispositivo (IMEI)",
          "Endereço de IP",
          "Clickstream/Rastreamento de website",
          "Modelo do aparelho / Versão do sistema operacional do dispositivo",
          "Senha de acesso ao dispositivo",
          "N/A",
        ],
      },
      {
        id: "data_health",
        label: "Informação pessoal de saúde",
        type: "multi-choice",
        required: true,
        options: [
          "Número de registro médico",
          "Número de beneficiário no plano de saúde",
          "Tratamento médico",
          "Diagnóstico médico",
          "Reembolsos médicos",
          "Histórico médico",
          "Dados de reclamações médicas",
          "Número de prescrição médica",
          "Histórico de saúde familiar ou morbidade",
          "Informações genéticas",
          "N/A",
        ],
      },
      {
        id: "data_sensitive_yn",
        label: "São tratados dados pessoais sensíveis?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "data_sensitive_list",
        label: "Caso a resposta acima tenha sido sim, descreva os dados pessoais sensíveis tratados:",
        type: "multi-choice",
        required: false,
        dependsOn: { fieldId: "data_sensitive_yn", values: ["Sim"] },
        options: [
          "Origem racial ou étnica",
          "Convicção religiosa",
          "Opinião Política",
          "Filiação Sindical",
          "Filiação/Opinião Política",
          "Dados de Saúde",
          "Vida Sexual",
          "Dados Genéticos",
          "Biometria",
          "N/A",
        ],
      },
    ],
  },

  // -------- SEÇÃO 4: USO DOS DADOS --------
  {
    kind: "section",
    id: "sec4",
    title: "4. Uso dos Dados",
    description:
      "Informações sobre a finalidade do tratamento dos dados pessoais coletados.",
    fields: [
      {
        id: "use_subjects",
        label: "De quem são os dados pessoais tratados?",
        type: "multi-choice",
        required: false,
        options: ["Servidores Públicos", "Ex- Servidores", "Terceiros", "Cidadãos"],
        allowOther: true,
      },
      {
        id: "use_diff_purpose",
        label:
          "Você utiliza esses dados pessoais para finalidades diferentes daquela informada ao Titular? (Exemplo: Os dados são coletados para prestação de serviço e automaticamente são cadastrados em lista de e-mail).",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "use_diff_purpose_desc",
        label: "Caso utilize para uma finalidade diversa, descreva",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_diff_purpose", values: ["Sim"] },
      },
      {
        id: "use_unnecessary_access",
        label:
          "Você tem acesso a algum dado pessoal que não é necessário para a realização desse processo? Qual? (Exemplo: Para a sua atividade são necessários apenas dados como nome, cpf porém acaba acessando toda uma base de dados).",
        type: "text-long",
        required: true,
      },
      {
        id: "use_received_external",
        label:
          "O dado pessoal é recebido de outra Instituição/empresa para prestação de serviços? (Ex: Convênios entre Instituições, cadastro para acesso ...)",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "use_received_external_desc",
        label: "Caso positivo, descreva",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_received_external", values: ["Sim"] },
      },
      {
        id: "use_automated_decision",
        label:
          "O dado pessoal é submetido a decisão automatizada durante o processo?",
        description:
          "Decisão automatizada entende-se pelo procedimento de classificação, nota, aprovação ou rejeição do perfil de um titular feito com base em algumas regras, algoritmos e instruções. Por exemplo análise de perfil financeiro para concessão de limite.",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "use_automated_decision_desc",
        label: "Descreva o processo de decisão automatizada",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_automated_decision", values: ["Sim"] },
      },
      {
        id: "use_marketing",
        label: "O dado pessoal é utilizado em campanhas de marketing/sociais?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
    ],
  },

  // -------- SEÇÃO 5: COLETA --------
  {
    kind: "section",
    id: "sec5",
    title: "5. Coleta e Criação dos Dados Pessoais",
    description:
      "Como os dados pessoais utilizados nos seus processos são coletados ou criados.",
    fields: [
      {
        id: "collect_source",
        label:
          "Como sua área recebe os dados pessoais que foram assinalados anteriormente?",
        type: "multi-choice",
        required: true,
        options: [
          "Gerado por outro departamento/setor",
          "Gerado por outra Instituição/empresa externa",
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Fornecido por terceiros ou parceiro (Ex. cadastro de acesso)",
          "Fornecido pelo governo",
          "Gerado por um sistema",
        ],
        allowOther: true,
      },
      {
        id: "collect_source_desc",
        label:
          "Considerando a questão acima. Especifique sua resposta (ex. Qual a área, como é feita a coleta com o titular, indique quais os terceiros, entidades dos governos ou sistemas. (Ex: Recebemos os dados por meio de planilha enviada pelo departamento x).",
        type: "text-long",
        required: true,
      },
      {
        id: "collect_policy_shown",
        label:
          "É apresentado ao titular do dado alguma Política ou Norma que informe quais serão as finalidades que o dado será utilizado? O que é apresentado?",
        type: "text-long",
        required: true,
      },
      {
        id: "collect_consent",
        label: "É solicitado algum tipo de consentimento ao titular do dado?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não", "N/A"],
      },
      {
        id: "collect_background_check",
        label:
          "É realizada algum tipo de busca de antecedentes criminais, trabalhistas ou de score de crédito? Caso positivo explique como acontece.",
        type: "text-long",
        required: false,
      },
    ],
  },

  // -------- SEÇÃO 6: TRANSFERÊNCIA E COMPARTILHAMENTO --------
  {
    kind: "section",
    id: "sec6",
    title: "6. Transferência e Compartilhamento dos Dados Pessoais",
    description:
      "Como os dados pessoais utilizados nos seus processos são transferidos ou compartilhados.",
    fields: [
      {
        id: "share_targets",
        label:
          "Os dados pessoais que você assinalou anteriormente são compartilhados e/ou transferidos?",
        type: "multi-choice",
        required: true,
        options: [
          "Sim, entre os departamentos da empresa",
          "Sim, entre empresas do Grupo",
          "Sim, com terceiros ou parceiros de negócio",
          "Instituições governamentais",
          "Não são compartilhados",
        ],
      },
      {
        id: "share_with_whom",
        label:
          "Considerando a questão acima, indique com quem é compartilhado informando o nome do departamento, ou do terceiro (Prestador de Serviços).",
        type: "text-short",
        required: false,
      },
      {
        id: "share_purpose",
        label: "Caso aplicável, qual é o objetivo do compartilhamento?",
        description: "(Ex. para responder uma solicitação do cliente, para ação de marketing, etc.)",
        type: "text-long",
        required: false,
      },
      {
        id: "share_data",
        label: "Quais Dados Pessoais são compartilhados com o Terceiro?",
        type: "text-long",
        required: false,
      },
      {
        id: "share_medium",
        label: "Por qual meio você realiza este compartilhamento?",
        type: "multi-choice",
        required: false,
        options: [
          "Mídia portátil (Drive USB, CD, DVD)",
          "E-mail",
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
          "N/A",
        ],
        allowOther: true,
      },
      {
        id: "share_security",
        label:
          "Existem medidas de segurança para proteção dos dados pessoais antes do compartilhamento? (Ex: A empresa possui politica de compartilhamento de dados, sites bloqueados...)",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não"],
      },
      {
        id: "share_subject_aware",
        label:
          "O titular do dado tem conhecimento do compartilhamento com terceiros?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não", "N/A"],
      },
      {
        id: "share_international",
        label:
          "Você compartilha o dado pessoal com pessoas localizadas em outros países? (Ao usar servidores estrangeiros também considera-se transferencia internacional por exemplo: Amazon, Onedrive, Outlook, WhatsApp, Youtube)",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "share_international_countries",
        label:
          "Caso afirmativo para a questão acima, indique com quais países você compartilha os dados pessoais:",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "share_international", values: ["Sim"] },
      },
    ],
  },

  // -------- SEÇÃO 7: ARMAZENAMENTO, RETENÇÃO E DESCARTE --------
  {
    kind: "section",
    id: "sec7",
    title: "7. Armazenamento, Retenção e Descarte",
    description:
      "Como os dados pessoais utilizados nos seus processos são armazenados e descartados.",
    fields: [
      {
        id: "store_format",
        label: "Em qual formato o dado pessoal é armazenado em sua área?",
        type: "multi-choice",
        required: true,
        options: [
          "Sistemas e Base de Dados (banco de dados)",
          "Arquivos eletrônicos (planilha Excel, Access, etc.)",
          "Dispositivos físicos (pen drive, CD/DVD, hard drives externos)",
          "E-mail corporativo",
          "Papel",
          "Imagens digitalizadas",
          "Áudios gravados",
          "N/A",
        ],
        allowOther: true,
      },
      {
        id: "store_location",
        label: "Onde os arquivos eletrônicos estão salvos?",
        description:
          "Especificar o caminho de rede, diretórios do google drive, sistemas utilizados, pastas locais, etc.",
        type: "text-long",
        required: true,
      },
      {
        id: "store_paper_secure",
        label:
          "Dentro da sua área, papéis contendo dados pessoais são armazenados de maneira segura, com acesso restrito apenas a pessoas autorizadas?",
        type: "single-choice",
        required: true,
        options: [
          "Nenhuma cópia impressa é armazenada",
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
          "Informações em cópia impressa são armazenadas longe de clientes e público em geral, mas geralmente não possuem controle de acesso",
          "N/A",
        ],
      },
      {
        id: "store_paper_external",
        label:
          "Sua área envia papéis contendo dados pessoais para um local de armazenamento /arquivamento externo?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
      },
      {
        id: "store_paper_external_desc",
        label:
          "Caso afirmativo, por favor descrever o local, fornecedor e procedimentos de envio do documento ao local de armazenamento",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "store_paper_external", values: ["Sim"] },
      },
      {
        id: "store_mobile_protected",
        label:
          "Os dados pessoais armazenados em dispositivos móveis (ex. pendrive) estão protegidos contra acesso não autorizado?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não", "N/A"],
      },
      {
        id: "store_mobile_measures",
        label: "Caso afirmativo, por favor detalhar as medidas utilizadas.",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "store_mobile_protected", values: ["Sim"] },
      },
      {
        id: "store_retention",
        label: "Este processo de negócio segue um calendário de retenção de dados?",
        type: "multi-choice",
        required: true,
        options: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
          "Dados pessoais não são deletados, mas são guardados anonimizados a partir do momento em que não são mais necessários para atender as exigências legais ou regulatórias",
          "Dados pessoais são retidos indefinidamente",
          "Dados são armazenados por um tempo menor do que o exigido pelas leis e  regulamentos",
          "Desconheço procedimento adotado",
        ],
        allowOther: true,
      },
      {
        id: "store_periodic_review",
        label: "O dado pessoal é revisado periodicamente?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não"],
      },
      {
        id: "store_extra_retention_reason",
        label:
          "Caso os dados sejam armazenados por prazo além do previsto em lei, por favor indique os motivos para tal.",
        type: "text-long",
        required: false,
      },
      {
        id: "store_local_backup",
        label:
          "Além do processo já realizado pela TI Corporativa, a área realiza localmente algum procedimento de backup dos arquivos eletrônicos contendo dados pessoais?",
        type: "single-choice",
        required: true,
        options: [
          "Sim, a área faz e guarda localmente uma cópia dos dados. Especificar; inclusive (i) em que tipo de mídia é realizado o backup, (ii) onde fica armazenada a mídia; (iii) por quanto tempo o backup é armazenado",
          "Não, o backup é realizado de forma centralizada pela TI",
        ],
        allowOther: true,
      },
    ],
  },
];

// ============================================================
// FORMATO PERSISTIDO em DataInventory.formAnswers (JSON)
// ============================================================

/**
 * Cada seção (sec1..sec7) é um dict { fieldId: valor }.
 * Valor pode ser:
 *   - string (text-short, text-long, single-choice)
 *   - string[] (multi-choice; quando há "Outro", o último item é "Outro: <texto>")
 *
 * O `_meta` carrega timestamps e o estado de progresso.
 */
export interface FormAnswers {
  _meta?: {
    startedAt?: string;
    lastSavedAt?: string;
    completedAt?: string;
    /** Última seção em que o user estava (id, ex: "sec3"). */
    lastStepId?: string;
  };
  sec1?: Record<string, string>;
  sec2?: Record<string, string | string[]>;
  sec3?: Record<string, string | string[]>;
  sec4?: Record<string, string | string[]>;
  sec5?: Record<string, string | string[]>;
  sec6?: Record<string, string | string[]>;
  sec7?: Record<string, string | string[]>;
}

// ============================================================
// HELPERS
// ============================================================

/** IDs de todas as seções (não inclui onboarding). */
export const SECTION_IDS = ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Total de telas do wizard, incluindo onboarding. */
export const TOTAL_STEPS = INVENTARIO_FORM_SCHEMA.length;

/** Acha um step pelo id. */
export function getStepById(id: string): WizardStep | undefined {
  return INVENTARIO_FORM_SCHEMA.find((s) => s.id === id);
}

/** Acha o índice (0-based) de um step. */
export function getStepIndex(id: string): number {
  return INVENTARIO_FORM_SCHEMA.findIndex((s) => s.id === id);
}

/**
 * Verifica se um campo deve ser exibido dada a resposta atual.
 * Usado pra dependsOn.
 */
export function isFieldVisible(
  field: FormField,
  sectionAnswers: Record<string, string | string[]>
): boolean {
  if (!field.dependsOn) return true;
  const dep = sectionAnswers[field.dependsOn.fieldId];
  if (dep == null) return false;
  if (Array.isArray(dep)) return dep.some((v) => field.dependsOn!.values.includes(v));
  return field.dependsOn.values.includes(dep);
}
