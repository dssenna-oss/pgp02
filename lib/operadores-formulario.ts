/**
 * Catálogo do Formulário de Avaliação de Terceiros
 * (Checkpoint 14 / G2).
 *
 * Transcrito do XLSX modelo da Denise (52 perguntas em 7 blocos), com
 * tags CYBER / LGPD / CYBER_LGPD pra calcular pontuações separadas.
 *
 * Cada pergunta tem:
 *   - id estável (q1, q1_1, q10_2, q44_1, ...)
 *   - block (1..7) e blockName
 *   - tag — define em qual dimensão soma (Cyber, LGPD ou ambas)
 *   - question (texto literal)
 *   - expectedAnswer ("S" | "N") — gabarito; resposta igual = 1 ponto
 *   - needsEvidence (boolean) — se "true", terceiro deve anexar evidência
 *   - isParent (boolean) — perguntas-mãe que apenas agrupam sub-questões
 *     (não pontuam; só servem pra navegação/legenda)
 *   - subOf (string?) — id da pergunta-mãe, se aplicável
 *
 * Engine de pontuação em `lib/operadores-pontuacao.ts`.
 */

export type FormTag = "CYBER" | "LGPD" | "CYBER_LGPD";
export type FormAnswer = "S" | "N" | "NA";

export interface FormQuestion {
  id: string;
  block: number;
  blockName: string;
  tag: FormTag | null;            // null em perguntas-mãe sem score
  question: string;
  expectedAnswer: FormAnswer | null;
  needsEvidence: boolean;
  isParent: boolean;
  subOf: string | null;
}

const B1 = "BLOCO I — Políticas, Padrões e Procedimentos";
const B2 = "BLOCO II — Segurança de Aplicação";
const B3 = "BLOCO III — Operação de Segurança";
const B4 = "BLOCO IV — Segurança de Infraestrutura";
const B5 = "BLOCO V — Segurança da Informação";
const B6 = "BLOCO VI — Segurança Física";
const B7 = "BLOCO VII — Privacidade / LGPD";

export const FORM_QUESTIONS: ReadonlyArray<FormQuestion> = [
  // ---------- Bloco I — Políticas, Padrões e Procedimentos ----------
  {
    id: "q1", block: 1, blockName: B1, tag: null, isParent: true, subOf: null,
    question: "A empresa possui uma estrutura de governança de segurança cibernética, que estabelece diretrizes, normas e procedimentos aderente às melhores práticas de mercado nos temas abaixo?",
    expectedAnswer: null, needsEvidence: false,
  },
  {
    id: "q1_1", block: 1, blockName: B1, tag: "CYBER", isParent: false, subOf: "q1",
    question: "1.1. Segurança da Informação e Cibernética.",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q1_2", block: 1, blockName: B1, tag: "LGPD", isParent: false, subOf: "q1",
    question: "1.2. Privacidade e proteção de dados pessoais.",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q2", block: 1, blockName: B1, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui política de segurança da informação e cibernética baseada em princípios e diretrizes que busquem assegurar a confidencialidade, a integridade, autenticidade e a disponibilidade dos dados e dos sistemas de informação utilizados?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q3", block: 1, blockName: B1, tag: "LGPD", isParent: false, subOf: null,
    question: "A empresa mantém política institucional (ou documento equivalente) sobre privacidade e proteção de dados pessoais, aprovado pela alta administração?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q4", block: 1, blockName: B1, tag: "CYBER_LGPD", isParent: false, subOf: null,
    question: "As políticas de segurança da informação, cibernética e de proteção de dados pessoais são divulgadas aos funcionários da empresa e às empresas prestadoras de serviços, mediante linguagem clara, acessível e em nível de detalhamento compatível com as funções desempenhadas?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q5", block: 1, blockName: B1, tag: "CYBER_LGPD", isParent: false, subOf: null,
    question: "A empresa realiza periodicamente avaliação e verificação das normas e dos procedimentos em segurança da informação, cibernética e de proteção de dados pessoais?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q6", block: 1, blockName: B1, tag: "CYBER_LGPD", isParent: false, subOf: null,
    question: "Existe comitê, fórum ou grupo específico para tratar segurança da informação, cibernética e de proteção de dados pessoais dentro da empresa, com representação e governança apropriados?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q7", block: 1, blockName: B1, tag: "CYBER_LGPD", isParent: false, subOf: null,
    question: "Existe definição formal de papéis e responsabilidades na empresa, em relação Segurança da informação, cibernética e de proteção de dados pessoais (ex: nos normativos, ordem de serviços, etc)?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q8", block: 1, blockName: B1, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui Plano de Prevenção e Resposta a Incidentes Cibernéticos que declara os procedimentos, controles e tecnologias para prevenir e responder a eventuais incidentes de segurança cibernética?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q9", block: 1, blockName: B1, tag: "CYBER", isParent: false, subOf: null,
    question: "Aplicável para o setor financeiro: Para as contratações de serviços relevantes de processamento e armazenamento de dados e de computação em nuvem, a empresa adota procedimentos em conformidade à Resolução 4.658 ou à Circular 3.909?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q10", block: 1, blockName: B1, tag: null, isParent: true, subOf: null,
    question: "A empresa disponibiliza capacitação contínua de seu corpo funcional?",
    expectedAnswer: null, needsEvidence: false,
  },
  {
    id: "q10_1", block: 1, blockName: B1, tag: "CYBER", isParent: false, subOf: "q10",
    question: "10.1. Segurança da Informação e Cibernética?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q10_2", block: 1, blockName: B1, tag: "LGPD", isParent: false, subOf: "q10",
    question: "10.2. Privacidade e proteção de dados pessoais?",
    expectedAnswer: "S", needsEvidence: true,
  },

  // ---------- Bloco II — Segurança de Aplicação ----------
  {
    id: "q11", block: 2, blockName: B2, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa adota padrões nacionais e/ou internacionais de segurança no desenvolvimento de novos produtos/serviços desde as fases iniciais de seu ciclo de vida?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q12", block: 2, blockName: B2, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui norma que padroniza a aplicação de atualizações e correções em componentes de infraestrutura de TI (softwares e equipamentos)?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q13", block: 2, blockName: B2, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa realiza testes de segurança em aplicações e sistemas desenvolvidos internamente e/ou adquiridos de fornecedores?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q14", block: 2, blockName: B2, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa executa revisões no código-fonte, baseado no aspecto segurança, como parte de seu ciclo de vida de desenvolvimento de software?",
    expectedAnswer: "S", needsEvidence: false,
  },

  // ---------- Bloco III — Operação de Segurança ----------
  {
    id: "q15", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa faz monitoramento contínuo e proativo das ameaças e dos ataques cibernéticos?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q16", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui equipe de tratamento e resposta aos incidentes cibernéticos (ETIRs/CSIRT — Computer Security Incident Response Team), com ênfase no uso de tecnologias emergentes?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q17", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui políticas e normas estabelecidas para controles de acessos e gestão de identidade?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q18", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa busca identificar e avaliar vulnerabilidades e gerenciar o risco de ameaças, adotando as cinco funções previstas na estrutura de segurança cibernética do NIST: Identificar, Proteger, Detectar, Responder e Restaurar?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q19", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa utiliza modelos reconhecidos para um adequado diagnóstico do estado em que se encontra, identificando os pontos mais vulneráveis de seus sistemas, as ameaças cibernéticas mais prováveis e os maiores fatores de risco?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q20", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa utiliza plataforma SOAR para gerenciamento de recursos (dispositivos portáteis, endpoints, servidores de e-mail, roteadores, switches, Wireless, firewalls, sistemas de arquivos, DNS, DHCP, IDS, IPS e SIEM)?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q21", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa realiza a medição da eficácia e da eficiência dos centros de tratamento e resposta aos incidentes computacionais?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q22", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa estabelece rotina de verificações de conformidade em segurança cibernética?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q23", block: 3, blockName: B3, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui planos de resposta a incidentes e de recuperação dos ambientes críticos que podem ser impactados pelos incidentes cibernéticos?",
    expectedAnswer: "S", needsEvidence: true,
  },

  // ---------- Bloco IV — Segurança de Infraestrutura ----------
  {
    id: "q24", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa se utiliza de segurança de borda nas redes de computadores, por meio de firewalls e outros mecanismos de filtros de pacotes?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q25", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui recursos anti-malware em estações e servidores de rede, como antivírus e firewalls?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q26", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A documentação do ambiente tecnológico (topologia física e lógica, identificação dos equipamentos e localização física, relação de sistema operacional e softwares instalados) é atualizada e armazenada em local com acesso controlado?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q27", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa monitora todos os componentes de infraestrutura e soluções de TI como forma de assegurar a disponibilidade e o funcionamento dos serviços?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q28", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui normas específicas para o gerenciamento e uso de dispositivos móveis?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q29", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa possui normas e padrões referentes ao descarte de mídias e equipamentos de recursos tecnológicos desativados?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q30", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa utiliza certificado digital para tratamento de informações críticas?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q31", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa disponibiliza ao CSIRT ferramentas computacionais adequadas, e sistemas baseados em tecnologias emergentes, condizentes com os padrões internacionais?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q32", block: 4, blockName: B4, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa realiza procedimentos de cópias de segurança periódicas, segregadas de forma automática e armazenadas em local protegido?",
    expectedAnswer: "S", needsEvidence: false,
  },

  // ---------- Bloco V — Segurança da Informação ----------
  {
    id: "q33", block: 5, blockName: B5, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa identifica, comunica e corrige informações e falhas de sistema de informações em tempo hábil?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q34", block: 5, blockName: B5, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa utiliza sandboxing para detectar ou bloquear e-mails potencialmente maliciosos?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q35", block: 5, blockName: B5, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa faz uso de informações de indicadores de ameaças relevantes para as informações e sistemas que estão sendo protegidos, e usa mitigações eficazes?",
    expectedAnswer: "S", needsEvidence: false,
  },

  // ---------- Bloco VI — Segurança Física ----------
  {
    id: "q36", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa limita o acesso físico a sistemas de informações organizacionais, equipamentos e respectivos ambientes operacionais a indivíduos autorizados?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q37", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa acompanha e monitora os visitantes, bem como suas atividades?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q38", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa mantém registros de acesso físico para auditoria?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q39", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa controla e gerencia o acesso físico?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q40", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa protege e monitora as instalações físicas e a infraestrutura de suporte dos sistemas organizacionais?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q41", block: 6, blockName: B6, tag: "CYBER", isParent: false, subOf: null,
    question: "A empresa aplica medidas de proteção para informação sensível em locais de trabalho alternativos (home office etc.)?",
    expectedAnswer: "S", needsEvidence: false,
  },

  // ---------- Bloco VII — Privacidade / LGPD ----------
  {
    id: "q42", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Realiza o tratamento de dados pessoais sensíveis?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q43", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Mantém registro/inventário das operações de tratamento de dados pessoais?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q44", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Realiza identificação e mensuração de riscos no tratamento de dados realizados?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q44_1", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: "q44",
    question: "44.1. As respostas aos riscos são planejadas, priorizadas e implementadas?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q45", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Todos os dados pessoais necessários são encaminhados e/ou disponibilizados pelo Controlador (a empresa contratante)? (Caso a resposta seja \"Não\", responda também os 4 sub-itens abaixo.)",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q45_1", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: "q45",
    question: "45.1. Considerando os dados pessoais encaminhados pelo Controlador, sua empresa realiza (ou pode vir a realizar) tratamentos diversos das finalidades acordadas?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q45_2", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: "q45",
    question: "45.2. Considerando os dados pessoais coletados diretamente pela empresa e necessários no contexto do contrato com o Controlador, seu tratamento está respaldado em base legal apropriada?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q45_3", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: "q45",
    question: "45.3. Algum tratamento dos dados pessoais coletados diretamente pela empresa e necessários no contexto do contrato com o Controlador é baseado no consentimento do titular?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q45_4", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: "q45",
    question: "45.4. Considerando os dados pessoais coletados diretamente pela empresa e necessários no contexto do contrato, eles são mantidos somente pelo período necessário ao cumprimento das obrigações?",
    expectedAnswer: "S", needsEvidence: false,
  },
  {
    id: "q46", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Realiza tratamento de dados pessoais fora do território nacional?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q47", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "O tratamento de dados pessoais envolve a participação de terceiros (prestadores de serviços, subcontratados, fornecedores, etc.)?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q48", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Ocorre algum tratamento de dados pessoais em ambiente de nuvem (públicas, privadas ou compartilhadas)?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q49", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Disponibiliza canais de atendimento aos titulares de dados pessoais, garantindo acesso aos direitos previstos na LGPD?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q50", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Existem planos ou procedimentos para detecção e resposta a incidentes de segurança que envolvam dados pessoais, incluindo a comunicação tempestiva ao Controlador?",
    expectedAnswer: "S", needsEvidence: true,
  },
  {
    id: "q51", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "Sua empresa já passou por algum incidente de violações de segurança da informação ou cibersegurança nos últimos 2 anos?",
    expectedAnswer: "N", needsEvidence: false,
  },
  {
    id: "q52", block: 7, blockName: B7, tag: "LGPD", isParent: false, subOf: null,
    question: "A empresa é certificada em algum padrão ou framework de segurança (ISO 27001, SOC 2, etc.)?",
    expectedAnswer: "S", needsEvidence: true,
  },
];

// ============================================================
// Helpers de leitura
// ============================================================

const QUESTIONS_BY_ID = new Map<string, FormQuestion>(
  FORM_QUESTIONS.map((q) => [q.id, q])
);

export function getFormQuestion(id: string): FormQuestion | undefined {
  return QUESTIONS_BY_ID.get(id);
}

/** Total de perguntas que pontuam (excluindo parents). */
export function getScorableQuestions(): FormQuestion[] {
  return FORM_QUESTIONS.filter((q) => !q.isParent && q.tag != null);
}

/** Total de perguntas em uma dimensão. */
export function getMaxScore(dimension: "CYBER" | "LGPD"): number {
  return getScorableQuestions().filter((q) =>
    dimension === "CYBER"
      ? q.tag === "CYBER" || q.tag === "CYBER_LGPD"
      : q.tag === "LGPD" || q.tag === "CYBER_LGPD"
  ).length;
}

/** Lista de blocos únicos com nomes. */
export interface FormBlock {
  block: number;
  name: string;
  questions: FormQuestion[];
}

export function getFormBlocks(): FormBlock[] {
  const map = new Map<number, FormBlock>();
  for (const q of FORM_QUESTIONS) {
    if (!map.has(q.block)) {
      map.set(q.block, { block: q.block, name: q.blockName, questions: [] });
    }
    map.get(q.block)!.questions.push(q);
  }
  return [...map.values()].sort((a, b) => a.block - b.block);
}

// ============================================================
// Estrutura das respostas (terceiro preenche)
// ============================================================

export interface FormResponseItem {
  /** "S" | "N" | "NA" — N/A não conta no score (e diminui o max). */
  answer: FormAnswer;
  /** Texto curto de evidência (link, página do anexo, etc.) */
  evidence?: string;
  /** Comentário/justificativa */
  comment?: string;
}

export type FormResponses = Record<string, FormResponseItem>;
