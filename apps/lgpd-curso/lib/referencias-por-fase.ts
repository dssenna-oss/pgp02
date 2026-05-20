// Catálogo de referências legais por fase do PGP.
// Alimenta o card colapsável "📚 Base legal desta fase" + modal nos mini-apps.
//
// Estrutura:
//   BIBLIOTECA  — cada artigo / resolução / guia definido UMA vez.
//   FASES       — cada fase aponta para refs da biblioteca + o "porquê" da fase.
// Para revisar o conteúdo jurídico, edite a BIBLIOTECA (texto) e o porQueImporta
// de cada fase. Conteúdo revisado pelo DPO em 2026-05-20.

export type TipoReferencia = "lei" | "resolucao" | "guia";

export type ReferenciaBase = {
  rotulo: string;
  tipo: TipoReferencia;
  textoBase?: string; // 📖 texto literal resumido (só leis/decretos)
  emMiudos: string; // 💬 versão em linguagem simples
  link?: { texto: string; url: string };
};

export type ReferenciaResolvida = ReferenciaBase & {
  id: string;
  porQueImporta: string; // 🎯 específico da fase
};

export type FaseReferencias = {
  nome: string;
  refs: ReferenciaResolvida[];
};

const LINK_LGPD = {
  texto: "Lei nº 13.709/2018 (LGPD) — texto completo no Planalto",
  url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
};

// ============================================================================
// BIBLIOTECA — cada referência definida uma única vez
// ============================================================================

const BIBLIOTECA: Record<string, ReferenciaBase> = {
  "cf-art-5-lxxix": {
    rotulo: "CF/88, Art. 5º, LXXIX — Proteção de dados como direito fundamental",
    tipo: "lei",
    textoBase:
      "\"é assegurado, nos termos da lei, o direito à proteção dos dados pessoais, inclusive nos meios digitais.\" (incluído pela Emenda Constitucional nº 115/2022)",
    emMiudos:
      "Desde 2022, proteger os dados pessoais é um direito fundamental — está no mesmo patamar da liberdade e da privacidade na Constituição.",
    link: {
      texto: "Constituição Federal — Planalto",
      url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    },
  },

  "lgpd-art-6": {
    rotulo: "LGPD, Art. 6º — Princípios do tratamento",
    tipo: "lei",
    textoBase:
      "\"As atividades de tratamento de dados pessoais deverão observar a boa-fé e os seguintes princípios:\" finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação, responsabilização e prestação de contas.",
    emMiudos:
      "Toda vez que o órgão usa um dado, precisa respeitar 10 regras de ouro. As mais cobradas: usar o dado só para a finalidade declarada, coletar só o necessário, ser transparente e conseguir provar que está em conformidade.",
    link: LINK_LGPD,
  },

  "lgpd-art-6-viii": {
    rotulo: "LGPD, Art. 6º, VIII — Princípio da prevenção",
    tipo: "lei",
    textoBase:
      "\"prevenção: adoção de medidas para prevenir a ocorrência de danos em virtude do tratamento de dados pessoais.\"",
    emMiudos:
      "É melhor prevenir do que remediar — agir antes de o problema acontecer. É o princípio que dá sentido à análise de riscos.",
    link: LINK_LGPD,
  },

  "lgpd-art-50": {
    rotulo: "LGPD, Art. 50 — Boas práticas e governança",
    tipo: "lei",
    textoBase:
      "Prevê que controladores e operadores possam implementar programa de governança em privacidade que, no mínimo, demonstre o comprometimento do agente e seja aplicável a todo o conjunto de dados pessoais (Art. 50, §2º).",
    emMiudos:
      "A lei recomenda que o órgão monte um Programa de Governança em Privacidade — o PGP, exatamente o que este curso ensina a fazer, fase por fase.",
    link: LINK_LGPD,
  },

  "lgpd-art-23": {
    rotulo: "LGPD, Art. 23 — Tratamento pelo Poder Público",
    tipo: "lei",
    textoBase:
      "\"O tratamento de dados pessoais pelas pessoas jurídicas de direito público [...] deverá ser realizado para o atendimento de sua finalidade pública, na persecução do interesse público, com o objetivo de executar as competências legais ou cumprir as atribuições legais do serviço público [...]\"",
    emMiudos:
      "O órgão público pode tratar dados do cidadão, mas só para cumprir suas funções legais e o interesse público — não para qualquer coisa.",
    link: LINK_LGPD,
  },

  "lgpd-art-5-viii": {
    rotulo: "LGPD, Art. 5º, VIII — Definição de Encarregado",
    tipo: "lei",
    textoBase:
      "\"encarregado: pessoa indicada pelo controlador e operador para atuar como canal de comunicação entre o controlador, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).\"",
    emMiudos:
      "O Encarregado (também chamado DPO) é a ponte entre o órgão, o cidadão e a ANPD.",
    link: LINK_LGPD,
  },

  "lgpd-art-41": {
    rotulo: "LGPD, Art. 41 — Designação e atribuições do Encarregado",
    tipo: "lei",
    textoBase:
      "\"O controlador deverá indicar encarregado pelo tratamento de dados pessoais.\" Entre as atividades do encarregado: aceitar reclamações dos titulares, receber comunicações da ANPD e orientar os funcionários sobre as práticas de proteção de dados.",
    emMiudos:
      "Indicar um Encarregado é obrigatório. Ele recebe as reclamações dos cidadãos, conversa com a ANPD e orienta os colegas do órgão.",
    link: LINK_LGPD,
  },

  "res-anpd-18-2024": {
    rotulo: "Resolução CD/ANPD nº 18/2024 — Atuação do Encarregado",
    tipo: "resolucao",
    emMiudos:
      "Resolução de 16/07/2024 que aprova o Regulamento sobre a atuação do Encarregado. Detalha: nomeação formal do Encarregado e de um substituto, divulgação pública do contato, independência e autonomia no exercício da função, dispensa de formação específica e possibilidade de acumular funções desde que sem conflito de interesse.",
    link: {
      texto: "Resolução CD/ANPD nº 18/2024 (PDF oficial)",
      url: "https://www.ipea.gov.br/protecaodedados/arquivos/Resolucao_cd_regulamento_atuacao_encarregado.pdf",
    },
  },

  "lgpd-art-5-x": {
    rotulo: "LGPD, Art. 5º, X — Definição de tratamento",
    tipo: "lei",
    textoBase:
      "\"tratamento: toda operação realizada com dados pessoais, como as que se referem a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.\"",
    emMiudos:
      "\"Tratar\" um dado é quase tudo — desde digitar um nome numa planilha até apagar um arquivo. Por isso o mapeamento precisa ser amplo.",
    link: LINK_LGPD,
  },

  "lgpd-art-37": {
    rotulo: "LGPD, Art. 37 — Registro das operações de tratamento",
    tipo: "lei",
    textoBase:
      "\"O controlador e o operador devem manter registro das operações de tratamento de dados pessoais que realizarem, especialmente quando baseado no legítimo interesse.\"",
    emMiudos:
      "O órgão é obrigado a manter um registro de tudo que faz com dados pessoais — é o que chamamos de inventário (ou ROPA).",
    link: LINK_LGPD,
  },

  "lgpd-art-5-defs": {
    rotulo: "LGPD, Art. 5º — Definições (dado pessoal, sensível, anonimizado)",
    tipo: "lei",
    textoBase:
      "I — dado pessoal: informação relacionada a pessoa natural identificada ou identificável. II — dado pessoal sensível: dado sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico. III — dado anonimizado.",
    emMiudos:
      "Antes de mapear é preciso saber o que conta como dado pessoal (qualquer informação que identifique alguém) e o que é dado sensível (saúde, religião, biometria... que pedem cuidado redobrado).",
    link: LINK_LGPD,
  },

  "lgpd-art-7": {
    rotulo: "LGPD, Art. 7º — Bases legais para dados comuns",
    tipo: "lei",
    textoBase:
      "\"O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses:\" consentimento; cumprimento de obrigação legal; pela administração pública, para a execução de políticas públicas; realização de estudos por órgão de pesquisa; execução de contrato; exercício de direitos em processo; proteção da vida; tutela da saúde; legítimo interesse; proteção do crédito.",
    emMiudos:
      "Nenhum dado pode ser usado \"porque sim\" — é preciso encaixar o uso numa das 10 justificativas legais. No setor público, a mais comum é a execução de políticas públicas.",
    link: LINK_LGPD,
  },

  "lgpd-art-11": {
    rotulo: "LGPD, Art. 11 — Bases legais para dados sensíveis",
    tipo: "lei",
    textoBase:
      "\"O tratamento de dados pessoais sensíveis somente poderá ocorrer nas seguintes hipóteses:\" com consentimento específico e destacado; ou, sem consentimento: cumprimento de obrigação legal; tratamento compartilhado necessário à execução de políticas públicas; estudos por órgão de pesquisa; exercício regular de direitos; proteção da vida; tutela da saúde; garantia da prevenção à fraude e à segurança do titular.",
    emMiudos:
      "Dado sensível tem uma lista própria, mais curta e mais rígida. Atenção: se for usar consentimento, ele precisa ser específico e destacado.",
    link: LINK_LGPD,
  },

  "lgpd-art-14": {
    rotulo: "LGPD, Art. 14 — Dados de crianças e adolescentes",
    tipo: "lei",
    textoBase:
      "\"O tratamento de dados pessoais de crianças e de adolescentes deverá ser realizado em seu melhor interesse [...]\" O §1º exige consentimento específico de um dos pais ou do responsável legal para o tratamento de dados de crianças.",
    emMiudos:
      "Dado de menor de idade pede cuidado especial e, em regra, consentimento de um dos pais ou responsável.",
    link: LINK_LGPD,
  },

  "lgpd-art-15-16": {
    rotulo: "LGPD, Arts. 15 e 16 — Término do tratamento e retenção",
    tipo: "lei",
    textoBase:
      "Art. 15 — o tratamento termina, entre outras hipóteses, quando a finalidade é alcançada. Art. 16 — os dados serão eliminados após o término do tratamento, ressalvada a conservação para cumprimento de obrigação legal, estudo por órgão de pesquisa, exercício regular de direitos ou uso exclusivo do controlador desde que anonimizados.",
    emMiudos:
      "Dado não se guarda para sempre. Depois que cumpriu a finalidade, deve ser eliminado — exceto se uma lei obrigar a guardá-lo por um prazo.",
    link: LINK_LGPD,
  },

  "decreto-12560-2025": {
    rotulo: "Decreto Federal nº 12.560/2025 — Dados em saúde / SUS Digital",
    tipo: "lei",
    emMiudos:
      "Decreto de 2025 que reforça regras para dados de saúde no âmbito do SUS — torna obrigatório o RIPD para o compartilhamento de dados de pacientes e veda o uso dessas informações para finalidades incompatíveis com o cuidado à saúde.",
  },

  "guia-poder-publico": {
    rotulo: "Guia ANPD — Tratamento de Dados Pessoais pelo Poder Público",
    tipo: "guia",
    emMiudos:
      "Material da ANPD que traduz a LGPD para a realidade de prefeituras, câmaras e demais órgãos públicos — com exemplos de bases legais e situações típicas do setor público.",
    link: {
      texto: "Guia ANPD — Poder Público (PDF)",
      url: "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-poder-publico-anpd-versao-final.pdf/@@display-file/file",
    },
  },

  "lgpd-art-46-49": {
    rotulo: "LGPD, Arts. 46 a 49 — Segurança e boas práticas",
    tipo: "lei",
    textoBase:
      "Art. 46 — \"Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão.\"",
    emMiudos:
      "O órgão precisa ter medidas concretas de segurança — senha, controle de acesso, backup, sigilo. Não basta \"achar\" que está seguro.",
    link: LINK_LGPD,
  },

  "guia-seguranca": {
    rotulo: "Guia ANPD — Segurança da Informação para Agentes de Pequeno Porte",
    tipo: "guia",
    emMiudos:
      "Checklist prático de segurança da informação publicado pela ANPD, pensado para órgãos e empresas de pequeno porte — com medidas mínimas viáveis.",
    link: {
      texto: "Guia ANPD — Segurança da Informação (PDF)",
      url: "https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-anpd-seguranca-informacao.pdf",
    },
  },

  "lgpd-art-5-xvii": {
    rotulo: "LGPD, Art. 5º, XVII — Relatório de impacto (RIPD)",
    tipo: "lei",
    textoBase:
      "\"relatório de impacto à proteção de dados pessoais: documentação do controlador que contém a descrição dos processos de tratamento de dados pessoais que podem gerar riscos às liberdades civis e aos direitos fundamentais, bem como medidas, salvaguardas e mecanismos de mitigação de risco.\"",
    emMiudos:
      "Quando um processo é arriscado, o órgão documenta o risco e como vai reduzi-lo — esse documento é o RIPD.",
    link: LINK_LGPD,
  },

  "res-anpd-2-2022": {
    rotulo: "Resolução CD/ANPD nº 2/2022 — Agentes de tratamento de pequeno porte",
    tipo: "resolucao",
    emMiudos:
      "Resolução que simplifica algumas obrigações para órgãos e empresas de pequeno porte e dá parâmetros sobre quando o RIPD é exigido. Muitos municípios pequenos se enquadram nesse regime.",
  },

  "lgpd-art-9": {
    rotulo: "LGPD, Art. 9º — Direito do titular à informação",
    tipo: "lei",
    textoBase:
      "\"O titular tem direito ao acesso facilitado às informações sobre o tratamento de seus dados, que deverão ser disponibilizadas de forma clara, adequada e ostensiva\" acerca da finalidade, da forma e duração do tratamento, da identificação e contato do controlador, do uso compartilhado de dados, das responsabilidades dos agentes e dos direitos do titular.",
    emMiudos:
      "O cidadão tem direito de saber, de forma clara, o que o órgão faz com os dados dele. O Aviso de Privacidade é a resposta a esse direito.",
    link: LINK_LGPD,
  },

  "lgpd-art-38": {
    rotulo: "LGPD, Art. 38 — A ANPD pode exigir o RIPD",
    tipo: "lei",
    textoBase:
      "\"A autoridade nacional poderá determinar ao controlador que elabore relatório de impacto à proteção de dados pessoais, inclusive de dados sensíveis, referente a suas operações de tratamento de dados, nos termos de regulamento, observados os segredos comercial e industrial.\"",
    emMiudos:
      "A ANPD pode, a qualquer momento, pedir o RIPD de um processo. Ter o relatório pronto é uma forma de se antecipar.",
    link: LINK_LGPD,
  },

  "guia-ripd": {
    rotulo: "ANPD — Orientações sobre o Relatório de Impacto (RIPD)",
    tipo: "guia",
    emMiudos:
      "Página e materiais da ANPD com orientações sobre quando e como elaborar o RIPD. Atenção: ainda não há um regulamento específico do RIPD — o tema está na agenda regulatória 2025-2026 da ANPD.",
    link: {
      texto: "ANPD — Relatório de Impacto (RIPD)",
      url: "https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/relatorio-de-impacto-a-protecao-de-dados-pessoais-ripd",
    },
  },

  "lgpd-art-5-vii": {
    rotulo: "LGPD, Art. 5º, VII — Definição de operador",
    tipo: "lei",
    textoBase:
      "\"operador: pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador.\"",
    emMiudos:
      "Operador é quem trata dados \"para\" o órgão — a empresa do sistema, a nuvem, o call center terceirizado.",
    link: LINK_LGPD,
  },

  "lgpd-art-39": {
    rotulo: "LGPD, Art. 39 — O operador segue as instruções do controlador",
    tipo: "lei",
    textoBase:
      "\"O operador deverá realizar o tratamento segundo as instruções fornecidas pelo controlador, que verificará a observância das próprias instruções e das normas sobre a matéria.\"",
    emMiudos:
      "O terceiro só pode fazer o que o órgão mandou — e o órgão precisa fiscalizar isso, geralmente por meio de cláusulas no contrato.",
    link: LINK_LGPD,
  },

  "lgpd-art-42-44": {
    rotulo: "LGPD, Arts. 42 a 44 — Responsabilidade e ressarcimento",
    tipo: "lei",
    textoBase:
      "Art. 42 — quem, no exercício de atividade de tratamento, causar a outrem dano patrimonial, moral, individual ou coletivo, em violação à legislação de proteção de dados, é obrigado a repará-lo. Art. 44 — o tratamento é irregular quando deixa de observar a legislação ou quando não fornece a segurança que o titular dele pode esperar.",
    emMiudos:
      "Se o terceiro vazar dados, o órgão também pode responder. Por isso escolher e fiscalizar bem o terceiro protege o próprio órgão.",
    link: LINK_LGPD,
  },

  "lgpd-art-33-36": {
    rotulo: "LGPD, Arts. 33 a 36 + Resolução CD/ANPD nº 19/2024 — Transferência internacional",
    tipo: "lei",
    textoBase:
      "Os Arts. 33 a 36 da LGPD definem em quais hipóteses dados pessoais podem ser transferidos para fora do Brasil. A Resolução CD/ANPD nº 19/2024 aprovou cláusulas-padrão contratuais que passaram a ser obrigatórias nesses contratos.",
    emMiudos:
      "Enviar dados para fora do Brasil (por exemplo, uma nuvem hospedada em outro país) só é permitido em certas condições. A Resolução 19/2024 criou cláusulas-padrão contratuais obrigatórias para esses casos.",
    link: {
      texto: "ANPD — Transferência Internacional de Dados",
      url: "https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados",
    },
  },

  "lgpd-art-18": {
    rotulo: "LGPD, Art. 18 — Direitos do titular",
    tipo: "lei",
    textoBase:
      "\"O titular dos dados pessoais tem direito a obter do controlador, em relação aos dados do titular por ele tratados, a qualquer momento e mediante requisição:\" confirmação da existência de tratamento; acesso aos dados; correção; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade; eliminação dos dados tratados com consentimento; informação sobre compartilhamentos; informação sobre a possibilidade de não consentir; revogação do consentimento.",
    emMiudos:
      "O cidadão pode pedir ao órgão: confirmar se há dados dele, ver esses dados, corrigir, eliminar, entre outros. O órgão é obrigado a responder.",
    link: LINK_LGPD,
  },

  "lgpd-art-19": {
    rotulo: "LGPD, Art. 19 — Prazos de resposta ao titular",
    tipo: "lei",
    textoBase:
      "O titular tem direito à confirmação de tratamento e ao acesso aos dados em formato simplificado, imediatamente, ou por meio de declaração clara e completa no prazo de até 15 (quinze) dias, contado da data do requerimento.",
    emMiudos:
      "O órgão não pode enrolar — há prazo. A resposta completa deve sair em até 15 dias contados do pedido.",
    link: LINK_LGPD,
  },

  "lgpd-art-20": {
    rotulo: "LGPD, Art. 20 — Revisão de decisões automatizadas",
    tipo: "lei",
    textoBase:
      "\"O titular dos dados tem direito a solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses, incluídas as decisões destinadas a definir o seu perfil pessoal, profissional, de consumo e de crédito ou os aspectos de sua personalidade.\"",
    emMiudos:
      "Se um sistema decidiu algo sozinho sobre o cidadão (por exemplo, negou um benefício automaticamente), ele tem direito de pedir a revisão dessa decisão.",
    link: LINK_LGPD,
  },

  "lgpd-art-48": {
    rotulo: "LGPD, Art. 48 — Comunicação de incidente de segurança",
    tipo: "lei",
    textoBase:
      "\"O controlador deverá comunicar à autoridade nacional e ao titular a ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares.\"",
    emMiudos:
      "Se houver um vazamento ou incidente que possa prejudicar o cidadão, o órgão é obrigado a avisar a ANPD e as pessoas afetadas.",
    link: LINK_LGPD,
  },

  "res-anpd-15-2024": {
    rotulo: "Resolução CD/ANPD nº 15/2024 — Comunicação de Incidente de Segurança",
    tipo: "resolucao",
    emMiudos:
      "Resolução de 2024 que regulamenta a comunicação de incidentes: define o prazo para comunicar à ANPD (3 dias úteis a partir da ciência), o conteúdo mínimo da comunicação e o uso do formulário oficial.",
    link: {
      texto: "ANPD — Resolução de Comunicação de Incidentes",
      url: "https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-resolucao-comunicacao-incidentes",
    },
  },

  "res-anpd-4-2023": {
    rotulo: "Resolução CD/ANPD nº 4/2023 — Dosimetria e aplicação de sanções",
    tipo: "resolucao",
    emMiudos:
      "Resolução que define como a ANPD calcula as multas e demais sanções administrativas — quais circunstâncias pesam a favor e contra o órgão fiscalizado.",
  },
};

// ============================================================================
// FASES — cada fase aponta para refs da biblioteca + o porquê de cada uma
// ============================================================================

type RefDaFase = { id: string; porQueImporta: string };

const FASES: Record<string, { nome: string; refs: RefDaFase[] }> = {
  fundacao: {
    nome: "Fundação — Entendendo o PGP",
    refs: [
      {
        id: "cf-art-5-lxxix",
        porQueImporta:
          "Mostra que o PGP não é burocracia: é o cumprimento de um direito constitucional do cidadão.",
      },
      {
        id: "lgpd-art-6",
        porQueImporta:
          "É a régua de tudo no curso — cada missão testa um ou mais desses princípios.",
      },
      {
        id: "lgpd-art-50",
        porQueImporta:
          "Explica por que o curso é estruturado em fases: elas são o PGP em ação.",
      },
      {
        id: "lgpd-art-23",
        porQueImporta:
          "Deixa claro que a administração pública tem regras próprias, diferentes de uma empresa privada.",
      },
    ],
  },

  encarregado: {
    nome: "Fase 1 — Encarregado e governança",
    refs: [
      {
        id: "lgpd-art-5-viii",
        porQueImporta: "Apresenta o papel central do curso — quem é o DPO do grupo.",
      },
      {
        id: "lgpd-art-41",
        porQueImporta: "Define o que o DPO do grupo faz na prática.",
      },
      {
        id: "res-anpd-18-2024",
        porQueImporta:
          "É a regra mais atual e específica sobre o papel do Encarregado — leitura obrigatória para quem assume essa função.",
      },
    ],
  },

  escopo: {
    nome: "Fase 2 — Escopo e processos críticos",
    refs: [
      {
        id: "lgpd-art-5-x",
        porQueImporta:
          "Ajuda o grupo a enxergar todos os processos que entram no escopo do mapeamento.",
      },
      {
        id: "lgpd-art-37",
        porQueImporta:
          "É a obrigação legal que justifica a fase seguinte — o Inventário.",
      },
    ],
  },

  inventario: {
    nome: "Fase 3 — Inventário e Bases Legais",
    refs: [
      {
        id: "lgpd-art-5-defs",
        porQueImporta: "O grupo classifica cada dado do processo — comum ou sensível.",
      },
      {
        id: "lgpd-art-37",
        porQueImporta: "É a base legal do preenchimento do inventário.",
      },
      {
        id: "lgpd-art-7",
        porQueImporta:
          "O grupo escolhe a base legal de cada processo que trata dados comuns.",
      },
      {
        id: "lgpd-art-11",
        porQueImporta:
          "Quando o processo tem dado sensível (ex.: Posto de Saúde), a base legal sai daqui, não do Art. 7º.",
      },
      {
        id: "lgpd-art-14",
        porQueImporta:
          "Se o processo envolve menores (escola, pediatria, estágio jovem), o grupo precisa sinalizar.",
      },
      {
        id: "lgpd-art-15-16",
        porQueImporta: "O grupo define o prazo de retenção de cada processo.",
      },
      {
        id: "decreto-12560-2025",
        porQueImporta:
          "Relevante para o processo \"Posto de Saúde\" de Vegas, que trata dados de pacientes.",
      },
      {
        id: "guia-poder-publico",
        porQueImporta:
          "Traduz a LGPD para a realidade de prefeituras e câmaras — apoio direto ao preenchimento.",
      },
    ],
  },

  gap: {
    nome: "Fase 4 — Diagnóstico de conformidade (GAP)",
    refs: [
      {
        id: "lgpd-art-50",
        porQueImporta:
          "O GAP mede o quanto o órgão já aderiu às boas práticas de governança.",
      },
      {
        id: "lgpd-art-6",
        porQueImporta: "Cada controle do GAP verifica, na prática, um dos princípios.",
      },
      {
        id: "lgpd-art-46-49",
        porQueImporta:
          "Vários controles do GAP avaliam exatamente as medidas de segurança.",
      },
      {
        id: "guia-seguranca",
        porQueImporta:
          "Checklist prático que ajuda a responder os controles de segurança do GAP.",
      },
    ],
  },

  "fase-5": {
    nome: "Fase 5 — Análise de Riscos e Plano de Ação",
    refs: [
      {
        id: "lgpd-art-6-viii",
        porQueImporta: "É o princípio que dá sentido à análise de riscos.",
      },
      {
        id: "lgpd-art-5-xvii",
        porQueImporta: "Conecta a análise de risco ao RIPD da Fase 6.",
      },
      {
        id: "lgpd-art-46-49",
        porQueImporta:
          "As medidas de segurança são a principal resposta aos riscos identificados.",
      },
      {
        id: "res-anpd-2-2022",
        porQueImporta:
          "Ajuda a calibrar o esforço de análise de risco ao tamanho do órgão.",
      },
    ],
  },

  aviso: {
    nome: "Fase 6 — Aviso de Privacidade",
    refs: [
      {
        id: "lgpd-art-9",
        porQueImporta: "É o \"índice\" do que o Aviso de Privacidade precisa conter.",
      },
      {
        id: "lgpd-art-6",
        porQueImporta:
          "Em especial o princípio da transparência (inciso VI): o Aviso é a transparência colocada em prática.",
      },
    ],
  },

  ripd: {
    nome: "Fase 6 — RIPD",
    refs: [
      {
        id: "lgpd-art-5-xvii",
        porQueImporta: "Define o que é o RIPD — o documento central desta fase.",
      },
      {
        id: "lgpd-art-38",
        porQueImporta: "Justifica produzir o RIPD mesmo antes de a ANPD pedir.",
      },
      {
        id: "res-anpd-2-2022",
        porQueImporta: "Dá parâmetros sobre quando o RIPD é exigido.",
      },
      {
        id: "guia-ripd",
        porQueImporta: "Orientações práticas da ANPD sobre como elaborar o RIPD.",
      },
    ],
  },

  terceiros: {
    nome: "Fase 6 — Gestão de Terceiros",
    refs: [
      {
        id: "lgpd-art-5-vii",
        porQueImporta: "Identifica quem são os operadores (terceiros) do processo.",
      },
      {
        id: "lgpd-art-39",
        porQueImporta:
          "Justifica a cláusula de proteção de dados nos contratos com terceiros.",
      },
      {
        id: "lgpd-art-42-44",
        porQueImporta:
          "Mostra o risco de não gerir bem os terceiros — a responsabilidade pode recair sobre o órgão.",
      },
      {
        id: "lgpd-art-33-36",
        porQueImporta:
          "Relevante quando o terceiro ou o sistema está hospedado fora do Brasil.",
      },
    ],
  },

  dsr: {
    nome: "Fase 6 — Direitos do Titular",
    refs: [
      {
        id: "lgpd-art-18",
        porQueImporta:
          "É a lista do que o canal de atendimento ao titular precisa cobrir.",
      },
      {
        id: "lgpd-art-19",
        porQueImporta: "Define o prazo que o grupo precisa cumprir na missão do DSR.",
      },
      {
        id: "lgpd-art-20",
        porQueImporta:
          "Direito mais técnico — importante quando há sistemas que decidem automaticamente.",
      },
    ],
  },

  incidentes: {
    nome: "Fase 7 — Resposta a Incidentes",
    refs: [
      {
        id: "lgpd-art-48",
        porQueImporta: "É a obrigação central da missão de incidentes.",
      },
      {
        id: "lgpd-art-46-49",
        porQueImporta: "A segurança é o que previne o incidente acontecer.",
      },
      {
        id: "res-anpd-15-2024",
        porQueImporta:
          "É o \"manual\" da comunicação — o grupo segue esse roteiro na missão.",
      },
      {
        id: "res-anpd-4-2023",
        porQueImporta: "Mostra a consequência de não tratar bem um incidente.",
      },
    ],
  },
};

/**
 * Resolve as referências de uma fase (junta a biblioteca com o porquê da fase).
 * Retorna null se a faseKey não existir.
 */
export function referenciasDaFase(faseKey: string): FaseReferencias | null {
  const fase = FASES[faseKey];
  if (!fase) return null;
  const refs: ReferenciaResolvida[] = [];
  for (const r of fase.refs) {
    const base = BIBLIOTECA[r.id];
    if (!base) continue;
    refs.push({ ...base, id: r.id, porQueImporta: r.porQueImporta });
  }
  return { nome: fase.nome, refs };
}
