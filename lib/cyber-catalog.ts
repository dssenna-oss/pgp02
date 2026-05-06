/**
 * Catálogo NIST CSF v1.1 — Maturidade Cibernética (Checkpoint 22).
 *
 * 80 subcategorias (controles) distribuídas em 5 funções e 16 categorias.
 * Cada controle é traduzido pra PT-BR claro, com:
 *   - exemplo concreto do dia-a-dia (`example`)
 *   - referência NIST original (`nistRef`)
 *   - público responsável (`audience`): jurídico/governança · TI · ambos
 *   - termos técnicos com tooltip explicativo (`technicalTerms`)
 *   - origem de pré-população quando aplicável (`prepopulateFrom`)
 *
 * Engine pura. Não depende de banco. Estrutura paralela a `gap-catalog.ts`.
 */

export type CyberFunction = "ID" | "PR" | "DE" | "RS" | "RC";
export type CyberAudience = "JURIDICO" | "TI" | "AMBOS";
export type CyberPrepopulateSource =
  | "GAP"
  | "INCIDENTES"
  | "CAPACITACAO"
  | "TERCEIROS";

export interface CyberTerm {
  /** Palavra/expressão técnica que aparece no enunciado. */
  term: string;
  /** Texto de tooltip exibido em hover. */
  tooltip: string;
}

export interface CyberControl {
  /** Código NIST (ex.: "ID.AM-1", "PR.AC-3"). */
  code: string;
  /** Função NIST (5 funções). */
  function: CyberFunction;
  /** Categoria dentro da função (ex.: "Asset Management"). */
  category: string;
  /** Pergunta em PT-BR claro pro usuário responder. */
  question: string;
  /** Exemplo concreto do dia-a-dia que ajuda o usuário a entender. */
  example: string;
  /** Referência original do NIST CSF (em inglês, técnico). */
  nistRef: string;
  /** Quem é o responsável principal por essa pergunta. */
  audience: CyberAudience;
  /** Termos técnicos do enunciado que terão tooltip explicativo. */
  technicalTerms?: ReadonlyArray<CyberTerm>;
  /** Quando o app pode pré-popular essa resposta a partir de outro CP. */
  prepopulateFrom?: CyberPrepopulateSource;
}

export interface CyberCategory {
  function: CyberFunction;
  /** Sigla da categoria (ex.: "ID.AM" pra Asset Management). */
  code: string;
  /** Nome traduzido. */
  label: string;
  /** Descrição curta do que a categoria avalia. */
  description: string;
}

// ============================================================
// Categorias (16 ao todo)
// ============================================================

export const CYBER_CATEGORIES: ReadonlyArray<CyberCategory> = [
  // ID — IDENTIFICAR
  { function: "ID", code: "ID.AM", label: "Gestão de Ativos",
    description: "Identificar e inventariar dispositivos, sistemas e dados que sustentam o negócio." },
  { function: "ID", code: "ID.BE", label: "Ambiente de Negócio",
    description: "Entender missão, objetivos e papéis da organização no ecossistema." },
  { function: "ID", code: "ID.GV", label: "Governança",
    description: "Políticas, processos e procedimentos pra gerenciar segurança." },
  { function: "ID", code: "ID.RA", label: "Avaliação de Riscos",
    description: "Identificar ameaças, vulnerabilidades e impactos." },
  { function: "ID", code: "ID.RM", label: "Estratégia de Gestão de Risco",
    description: "Como decidir quanto risco aceitar e como tratá-lo." },
  { function: "ID", code: "ID.SC", label: "Cadeia de Suprimentos",
    description: "Gestão de risco com fornecedores, terceiros e parceiros." },

  // PR — PROTEGER
  { function: "PR", code: "PR.AC", label: "Controle de Acesso",
    description: "Quem tem acesso a quê, com que credenciais." },
  { function: "PR", code: "PR.AT", label: "Conscientização e Treinamento",
    description: "Educar pessoas sobre suas responsabilidades em segurança." },
  { function: "PR", code: "PR.DS", label: "Segurança de Dados",
    description: "Proteção dos dados em armazenamento, em trânsito e em uso." },
  { function: "PR", code: "PR.IP", label: "Processos e Procedimentos",
    description: "Políticas e procedimentos operacionais de proteção." },
  { function: "PR", code: "PR.MA", label: "Manutenção",
    description: "Manutenção segura de sistemas e ativos." },
  { function: "PR", code: "PR.PT", label: "Tecnologia de Proteção",
    description: "Soluções técnicas (antivírus, firewall, criptografia)." },

  // DE — DETECTAR
  { function: "DE", code: "DE.AE", label: "Anomalias e Eventos",
    description: "Identificar atividades anômalas e seu impacto." },
  { function: "DE", code: "DE.CM", label: "Monitoramento Contínuo",
    description: "Vigilância contínua de sistemas e rede." },
  { function: "DE", code: "DE.DP", label: "Processos de Detecção",
    description: "Manter e melhorar processos de detecção." },

  // RS — RESPONDER
  { function: "RS", code: "RS.RP", label: "Plano de Resposta",
    description: "Plano executado durante ou após incidente." },
  { function: "RS", code: "RS.CO", label: "Comunicações",
    description: "Coordenação interna e externa durante resposta." },
  { function: "RS", code: "RS.AN", label: "Análise",
    description: "Investigar pra garantir resposta e recuperação eficazes." },
  { function: "RS", code: "RS.MI", label: "Mitigação",
    description: "Conter, mitigar e erradicar incidentes." },
  { function: "RS", code: "RS.IM", label: "Melhorias",
    description: "Lições aprendidas pra fortalecer resposta futura." },

  // RC — RECUPERAR
  { function: "RC", code: "RC.RP", label: "Plano de Recuperação",
    description: "Restaurar sistemas e capacidade após incidente." },
  { function: "RC", code: "RC.IM", label: "Melhorias",
    description: "Lições aprendidas após recuperação." },
  { function: "RC", code: "RC.CO", label: "Comunicações",
    description: "Comunicar progresso de recuperação a stakeholders." },
];

// ============================================================
// Controles (80 subcategorias)
// ============================================================

const TERM_AMEACA: CyberTerm = {
  term: "ameaças",
  tooltip:
    "Ameaça (threat): qualquer evento ou ator que pode causar dano — vírus, ataque hacker, fraude interna, falha humana, desastre natural.",
};

const TERM_VULNERABILIDADE: CyberTerm = {
  term: "vulnerabilidades",
  tooltip:
    "Vulnerabilidade: fraqueza explorável num sistema ou processo — software desatualizado, senha fraca, falta de backup.",
};

const TERM_APETITE_RISCO: CyberTerm = {
  term: "apetite de risco",
  tooltip:
    "Apetite de risco: quanto risco a organização aceita assumir — ex.: 'aceitamos risco baixo em finanças, médio em marketing, nenhum em dados sensíveis'.",
};

const TERM_PSEUDONIMIZACAO: CyberTerm = {
  term: "pseudonimização",
  tooltip:
    "Pseudonimização: substituir dados que identificam a pessoa por códigos. Quem tem o 'mapa' consegue voltar ao original.",
};

const TERM_LINHA_BASE: CyberTerm = {
  term: "linha de base",
  tooltip:
    "Linha de base (baseline): padrão do que é considerado 'normal' no funcionamento da rede ou sistemas. Desvios podem indicar ataque.",
};

const TERM_INDICADORES: CyberTerm = {
  term: "indicadores de comprometimento",
  tooltip:
    "IoC (Indicators of Compromise): pistas técnicas que indicam que um sistema foi comprometido — IP suspeito, hash de arquivo malicioso, comportamento anômalo.",
};

export const CYBER_CONTROLS: ReadonlyArray<CyberControl> = [
  // ===========================================================
  // ID — IDENTIFICAR (28 controles)
  // ===========================================================

  // ID.AM — Asset Management
  {
    code: "ID.AM-1", function: "ID", category: "Gestão de Ativos",
    question: "A empresa tem inventário atualizado dos equipamentos físicos (servidores, notebooks, celulares corporativos)?",
    example: "Ex.: planilha 'Ativos TI' atualizada mensalmente, ou ferramenta tipo Lansweeper, GLPI.",
    nistRef: "ID.AM-1 — Physical devices and systems within the organization are inventoried.",
    audience: "TI",
  },
  {
    code: "ID.AM-2", function: "ID", category: "Gestão de Ativos",
    question: "Existe inventário dos softwares e plataformas usados pela empresa?",
    example: "Ex.: lista com licenças do Office, Google Workspace, sistemas SaaS contratados, softwares instalados nos computadores.",
    nistRef: "ID.AM-2 — Software platforms and applications within the organization are inventoried.",
    audience: "TI",
  },
  {
    code: "ID.AM-3", function: "ID", category: "Gestão de Ativos",
    question: "A empresa sabe por onde os dados se movimentam entre sistemas?",
    example: "Ex.: diagrama mostrando que CRM → ERP → BI → backup. Pode ser feito junto do Inventário LGPD.",
    nistRef: "ID.AM-3 — Organizational communication and data flows are mapped.",
    audience: "AMBOS",
    prepopulateFrom: "GAP",
  },
  {
    code: "ID.AM-4", function: "ID", category: "Gestão de Ativos",
    question: "Os sistemas externos (SaaS, APIs, fornecedores) que se conectam à organização estão catalogados?",
    example: "Ex.: lista dos integradores tipo 'Stripe pra pagamento, SendGrid pra e-mail, AWS S3 pra backup'.",
    nistRef: "ID.AM-4 — External information systems are catalogued.",
    audience: "TI",
    prepopulateFrom: "TERCEIROS",
  },
  {
    code: "ID.AM-5", function: "ID", category: "Gestão de Ativos",
    question: "Os ativos (sistemas, dados, dispositivos) são classificados por importância pro negócio?",
    example: "Ex.: 'crítico / importante / pouco importante' baseado em impacto financeiro e de imagem caso fiquem indisponíveis.",
    nistRef: "ID.AM-5 — Resources are prioritized based on classification, criticality, and business value.",
    audience: "AMBOS",
  },
  {
    code: "ID.AM-6", function: "ID", category: "Gestão de Ativos",
    question: "Há definição clara de papéis e responsabilidades em cibersegurança?",
    example: "Ex.: 'CTO responde por estratégia, CISO por execução, gerentes por suas áreas'. Documentado no organograma ou política.",
    nistRef: "ID.AM-6 — Cybersecurity roles and responsibilities are established.",
    audience: "JURIDICO",
  },

  // ID.BE — Business Environment
  {
    code: "ID.BE-1", function: "ID", category: "Ambiente de Negócio",
    question: "A empresa entende seu papel na cadeia de suprimentos (quem depende dela, de quem depende)?",
    example: "Ex.: somos provedor de SaaS pra 50 prefeituras — nossa indisponibilidade afeta serviço público.",
    nistRef: "ID.BE-1 — The organization's role in the supply chain is identified.",
    audience: "JURIDICO",
  },
  {
    code: "ID.BE-3", function: "ID", category: "Ambiente de Negócio",
    question: "Foram definidas prioridades organizacionais e missão que orientam decisões de segurança?",
    example: "Ex.: 'segurança de dados de clientes é prioridade #1 — vem antes de velocidade de entrega'.",
    nistRef: "ID.BE-3 — Priorities for organizational mission, objectives, and activities are established.",
    audience: "JURIDICO",
  },
  {
    code: "ID.BE-4", function: "ID", category: "Ambiente de Negócio",
    question: "Há identificação dos serviços críticos que dependem de TI pra operar?",
    example: "Ex.: 'sistema de cobrança e atendimento ao cliente NÃO podem ficar parados; HR pode ficar até 4h'.",
    nistRef: "ID.BE-4 — Dependencies and critical functions for delivery of critical services are established.",
    audience: "AMBOS",
  },
  {
    code: "ID.BE-5", function: "ID", category: "Ambiente de Negócio",
    question: "Existem requisitos de resiliência (quanto tempo posso ficar parado, quanto dado posso perder)?",
    example: "Ex.: RTO 4h (volta em 4h) · RPO 1h (perde no máximo 1h de dado). Documentado no PCN.",
    nistRef: "ID.BE-5 — Resilience requirements to support delivery of critical services are established.",
    audience: "TI",
  },

  // ID.GV — Governance
  {
    code: "ID.GV-1", function: "ID", category: "Governança",
    question: "Existe política de segurança da informação aprovada pela direção?",
    example: "Ex.: documento 'PSI' assinado pelo CEO/diretor, revisado anualmente, comunicado a todos.",
    nistRef: "ID.GV-1 — Organizational cybersecurity policy is established and communicated.",
    audience: "JURIDICO",
  },
  {
    code: "ID.GV-2", function: "ID", category: "Governança",
    question: "Há coordenação entre os papéis de TI/segurança e os demais (jurídico, RH, compliance)?",
    example: "Ex.: comitê de segurança mensal com representantes; ou reuniões trimestrais formalizadas.",
    nistRef: "ID.GV-2 — Cybersecurity roles are coordinated with internal roles and external partners.",
    audience: "AMBOS",
  },
  {
    code: "ID.GV-3", function: "ID", category: "Governança",
    question: "A empresa conhece e cumpre as leis e normas de segurança aplicáveis?",
    example: "Ex.: LGPD, Marco Civil, normas setoriais (BACEN, ANS, ANATEL). Documentado quem mapeia/atualiza.",
    nistRef: "ID.GV-3 — Legal and regulatory requirements regarding cybersecurity are understood and managed.",
    audience: "JURIDICO",
    prepopulateFrom: "GAP",
  },
  {
    code: "ID.GV-4", function: "ID", category: "Governança",
    question: "Os processos de governança contemplam riscos cibernéticos?",
    example: "Ex.: ata da diretoria mostra discussão de riscos cyber junto com riscos financeiros.",
    nistRef: "ID.GV-4 — Governance and risk management processes address cybersecurity risks.",
    audience: "JURIDICO",
  },

  // ID.RA — Risk Assessment
  {
    code: "ID.RA-1", function: "ID", category: "Avaliação de Riscos",
    question: "As [vulnerabilidades] dos sistemas são identificadas e documentadas?",
    example: "Ex.: scan automatizado de vulnerabilidades mensal, ou avaliações de pentest anual.",
    nistRef: "ID.RA-1 — Asset vulnerabilities are identified and documented.",
    audience: "TI",
    technicalTerms: [TERM_VULNERABILIDADE],
  },
  {
    code: "ID.RA-2", function: "ID", category: "Avaliação de Riscos",
    question: "A empresa recebe informação atualizada sobre [ameaças] do setor?",
    example: "Ex.: assina boletins do CERT.br, do CTIR.gov, ou serviços tipo Cisco Talos, Recorded Future.",
    nistRef: "ID.RA-2 — Cyber threat intelligence is received from information sharing forums and sources.",
    audience: "TI",
    technicalTerms: [TERM_AMEACA],
  },
  {
    code: "ID.RA-3", function: "ID", category: "Avaliação de Riscos",
    question: "As [ameaças] internas e externas são identificadas e atualizadas periodicamente?",
    example: "Ex.: matriz revisada anualmente listando ransomware, phishing, fraude interna, vazamento por funcionário.",
    nistRef: "ID.RA-3 — Threats, both internal and external, are identified and documented.",
    audience: "AMBOS",
    technicalTerms: [TERM_AMEACA],
  },
  {
    code: "ID.RA-4", function: "ID", category: "Avaliação de Riscos",
    question: "Os impactos potenciais ao negócio (financeiro, reputacional, regulatório) são estimados?",
    example: "Ex.: 'vazamento de dados pode custar até R$ 500k em multa LGPD + 30% queda de receita por 3 meses'.",
    nistRef: "ID.RA-4 — Potential business impacts and likelihoods are identified.",
    audience: "AMBOS",
  },
  {
    code: "ID.RA-5", function: "ID", category: "Avaliação de Riscos",
    question: "Há cálculo formal de risco combinando ameaças × vulnerabilidades × impacto?",
    example: "Ex.: matriz 5x5 (probabilidade × impacto) aplicada a cada cenário identificado.",
    nistRef: "ID.RA-5 — Threats, vulnerabilities, likelihoods, and impacts are used to determine risk.",
    audience: "AMBOS",
  },
  {
    code: "ID.RA-6", function: "ID", category: "Avaliação de Riscos",
    question: "As respostas aos riscos (aceitar, mitigar, transferir, evitar) são identificadas e priorizadas?",
    example: "Ex.: 'risco X: mitigado via firewall · risco Y: transferido via seguro · risco Z: aceito formalmente'.",
    nistRef: "ID.RA-6 — Risk responses are identified and prioritized.",
    audience: "JURIDICO",
  },

  // ID.RM — Risk Management Strategy
  {
    code: "ID.RM-1", function: "ID", category: "Estratégia de Gestão de Risco",
    question: "Existe política formal de gestão de risco aprovada pela direção, com [apetite de risco] e responsabilidades?",
    example: "Ex.: documento que diga 'risco baixo: TI decide / médio: gerência / alto: diretoria'. Aprovado em ata.",
    nistRef: "ID.RM-1 — Risk management processes are established, managed, and agreed to by stakeholders.",
    audience: "JURIDICO",
    technicalTerms: [TERM_APETITE_RISCO],
  },
  {
    code: "ID.RM-2", function: "ID", category: "Estratégia de Gestão de Risco",
    question: "O [apetite de risco] organizacional é claramente expresso?",
    example: "Ex.: 'aceitamos risco baixo em finanças, médio em marketing, nenhum em dados sensíveis'.",
    nistRef: "ID.RM-2 — Organizational risk tolerance is determined and clearly expressed.",
    audience: "JURIDICO",
    technicalTerms: [TERM_APETITE_RISCO],
  },
  {
    code: "ID.RM-3", function: "ID", category: "Estratégia de Gestão de Risco",
    question: "O apetite de risco considera o papel da empresa no setor (criticidade pra sociedade)?",
    example: "Ex.: 'somos infraestrutura crítica de saúde — apetite de risco MUITO baixo em disponibilidade'.",
    nistRef: "ID.RM-3 — The organization's determination of risk tolerance is informed by its role in critical infrastructure.",
    audience: "JURIDICO",
  },

  // ID.SC — Supply Chain Risk Management
  {
    code: "ID.SC-1", function: "ID", category: "Cadeia de Suprimentos",
    question: "Há processo formal de avaliação de risco de fornecedores antes da contratação?",
    example: "Ex.: questionário Cyber+LGPD aplicado antes de assinar contrato. Já existe aqui na Gestão de Terceiros.",
    nistRef: "ID.SC-1 — Cyber supply chain risk management processes are identified.",
    audience: "AMBOS",
    prepopulateFrom: "TERCEIROS",
  },
  {
    code: "ID.SC-2", function: "ID", category: "Cadeia de Suprimentos",
    question: "Os fornecedores são identificados, priorizados e avaliados quanto a risco cyber?",
    example: "Ex.: lista classificando 'crítico / importante / comum' e quais já passaram por avaliação.",
    nistRef: "ID.SC-2 — Suppliers and third party partners are identified, prioritized, and assessed.",
    audience: "AMBOS",
    prepopulateFrom: "TERCEIROS",
  },
  {
    code: "ID.SC-3", function: "ID", category: "Cadeia de Suprimentos",
    question: "Os contratos com fornecedores incluem cláusulas de cibersegurança?",
    example: "Ex.: cláusula obrigando fornecedor a notificar incidente em 24h, manter criptografia, fazer auditoria anual.",
    nistRef: "ID.SC-3 — Contracts with suppliers and third-party partners are used to implement appropriate measures.",
    audience: "JURIDICO",
    prepopulateFrom: "TERCEIROS",
  },
  {
    code: "ID.SC-4", function: "ID", category: "Cadeia de Suprimentos",
    question: "Os fornecedores são auditados periodicamente quanto às obrigações de segurança?",
    example: "Ex.: auditoria anual ou solicitação de relatório SOC 2 / ISO 27001 dos fornecedores críticos.",
    nistRef: "ID.SC-4 — Suppliers are routinely assessed using audits and tests.",
    audience: "AMBOS",
  },
  {
    code: "ID.SC-5", function: "ID", category: "Cadeia de Suprimentos",
    question: "A organização inclui fornecedores em testes e exercícios de resposta a incidentes?",
    example: "Ex.: simulação anual onde fornecedor crítico participa do plano de resposta.",
    nistRef: "ID.SC-5 — Response and recovery planning and testing are conducted with suppliers.",
    audience: "AMBOS",
  },

  // ===========================================================
  // PR — PROTEGER (24 controles)
  // ===========================================================

  // PR.AC — Identity Management & Access Control
  {
    code: "PR.AC-1", function: "PR", category: "Controle de Acesso",
    question: "Cada pessoa tem login próprio e quem sai da empresa tem o acesso removido?",
    example: "Ex.: nada de 'usuario_admin' compartilhado. Saiu do RH → TI revoga acesso em até 24h.",
    nistRef: "PR.AC-1 — Identities and credentials are issued, managed, verified, revoked, and audited.",
    audience: "TI",
  },
  {
    code: "PR.AC-3", function: "PR", category: "Controle de Acesso",
    question: "O acesso remoto (home office, VPN) é controlado e monitorado?",
    example: "Ex.: VPN obrigatória pra acessar sistemas internos; logs guardados; MFA ativado.",
    nistRef: "PR.AC-3 — Remote access is managed.",
    audience: "TI",
  },
  {
    code: "PR.AC-4", function: "PR", category: "Controle de Acesso",
    question: "As permissões seguem o princípio do 'menor privilégio' (cada pessoa só tem acesso ao mínimo necessário)?",
    example: "Ex.: estagiário não tem acesso à folha de pagamento; vendedor não tem acesso ao banco de dados de TI.",
    nistRef: "PR.AC-4 — Access permissions and authorizations are managed, incorporating the principles of least privilege.",
    audience: "TI",
  },
  {
    code: "PR.AC-5", function: "PR", category: "Controle de Acesso",
    question: "A rede está segmentada (separada em zonas de segurança)?",
    example: "Ex.: rede de visitantes separada da rede interna; servidores críticos em VLAN separada.",
    nistRef: "PR.AC-5 — Network integrity is protected (e.g., network segregation, network segmentation).",
    audience: "TI",
  },
  {
    code: "PR.AC-7", function: "PR", category: "Controle de Acesso",
    question: "Os usuários são autenticados com múltiplos fatores (MFA / 2FA)?",
    example: "Ex.: senha + código do celular pra acessar e-mail, sistemas críticos, painel admin.",
    nistRef: "PR.AC-7 — Users, devices, and other assets are authenticated commensurate with risk.",
    audience: "TI",
  },

  // PR.AT — Awareness & Training
  {
    code: "PR.AT-1", function: "PR", category: "Conscientização e Treinamento",
    question: "Os colaboradores recebem treinamento de segurança ao entrar e periodicamente?",
    example: "Ex.: módulo de onboarding sobre senhas/phishing + reciclagem anual. Já existe aqui em Capacitação.",
    nistRef: "PR.AT-1 — All users are informed and trained.",
    audience: "JURIDICO",
    prepopulateFrom: "CAPACITACAO",
  },
  {
    code: "PR.AT-2", function: "PR", category: "Conscientização e Treinamento",
    question: "Os usuários privilegiados (TI, admins) recebem treinamento adicional sobre suas responsabilidades?",
    example: "Ex.: equipe de TI tem treinamento extra sobre gestão de chaves criptográficas, resposta a incidente.",
    nistRef: "PR.AT-2 — Privileged users understand their roles and responsibilities.",
    audience: "TI",
  },
  {
    code: "PR.AT-3", function: "PR", category: "Conscientização e Treinamento",
    question: "Terceiros (fornecedores, prestadores) recebem orientação sobre as regras de segurança da organização?",
    example: "Ex.: termo assinado pelo prestador acordando com PSI; treinamento curto antes de receber acesso.",
    nistRef: "PR.AT-3 — Third-party stakeholders understand their roles and responsibilities.",
    audience: "JURIDICO",
    prepopulateFrom: "TERCEIROS",
  },
  {
    code: "PR.AT-4", function: "PR", category: "Conscientização e Treinamento",
    question: "A alta direção recebe orientação periódica sobre seu papel em cibersegurança?",
    example: "Ex.: reunião trimestral com diretoria sobre status de segurança, riscos, simulação de phishing executivo.",
    nistRef: "PR.AT-4 — Senior executives understand their roles and responsibilities.",
    audience: "AMBOS",
  },
  {
    code: "PR.AT-5", function: "PR", category: "Conscientização e Treinamento",
    question: "Pessoal de segurança física entende suas responsabilidades cyber?",
    example: "Ex.: porteiro orientado a não permitir 'tailgating' (entrada de não-identificado atrás de funcionário).",
    nistRef: "PR.AT-5 — Physical and cybersecurity personnel understand their roles and responsibilities.",
    audience: "TI",
  },

  // PR.DS — Data Security
  {
    code: "PR.DS-1", function: "PR", category: "Segurança de Dados",
    question: "Os dados armazenados estão protegidos por criptografia (em discos, em backups)?",
    example: "Ex.: BitLocker nos notebooks, criptografia AES nos backups, banco com TDE habilitado.",
    nistRef: "PR.DS-1 — Data-at-rest is protected.",
    audience: "TI",
  },
  {
    code: "PR.DS-2", function: "PR", category: "Segurança de Dados",
    question: "Os dados em trânsito (entre sistemas, pela internet) são protegidos?",
    example: "Ex.: HTTPS em todos os sites/APIs, VPN pra acessos remotos, TLS 1.2+ em conexões internas.",
    nistRef: "PR.DS-2 — Data-in-transit is protected.",
    audience: "TI",
  },
  {
    code: "PR.DS-3", function: "PR", category: "Segurança de Dados",
    question: "Há gestão formal do ciclo de vida dos ativos (recebimento, uso, descarte)?",
    example: "Ex.: notebook recebido com formatação completa, descarte com wipe seguro/destruição física.",
    nistRef: "PR.DS-3 — Assets are formally managed throughout removal, transfers, and disposition.",
    audience: "TI",
  },
  {
    code: "PR.DS-4", function: "PR", category: "Segurança de Dados",
    question: "Há capacidade adequada de armazenamento pra garantir disponibilidade?",
    example: "Ex.: monitoramento de espaço em disco, alertas antes de encher, plano de expansão.",
    nistRef: "PR.DS-4 — Adequate capacity to ensure availability is maintained.",
    audience: "TI",
  },
  {
    code: "PR.DS-5", function: "PR", category: "Segurança de Dados",
    question: "Existe proteção contra vazamento de dados (DLP)?",
    example: "Ex.: ferramenta que bloqueia anexar arquivo sensível em e-mail externo; restrição de USB.",
    nistRef: "PR.DS-5 — Protections against data leaks are implemented.",
    audience: "TI",
  },
  {
    code: "PR.DS-6", function: "PR", category: "Segurança de Dados",
    question: "A integridade de dados/software é verificada (hash, assinatura digital)?",
    example: "Ex.: arquivos de instalação verificados por hash; software só roda assinado.",
    nistRef: "PR.DS-6 — Integrity checking mechanisms are used to verify software, firmware, and information integrity.",
    audience: "TI",
  },
  {
    code: "PR.DS-7", function: "PR", category: "Segurança de Dados",
    question: "Os ambientes de desenvolvimento e produção estão separados?",
    example: "Ex.: dev/staging/prod em servidores e bancos diferentes; dados de prod NÃO copiados pra dev.",
    nistRef: "PR.DS-7 — The development and testing environments are separate from the production environment.",
    audience: "TI",
  },

  // PR.IP — Information Protection Processes & Procedures
  {
    code: "PR.IP-1", function: "PR", category: "Processos e Procedimentos",
    question: "Existem configurações-padrão (baselines) seguras pros sistemas?",
    example: "Ex.: imagem padrão de notebook com configurações endurecidas; templates de servidor revisados.",
    nistRef: "PR.IP-1 — A baseline configuration of information technology systems is created and maintained.",
    audience: "TI",
  },
  {
    code: "PR.IP-2", function: "PR", category: "Processos e Procedimentos",
    question: "Há processo de gestão de mudanças (changes em sistemas seguem aprovação/teste)?",
    example: "Ex.: deploys passam por revisão de código + aprovação; mudanças críticas têm janela de manutenção.",
    nistRef: "PR.IP-2 — A System Development Life Cycle to manage systems is implemented.",
    audience: "TI",
  },
  {
    code: "PR.IP-3", function: "PR", category: "Processos e Procedimentos",
    question: "Há controle formal de mudanças de configuração?",
    example: "Ex.: ticketing pra qualquer mudança em produção; histórico de quem alterou e quando.",
    nistRef: "PR.IP-3 — Configuration change control processes are in place.",
    audience: "TI",
  },
  {
    code: "PR.IP-4", function: "PR", category: "Processos e Procedimentos",
    question: "Existe rotina de backup com testes periódicos de restauração?",
    example: "Ex.: backup diário automático; teste de restauração trimestral pra confirmar que funciona.",
    nistRef: "PR.IP-4 — Backups of information are conducted, maintained, and tested.",
    audience: "TI",
  },
  {
    code: "PR.IP-9", function: "PR", category: "Processos e Procedimentos",
    question: "Existe plano de resposta e recuperação de incidentes?",
    example: "Ex.: documento 'O que fazer se ransomware' com passos numerados, contatos, decisões. Já existe parcialmente em Incidentes.",
    nistRef: "PR.IP-9 — Response plans and recovery plans are in place and managed.",
    audience: "AMBOS",
    prepopulateFrom: "INCIDENTES",
  },
  {
    code: "PR.IP-11", function: "PR", category: "Processos e Procedimentos",
    question: "A cibersegurança é considerada nos processos de RH (contratação, demissão)?",
    example: "Ex.: termo de confidencialidade na contratação; revogação de acesso na demissão; checklist pré e pós.",
    nistRef: "PR.IP-11 — Cybersecurity is included in human resources practices.",
    audience: "JURIDICO",
  },
  {
    code: "PR.IP-12", function: "PR", category: "Processos e Procedimentos",
    question: "Há plano de gestão de [vulnerabilidades] (descobrir → priorizar → corrigir)?",
    example: "Ex.: vulnerabilidades críticas corrigidas em até 7 dias, médias em 30 dias, baixas em 90.",
    nistRef: "PR.IP-12 — A vulnerability management plan is developed and implemented.",
    audience: "TI",
    technicalTerms: [TERM_VULNERABILIDADE],
  },

  // PR.MA — Maintenance
  {
    code: "PR.MA-1", function: "PR", category: "Manutenção",
    question: "Há manutenção e reparo dos ativos com controles de segurança?",
    example: "Ex.: técnico externo só acessa após assinatura de NDA; manutenção remota via canal autenticado.",
    nistRef: "PR.MA-1 — Maintenance and repair of organizational assets are performed and logged.",
    audience: "TI",
  },

  // PR.PT — Protective Technology
  {
    code: "PR.PT-1", function: "PR", category: "Tecnologia de Proteção",
    question: "Existe registro de logs de auditoria pra eventos críticos?",
    example: "Ex.: logs de quem acessou banco de dados, alterações em config crítica. Mantidos por 1 ano+.",
    nistRef: "PR.PT-1 — Audit/log records are determined, documented, implemented, and reviewed.",
    audience: "TI",
  },
  {
    code: "PR.PT-3", function: "PR", category: "Tecnologia de Proteção",
    question: "O acesso aos sistemas é restrito por princípios de menor funcionalidade (só serviços necessários ativos)?",
    example: "Ex.: portas/serviços não usados desabilitados; firewall bloqueia tudo que não foi liberado.",
    nistRef: "PR.PT-3 — The principle of least functionality is incorporated.",
    audience: "TI",
  },
  {
    code: "PR.PT-4", function: "PR", category: "Tecnologia de Proteção",
    question: "Existem mecanismos de proteção da rede (firewall, anti-malware, IDS)?",
    example: "Ex.: firewall corporativo, antivírus em todos endpoints, sistema de detecção de intrusão.",
    nistRef: "PR.PT-4 — Communications and control networks are protected.",
    audience: "TI",
  },

  // ===========================================================
  // DE — DETECTAR (12 controles)
  // ===========================================================

  // DE.AE — Anomalies & Events
  {
    code: "DE.AE-1", function: "DE", category: "Anomalias e Eventos",
    question: "Existe [linha de base] do funcionamento normal da rede pra identificar anomalias?",
    example: "Ex.: ferramenta sabe que tráfego médio é X GB/dia; alerta quando ultrapassa 3x.",
    nistRef: "DE.AE-1 — A baseline of network operations and expected data flows is established and managed.",
    audience: "TI",
    technicalTerms: [TERM_LINHA_BASE],
  },
  {
    code: "DE.AE-2", function: "DE", category: "Anomalias e Eventos",
    question: "Eventos detectados são analisados pra entender o que ocorreu?",
    example: "Ex.: ao receber alerta, alguém investiga: foi falso positivo? Ataque real? Quanto impactou?",
    nistRef: "DE.AE-2 — Detected events are analyzed to understand attack targets and methods.",
    audience: "TI",
  },
  {
    code: "DE.AE-3", function: "DE", category: "Anomalias e Eventos",
    question: "Os dados de eventos de segurança são consolidados num lugar central?",
    example: "Ex.: SIEM (Splunk, Wazuh, Elastic) que junta logs de firewall + antivírus + servidores.",
    nistRef: "DE.AE-3 — Event data are aggregated and correlated from multiple sources and sensors.",
    audience: "TI",
  },
  {
    code: "DE.AE-4", function: "DE", category: "Anomalias e Eventos",
    question: "O impacto dos eventos detectados é determinado?",
    example: "Ex.: alerta classificado como 'baixo / médio / crítico' com base no que foi afetado.",
    nistRef: "DE.AE-4 — Impact of events is determined.",
    audience: "TI",
  },
  {
    code: "DE.AE-5", function: "DE", category: "Anomalias e Eventos",
    question: "Existem limiares pré-definidos pra disparar alerta de incidente?",
    example: "Ex.: 'mais de 5 falhas de login em 1 minuto = alerta'; 'tentativa de exfiltração > 100MB = alerta'.",
    nistRef: "DE.AE-5 — Incident alert thresholds are established.",
    audience: "TI",
  },

  // DE.CM — Continuous Monitoring
  {
    code: "DE.CM-1", function: "DE", category: "Monitoramento Contínuo",
    question: "A rede é monitorada continuamente pra detectar atividade suspeita?",
    example: "Ex.: firewall com alerta ativo, IDS, ferramenta tipo Wireshark/Zeek capturando tráfego.",
    nistRef: "DE.CM-1 — The network is monitored to detect potential cybersecurity events.",
    audience: "TI",
  },
  {
    code: "DE.CM-3", function: "DE", category: "Monitoramento Contínuo",
    question: "A atividade dos usuários é monitorada pra detectar uso indevido?",
    example: "Ex.: detecção de logins fora do horário, acesso massivo a arquivos, download anormal.",
    nistRef: "DE.CM-3 — Personnel activity is monitored to detect potential cybersecurity events.",
    audience: "TI",
  },
  {
    code: "DE.CM-4", function: "DE", category: "Monitoramento Contínuo",
    question: "Há detecção ativa de código malicioso (antivírus, EDR)?",
    example: "Ex.: antivírus corporativo (Windows Defender Enterprise, Kaspersky) ou EDR (CrowdStrike, SentinelOne).",
    nistRef: "DE.CM-4 — Malicious code is detected.",
    audience: "TI",
  },
  {
    code: "DE.CM-7", function: "DE", category: "Monitoramento Contínuo",
    question: "Há monitoramento pra detectar pessoas, dispositivos ou software não autorizados?",
    example: "Ex.: alerta quando equipamento desconhecido conecta na rede; quando software não-aprovado é instalado.",
    nistRef: "DE.CM-7 — Monitoring for unauthorized personnel, connections, devices, and software is performed.",
    audience: "TI",
  },
  {
    code: "DE.CM-8", function: "DE", category: "Monitoramento Contínuo",
    question: "A organização realiza varreduras de [vulnerabilidades] periodicamente?",
    example: "Ex.: scan automatizado mensal; pentest anual contratado.",
    nistRef: "DE.CM-8 — Vulnerability scans are performed.",
    audience: "TI",
    technicalTerms: [TERM_VULNERABILIDADE],
  },

  // DE.DP — Detection Processes
  {
    code: "DE.DP-1", function: "DE", category: "Processos de Detecção",
    question: "Há papel/responsabilidade definido pra detecção de eventos de segurança?",
    example: "Ex.: 'Pedro (TI) é responsável por triar alertas em até 4h; equipe externa cobre fora do horário'.",
    nistRef: "DE.DP-1 — Roles and responsibilities for detection are well defined to ensure accountability.",
    audience: "AMBOS",
  },
  {
    code: "DE.DP-4", function: "DE", category: "Processos de Detecção",
    question: "Eventos detectados são comunicados às partes interessadas?",
    example: "Ex.: alerta crítico vai pra grupo de WhatsApp da diretoria; relatório mensal pra gestão.",
    nistRef: "DE.DP-4 — Event detection information is communicated.",
    audience: "AMBOS",
  },

  // ===========================================================
  // RS — RESPONDER (10 controles)
  // ===========================================================

  // RS.RP — Response Planning
  {
    code: "RS.RP-1", function: "RS", category: "Plano de Resposta",
    question: "Existe plano de resposta a incidentes documentado e seguido?",
    example: "Ex.: documento 'Resposta a Incidente' com passos: identificar → conter → erradicar → recuperar → aprender.",
    nistRef: "RS.RP-1 — Response plan is executed during or after an incident.",
    audience: "AMBOS",
    prepopulateFrom: "INCIDENTES",
  },

  // RS.CO — Communications
  {
    code: "RS.CO-1", function: "RS", category: "Comunicações",
    question: "Os papéis e ordem de comunicação durante incidente são claros?",
    example: "Ex.: 'TI avisa CISO em 1h, CISO avisa CEO/jurídico em 2h, jurídico decide ANPD em 24h'.",
    nistRef: "RS.CO-1 — Personnel know their roles and order of operations when a response is needed.",
    audience: "AMBOS",
  },
  {
    code: "RS.CO-2", function: "RS", category: "Comunicações",
    question: "Incidentes são reportados internamente conforme critérios estabelecidos?",
    example: "Ex.: incidente médio = relatório em 24h pra diretoria; crítico = call em 1h. Já existe em Incidentes.",
    nistRef: "RS.CO-2 — Incidents are reported consistent with established criteria.",
    audience: "JURIDICO",
    prepopulateFrom: "INCIDENTES",
  },
  {
    code: "RS.CO-3", function: "RS", category: "Comunicações",
    question: "Informação sobre incidente é compartilhada com partes externas (clientes, ANPD, autoridades)?",
    example: "Ex.: ANPD em 72h, clientes afetados notificados, polícia se for cybercrime. Já existe em Incidentes.",
    nistRef: "RS.CO-3 — Information is shared consistent with response plans.",
    audience: "JURIDICO",
    prepopulateFrom: "INCIDENTES",
  },
  {
    code: "RS.CO-4", function: "RS", category: "Comunicações",
    question: "A coordenação com stakeholders durante incidente segue plano?",
    example: "Ex.: comitê de crise convocado em até 2h; cadência de updates a cada 4h.",
    nistRef: "RS.CO-4 — Coordination with stakeholders occurs consistent with response plans.",
    audience: "AMBOS",
  },

  // RS.AN — Analysis
  {
    code: "RS.AN-1", function: "RS", category: "Análise",
    question: "Notificações dos sistemas de detecção são investigadas e não ignoradas?",
    example: "Ex.: todo alerta de antivírus/firewall é triado em até X horas; nada vai pra lixo direto.",
    nistRef: "RS.AN-1 — Notifications from detection systems are investigated.",
    audience: "TI",
  },
  {
    code: "RS.AN-2", function: "RS", category: "Análise",
    question: "O impacto do incidente é entendido em profundidade?",
    example: "Ex.: análise post-mortem identifica quais sistemas, dados, usuários foram afetados e por quanto tempo.",
    nistRef: "RS.AN-2 — The impact of the incident is understood.",
    audience: "AMBOS",
  },
  {
    code: "RS.AN-3", function: "RS", category: "Análise",
    question: "Análise forense é realizada quando aplicável?",
    example: "Ex.: cópia bit-a-bit do disco antes de qualquer alteração; cadeia de custódia preservada.",
    nistRef: "RS.AN-3 — Forensics are performed.",
    audience: "TI",
  },

  // RS.MI — Mitigation
  {
    code: "RS.MI-1", function: "RS", category: "Mitigação",
    question: "Incidentes são contidos rapidamente?",
    example: "Ex.: máquina infectada é isolada da rede em minutos; conta comprometida é desativada imediatamente.",
    nistRef: "RS.MI-1 — Incidents are contained.",
    audience: "TI",
  },
  {
    code: "RS.MI-2", function: "RS", category: "Mitigação",
    question: "Incidentes são erradicados (causa raiz removida)?",
    example: "Ex.: malware removido + patch da vulnerabilidade explorada + senha trocada de todos afetados.",
    nistRef: "RS.MI-2 — Incidents are mitigated.",
    audience: "TI",
  },

  // RS.IM — Improvements
  {
    code: "RS.IM-1", function: "RS", category: "Melhorias",
    question: "Lições aprendidas dos incidentes são incorporadas ao plano?",
    example: "Ex.: post-mortem após cada incidente alimenta atualização do plano a cada 6 meses.",
    nistRef: "RS.IM-1 — Response plans incorporate lessons learned.",
    audience: "AMBOS",
  },

  // ===========================================================
  // RC — RECUPERAR (6 controles)
  // ===========================================================

  // RC.RP — Recovery Planning
  {
    code: "RC.RP-1", function: "RC", category: "Plano de Recuperação",
    question: "Existe plano de recuperação após incidente que é executado?",
    example: "Ex.: 'voltar do backup', 'recuperar acesso', 'restaurar serviços críticos primeiro'. Documentado.",
    nistRef: "RC.RP-1 — Recovery plan is executed during or after a cybersecurity incident.",
    audience: "TI",
  },

  // RC.IM — Improvements
  {
    code: "RC.IM-1", function: "RC", category: "Melhorias",
    question: "Lições aprendidas são incorporadas aos planos de recuperação?",
    example: "Ex.: 'backup do banco X demorou 6h pra restaurar — vamos passar pra solução tipo Veeam'.",
    nistRef: "RC.IM-1 — Recovery plans incorporate lessons learned.",
    audience: "TI",
  },
  {
    code: "RC.IM-2", function: "RC", category: "Melhorias",
    question: "As estratégias de recuperação são atualizadas com base em mudanças do negócio?",
    example: "Ex.: novo sistema crítico entrou em produção → plano de recuperação atualizado em 30 dias.",
    nistRef: "RC.IM-2 — Recovery strategies are updated.",
    audience: "AMBOS",
  },

  // RC.CO — Communications
  {
    code: "RC.CO-1", function: "RC", category: "Comunicações",
    question: "A reputação organizacional é gerenciada após incidente?",
    example: "Ex.: comunicação de crise pronta, porta-voz designado, FAQ pública preparada.",
    nistRef: "RC.CO-1 — Public relations are managed.",
    audience: "JURIDICO",
  },
  {
    code: "RC.CO-2", function: "RC", category: "Comunicações",
    question: "Atividades de recuperação são comunicadas internamente?",
    example: "Ex.: e-mail diário pra todos durante recuperação informando 'estamos no passo X de Y'.",
    nistRef: "RC.CO-2 — Reputation is repaired after an incident.",
    audience: "AMBOS",
  },
  {
    code: "RC.CO-3", function: "RC", category: "Comunicações",
    question: "Atividades de recuperação são comunicadas a stakeholders externos (clientes, fornecedores, ANPD)?",
    example: "Ex.: clientes informados quando serviço volta, ANPD recebe relatório final em 30 dias.",
    nistRef: "RC.CO-3 — Recovery activities are communicated to internal and external stakeholders.",
    audience: "JURIDICO",
    prepopulateFrom: "INCIDENTES",
  },
];

// ============================================================
// Helpers de consulta
// ============================================================

const CONTROLS_BY_CODE: Record<string, CyberControl> = {};
for (const c of CYBER_CONTROLS) {
  CONTROLS_BY_CODE[c.code] = c;
}

export function getCyberControl(code: string): CyberControl | undefined {
  return CONTROLS_BY_CODE[code];
}

export function getCyberControlsByFunction(fn: CyberFunction): ReadonlyArray<CyberControl> {
  return CYBER_CONTROLS.filter((c) => c.function === fn);
}

export function getCyberControlsByCategory(categoryCode: string): ReadonlyArray<CyberControl> {
  return CYBER_CONTROLS.filter((c) => c.code.startsWith(categoryCode + "-") || c.code.startsWith(categoryCode + "."));
}

export const TOTAL_CYBER_CONTROLS = CYBER_CONTROLS.length;

// ============================================================
// Labels (UI)
// ============================================================

export function cyberFunctionLabel(fn: CyberFunction | string): string {
  switch (fn) {
    case "ID": return "Identificar";
    case "PR": return "Proteger";
    case "DE": return "Detectar";
    case "RS": return "Responder";
    case "RC": return "Recuperar";
    default:   return fn;
  }
}

export function cyberFunctionFullLabel(fn: CyberFunction | string): string {
  return `${cyberFunctionLabel(fn)} (${fn})`;
}

export function cyberAudienceLabel(a: CyberAudience | string): string {
  switch (a) {
    case "JURIDICO": return "Jurídico/Governança";
    case "TI":       return "TI";
    case "AMBOS":    return "Ambos";
    default:         return a;
  }
}

export function cyberAudienceIcon(a: CyberAudience | string): string {
  switch (a) {
    case "JURIDICO": return "👤";
    case "TI":       return "💻";
    case "AMBOS":    return "🤝";
    default:         return "•";
  }
}
