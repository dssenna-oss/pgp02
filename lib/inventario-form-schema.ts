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
  /** Conteúdo de ajuda (ícone "?" ao lado da label). Opcional. */
  help?: FieldHelp;
}

/**
 * Conteúdo de ajuda contextual de um field. Renderizado no popover do
 * "?" ao lado da label da pergunta. Tudo opcional — se ausente, o ícone
 * de help nem aparece.
 *
 * `feedsInto` referencia ids de `MINI_APPS` (lib/inventario-mini-apps.ts).
 *
 * `criticidade` controla se aparece selo de atenção. Use "alta" só pra
 * perguntas sensíveis (dado sensível, criança, transferência internacional,
 * decisão automatizada, marketing, etc.).
 */
export interface FieldHelp {
  /** Por que essa pergunta importa — 1-2 frases simples. */
  why: string;
  /** Artigo da LGPD diretamente relacionado. */
  lgpd?: { artigo: string; resumo: string };
  /** Mini-apps (ids de MINI_APPS) que essa resposta vai alimentar. */
  feedsInto: string[];
  /** Selo de criticidade — só aparece se "alta" ou "media". */
  criticidade?: "alta" | "media";
  /** Exemplos práticos pra ilustrar. Mostrados num bloco "Ver exemplos". */
  exemplos?: string[];
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
        help: {
          why: "Pra registrar quem foi a pessoa responsável por descrever este tratamento de dados. A LGPD exige que a empresa saiba quem trata cada informação dentro dela.",
          lgpd: {
            artigo: "Art. 37",
            resumo:
              "O controlador deve manter registro das operações de tratamento de dados pessoais.",
          },
          feedsInto: ["inventario", "ripd"],
        },
      },
      {
        id: "respondent_role",
        label: "Cargo",
        type: "text-short",
        required: true,
        help: {
          why: "O cargo ajuda a entender quem tem autoridade sobre esse tratamento. Em auditoria, saber se foi um analista, gerente ou diretor que descreveu o processo dá contexto sobre a confiabilidade da informação.",
          lgpd: {
            artigo: "Art. 50",
            resumo:
              "Boas práticas de governança em privacidade pedem clareza sobre papéis e responsabilidades.",
          },
          feedsInto: ["inventario", "riscos", "ripd"],
        },
      },
      {
        id: "respondent_email",
        label: "E-mail",
        type: "text-short",
        required: true,
        autoFillFrom: "session.email",
        help: {
          why: "Canal de contato pra dúvidas sobre este mapeamento — auditorias internas, atualizações no processo, ou pedidos de titulares (ex: 'quem descreveu como meus dados são tratados?').",
          lgpd: {
            artigo: "Art. 18",
            resumo:
              "Titulares podem pedir transparência sobre como seus dados são tratados — é preciso ter como rastrear quem registrou o quê.",
          },
          feedsInto: ["inventario", "ripd"],
        },
      },
      {
        id: "respondent_department",
        label: "Departamento",
        type: "text-short",
        required: true,
        help: {
          why: "Permite agrupar tratamentos por área da empresa. Saber que RH, Financeiro e TI tratam dados pessoais diferentes é essencial pra Análise de Riscos e GAP — cada área tem riscos diferentes.",
          lgpd: {
            artigo: "Art. 50",
            resumo:
              "Programa de Governança em Privacidade deve cobrir todas as áreas que tratam dados pessoais — não dá pra adequar o que você não mapeou.",
          },
          feedsInto: ["inventario", "riscos", "gap", "plano-acao"],
        },
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
        help: {
          why: "Dar um nome claro ao processo ajuda a organizar seu inventário e a identificar rapidamente onde e como os dados são tratados na sua organização. É a sua referência principal — vira chave de busca em todos os documentos derivados.",
          lgpd: {
            artigo: "Art. 37",
            resumo:
              "O controlador deve manter registro das operações de tratamento de dados pessoais.",
          },
          feedsInto: ["inventario", "riscos", "diagnostico", "ripd"],
          exemplos: [
            "Bom: 'Recrutamento e Seleção de Estagiários'",
            "Bom: 'Cadastro de Munícipes para Atendimento Social'",
            "Ruim: 'Atendimento' (genérico demais)",
            "Ruim: 'Sistema X' (não diz o que faz)",
          ],
        },
      },
      {
        id: "process_purpose",
        label:
          "Descreva de forma detalhada a finalidade do tratamento dos dados pessoais. Neste item é importante que você indique como realiza a coleta do dado, como utiliza ex: São usados os dados dos colaboradores para realizar ações internas (evento de dia das mulheres).",
        type: "text-long",
        required: true,
        help: {
          why: "Detalhar a finalidade, a forma de coleta e o uso dos dados é fundamental pra demonstrar que você sabe o que faz com as informações dos titulares. Isso garante transparência e conformidade com a LGPD, evitando desvios de finalidade.",
          lgpd: {
            artigo: "Art. 6º, I e VI",
            resumo:
              "Princípios da finalidade (propósitos legítimos e específicos) e da transparência (informações claras sobre o tratamento).",
          },
          feedsInto: [
            "inventario",
            "riscos",
            "diagnostico",
            "ripd",
            "politica-privacidade",
            "plano-acao",
          ],
          criticidade: "alta",
          exemplos: [
            "Bom: 'Coleta de dados de servidores (nome, CPF, cargo) via formulário de admissão para processamento da folha de pagamento e cumprimento de obrigações fiscais e previdenciárias.'",
            "Bom: 'Coleta de dados de munícipes (nome, endereço, telefone) via sistema de agendamento online para marcação de consultas em UBS, visando a prestação de serviços de saúde pública.'",
            "Ruim: 'Coleta de dados de visitantes na portaria para controle de acesso, mas depois usa os telefones para enviar mensagens de campanhas políticas.' (Desvio de finalidade)",
            "Ruim: 'Coleta de dados de crianças em evento escolar para fins educacionais, sem detalhar quais dados, como são coletados e para que uso específico.' (Vago, falta transparência)",
          ],
        },
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
        help: {
          why: "Saber o volume de titulares ajuda a avaliar o risco e o impacto potencial de um incidente. É um fator chave pra determinar se o tratamento é de alto risco e exige medidas adicionais — volumes altos costumam exigir RIPD obrigatório e Política de Segurança formal.",
          lgpd: {
            artigo: "Art. 38",
            resumo:
              "O controlador deve elaborar Relatório de Impacto à Proteção de Dados (RIPD) quando o tratamento puder gerar riscos às liberdades civis e direitos fundamentais — a escala do tratamento é fator relevante.",
          },
          feedsInto: ["inventario", "riscos", "ripd"],
          criticidade: "alta",
        },
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
        help: {
          why: "Nomes e iniciais são dados pessoais básicos que permitem identificar o titular. Saber quais partes do nome você coleta ajuda a entender o nível de identificação e o risco associado.",
          lgpd: {
            artigo: "Art. 5º, I",
            resumo: "Define 'dado pessoal' como informação que identifica ou torna identificável uma pessoa natural.",
          },
          feedsInto: ["inventario","politica-privacidade","ripd"],
          criticidade: "media",
        },
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
        help: {
          why: "Identificar quais características dos titulares você trata ajuda a saber se são dados sensíveis, que exigem mais cuidado e justificativas específicas pela LGPD. Isso é essencial para avaliar os riscos e a conformidade do tratamento.",
          lgpd: {
            artigo: "Art. 5º, II",
            resumo: "Define 'dado pessoal sensível' como aquele sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Informações de raça/etnia para programas de cotas em concursos públicos.",
            "Dados biométricos (digitais) para controle de ponto de servidores.",
            "Informações sobre saúde para licenças médicas de servidores.",
            "Dados de gênero e idade para estatísticas demográficas em pesquisas.",
          ],
        },
      },
      {
        id: "data_filiation",
        label: "Filiação",
        type: "multi-choice",
        required: true,
        options: ["Nome do Mãe", "Nome do Pai", "N/A"],
        help: {
          why: "Saber se você coleta a filiação (nome da mãe/pai) ajuda a entender o nível de detalhe da identificação do titular. É um dado pessoal que, combinado com outros, pode ser crucial para a identificação unívoca de uma pessoa.",
          lgpd: {
            artigo: "Art. 5º, I",
            resumo: "Define 'dado pessoal' como qualquer informação que identifique ou torne identificável uma pessoa natural.",
          },
          feedsInto: ["inventario","politica-privacidade","riscos"],
          criticidade: "media",
        },
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
        help: {
          why: "Identificar quais dados oficiais você coleta ajuda a entender o escopo do tratamento e os riscos envolvidos. São informações que, se vazadas, podem causar sérios danos ao titular, como fraude de identidade.",
          lgpd: {
            artigo: "Art. 5º, I e Art. 7º, II e III",
            resumo: "Define dado pessoal e estabelece as bases legais para o tratamento, incluindo cumprimento de obrigação legal e execução de políticas públicas pela administração.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "media",
        },
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
        help: {
          why: "Identificar informações residenciais ajuda a mapear o tipo de dados pessoais que sua organização coleta e trata. Isso é essencial para entender o impacto na privacidade do titular e os riscos envolvidos.",
          lgpd: {
            artigo: "Art. 5º, I",
            resumo: "Define 'dado pessoal' como qualquer informação que identifique ou torne identificável uma pessoa natural.",
          },
          feedsInto: ["inventario","riscos","diagnostico","politica-privacidade"],
          criticidade: "media",
        },
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
        help: {
          why: "Identificar o tipo de informação sobre escolaridade ajuda a entender o perfil do titular e a verificar se esse dado é realmente necessário para a finalidade do processo, seguindo o princípio da minimização.",
          lgpd: {
            artigo: "Art. 6º, III",
            resumo: "Princípio da necessidade — o tratamento deve ser limitado ao mínimo necessário para a realização de suas finalidades.",
          },
          feedsInto: ["inventario","politica-privacidade","diagnostico","riscos"],
          criticidade: "media",
        },
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
        help: {
          why: "Você precisa saber quais dados profissionais são coletados pra garantir que são necessários e pra identificar dados sensíveis, como exames médicos, que exigem maior cuidado e base legal específica.",
          lgpd: {
            artigo: "Art. 11",
            resumo: "O tratamento de dados pessoais sensíveis exige condições específicas e bases legais mais restritas.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Exames médicos admissionais/periódicos (dado sensível).",
            "Número de matrícula do servidor (identificador).",
            "Histórico de cargos e funções (informação profissional comum).",
            "Reclamações internas de funcionário (pode conter dados sensíveis ou exigir cuidado extra).",
          ],
        },
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
        help: {
          why: "Coletar informações financeiras aumenta o risco de fraude e vazamento. Você precisa de uma base legal clara e medidas de segurança robustas para proteger esses dados, evitando prejuízos aos titulares e à sua organização.",
          lgpd: {
            artigo: "Art. 7º",
            resumo: "O tratamento de dados pessoais somente pode ser realizado mediante as bases legais previstas na lei.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Dados bancários de servidores para pagamento de salários.",
            "Informações de renda para programas sociais ou bolsas de estudo.",
            "Dados de cartão de crédito para pagamento de taxas ou serviços públicos (ex: multas, emissão de documentos).",
            "Histórico de transações para investigação de fraudes em órgãos de controle.",
          ],
        },
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
        help: {
          why: "Identificar se o processo trata dados pessoais relacionados a finanças ou histórico jurídico. Essas informações podem ser sensíveis ou de alto risco, exigindo maior proteção e bases legais específicas da LGPD.",
          lgpd: {
            artigo: "Art. 11",
            resumo: "O tratamento de dados pessoais sensíveis exige condições específicas e mais rigorosas, como consentimento explícito ou cumprimento de obrigação legal.",
          },
          feedsInto: ["inventario","riscos","ripd","politica-privacidade","politica-seguranca"],
          criticidade: "alta",
          exemplos: [
            "Dados de renda familiar mensal e patrimônio: Cadastro Único para programas sociais, declaração de bens de servidores públicos, análise de isenção de taxas.",
            "Processos em andamento / concluídos envolvendo o titular: Certidões de antecedentes criminais para concursos, processos administrativos disciplinares de servidores, processos judiciais de desapropriação.",
          ],
        },
      },
      {
        id: "data_children",
        label: "Informações sobre Crianças ou Adolescentes",
        description: "Crianças (até 12 anos incompletos)",
        type: "multi-choice",
        required: true,
        options: ["Nome", "Idade", "Sexo", "Endereço", "E-mail", "N/A"],
        help: {
          why: "Dados de crianças e adolescentes têm proteção especial pela LGPD. Você precisa identificar quais dados são coletados para garantir que o tratamento segue as regras específicas, como a necessidade de consentimento dos pais ou responsáveis.",
          lgpd: {
            artigo: "Art. 14",
            resumo: "O tratamento de dados pessoais de crianças e adolescentes deve ser realizado no seu melhor interesse e com consentimento específico e em destaque dado por pelo menos um dos pais ou responsável legal.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Nome e idade de alunos em escolas municipais",
            "Informações de saúde de crianças atendidas em postos de saúde",
            "Dados de contato de adolescentes em programas sociais",
            "Registro de participação em atividades esportivas ou culturais para menores",
          ],
        },
      },
      {
        id: "data_children_consent",
        label: "Houve consentimento de um dos pais ou responsável legal?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não", "Não sei informar", "N/A"],
        help: {
          why: "Você precisa saber se o consentimento para tratar dados de crianças e adolescentes foi dado pelos pais ou responsáveis. A LGPD exige proteção especial e consentimento específico para esses dados.",
          lgpd: {
            artigo: "Art. 14, § 1º",
            resumo: "O tratamento de dados pessoais de crianças e adolescentes deve ser realizado com consentimento específico e em destaque dado por pelo menos um dos pais ou responsável legal.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Inscrição de alunos em escolas municipais.",
            "Cadastro em programas sociais voltados para menores de idade.",
            "Atendimento em unidades de saúde pediátricas.",
            "Participação em atividades culturais ou esportivas promovidas pelo órgão.",
          ],
        },
      },
      {
        id: "data_teens",
        label: "Adolescentes (entre 12 e 18 anos)",
        type: "multi-choice",
        required: true,
        options: ["Nome", "Idade", "Sexo", "Endereço", "E-mail", "N/A"],
        help: {
          why: "A LGPD dá proteção especial aos dados de crianças e adolescentes. Saber se você trata esses dados é crucial pra garantir que as regras específicas (como o melhor interesse deles) sejam seguidas e pra evitar multas.",
          lgpd: {
            artigo: "Art. 14",
            resumo: "O tratamento de dados pessoais de crianças e adolescentes deve ser realizado em seu melhor interesse e com consentimento específico dos pais ou responsável legal, exceto em algumas situações.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Dados de alunos em escolas municipais",
            "Dados de adolescentes em programas sociais da prefeitura",
            "Dados de jovens em centros esportivos ou culturais públicos",
          ],
        },
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
        help: {
          why: "Muitas preferências são consideradas dados sensíveis pela LGPD (religião, política, sexualidade, filiação). Identificar quais você coleta é crucial para aplicar as regras mais rigorosas de tratamento e garantir a base legal correta.",
          lgpd: {
            artigo: "Art. 5º, II e Art. 11",
            resumo: "Define dado pessoal sensível e estabelece condições específicas para o seu tratamento, exigindo maior cuidado e base legal robusta.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Crenças religiosas ou filosóficas: Coleta de dados de servidores para atender a pedidos de dispensa de ponto em datas religiosas específicas.",
            "Filiação sindical: Desconto de mensalidade sindical em folha de pagamento de servidores públicos.",
            "Orientação sexual: Informações coletadas em pesquisas de diversidade e inclusão, com consentimento específico.",
            "Preferência de compra: Não se aplica diretamente a órgãos públicos, mas pode surgir em parcerias ou convênios.",
          ],
        },
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
        help: {
          why: "Informações de dispositivos móveis podem identificar o titular, rastrear seu comportamento e até revelar dados sensíveis. Saber quais você coleta ajuda a avaliar riscos e garantir a proteção necessária.",
          lgpd: {
            artigo: "Art. 5º, I e II",
            resumo: "Define 'dado pessoal' como informação que identifica ou torna identificável uma pessoa, e 'dado pessoal sensível' para categorias específicas de alto risco.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Geolocalização: Monitoramento de frota de veículos oficiais, apps de fiscalização de obras.",
            "Áudio/Vídeo: Câmeras de segurança em prédios públicos, gravações de atendimento ao cidadão.",
            "Identificador único de dispositivo (IMEI): Controle de patrimônio de celulares funcionais.",
            "Endereço de IP/Clickstream: Logs de acesso a sistemas internos ou portais de serviços públicos.",
          ],
        },
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
        help: {
          why: "Dados de saúde são considerados dados sensíveis pela LGPD. Exigem proteção extra e só podem ser tratados em situações muito específicas, como para cumprir obrigação legal ou proteger a vida do titular.",
          lgpd: {
            artigo: "Art. 5º, II e Art. 11",
            resumo: "Define dados sensíveis (incluindo dados de saúde) e estabelece condições mais rigorosas para seu tratamento.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
        },
      },
      {
        id: "data_sensitive_yn",
        label: "São tratados dados pessoais sensíveis?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "Dados pessoais sensíveis têm proteção especial pela LGPD, pois seu tratamento indevido pode gerar discriminação. Identificá-los é crucial para aplicar as regras mais rigorosas de segurança e base legal.",
          lgpd: {
            artigo: "Art. 5º, II e Art. 11",
            resumo: "Define o que são dados pessoais sensíveis e estabelece condições específicas e mais restritivas para seu tratamento.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Dados de saúde (prontuários médicos em hospitais públicos, atestados em RH)",
            "Origem racial ou étnica (cotas em concursos, programas sociais)",
            "Filiação sindical (servidores públicos)",
            "Dados biométricos (controle de ponto, acesso a sistemas)",
            "Convicção religiosa (atendimento a minorias)",
          ],
        },
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
        help: {
          why: "Dados sensíveis têm proteção extra pela LGPD por seu alto potencial discriminatório. Identificá-los é crucial para aplicar as salvaguardas corretas e evitar multas.",
          lgpd: {
            artigo: "Art. 5º, II e Art. 11",
            resumo: "Define o que são dados pessoais sensíveis e estabelece condições mais rigorosas para seu tratamento.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Dados de saúde: prontuários médicos de servidores ou usuários de serviços de saúde pública.",
            "Biometria: digital para controle de ponto de servidores ou reconhecimento facial em sistemas de segurança.",
            "Origem racial ou étnica: informações coletadas em pesquisas para políticas de inclusão ou cotas.",
          ],
        },
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
        help: {
          why: "Ajuda a entender quem são os titulares dos dados que sua organização trata. Isso é fundamental pra aplicar os direitos da LGPD e informar corretamente cada grupo de pessoas.",
          lgpd: {
            artigo: "Art. 6º, V",
            resumo: "Princípio da transparência — o tratamento deve garantir informações claras e acessíveis aos titulares sobre o tratamento de seus dados.",
          },
          feedsInto: ["inventario","politica-privacidade","diagnostico","ripd","riscos"],
          criticidade: "media",
        },
      },
      {
        id: "use_diff_purpose",
        label:
          "Você utiliza esses dados pessoais para finalidades diferentes daquela informada ao Titular? (Exemplo: Os dados são coletados para prestação de serviço e automaticamente são cadastrados em lista de e-mail).",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "Usar dados para uma finalidade diferente da informada ao titular é uma violação grave da LGPD. Isso quebra a confiança e expõe a organização a riscos legais e de reputação.",
          lgpd: {
            artigo: "Art. 6º, I e VI",
            resumo: "O tratamento deve ter propósitos legítimos, específicos, explícitos e informados ao titular (Finalidade) e garantir clareza sobre o tratamento dos dados (Transparência).",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Dados coletados para matrícula em escola municipal são usados para enviar propaganda de cursos particulares.",
            "Informações de contato de um cidadão que solicitou um serviço são usadas para pesquisa de satisfação sem aviso prévio.",
            "Dados de saúde de servidores para perícia médica são usados para criar um ranking de produtividade.",
          ],
        },
      },
      {
        id: "use_diff_purpose_desc",
        label: "Caso utilize para uma finalidade diversa, descreva",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_diff_purpose", values: ["Sim"] },
        help: {
          why: "Se você usa dados para algo diferente do que foi informado ao titular, isso é um risco sério de descumprimento da LGPD. A finalidade inicial precisa ser respeitada e, se houver uma nova, ela precisa de uma nova base legal e ser comunicada.",
          lgpd: {
            artigo: "Art. 6º, I",
            resumo: "O tratamento posterior de dados pessoais não pode ser incompatível com as finalidades originais informadas ao titular.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Dados de inscritos em concurso público usados para enviar e-mails de marketing de eventos da prefeitura sem aviso.",
            "Informações de saúde coletadas para atendimento médico usadas para pesquisa acadêmica sem anonimização ou consentimento.",
            "Dados de contato de cidadãos que solicitaram um serviço usados para formar uma lista de e-mails para campanhas políticas.",
          ],
        },
      },
      {
        id: "use_unnecessary_access",
        label:
          "Você tem acesso a algum dado pessoal que não é necessário para a realização desse processo? Qual? (Exemplo: Para a sua atividade são necessários apenas dados como nome, cpf porém acaba acessando toda uma base de dados).",
        type: "text-long",
        required: true,
        help: {
          why: "Essa pergunta ajuda a identificar se você está acessando dados pessoais além do estritamente necessário para sua atividade. A LGPD exige que você colete e use apenas os dados essenciais, minimizando riscos.",
          lgpd: {
            artigo: "Art. 6º, III",
            resumo: "Princípio da necessidade — o tratamento de dados deve se limitar ao mínimo necessário para a realização de suas finalidades.",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","politica-seguranca"],
          criticidade: "alta",
          exemplos: [
            "Acessar o histórico médico completo de um servidor quando só precisa confirmar se ele tem direito a um benefício específico.",
            "Ter acesso à base de dados completa de cidadãos cadastrados na prefeitura, quando sua função exige apenas consultar dados de contribuintes de um bairro específico.",
            "Um funcionário do RH que acessa dados financeiros detalhados de todos os servidores, mas sua função só exige informações de folha de pagamento.",
          ],
        },
      },
      {
        id: "use_received_external",
        label:
          "O dado pessoal é recebido de outra Instituição/empresa para prestação de serviços? (Ex: Convênios entre Instituições, cadastro para acesso ...)",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "Quando você recebe dados de outra instituição, precisa garantir que ela tinha o direito de compartilhar e que você tem uma base legal pra recebê-los. Isso define responsabilidades e evita problemas de conformidade.",
          lgpd: {
            artigo: "Art. 7º",
            resumo: "O tratamento de dados pessoais só pode ser realizado mediante uma das bases legais previstas na LGPD.",
          },
          feedsInto: ["inventario","riscos","contratos","politica-privacidade","ripd"],
          criticidade: "alta",
          exemplos: [
            "Recebimento de dados de saúde de hospitais para programas de assistência social do município.",
            "Dados de cadastro de eleitores do TRE para serviços municipais (ex: programas de cidadania).",
            "Dados de alunos de escolas estaduais para programas educacionais complementares do município.",
            "Dados de inadimplentes de concessionárias de serviços públicos para programas de renegociação de dívidas.",
          ],
        },
      },
      {
        id: "use_received_external_desc",
        label: "Caso positivo, descreva",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_received_external", values: ["Sim"] },
        help: {
          why: "Descrever como e com quem os dados são compartilhados ou transferidos é essencial pra garantir a transparência com o titular e a conformidade com a LGPD. Você precisa saber o destino do dado pra gerenciar riscos e responsabilidades.",
          lgpd: {
            artigo: "Art. 6º, VI e IX",
            resumo: "O tratamento de dados deve ser transparente e o controlador deve informar sobre o compartilhamento de dados com terceiros.",
          },
          feedsInto: ["inventario","riscos","politica-privacidade","politica-seguranca","contratos"],
          criticidade: "alta",
          exemplos: [
            "Compartilhamento com a Secretaria de Saúde Municipal para campanhas de vacinação, conforme Lei X/2020.",
            "Transferência para empresa terceirizada de gestão de folha de pagamento (Operador), conforme contrato de prestação de serviços.",
            "Compartilhamento com outros órgãos públicos para fins de fiscalização e controle, conforme convênio Y.",
            "Transferência internacional de dados para servidor de e-mail localizado nos EUA, com cláusulas contratuais padrão.",
          ],
        },
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
        help: {
          why: "Decisões automatizadas podem ter grande impacto na vida dos titulares, como acesso a serviços ou benefícios. A LGPD exige transparência e o direito do titular de pedir revisão dessas decisões.",
          lgpd: {
            artigo: "Art. 20",
            resumo: "O titular tem direito a solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais.",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","ripd"],
          criticidade: "alta",
          exemplos: [
            "Classificação automática de pedidos de auxílio social por sistema.",
            "Análise de elegibilidade para vagas em creches municipais por algoritmo.",
            "Avaliação de desempenho de servidores públicos por software.",
            "Seleção de candidatos para cursos técnicos com base em notas e critérios automatizados.",
          ],
        },
      },
      {
        id: "use_automated_decision_desc",
        label: "Descreva o processo de decisão automatizada",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "use_automated_decision", values: ["Sim"] },
        help: {
          why: "Decisões automatizadas podem ter grande impacto na vida do titular, como negar um benefício ou serviço. A LGPD exige transparência e o direito de o titular pedir revisão humana dessas decisões.",
          lgpd: {
            artigo: "Art. 20",
            resumo: "O titular tem direito a solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses.",
          },
          feedsInto: ["inventario","riscos","ripd","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Sistema que avalia automaticamente a elegibilidade de cidadãos para um programa social com base em dados de renda e cadastro único.",
            "Algoritmo que classifica automaticamente pedidos de licença ou alvará, aprovando ou negando sem intervenção humana.",
            "Uso de inteligência artificial para ranquear candidatos em concursos públicos, gerando uma lista final sem revisão manual.",
          ],
        },
      },
      {
        id: "use_marketing",
        label: "O dado pessoal é utilizado em campanhas de marketing/sociais?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "Saber se os dados são usados em campanhas ajuda a garantir que o uso está alinhado com a finalidade original e a base legal. É crucial para a transparência com o titular e para evitar uso indevido, especialmente em órgãos públicos.",
          lgpd: {
            artigo: "Art. 6º, I e Art. 9º",
            resumo: "O tratamento deve ter finalidade legítima e ser transparente, informando o titular sobre o uso de seus dados.",
          },
          feedsInto: ["inventario","riscos","politica-privacidade","diagnostico","ripd"],
          criticidade: "alta",
          exemplos: [
            "Sim, para campanhas de vacinação da Secretaria de Saúde (base legal: execução de políticas públicas).",
            "Sim, para divulgar eventos culturais da prefeitura (base legal: interesse público, com aviso claro ao titular).",
            "Não, não usamos dados pessoais para marketing ou campanhas sociais.",
            "Cuidado: usar dados de cidadãos para campanhas políticas de partidos ou candidatos é proibido.",
          ],
        },
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
        help: {
          why: "Saber a origem dos dados é fundamental para garantir a transparência com o titular e verificar se a coleta foi feita de forma legítima. Ajuda a identificar responsabilidades e riscos na cadeia de tratamento.",
          lgpd: {
            artigo: "Art. 9º, V",
            resumo: "O titular tem direito a informações claras e acessíveis sobre a origem dos seus dados pessoais.",
          },
          feedsInto: ["inventario","riscos","politica-privacidade","contratos","diagnostico"],
          criticidade: "media",
        },
      },
      {
        id: "collect_source_desc",
        label:
          "Considerando a questão acima. Especifique sua resposta (ex. Qual a área, como é feita a coleta com o titular, indique quais os terceiros, entidades dos governos ou sistemas. (Ex: Recebemos os dados por meio de planilha enviada pelo departamento x).",
        type: "text-long",
        required: true,
        help: {
          why: "É essencial mapear como os dados pessoais chegam até você e quem mais está envolvido. Isso ajuda a garantir a transparência com o titular e a controlar os riscos de segurança e compartilhamento indevido.",
          lgpd: {
            artigo: "Art. 6º, V, VI, X e Art. 37",
            resumo: "Os princípios da LGPD exigem transparência e prestação de contas, e o controlador deve manter registro das operações de tratamento, incluindo a origem dos dados.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Recebemos dados de cadastro de servidores via sistema de RH do governo estadual (ex: SIGRH).",
            "Coletamos dados de cidadãos via formulário físico na recepção para agendamento de serviços.",
            "Dados de saúde são coletados diretamente do paciente em prontuário eletrônico no posto de saúde.",
            "Compartilhamos dados de alunos com o Ministério da Educação via sistema e-MEC para censo escolar.",
          ],
        },
      },
      {
        id: "collect_policy_shown",
        label:
          "É apresentado ao titular do dado alguma Política ou Norma que informe quais serão as finalidades que o dado será utilizado? O que é apresentado?",
        type: "text-long",
        required: true,
        help: {
          why: "É fundamental que o titular saiba como seus dados serão usados. Isso garante transparência e permite que ele exerça seus direitos, como o de revogar um consentimento ou questionar o uso.",
          lgpd: {
            artigo: "Art. 9º e Art. 23, § 1º",
            resumo: "O titular tem direito a informações claras sobre o tratamento de seus dados, e o Poder Público deve dar publicidade e transparência às suas operações.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Política de Privacidade no site da prefeitura",
            "Termo de Consentimento específico para um serviço",
            "Aviso de Privacidade em edital de concurso público",
            "Informações claras em formulários de inscrição para programas sociais",
          ],
        },
      },
      {
        id: "collect_consent",
        label: "É solicitado algum tipo de consentimento ao titular do dado?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não", "N/A"],
        help: {
          why: "Saber se você pede consentimento ao titular é fundamental para verificar se o tratamento de dados tem uma base legal válida. Se você usa consentimento, ele precisa ser livre, informado e específico.",
          lgpd: {
            artigo: "Art. 7º, I e Art. 8º",
            resumo: "O consentimento é uma das bases legais para o tratamento de dados, e precisa ser livre, informado e inequívoco.",
          },
          feedsInto: ["inventario","politica-privacidade","diagnostico","gap","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Sim: Para enviar e-mails de marketing sobre novos programas sociais não obrigatórios.",
            "Sim: Para coletar dados de localização de cidadãos para um aplicativo de turismo opcional.",
            "Não: Para processar pagamentos de impostos, pois é uma obrigação legal.",
            "Não: Para fornecer dados para o SUS, pois é execução de política pública.",
          ],
        },
      },
      {
        id: "collect_background_check",
        label:
          "É realizada algum tipo de busca de antecedentes criminais, trabalhistas ou de score de crédito? Caso positivo explique como acontece.",
        type: "text-long",
        required: false,
        help: {
          why: "Buscas de antecedentes criminais, trabalhistas ou score de crédito envolvem dados de alto risco. Você precisa ter uma base legal muito clara e uma justificativa forte para coletar e usar essas informações, evitando discriminação.",
          lgpd: {
            artigo: "Art. 11",
            resumo: "O tratamento de dados pessoais sensíveis só pode ocorrer em situações específicas, como cumprimento de obrigação legal ou execução de políticas públicas.",
          },
          feedsInto: ["inventario","riscos","ripd","politica-privacidade","politica-seguranca"],
          criticidade: "alta",
          exemplos: [
            "Permitido: Concurso público para cargos que exigem idoneidade, com previsão em lei específica para a busca de antecedentes criminais.",
            "Permitido: Avaliação de crédito para concessão de empréstimos habitacionais por órgão público, se houver previsão legal e finalidade clara.",
            "Não permitido: Busca de antecedentes criminais para contratação de estagiários sem previsão legal específica ou justificativa de risco.",
            "Não permitido: Consulta de score de crédito para seleção de beneficiários de programas sociais sem base legal.",
          ],
        },
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
        help: {
          why: "Saber com quem você compartilha ou transfere dados é crucial pra garantir que todos os envolvidos sigam a LGPD. Isso afeta a responsabilidade, a base legal e a segurança dos dados do titular.",
          lgpd: {
            artigo: "Art. 7º, § 7º",
            resumo: "O tratamento de dados pessoais por pessoa jurídica de direito público deve atender à sua finalidade pública, com base legal e informações claras sobre o compartilhamento.",
          },
          feedsInto: ["inventario","riscos","contratos","politica-privacidade","ripd"],
          criticidade: "alta",
          exemplos: [
            "Compartilhamento de dados de saúde de pacientes entre uma Secretaria Municipal de Saúde e o SUS.",
            "Transferência de dados de servidores para uma empresa terceirizada que gerencia a folha de pagamento.",
            "Compartilhamento de dados de contribuintes entre a Secretaria de Finanças e a Receita Federal para fiscalização.",
            "Compartilhamento de dados de alunos entre a Secretaria de Educação e o Ministério da Educação para programas federais.",
          ],
        },
      },
      {
        id: "share_with_whom",
        label:
          "Considerando a questão acima, indique com quem é compartilhado informando o nome do departamento, ou do terceiro (Prestador de Serviços).",
        type: "text-short",
        required: false,
        dependsOn: {
          fieldId: "share_targets",
          values: [
            "Sim, entre os departamentos da empresa",
            "Sim, entre empresas do Grupo",
            "Sim, com terceiros ou parceiros de negócio",
            "Instituições governamentais",
          ],
        },
        help: {
          why: "É fundamental saber com quem seus dados são compartilhados para garantir que eles continuem protegidos e para cumprir o princípio da responsabilização. Você precisa saber quem tem acesso aos dados que você coleta.",
          lgpd: {
            artigo: "Art. 6º, X",
            resumo: "O princípio da responsabilização e prestação de contas exige que o controlador demonstre o cumprimento das normas de proteção de dados.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Secretaria Municipal de Saúde (compartilhando dados de vacinação com a Secretaria de Educação para campanhas escolares)",
            "Empresa terceirizada de folha de pagamento (compartilhando dados de servidores)",
            "Tribunal de Contas do Estado (compartilhando dados de licitações e contratos)",
            "Plataforma de gestão de processos judiciais (compartilhando dados de partes envolvidas)",
          ],
        },
      },
      {
        id: "share_purpose",
        label: "Caso aplicável, qual é o objetivo do compartilhamento?",
        description: "(Ex. para responder uma solicitação do cliente, para ação de marketing, etc.)",
        type: "text-long",
        required: false,
        dependsOn: {
          fieldId: "share_targets",
          values: [
            "Sim, entre os departamentos da empresa",
            "Sim, entre empresas do Grupo",
            "Sim, com terceiros ou parceiros de negócio",
            "Instituições governamentais",
          ],
        },
        help: {
          why: "Você precisa justificar o porquê de compartilhar dados pessoais. Isso garante que o compartilhamento é legítimo, transparente e alinhado com a finalidade original da coleta, protegendo os direitos do titular.",
          lgpd: {
            artigo: "Art. 6º, I e V; Art. 7º",
            resumo: "O tratamento e compartilhamento de dados devem ter finalidade legítima e ser transparentes, sempre embasados em uma das hipóteses legais.",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Para responder a uma requisição judicial de dados de um servidor.",
            "Para compartilhar dados de saúde de pacientes com um hospital parceiro para continuidade do tratamento.",
            "Para enviar dados de contribuintes para a Receita Federal para fiscalização tributária.",
            "Para divulgar resultados de concursos públicos, incluindo nomes e notas dos aprovados.",
          ],
        },
      },
      {
        id: "share_data",
        label: "Quais Dados Pessoais são compartilhados com o Terceiro?",
        type: "text-long",
        required: false,
        dependsOn: {
          fieldId: "share_targets",
          values: [
            "Sim, entre os departamentos da empresa",
            "Sim, entre empresas do Grupo",
            "Sim, com terceiros ou parceiros de negócio",
            "Instituições governamentais",
          ],
        },
        help: {
          why: "Você precisa saber exatamente quais dados pessoais são compartilhados pra garantir que apenas o essencial seja transferido e que o titular seja informado. Isso ajuda a controlar os riscos e a cumprir o princípio da minimização de dados.",
          lgpd: {
            artigo: "Art. 6º, III e VI",
            resumo: "O tratamento de dados deve ser limitado ao mínimo necessário para sua finalidade (necessidade) e com informações claras aos titulares (transparência).",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Nome completo, CPF, endereço e telefone (para empresa de logística que entrega correspondências)",
            "Apenas o número de matrícula do servidor (para sistema de folha de pagamento externo)",
            "Dados de saúde anonimizados (para pesquisa estatística com universidade)",
            "Nenhum dado pessoal, apenas dados agregados (se o compartilhamento for apenas de estatísticas sem identificação)",
          ],
        },
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
        dependsOn: {
          fieldId: "share_targets",
          values: [
            "Sim, entre os departamentos da empresa",
            "Sim, entre empresas do Grupo",
            "Sim, com terceiros ou parceiros de negócio",
            "Instituições governamentais",
          ],
        },
        help: {
          why: "Identificar o meio de compartilhamento é vital pra avaliar a segurança dos dados durante a transferência. Ajuda a garantir que você usa métodos seguros e evita vazamentos ou acessos não autorizados.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","politica-seguranca"],
          criticidade: "media",
          exemplos: [
            "Mídia portátil (Drive USB, CD, DVD): Exige criptografia forte e controle rigoroso de quem acessa e manuseia.",
            "E-mail: Deve ser via e-mail corporativo seguro, com criptografia e autenticação. E-mails pessoais são de alto risco.",
            "Comunicação entre aplicações externas: Exige contratos, APIs seguras e protocolos de transferência de dados criptografados (ex: SFTP, VPN).",
            "N/A: Se não há compartilhamento externo ou interno, significa que o dado fica apenas dentro do seu sistema principal.",
          ],
        },
      },
      {
        id: "share_security",
        label:
          "Existem medidas de segurança para proteção dos dados pessoais antes do compartilhamento? (Ex: A empresa possui politica de compartilhamento de dados, sites bloqueados...)",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não"],
        help: {
          why: "Garantir que os dados pessoais estejam protegidos mesmo quando são compartilhados com outras entidades. Isso evita vazamentos, uso indevido e responsabiliza sua organização.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","gap","plano-acao","politica-seguranca"],
          criticidade: "media",
          exemplos: [
            "Possuir uma política interna de compartilhamento de dados aprovada.",
            "Exigir cláusulas contratuais específicas de segurança com os parceiros.",
            "Realizar anonimização ou pseudonimização dos dados antes do envio.",
            "Utilizar criptografia para o transporte dos dados.",
          ],
        },
      },
      {
        id: "share_subject_aware",
        label:
          "O titular do dado tem conhecimento do compartilhamento com terceiros?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não", "N/A"],
        help: {
          why: "O titular precisa saber com quem seus dados são compartilhados para poder exercer seus direitos e entender o fluxo das informações. A transparência é um pilar fundamental da LGPD.",
          lgpd: {
            artigo: "Art. 6º, V e Art. 9º",
            resumo: "O tratamento deve garantir aos titulares informações claras e precisas sobre o tratamento de seus dados, incluindo o compartilhamento com terceiros.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","politica-privacidade"],
          criticidade: "media",
          exemplos: [
            "Sim, via Política de Privacidade publicada no site da prefeitura.",
            "Sim, via termo de consentimento específico assinado pelo titular.",
            "Não, mas o compartilhamento é obrigatório por lei e a informação é pública.",
            "Não, o titular não é informado sobre este compartilhamento.",
          ],
        },
      },
      {
        id: "share_international",
        label:
          "Você compartilha o dado pessoal com pessoas localizadas em outros países? (Ao usar servidores estrangeiros também considera-se transferencia internacional por exemplo: Amazon, Onedrive, Outlook, WhatsApp, Youtube)",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "A transferência de dados pessoais para outros países tem regras mais rígidas na LGPD. Você precisa saber se o dado sai do Brasil, mesmo que seja por um serviço de nuvem (cloud) que armazena dados em servidores estrangeiros.",
          lgpd: {
            artigo: "Art. 33",
            resumo: "A LGPD estabelece condições específicas para a transferência internacional de dados pessoais, exigindo um nível adequado de proteção.",
          },
          feedsInto: ["inventario","riscos","diagnostico","ripd","contratos"],
          criticidade: "alta",
          exemplos: [
            "Uso de e-mail corporativo (Outlook, Gmail) com servidores fora do Brasil",
            "Armazenamento de documentos em nuvem (OneDrive, Google Drive) com data centers internacionais",
            "Uso de plataformas de comunicação (WhatsApp, Zoom) que processam dados fora do país",
            "Hospedagem de sites ou sistemas em provedores com servidores no exterior (Amazon AWS, Google Cloud)",
          ],
        },
      },
      {
        id: "share_international_countries",
        label:
          "Caso afirmativo para a questão acima, indique com quais países você compartilha os dados pessoais:",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "share_international", values: ["Sim"] },
        help: {
          why: "Compartilhar dados com outros países tem regras específicas e mais rigorosas na LGPD. Você precisa saber para onde os dados estão indo para garantir a conformidade e proteger os titulares.",
          lgpd: {
            artigo: "Art. 33",
            resumo: "A transferência internacional de dados pessoais só é permitida em situações específicas, como para países com nível de proteção adequado ou mediante cláusulas contratuais específicas.",
          },
          feedsInto: ["inventario","riscos","ripd","contratos","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Estados Unidos (para serviços de nuvem ou software)",
            "Países da União Europeia (para cooperação internacional ou pesquisa)",
            "Países do Mercosul (para intercâmbio de informações governamentais)",
          ],
        },
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
        help: {
          why: "O formato de armazenamento impacta diretamente a segurança dos dados. Saber onde e como os dados estão guardados ajuda a identificar vulnerabilidades e aplicar as medidas de proteção adequadas.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","politica-seguranca"],
          criticidade: "media",
        },
      },
      {
        id: "store_location",
        label: "Onde os arquivos eletrônicos estão salvos?",
        description:
          "Especificar o caminho de rede, diretórios do google drive, sistemas utilizados, pastas locais, etc.",
        type: "text-long",
        required: true,
        help: {
          why: "Saber onde os dados eletrônicos estão salvos é fundamental para controlar o acesso, aplicar medidas de segurança e garantir a proteção contra perdas ou vazamentos. Ajuda a identificar vulnerabilidades.",
          lgpd: {
            artigo: "Art. 46, caput",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança técnicas e administrativas para proteger os dados pessoais.",
          },
          feedsInto: ["inventario","riscos","diagnostico","politica-seguranca","incidentes"],
          criticidade: "media",
        },
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
        help: {
          why: "Proteger dados pessoais em papel é tão importante quanto proteger dados digitais. A falta de segurança física pode levar a vazamentos, roubo de identidade e multas para a organização.",
          lgpd: {
            artigo: "Art. 49",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas para proteger os dados pessoais de acessos não autorizados e de incidentes.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca","plano-acao","incidentes"],
          criticidade: "alta",
          exemplos: [
            "Armários com chave controlada para prontuários de pacientes ou dossiês de servidores.",
            "Salas de arquivo com acesso restrito por crachá ou senha.",
            "Procedimentos claros para descarte seguro de documentos (fragmentação, incineração).",
            "Evitar deixar documentos com dados pessoais em mesas desprotegidas ou áreas de livre acesso.",
          ],
        },
      },
      {
        id: "store_paper_external",
        label:
          "Sua área envia papéis contendo dados pessoais para um local de armazenamento /arquivamento externo?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não"],
        help: {
          why: "Quando dados pessoais em papel são guardados fora da sua organização, você perde parte do controle direto. Isso aumenta o risco de acessos não autorizados ou perdas, e exige que você garanta a segurança mesmo com terceiros.",
          lgpd: {
            artigo: "Art. 47",
            resumo: "O controlador ou operador que, em razão de sua atividade, realizar tratamento de dados pessoais para terceiros, deve fornecer informações sobre as medidas de segurança.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca","contratos","incidentes"],
          criticidade: "alta",
          exemplos: [
            "Empresas de guarda de documentos e arquivos mortos",
            "Cartórios que arquivam documentos físicos",
            "Escritórios de contabilidade que guardam comprovantes de servidores",
          ],
        },
      },
      {
        id: "store_paper_external_desc",
        label:
          "Caso afirmativo, por favor descrever o local, fornecedor e procedimentos de envio do documento ao local de armazenamento",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "store_paper_external", values: ["Sim"] },
        help: {
          why: "É fundamental saber onde e como os dados são guardados para garantir sua segurança e conformidade com a LGPD. Isso ajuda a identificar responsabilidades e vulnerabilidades.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca","contratos","incidentes"],
          criticidade: "alta",
          exemplos: [
            "Local: Servidor próprio no datacenter da prefeitura, Nuvem AWS (região São Paulo), Arquivo físico na sala X do prédio Y.",
            "Fornecedor: Amazon Web Services (AWS), Empresa de guarda de documentos 'Guarda Segura Ltda'.",
            "Procedimentos de envio: Upload via SFTP com criptografia TLS, Transporte de documentos físicos em malote lacrado por empresa de segurança contratada.",
          ],
        },
      },
      {
        id: "store_mobile_protected",
        label:
          "Os dados pessoais armazenados em dispositivos móveis (ex. pendrive) estão protegidos contra acesso não autorizado?",
        type: "single-choice",
        required: true,
        options: ["Sim", "Não", "N/A"],
        help: {
          why: "Dispositivos móveis são fáceis de perder ou roubar. Proteger os dados neles é crucial pra evitar vazamentos e garantir a segurança das informações dos titulares.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca","incidentes"],
          criticidade: "alta",
          exemplos: [
            "Uso de criptografia nos pendrives ou discos externos.",
            "Proteção por senha forte nos dispositivos móveis.",
            "Restrição do uso de dispositivos móveis pessoais para dados de trabalho.",
            "Treinamento para servidores sobre manuseio seguro de dados em dispositivos móveis.",
          ],
        },
      },
      {
        id: "store_mobile_measures",
        label: "Caso afirmativo, por favor detalhar as medidas utilizadas.",
        type: "text-long",
        required: false,
        dependsOn: { fieldId: "store_mobile_protected", values: ["Sim"] },
        help: {
          why: "Detalhar as medidas de segurança no armazenamento e descarte é crucial pra proteger os dados pessoais contra acessos não autorizados ou perdas. Isso demonstra sua responsabilidade e conformidade com a LGPD.",
          lgpd: {
            artigo: "Art. 46 e Art. 6º, VII",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca","plano-acao","ripd"],
          criticidade: "alta",
          exemplos: [
            "Criptografia de dados armazenados em servidores da prefeitura",
            "Controles de acesso físico e lógico aos arquivos e sistemas",
            "Destruição física de documentos em papel por fragmentação",
            "Eliminação segura de dados digitais por sobrescrita ou desmagnetização",
          ],
        },
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
        help: {
          why: "Manter dados pessoais por mais tempo do que o necessário aumenta o risco de incidentes e viola a LGPD. Você precisa ter um prazo definido para cada tipo de dado, baseado na finalidade e em leis específicas.",
          lgpd: {
            artigo: "Art. 16",
            resumo: "Os dados pessoais devem ser eliminados após o término do tratamento, salvo exceções como cumprimento de obrigação legal ou regulatória.",
          },
          feedsInto: ["inventario","riscos","gap","diagnostico","plano-acao"],
          criticidade: "alta",
          exemplos: [
            "Dados de prontuários médicos são retidos por 20 anos, conforme legislação específica da saúde.",
            "Dados de candidatos a concursos públicos são eliminados após 5 anos do resultado final, salvo se o candidato for aprovado e nomeado.",
            "Dados de visitantes do prédio são deletados após 30 dias, a menos que haja um incidente de segurança que exija retenção para investigação.",
            "Dados de cadastro de usuários de um serviço online são mantidos enquanto a conta estiver ativa e por mais 6 meses após o cancelamento, para fins de auditoria.",
          ],
        },
      },
      {
        id: "store_periodic_review",
        label: "O dado pessoal é revisado periodicamente?",
        type: "single-choice",
        required: false,
        options: ["Sim", "Não"],
        help: {
          why: "A revisão periódica garante que os dados pessoais estejam sempre atualizados, corretos e que você não esteja guardando informações desnecessárias ou por mais tempo do que o permitido, reduzindo riscos de vazamento e multas.",
          lgpd: {
            artigo: "Art. 6º, IV",
            resumo: "Princípio da qualidade dos dados — os dados pessoais devem ser exatos, claros, relevantes e atualizados, de acordo com a necessidade e para o cumprimento da finalidade de seu tratamento.",
          },
          feedsInto: ["inventario","riscos","politica-seguranca"],
          criticidade: "media",
        },
      },
      {
        id: "store_extra_retention_reason",
        label:
          "Caso os dados sejam armazenados por prazo além do previsto em lei, por favor indique os motivos para tal.",
        type: "text-long",
        required: false,
        help: {
          why: "Manter dados pessoais por mais tempo do que o necessário aumenta os riscos de segurança e privacidade. Você precisa justificar bem qualquer prazo extra para evitar multas e provar conformidade com a LGPD.",
          lgpd: {
            artigo: "Art. 16",
            resumo: "O tratamento de dados pessoais deve ser encerrado quando atingida a finalidade, mas há exceções para sua conservação, como cumprimento de obrigação legal ou defesa em processo.",
          },
          feedsInto: ["inventario","riscos","diagnostico","plano-acao","politica-privacidade"],
          criticidade: "alta",
          exemplos: [
            "Manutenção para cumprimento de obrigação legal ou regulatória (ex: dados fiscais por 5 anos, prontuários de saúde por 20 anos).",
            "Transferência a terceiro, desde que respeitados os requisitos de tratamento de dados.",
            "Uso exclusivo do controlador, vedado acesso de terceiro, e desde que anonimizados os dados.",
            "Para defesa em processo judicial, administrativo ou arbitral.",
          ],
        },
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
        help: {
          why: "Saber onde e como os dados pessoais são armazenados, incluindo backups, é fundamental pra garantir a segurança e a integridade. Backups não controlados pela TI podem ser um grande risco de vazamento ou perda de dados.",
          lgpd: {
            artigo: "Art. 46",
            resumo: "Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
          },
          feedsInto: ["inventario","riscos","diagnostico","gap","plano-acao"],
          criticidade: "media",
          exemplos: [
            "Backup em HD externo sem criptografia, guardado na gaveta do servidor.",
            "Cópia de planilhas com dados de servidores em pendrive pessoal.",
            "Servidor de arquivos local com cópias de documentos de usuários, sem controle de acesso.",
            "Cópia de segurança de banco de dados em máquina de uso comum.",
          ],
        },
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
