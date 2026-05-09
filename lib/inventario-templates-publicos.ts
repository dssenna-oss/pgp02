/**
 * Catálogo de Modelos Padronizados de Inventário (Fatia "a" — 2026-05-11).
 *
 * Templates de processos típicos do setor público brasileiro com 60-70%
 * dos campos do formulário de Inventário pré-preenchidos. Servidor escolhe
 * um modelo → wizard abre já populado → ele só ajusta o que é específico
 * da própria instituição.
 *
 * Vocabulário:
 *   - "domínio" = grupo temático (Ouvidoria/SIC, Pessoas, Atendimento, etc.)
 *   - "modelo" = template específico aplicável (pode haver 1+ por domínio
 *     para cobrir variantes — ex: Ouvidoria conjunto vs separada).
 *
 * Cada modelo entrega um `Partial<FormAnswers>` que é mesclado com qualquer
 * coisa já presente nas respostas (mesclagem em camadas: existente vence
 * template, pra não sobrescrever input do usuário). A camada Modelo é
 * marcada via `_meta.provenance.fields[fieldId] = 'template:<id>'` pra
 * UI exibir badge "📋 Modelo" e diferenciar de "✋ Manual" / "🤖 IA".
 *
 * NÃO é fonte da verdade jurídica institucional — é PONTO DE PARTIDA.
 * Servidor sempre revisa antes de finalizar.
 *
 * Para adicionar novos modelos: ver pattern abaixo. Seguir as bases
 * legais nacionais (LAI, LGPD, Lei 13.460, Lei 14.133, Lei 11.788, etc.)
 * — não bases estaduais ou municipais (essas o servidor adiciona).
 */

import type { FormAnswers } from "./inventario-form-schema";

// ============================================================
// TIPOS
// ============================================================

export type TemplateDomain =
  | "ouvidoria_sic"
  | "pessoas"
  | "compras"
  | "documentos"
  | "atendimento"
  | "viagens"
  | "controle";

export interface InventarioTemplate {
  /** ID único, kebab-case. */
  id: string;
  /** Nome curto exibido no card. */
  nome: string;
  /** Domínio temático (agrupador na UI). */
  domain: TemplateDomain;
  /** Frase curta (até ~120 chars) explicando quando usar. */
  descricaoCurta: string;
  /** Bases legais principais aplicáveis (citação curta). */
  basesLegais: string[];
  /** Hipóteses LGPD (Art. 7 e/ou 11) tipicamente aplicáveis. */
  hipotesesLgpd: string[];
  /**
   * Quando o servidor deve preferir este modelo. 1-3 frases curtas em
   * linguagem do dia-a-dia (sem jargão jurídico).
   */
  quandoUsar: string;
  /** Tags pra busca livre — sinônimos, abreviações, sistemas comuns. */
  tags: string[];
  /**
   * Respostas pré-preenchidas. Não inclui sec1 (respondente — vem da
   * sessão) nem campos cujo valor varia muito por instituição (ex:
   * volume de titulares, local físico de armazenamento).
   */
  preenchimento: Partial<FormAnswers>;
  /**
   * IDs de campos que o template propositalmente DEIXOU EM BRANCO porque
   * são específicos da instituição. Exibidos como "⚠️ Aguarda revisão"
   * na UI quando o servidor abre o wizard.
   */
  camposPendentes: string[];
}

// ============================================================
// CATÁLOGO — 10 modelos da v1
// ============================================================

export const INVENTARIO_TEMPLATES: InventarioTemplate[] = [
  // -------- OUVIDORIA / SIC -------------------------------------------
  {
    id: "ouvidoria-sic-conjunta",
    nome: "Ouvidoria + SIC (modelo conjunto)",
    domain: "ouvidoria_sic",
    descricaoCurta:
      "Sistema único que recebe manifestações de ouvidoria E pedidos de acesso à informação no mesmo canal.",
    quandoUsar:
      "Use quando a sua instituição tem um único setor/sistema atendendo notícias de irregularidade, reclamações, sugestões, elogios, solicitações E pedidos de informação da LAI (modelo Fala.BR / 'Conta pra Gente').",
    basesLegais: [
      "Lei 13.460/2017 (Lei do Usuário do Serviço Público)",
      "Lei 12.527/2011 (LAI)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, III — execução de políticas públicas",
      "Art. 11, II 'a' — cumprimento de obrigação legal pelo controlador",
    ],
    tags: [
      "ouvidoria",
      "sic",
      "lai",
      "fala.br",
      "conta pra gente",
      "manifestação",
      "denúncia",
      "reclamação",
      "sugestão",
      "elogio",
      "solicitação",
      "pedido de informação",
      "transparência",
    ],
    preenchimento: {
      sec2: {
        process_name:
          "Atendimento integrado de Ouvidoria e Serviço de Informação ao Cidadão (SIC)",
        process_purpose:
          "Receber, analisar, encaminhar e responder manifestações de ouvidoria (notícias de irregularidade, reclamações, sugestões, elogios, solicitações) e pedidos de acesso à informação (LAI), em conformidade com a Lei 13.460/2017 e a Lei 12.527/2011. Os dados pessoais são utilizados para identificar o manifestante quando aplicável, instruir a apuração interna, encaminhar a manifestação ao setor competente e enviar a resposta formal ao cidadão dentro dos prazos legais.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["Data e Local de Nascimento"],
        data_filiation: ["N/A"],
        data_official_ids: ["CPF"],
        data_residential: ["E-mail pessoal", "Número de celular pessoal"],
        data_education: ["N/A"],
        data_professional: ["N/A"],
        data_financial: ["N/A"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["Endereço de IP"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Cidadãos", "Servidores Públicos"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Não. O acesso é restrito ao servidor da Ouvidoria/SIC encarregado da manifestação e aos setores apuradores quando necessário ao deslinde do caso.",
        use_received_external: "Não",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
        ],
        collect_source_desc:
          "Os dados são fornecidos pelo próprio cidadão ao registrar a manifestação ou pedido de informação, por meio do sistema de Ouvidoria, formulário web, e-mail, telefone ou atendimento presencial. Em manifestações anônimas (notícia de irregularidade, reclamação, sugestão), nenhum dado pessoal é exigido.",
        collect_policy_shown:
          "Política de Privacidade institucional disponível no portal, com link visível no formulário de Ouvidoria e no e-SIC. Aviso de tratamento de dados destacado no momento do registro da manifestação.",
        collect_consent: "Não",
        collect_background_check: "Não é realizada qualquer busca de antecedentes do manifestante.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Setores internos competentes para apuração (a depender do tema da manifestação). Em casos de denúncia com indício de irregularidade que escape à competência institucional, encaminhamento à Controladoria Geral, Ministério Público ou Tribunal de Contas.",
        share_purpose:
          "Instruir a apuração interna da manifestação e/ou cumprir obrigação legal de encaminhamento a órgão de controle competente.",
        share_data:
          "Apenas os dados estritamente necessários ao desfecho do caso. Identidade do manifestante preservada quando solicitado sigilo (Art. 31 da LAI; Art. 4º, §3º da Lei 13.460/2017).",
        share_medium: ["Comunicação entre aplicações internas da instituição"],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: ["Sistemas e Base de Dados (banco de dados)"],
        store_paper_secure: "Nenhuma cópia impressa é armazenada",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc", // específico do sistema usado
      "sec7.store_location",
      "sec7.store_extra_retention_reason",
    ],
  },
  {
    id: "ouvidoria-apenas",
    nome: "Ouvidoria (sem SIC)",
    domain: "ouvidoria_sic",
    descricaoCurta:
      "Setor que atende somente manifestações de ouvidoria (Lei 13.460), sem responder pedidos de acesso à informação.",
    quandoUsar:
      "Use quando a Ouvidoria opera em estrutura separada do SIC e cuida apenas de notícias de irregularidade, reclamações, sugestões, elogios e solicitações dos usuários do serviço.",
    basesLegais: [
      "Lei 13.460/2017 (Lei do Usuário do Serviço Público)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: ["Art. 7º, III — execução de políticas públicas"],
    tags: [
      "ouvidoria",
      "manifestação",
      "denúncia",
      "reclamação",
      "sugestão",
      "elogio",
      "solicitação",
      "lei do usuário",
    ],
    preenchimento: {
      sec2: {
        process_name: "Atendimento de manifestações de Ouvidoria",
        process_purpose:
          "Receber, analisar, encaminhar e responder manifestações de usuários do serviço público (notícias de irregularidade, reclamações, sugestões, elogios e solicitações), nos termos da Lei 13.460/2017. Os dados pessoais identificam o manifestante quando aplicável, permitem o encaminhamento da manifestação ao setor competente e o envio da resposta formal dentro do prazo legal de 30 dias prorrogáveis por mais 30.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["Data e Local de Nascimento"],
        data_filiation: ["N/A"],
        data_official_ids: ["CPF"],
        data_residential: ["E-mail pessoal", "Número de celular pessoal"],
        data_education: ["N/A"],
        data_professional: ["N/A"],
        data_financial: ["N/A"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["Endereço de IP"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Cidadãos", "Servidores Públicos"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Não. Acesso restrito aos servidores da Ouvidoria e aos setores apuradores envolvidos.",
        use_received_external: "Não",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
        ],
        collect_source_desc:
          "Os dados são fornecidos pelo próprio cidadão ao registrar a manifestação por sistema, formulário web, e-mail, telefone ou atendimento presencial. Manifestação anônima é permitida nos termos da Lei 13.460/2017.",
        collect_policy_shown:
          "Política de Privacidade institucional disponível no portal, com link no formulário de Ouvidoria.",
        collect_consent: "Não",
        collect_background_check: "Não.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Setores internos competentes para apuração. Encaminhamento a órgãos externos (CGU, MP, TC) quando o tema escapar à competência institucional.",
        share_purpose:
          "Instruir a apuração interna ou encaminhar à autoridade competente quando a matéria não for de competência institucional.",
        share_data: "Apenas o necessário ao deslinde da manifestação. Sigilo do manifestante preservado quando solicitado.",
        share_medium: ["Comunicação entre aplicações internas da instituição"],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: ["Sistemas e Base de Dados (banco de dados)"],
        store_paper_secure: "Nenhuma cópia impressa é armazenada",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec7.store_location",
    ],
  },
  {
    id: "sic-apenas",
    nome: "Serviço de Informação ao Cidadão (SIC + e-SIC)",
    domain: "ouvidoria_sic",
    descricaoCurta:
      "Setor que atende somente pedidos de acesso à informação (LAI), físico ou via e-SIC. Separado da Ouvidoria.",
    quandoUsar:
      "Use quando o SIC funciona como setor próprio (sala de atendimento físico e/ou e-SIC), separado da Ouvidoria. Atende exclusivamente pedidos de informação e seus recursos.",
    basesLegais: [
      "Lei 12.527/2011 (LAI)",
      "Decreto 7.724/2012 (regulamenta a LAI federal — análogos estaduais/municipais)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal pelo controlador",
      "Art. 7º, III — execução de políticas públicas",
    ],
    tags: [
      "sic",
      "e-sic",
      "lai",
      "lei de acesso à informação",
      "pedido de informação",
      "transparência",
      "recurso lai",
    ],
    preenchimento: {
      sec2: {
        process_name: "Atendimento de pedidos de acesso à informação (SIC / e-SIC)",
        process_purpose:
          "Receber, instruir, responder e gerir recursos de pedidos de acesso à informação formulados nos termos da Lei 12.527/2011 e regulamentos análogos. Os dados pessoais identificam o solicitante (exigência da LAI), permitem o registro do pedido, a entrega da resposta e o exercício do direito de recurso. Prazo legal: 20 dias prorrogáveis por mais 10.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["N/A"],
        data_filiation: ["N/A"],
        data_official_ids: ["CPF", "RG (número, data de emissão e órgão expedidor)"],
        data_residential: ["E-mail pessoal", "Endereço Residencial"],
        data_education: ["N/A"],
        data_professional: ["N/A"],
        data_financial: ["N/A"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["Endereço de IP"],
        data_health: ["N/A"],
        data_sensitive_yn: "Sim",
        data_sensitive_list: ["N/A"], // Sigilo da identidade do solicitante (Art. 10 §1º LAI) — DPO confirma
      },
      sec4: {
        use_subjects: ["Cidadãos"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Não. Acesso restrito ao servidor responsável pelo SIC e à autoridade recursal nos casos de recurso.",
        use_received_external: "Não",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
        ],
        collect_source_desc:
          "Os dados são fornecidos pelo próprio cidadão ao formular o pedido por meio do e-SIC, balcão físico ou outros canais oficiais. A identificação é exigência da LAI.",
        collect_policy_shown:
          "Política de Privacidade institucional disponível no portal e link visível no e-SIC.",
        collect_consent: "Não",
        collect_background_check: "Não.",
      },
      sec6: {
        share_targets: ["Sim, entre os departamentos da empresa"],
        share_with_whom:
          "Setores detentores da informação solicitada (para instrução do pedido) e autoridade superior (para análise de recursos).",
        share_purpose:
          "Permitir a instrução do pedido pelo setor que detém a informação e o exame de recursos pelas instâncias previstas na LAI.",
        share_data:
          "Identidade do solicitante quando estritamente necessária à instrução. A LAI assegura sigilo da identidade do solicitante (Art. 10, §1º).",
        share_medium: ["Comunicação entre aplicações internas da instituição"],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: ["Sistemas e Base de Dados (banco de dados)"],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec3.data_sensitive_list", // sigilo do solicitante é dado sensível por jurisprudência
      "sec5.collect_source_desc",
      "sec7.store_location",
    ],
  },

  // -------- PESSOAS / RH ----------------------------------------------
  {
    id: "estagio",
    nome: "Programa de Estágio",
    domain: "pessoas",
    descricaoCurta:
      "Seleção e gestão de estagiários (Lei 11.788/2008). Costuma envolver dado de instituição de ensino e termo de compromisso.",
    quandoUsar:
      "Use para o ciclo completo do estágio: edital de seleção → matrícula → termo de compromisso tripartite → folha de bolsa → desligamento. Inclui jovem aprendiz se a instituição tiver.",
    basesLegais: [
      "Lei 11.788/2008 (Lei do Estágio)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, V — execução de contrato (termo de compromisso de estágio)",
      "Art. 7º, II — cumprimento de obrigação legal",
    ],
    tags: [
      "estágio",
      "estagiário",
      "lei 11.788",
      "termo de compromisso",
      "iel",
      "ciee",
      "agente de integração",
      "bolsa estágio",
    ],
    preenchimento: {
      sec2: {
        process_name: "Programa de Estágio (seleção e gestão de estagiários)",
        process_purpose:
          "Selecionar, contratar e gerir estagiários nos termos da Lei 11.788/2008. Os dados pessoais são utilizados para verificar requisitos (matrícula ativa, frequência, idade), formalizar o termo de compromisso tripartite (estagiário, instituição de ensino, parte concedente), processar o pagamento da bolsa e do auxílio-transporte, gerir frequência e desligamento ao final do prazo.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Nome do meio", "Sobrenome"],
        data_personal: ["Idade", "Data e Local de Nascimento", "Gênero", "Estado Civil"],
        data_filiation: ["Nome do Mãe", "Nome do Pai"],
        data_official_ids: ["CPF", "RG (número, data de emissão e órgão expedidor)", "PIS/PASEP"],
        data_residential: ["Endereço Residencial", "E-mail pessoal", "Número de celular pessoal"],
        data_education: ["Histórico acadêmico"],
        data_professional: ["N/A"],
        data_financial: ["Dados bancários (banco, agência e conta)"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["Nome", "Idade", "Endereço", "E-mail"], // jovem aprendiz pode ser adolescente
        data_preferences: ["N/A"],
        data_mobile: ["N/A"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Terceiros"], // estagiário não é servidor
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Não. Acesso restrito ao setor de RH/Gestão de Pessoas, à chefia imediata e ao supervisor de estágio.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Recebimento de dados do estagiário pela instituição de ensino e/ou agente de integração (ex: CIEE, IEL) por meio de planilhas, sistemas próprios ou e-mail. O agente de integração frequentemente atua como Operador.",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Fornecido por terceiros ou parceiro (Ex. cadastro de acesso)",
        ],
        collect_source_desc:
          "Dados coletados diretamente do estagiário no ato da inscrição/contratação e da instituição de ensino e/ou agente de integração para verificação dos requisitos legais (matrícula ativa, frequência mínima).",
        collect_policy_shown: "Política de Privacidade da instituição + cláusula no termo de compromisso de estágio.",
        collect_consent: "Não",
        collect_background_check: "Não. A Lei 11.788 não exige consulta a antecedentes para estágio em geral.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Sim, com terceiros ou parceiros de negócio",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Departamento de RH, chefia imediata, agente de integração (CIEE/IEL), instituição de ensino conveniada, banco pagador da bolsa, eSocial.",
        share_purpose:
          "Formalização do termo de compromisso, pagamento da bolsa e auxílio-transporte, registro no eSocial, controle de frequência e cumprimento de obrigações legais.",
        share_data:
          "Dados cadastrais, dados bancários (para o banco pagador), CPF e PIS/PASEP (para eSocial), histórico acadêmico (para a instituição de ensino).",
        share_medium: [
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
        ],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel",
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec6.share_with_whom", // nome do agente de integração específico
      "sec7.store_location",
      "sec7.store_extra_retention_reason", // tabela de temporalidade própria
    ],
  },
  {
    id: "cadastro-servidor-rh",
    nome: "Cadastro de Servidor / RH",
    domain: "pessoas",
    descricaoCurta:
      "Cadastro funcional do servidor estatutário: posse, dossiê, dependentes, lotação, progressão. Vínculo contínuo enquanto durar a relação.",
    quandoUsar:
      "Use para o cadastro funcional contínuo do servidor (não para a folha de pagamento — essa é processo separado). Inclui dossiê de dependentes, evoluções funcionais, frequência, férias, licenças.",
    basesLegais: [
      "Lei 8.112/1990 (regime federal — análogos estaduais/municipais)",
      "Constituição Federal Art. 37 (princípios da Administração Pública)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal",
      "Art. 7º, III — execução de políticas públicas",
      "Art. 11, II 'a' e 'g' — obrigação legal e tutela da saúde (atestados, perícia)",
    ],
    tags: [
      "rh",
      "recursos humanos",
      "servidor",
      "estatutário",
      "cadastro funcional",
      "dossiê",
      "lei 8.112",
      "siape",
      "esocial",
      "frequência",
      "férias",
      "licenças",
    ],
    preenchimento: {
      sec2: {
        process_name: "Cadastro Funcional de Servidor (Gestão de Pessoas)",
        process_purpose:
          "Manter o cadastro funcional do servidor durante toda a relação estatutária — posse, lotação, evoluções, dependentes, frequência, férias, licenças, atestados, progressões, aposentadoria. Os dados pessoais são utilizados para cumprimento das obrigações trabalhistas, previdenciárias e fiscais, processamento de benefícios funcionais, gestão de carreira e atendimento de obrigações de transparência ativa.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Nome do meio", "Sobrenome"],
        data_personal: [
          "Idade",
          "Data e Local de Nascimento",
          "Gênero",
          "Nacionalidade",
          "Naturalidade",
          "Estado Civil",
          "Fotografias",
          "Número de filhos",
          "Raça ou Origem Étnica",
        ],
        data_filiation: ["Nome do Mãe", "Nome do Pai"],
        data_official_ids: [
          "CPF",
          "RG (número, data de emissão e órgão expedidor)",
          "CNH (número, data de emissão e órgão expedidor)",
          "CTPS",
          "PIS/PASEP",
          "Certidão de Nascimento",
          "Carteira SUS",
        ],
        data_residential: [
          "Endereço Residencial",
          "Telefone Residencial",
          "E-mail pessoal",
          "Número de celular pessoal",
        ],
        data_education: ["Diplomas e escolaridade", "Licenças e associação profissional", "Histórico acadêmico"],
        data_professional: [
          "Ocupação/Cargo",
          "E-mail comercial",
          "Número de Identificação do Empregador (ex: matrícula)",
          "Exame médico admissional",
          "Exame médico periódico",
          "Histórico empregatício declarado pelo funcionário",
        ],
        data_financial: ["N/A"], // folha é processo separado
        data_legal: ["Processos em andamento / concluídos envolvendo o titular"], // PADs
        data_children: ["Nome", "Idade", "E-mail"], // dependentes
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: [],
        data_mobile: ["N/A"],
        data_health: [
          "Tratamento médico",
          "Diagnóstico médico",
          "Histórico médico",
        ], // atestados, perícia
        data_sensitive_yn: "Sim",
        data_sensitive_list: [
          "Origem racial ou étnica",
          "Dados de Saúde",
          "Filiação Sindical",
          "Biometria",
        ],
      },
      sec4: {
        use_subjects: ["Servidores Públicos", "Ex- Servidores"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso restrito ao setor de Gestão de Pessoas, à chefia imediata (no escopo necessário) e à área de Saúde Ocupacional para dados médicos.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Recebimento de dados do candidato aprovado em concurso (banca examinadora) e atualizações do servidor durante o vínculo.",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Gerado por outro departamento/setor",
        ],
        collect_source_desc:
          "Dados coletados do servidor no momento da posse e durante o vínculo (atestados, declarações, certidões). Documentos médicos via Saúde Ocupacional. Dados de progressão via setor de avaliação de desempenho.",
        collect_policy_shown:
          "Política de Privacidade institucional + Termo de Ciência sobre tratamento de dados no momento da posse.",
        collect_consent: "Não",
        collect_background_check:
          "Sim para cargos com exigência legal específica (ex: cargos sigilosos, magistratura, fiscalização tributária). Realizada conforme estrita previsão legal.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "eSocial (Receita Federal), órgãos previdenciários (RPPS / INSS), Tribunal de Contas competente, Portal da Transparência (dados públicos por força do Art. 31 §3º LAI), banco pagador.",
        share_purpose:
          "Cumprimento de obrigações trabalhistas, previdenciárias, fiscais e de transparência ativa (Art. 7 LAI). Processamento de folha pelo setor financeiro.",
        share_data:
          "Dados cadastrais, dados financeiros, frequência, vencimentos, lotação. Dados públicos: nome, cargo, lotação, vencimento bruto (Art. 7 LAI / Súmula Vinculante 11 STF).",
        share_medium: [
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
        ],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel",
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_extra_retention_reason:
          "Dossiê funcional retido conforme Tabela de Temporalidade Documental (TTD) — usualmente 95 anos após o desligamento, conforme Resolução CONARQ 14/2001 e Lei 8.159/1991 (Lei de Arquivos).",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec6.share_with_whom", // sistema específico (SIAPE, RH local, etc.)
      "sec7.store_location",
    ],
  },

  // -------- COMPRAS ---------------------------------------------------
  {
    id: "licitacao",
    nome: "Licitação e Contratação",
    domain: "compras",
    descricaoCurta:
      "Procedimentos licitatórios da Lei 14.133/2021 (pregão, concorrência, dispensa, inexigibilidade) e habilitação de fornecedores.",
    quandoUsar:
      "Use para o ciclo de compras: edital → habilitação → julgamento → adjudicação → homologação → contrato. Inclui pregão eletrônico, concorrência, dispensa eletrônica e credenciamento.",
    basesLegais: [
      "Lei 14.133/2021 (Nova Lei de Licitações e Contratos)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal",
      "Art. 7º, III — execução de políticas públicas",
      "Art. 11, II 'a' — cumprimento de obrigação legal (sócios pessoa física)",
    ],
    tags: [
      "licitação",
      "lei 14.133",
      "pregão",
      "concorrência",
      "dispensa",
      "inexigibilidade",
      "credenciamento",
      "compras",
      "contratação",
      "fornecedor",
      "habilitação",
      "comprasnet",
      "pncp",
    ],
    preenchimento: {
      sec2: {
        process_name: "Licitação e Contratação (Lei 14.133/2021)",
        process_purpose:
          "Conduzir procedimentos licitatórios (pregão, concorrência, dispensa, inexigibilidade) e celebrar contratos administrativos para aquisição de bens e serviços, em conformidade com a Lei 14.133/2021. Os dados pessoais utilizados referem-se aos representantes legais dos licitantes (PJ), sócios pessoa física, profissionais técnicos responsáveis e, em credenciamento de PF, ao próprio titular.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Nome do meio", "Sobrenome"],
        data_personal: ["N/A"],
        data_filiation: ["N/A"],
        data_official_ids: [
          "CPF",
          "RG (número, data de emissão e órgão expedidor)",
        ],
        data_residential: ["E-mail pessoal", "Endereço Residencial"],
        data_education: ["Licenças e associação profissional"], // CREA, CRC, OAB
        data_professional: [
          "Ocupação/Cargo",
          "E-mail comercial",
          "Endereço comercial",
          "Telefone comercial",
        ],
        data_financial: ["Dados bancários (banco, agência e conta)"], // só credenciamento PF
        data_legal: ["Processos em andamento / concluídos envolvendo o titular"], // CADIN, idoneidade
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["N/A"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Terceiros"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso restrito à comissão de contratação, pregoeiro, agente de contratação, autoridade superior e setor jurídico no escopo necessário.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Dados recebidos diretamente do licitante via plataforma de licitações (ComprasNet, BLL, BEC, sistema próprio do PNCP) e por documentação anexa de habilitação.",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
        ],
        collect_source_desc:
          "Documentos de habilitação enviados pelo licitante via plataforma de pregão eletrônico ou em meio físico nos casos previstos.",
        collect_policy_shown:
          "Edital indica claramente quais dados serão tratados e a publicidade dos atos licitatórios (princípio da publicidade — Art. 5º Lei 14.133).",
        collect_consent: "Não",
        collect_background_check:
          "Sim. Consulta obrigatória a sistemas de inidoneidade (CEIS, CNEP, CNJ, CADIN, sistemas estaduais e municipais análogos) conforme Art. 14 da Lei 14.133.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Tribunal de Contas competente, Controladoria, Portal da Transparência, PNCP (Portal Nacional de Contratações Públicas) — publicidade obrigatória do Art. 174 da Lei 14.133.",
        share_purpose:
          "Cumprimento dos princípios da publicidade e do controle externo. Alimentação obrigatória do PNCP.",
        share_data: "Dados públicos do procedimento: edital, atas, contratos, partes envolvidas, valores. Dados pessoais limitados aos representantes legais e sócios.",
        share_medium: [
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
        ],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel",
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_extra_retention_reason:
          "Procedimento licitatório guardado por toda a vigência contratual + prazo prescricional aplicável (10 anos da Lei de Improbidade conforme TCU/jurisprudência), conforme Tabela de Temporalidade Documental institucional.",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec6.share_with_whom",
      "sec7.store_location",
    ],
  },

  // -------- DOCUMENTOS ------------------------------------------------
  {
    id: "protocolo-documentos",
    nome: "Protocolo de Documentos",
    domain: "documentos",
    descricaoCurta:
      "Recepção, autuação e tramitação de processos administrativos (físico ou eletrônico — SEI, eDoc, e-Processo).",
    quandoUsar:
      "Use para o serviço de protocolo geral: recebimento de documentos do cidadão ou órgãos externos, autuação, distribuição e acompanhamento da tramitação.",
    basesLegais: [
      "Lei 9.784/1999 (Processo Administrativo Federal — análogos estaduais)",
      "Decreto 8.539/2015 (uso de meio eletrônico — Adm. Federal)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal",
      "Art. 7º, III — execução de políticas públicas",
    ],
    tags: [
      "protocolo",
      "sei",
      "edoc",
      "e-processo",
      "tramitação",
      "autuação",
      "processo administrativo",
      "lei 9.784",
    ],
    preenchimento: {
      sec2: {
        process_name: "Protocolo e Tramitação de Documentos / Processos Administrativos",
        process_purpose:
          "Receber, autuar, classificar, distribuir e acompanhar a tramitação de documentos e processos administrativos. Os dados pessoais identificam o interessado/requerente e seu representante legal, permitem comunicar atos processuais (Art. 26 da Lei 9.784) e atender pedidos de cópia/vista pelo próprio interessado.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["N/A"],
        data_filiation: ["N/A"],
        data_official_ids: ["CPF", "RG (número, data de emissão e órgão expedidor)"],
        data_residential: [
          "Endereço Residencial",
          "E-mail pessoal",
          "Número de celular pessoal",
        ],
        data_education: ["N/A"],
        data_professional: ["N/A"],
        data_financial: ["N/A"],
        data_legal: ["Processos em andamento / concluídos envolvendo o titular"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["N/A"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Cidadãos", "Servidores Públicos"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso restrito conforme nível de sigilo do processo. Processos com restrição de acesso (LGPD, segredo de justiça, sigilo legal) ficam restritos aos usuários autorizados.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Recebimento de documentos do interessado, de outros órgãos públicos (ofícios) e do Judiciário (intimações).",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Gerado por outra Instituição/empresa externa",
        ],
        collect_source_desc:
          "Cidadão entrega documentação no balcão físico ou via sistema eletrônico (SEI/eDoc/e-Processo). Outros órgãos enviam ofícios eletrônicos ou via correspondência.",
        collect_policy_shown:
          "Política de Privacidade institucional + cláusula no formulário de protocolo eletrônico.",
        collect_consent: "Não",
        collect_background_check: "Não.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Setores de tramitação interna do processo, órgãos externos via ofício eletrônico, Tribunal de Contas, Judiciário (quando intimado).",
        share_purpose:
          "Tramitação processual e cumprimento de obrigações legais de comunicação interinstitucional.",
        share_data: "Conteúdo do processo conforme nível de sigilo. Informações pessoais protegidas em processos com restrição de acesso.",
        share_medium: ["Comunicação entre aplicações internas da instituição"],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel",
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Sim",
        store_paper_external_desc:
          "Processos físicos arquivados em arquivo central ou empresa de guarda terceirizada, conforme Tabela de Temporalidade Documental.",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_extra_retention_reason:
          "Processos administrativos são guardados conforme Tabela de Temporalidade Documental institucional (Resolução CONARQ + Lei 8.159/1991). Prazos variam de 5 a 95 anos conforme natureza do processo.",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec7.store_location",
    ],
  },

  // -------- ATENDIMENTO ----------------------------------------------
  {
    id: "atendimento-publico",
    nome: "Atendimento ao Público (recepção / agendamento)",
    domain: "atendimento",
    descricaoCurta:
      "Recepção física e/ou agendamento online para atendimento presencial. Coleta básica de identificação e motivo da visita.",
    quandoUsar:
      "Use para a recepção do prédio público e para o sistema de agendamento de atendimento (presencial ou videoconferência). Inclui controle de acesso de visitantes.",
    basesLegais: [
      "Lei 13.460/2017 (Lei do Usuário do Serviço Público)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, III — execução de políticas públicas",
      "Art. 7º, IX — legítimo interesse (controle de acesso, segurança patrimonial)",
    ],
    tags: [
      "atendimento",
      "recepção",
      "agendamento",
      "visitante",
      "controle de acesso",
      "portaria",
      "fila",
      "balcão",
    ],
    preenchimento: {
      sec2: {
        process_name: "Atendimento ao Público (Recepção e Agendamento)",
        process_purpose:
          "Receber, identificar e direcionar visitantes; gerenciar agendamentos para atendimento presencial ou virtual. Os dados pessoais identificam o visitante para fins de controle de acesso (segurança), permitem o agendamento com confirmação prévia e avaliação posterior do serviço prestado.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["Fotografias"], // crachá de visitante
        data_filiation: ["N/A"],
        data_official_ids: ["CPF", "RG (número, data de emissão e órgão expedidor)"],
        data_residential: ["E-mail pessoal", "Número de celular pessoal"],
        data_education: ["N/A"],
        data_professional: ["N/A"],
        data_financial: ["N/A"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["Áudio/Vídeo"], // CFTV da recepção
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Cidadãos", "Terceiros"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso aos dados de agendamento restrito ao setor recepcionado. Dados de portaria/CFTV restritos à equipe de segurança patrimonial.",
        use_received_external: "Não",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
        ],
        collect_source_desc:
          "Dados coletados diretamente do visitante na recepção (preenchimento manual do livro de visitantes ou crachá eletrônico) ou no formulário de agendamento online.",
        collect_policy_shown:
          "Aviso de tratamento de dados visível na recepção (Art. 100 LGPD pra órgãos públicos) + Política de Privacidade institucional.",
        collect_consent: "Não",
        collect_background_check: "Não.",
      },
      sec6: {
        share_targets: ["Sim, entre os departamentos da empresa"],
        share_with_whom:
          "Setor que receberá o visitante (para confirmar a chegada) e equipe de segurança patrimonial.",
        share_purpose: "Operacionalização do atendimento e controle de acesso.",
        share_data: "Nome, documento e setor de destino.",
        share_medium: ["Comunicação entre aplicações internas da instituição"],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel", // livro de visitantes
        ],
        store_paper_secure:
          "Informações em cópia impressa são armazenadas longe de clientes e público em geral, mas geralmente não possuem controle de acesso",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec7.store_location",
      "sec7.store_extra_retention_reason", // política de retenção do CFTV
    ],
  },

  // -------- VIAGENS ---------------------------------------------------
  {
    id: "diarias-passagens",
    nome: "Diárias e Passagens",
    domain: "viagens",
    descricaoCurta:
      "Concessão e prestação de contas de diárias e passagens para servidores e colaboradores eventuais em viagem a serviço.",
    quandoUsar:
      "Use para o ciclo: solicitação de afastamento → autorização → emissão da PCDP → emissão de passagem → prestação de contas. Federal usa SCDP; estados/municípios têm sistemas análogos.",
    basesLegais: [
      "Decreto 5.992/2006 (federal — análogos estaduais/municipais)",
      "IN SLTI 03/2015 (SCDP federal)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal",
      "Art. 7º, III — execução de políticas públicas",
    ],
    tags: [
      "diárias",
      "passagens",
      "scdp",
      "viagem",
      "afastamento",
      "pcdp",
      "prestação de contas",
      "decreto 5.992",
    ],
    preenchimento: {
      sec2: {
        process_name: "Concessão de Diárias e Passagens",
        process_purpose:
          "Conceder diárias e emitir passagens para servidores e colaboradores eventuais em deslocamento a serviço. Os dados pessoais permitem a emissão da Proposta de Concessão de Diárias e Passagens (PCDP), a compra/emissão da passagem em nome do beneficiário, o pagamento da diária e a prestação de contas. Inclui dados de acompanhantes em casos específicos previstos em norma.",
      },
      sec3: {
        data_names: ["Primeiro nome", "Sobrenome"],
        data_personal: ["Data e Local de Nascimento", "Nacionalidade", "Gênero"],
        data_filiation: ["N/A"],
        data_official_ids: [
          "CPF",
          "RG (número, data de emissão e órgão expedidor)",
          "Número de passaporte",
          "Visto de entrada em outros países",
        ],
        data_residential: ["E-mail pessoal", "Número de celular pessoal"],
        data_education: ["N/A"],
        data_professional: [
          "Ocupação/Cargo",
          "Número de Identificação do Empregador (ex: matrícula)",
        ],
        data_financial: ["Dados bancários (banco, agência e conta)"],
        data_legal: ["N/A"],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["N/A"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Servidores Públicos", "Terceiros"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso restrito ao setor de viagens, gestor da unidade e ordenador de despesa.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Recebimento de dados de companhias aéreas (e-tickets), agências de viagens contratadas e do próprio servidor para prestação de contas.",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Gerado por um sistema",
        ],
        collect_source_desc:
          "Dados pré-cadastrados pelo servidor no sistema de viagens (ex: SCDP) e atualizados a cada solicitação. Dados internacionais (passaporte/visto) coletados conforme destino.",
        collect_policy_shown:
          "Política de Privacidade institucional + Termo de Ciência sobre tratamento de dados de viagem.",
        collect_consent: "Não",
        collect_background_check: "Não.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Sim, com terceiros ou parceiros de negócio",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Agência de viagens contratada, companhias aéreas, hotéis (em alguns casos), Tribunal de Contas, Portal da Transparência (publicação obrigatória do Art. 7 LAI).",
        share_purpose:
          "Emissão de passagem, hospedagem, prestação de contas, controle externo e transparência ativa.",
        share_data:
          "Nome, CPF, e-mail, dados de viagem, valor da diária. Dados públicos: nome, cargo, motivo, destino, valor (Art. 7 LAI).",
        share_medium: [
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
        ],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel",
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_extra_retention_reason:
          "Processo de viagem retido conforme Tabela de Temporalidade Documental (geralmente 5 a 10 anos para fins de fiscalização do Tribunal de Contas).",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec6.share_with_whom", // nome da agência
      "sec7.store_location",
    ],
  },

  // -------- CONTROLE / FISCALIZAÇÃO ----------------------------------
  {
    id: "auditoria-fiscalizacao",
    nome: "Auditoria / Fiscalização Externa",
    domain: "controle",
    descricaoCurta:
      "Atividades de fiscalização e auditoria externa exercidas por órgãos de controle (TC, CGU, MP) sobre jurisdicionados e gestores.",
    quandoUsar:
      "Use para Tribunais de Contas, Controladorias e MPs no exercício de fiscalização: análise de prestação de contas, instauração de processos de controle externo, oitiva de gestores, denúncias e representações.",
    basesLegais: [
      "CF Art. 70-75 (Tribunais de Contas)",
      "Leis Orgânicas dos TCs e MPs",
      "Lei 8.443/1992 (LOTCU — análogos estaduais)",
      "Lei 10.180/2001 (controle interno federal)",
      "Lei 13.709/2018 (LGPD)",
    ],
    hipotesesLgpd: [
      "Art. 7º, II — cumprimento de obrigação legal",
      "Art. 7º, III — execução de políticas públicas",
      "Art. 11, II 'a' e 'g' — obrigação legal e exercício regular de direito",
    ],
    tags: [
      "auditoria",
      "fiscalização",
      "controle externo",
      "tribunal de contas",
      "tc",
      "cgu",
      "mp",
      "ministério público",
      "controladoria",
      "prestação de contas",
      "denúncia",
      "representação",
      "responsabilidade",
    ],
    preenchimento: {
      sec2: {
        process_name: "Auditoria e Fiscalização Externa (Controle)",
        process_purpose:
          "Exercer competência constitucional de controle externo sobre os jurisdicionados (gestores públicos, ordenadores de despesa, responsáveis por bens e valores). Os dados pessoais identificam os responsáveis pelos atos de gestão objeto de exame, permitem instaurar processos de controle, intimar e citar (com observância do contraditório), aplicar sanções pessoais e dar publicidade aos julgados (Art. 71 CF).",
      },
      sec3: {
        data_names: ["Primeiro nome", "Nome do meio", "Sobrenome"],
        data_personal: ["Data e Local de Nascimento", "Nacionalidade", "Gênero"],
        data_filiation: ["Nome do Mãe", "Nome do Pai"], // qualificação processual
        data_official_ids: [
          "CPF",
          "RG (número, data de emissão e órgão expedidor)",
        ],
        data_residential: [
          "Endereço Residencial",
          "E-mail pessoal",
          "Número de celular pessoal",
        ],
        data_education: ["Diplomas e escolaridade", "Licenças e associação profissional"],
        data_professional: [
          "Ocupação/Cargo",
          "E-mail comercial",
          "Endereço comercial",
          "Número de Identificação do Empregador (ex: matrícula)",
        ],
        data_financial: [
          "Dados bancários (banco, agência e conta)",
          "Histórico de transações financeiras",
          "Salário e outros rendimentos",
          "Dados de renda familiar mensal e patrimônio",
        ],
        data_legal: [
          "Dados de renda familiar mensal e patrimônio",
          "Processos em andamento / concluídos envolvendo o titular",
        ],
        data_children: ["N/A"],
        data_children_consent: "N/A",
        data_teens: ["N/A"],
        data_preferences: ["N/A"],
        data_mobile: ["N/A"],
        data_health: ["N/A"],
        data_sensitive_yn: "Não",
      },
      sec4: {
        use_subjects: ["Servidores Públicos", "Ex- Servidores", "Terceiros"],
        use_diff_purpose: "Não",
        use_unnecessary_access:
          "Acesso restrito aos auditores designados, à autoridade processante (relator), ao MP de Contas e à Secretaria do órgão.",
        use_received_external: "Sim",
        use_received_external_desc:
          "Recebimento de prestação de contas dos jurisdicionados, denúncias, representações, ofícios de outros órgãos de controle e bases de dados públicas para cruzamento (Cidades, Receita, etc.).",
        use_automated_decision: "Não",
        use_marketing: "Não",
      },
      sec5: {
        collect_source: [
          "Fornecido pelo próprio titular do dado pessoal (Ex. coletamos o dado diretamente do titular no website, via formulário, via e-mail, etc.)",
          "Gerado por outra Instituição/empresa externa",
          "Fornecido pelo governo",
          "Gerado por um sistema",
        ],
        collect_source_desc:
          "Dados recebidos do jurisdicionado durante a prestação de contas, de bases governamentais (Receita, Cadastro Único, Sistemas estaduais), de denunciantes e durante a instrução processual.",
        collect_policy_shown:
          "Política de Privacidade institucional + Aviso de tratamento no portal de processos. Princípio da publicidade processual mitigado por sigilo legal nos casos previstos.",
        collect_consent: "Não",
        collect_background_check:
          "Sim quando essencial à instrução: consulta a CADIN, listas de inelegibilidade, sistemas de inidoneidade (CEIS, CNEP) — sempre fundamentada na competência constitucional.",
      },
      sec6: {
        share_targets: [
          "Sim, entre os departamentos da empresa",
          "Instituições governamentais",
        ],
        share_with_whom:
          "Setores instrutórios internos, MP de Contas, Ministério Público comum (Art. 16 §3º LOTCU análogo), Polícia Judiciária quando indícios criminais, Atricon, IRB, sistemas nacionais de informação (CNJ, CNMP).",
        share_purpose:
          "Cumprimento das competências constitucionais e legais de controle externo, comunicação obrigatória de irregularidades e cooperação interinstitucional.",
        share_data: "Conteúdo do processo conforme nível de sigilo legal aplicável.",
        share_medium: [
          "Comunicação entre aplicações internas da instituição",
          "Comunicação entre aplicações externas",
        ],
        share_security: "Sim",
        share_subject_aware: "Sim",
        share_international: "Não",
      },
      sec7: {
        store_format: [
          "Sistemas e Base de Dados (banco de dados)",
          "Papel", // processos físicos antigos
        ],
        store_paper_secure:
          "Informações em cópia impressa são sempre armazenadas em locais seguros, trancados com acesso restrito apenas a pessoas autorizadas",
        store_paper_external: "Não",
        store_mobile_protected: "N/A",
        store_retention: [
          "Dados pessoais são deletados no momento em que não são mais necessários para atender exigências legais ou regulatórias",
        ],
        store_periodic_review: "Sim",
        store_extra_retention_reason:
          "Processos de controle externo guardados conforme Tabela de Temporalidade Documental institucional, observado o prazo prescricional para responsabilização dos gestores (variável conforme natureza do dano).",
        store_local_backup: "Não, o backup é realizado de forma centralizada pela TI",
      },
    },
    camposPendentes: [
      "sec2.process_volume",
      "sec5.collect_source_desc",
      "sec6.share_with_whom",
      "sec7.store_location",
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

/** Lookup por id. */
export function getTemplateById(id: string): InventarioTemplate | undefined {
  return INVENTARIO_TEMPLATES.find((t) => t.id === id);
}

/** Agrupa modelos por domínio (pra UI). */
export const TEMPLATES_BY_DOMAIN: Record<TemplateDomain, InventarioTemplate[]> =
  INVENTARIO_TEMPLATES.reduce(
    (acc, t) => {
      (acc[t.domain] ??= []).push(t);
      return acc;
    },
    {} as Record<TemplateDomain, InventarioTemplate[]>,
  );

export const DOMAIN_LABEL: Record<TemplateDomain, string> = {
  ouvidoria_sic: "Ouvidoria / SIC",
  pessoas: "Pessoas / RH",
  compras: "Compras e Contratações",
  documentos: "Gestão de Documentos",
  atendimento: "Atendimento ao Público",
  viagens: "Viagens e Diárias",
  controle: "Controle / Fiscalização",
};

/**
 * Conta quantos campos do schema ficam preenchidos pelo template.
 * Útil pra exibir "Pré-preenche 35 de 50 campos" no card.
 */
export function countPreenchidos(t: InventarioTemplate): number {
  let total = 0;
  for (const sec of Object.values(t.preenchimento)) {
    if (sec && typeof sec === "object") {
      total += Object.keys(sec).length;
    }
  }
  return total;
}

/**
 * Mescla um template em um FormAnswers existente. Estratégia:
 * - Campos do template aplicam APENAS onde answers[sec][field] está vazio
 *   (não sobrescreve input do usuário).
 * - Marca a origem dos campos preenchidos por template em
 *   answers._meta.provenance (para badges na UI).
 *
 * Retorna `{ next, applied }` onde `applied` é o conjunto de "sec.field"
 * que foi efetivamente aplicado nesta operação.
 */
export function applyTemplate(
  current: FormAnswers,
  template: InventarioTemplate,
): { next: FormAnswers; applied: string[] } {
  const next: FormAnswers = JSON.parse(JSON.stringify(current ?? {}));
  const applied: string[] = [];

  for (const [secKey, fields] of Object.entries(template.preenchimento)) {
    if (!fields || typeof fields !== "object") continue;
    const target = ((next as any)[secKey] ??= {}) as Record<
      string,
      string | string[]
    >;
    for (const [fieldId, value] of Object.entries(fields)) {
      const existing = target[fieldId];
      const empty = existing == null
        || (typeof existing === "string" && !existing.trim())
        || (Array.isArray(existing) && existing.length === 0);
      if (empty) {
        target[fieldId] = value as string | string[];
        applied.push(`${secKey}.${fieldId}`);
      }
    }
  }

  // Provenance — armazena no _meta como objeto fieldId → origem
  // Não é tipado em FormAnswers (extensão informal), é OK porque
  // _meta é Record-like na prática.
  const meta = (next._meta ??= {}) as any;
  meta.provenance ??= {};
  meta.templateApplied = template.id;
  meta.templateAppliedAt = new Date().toISOString();
  for (const path of applied) {
    meta.provenance[path] = `template:${template.id}`;
  }

  return { next, applied };
}
