/**
 * Catálogo dos 13 tipos de risco da Análise de Riscos LGPD.
 *
 * Fonte: Aula 16 do curso "LGPD PRO" (slides 4-6 + 11-24) + transcrição
 * da Denise (`scripts/_video-transcript-16-1.txt`).
 *
 * Cada código mapeia 1-pra-1 com uma coluna do Excel modelo (BR-CD):
 *   BR=ausencia_legitimacao · BS=criancas_adolescentes
 *   BT=excessivo · BU=falta_transparencia · BV=transferencia_internacional
 *   BW=compartilhamento_terceiro · BX=armazenagem_indeterminada
 *   BY=finalidade_diversa · BZ=compartilhamento_grupo
 *   CA=aquisicao_indireta · CB=decisao_automatizada · CC=profiling
 *   CD=background_check
 *
 * Não inclui o risco macro "Não atendimento de processo/controle/política
 * com a LGPD" (slide 5/17) — esse pertence à camada de GAP Analysis
 * (Checkpoint 9), não à análise por processo.
 */


// ============================================================
// Tipos
// ============================================================

export type RiskCode =
  | "BR" // Ausência de legitimação
  | "BS" // Crianças/Adolescentes
  | "BT" // Tratamento excessivo
  | "BU" // Falta de transparência
  | "BV" // Transferência internacional
  | "BW" // Compartilhamento com terceiro
  | "BX" // Armazenagem indeterminada
  | "BY" // Finalidade diversa
  | "BZ" // Compartilhamento empresas do grupo
  | "CA" // Aquisição indireta de banco
  | "CB" // Decisão automatizada
  | "CC" // Profiling
  | "CD"; // Background check

export type RiskStatus =
  | "IDENTIFICADO"
  | "EM_MITIGACAO"
  | "ACEITO"
  | "ELIMINADO";

export interface RiskHelpContent {
  /** Descrição factual do que caracteriza esse risco. */
  fato: string;
  /** Artigos da LGPD que fundamentam o risco. */
  fundamentoLegal: string;
  /** Consequência: o que acontece se nada for feito. */
  riscoIdentificado: string;
  /** Recomendações típicas pra mitigar (lista curta). */
  recomendacoes: string[];
}

export interface RiskDefinition {
  code: RiskCode;
  /** Nome curto pra mostrar em listas/cards. */
  shortLabel: string;
  /** Nome completo da metodologia (slides 4-6 do PDF). */
  fullLabel: string;
  /** Frase curta explicando o risco (slides 4-6, segunda linha). */
  summary: string;
  /** Conteúdo expandido pro popover "?" da tela. */
  help: RiskHelpContent;
}

/**
 * Resultado da auto-sugestão pro DPO.
 *
 * - `kind: "preselect"` → o sistema **pré-marca**. As respostas do wizard
 *   são quase mecânicas (ex: "transferência internacional = sim" → BV).
 *   DPO só precisa confirmar (clicar Salvar) ou desmarcar.
 *
 * - `kind: "alert"` → o sistema mostra uma **bandeirinha** com texto
 *   explicando por que vale a pena avaliar. Não pré-marca. Reflete o
 *   conselho da Denise: "tem dado de criança não é risco automático,
 *   mas levanta uma bandeirinha pra avaliar com mais cautela".
 *
 * - `kind: null` → silencioso. Wizard não trouxe nenhum sinal.
 */
export type RiskSuggestion =
  | { kind: "preselect"; reason: string; suggestedDescription?: string }
  | { kind: "alert"; reason: string }
  | { kind: null };

// ============================================================
// Catálogo dos 13 riscos
// ============================================================

export const RISCOS_CATALOG: ReadonlyArray<RiskDefinition> = [
  // ----- BR -----
  {
    code: "BR",
    shortLabel: "Ausência de base legal",
    fullLabel: "Ausência de legitimação para o Tratamento de Dado Pessoal",
    summary:
      "Coleta ou processamento de dados pessoais sem uma base legal própria e específica.",
    help: {
      fato:
        "As atividades de tratamento desenvolvidas pela organização não possuem uma base legal adequada (ou ela não foi formalmente confirmada).",
      fundamentoLegal:
        "Art. 7º (dados comuns) e Art. 11 (dados sensíveis) da LGPD — toda atividade de tratamento precisa estar respaldada em uma das hipóteses legais previstas.",
      riscoIdentificado:
        "Tratar dados sem base legal adequada é descumprimento direto da LGPD e está entre as primeiras motivações de multa da ANPD.",
      recomendacoes: [
        "Definir formalmente uma base legal para a atividade",
        "Cumprir os requisitos específicos da base escolhida (LIA pro legítimo interesse, termo pro consentimento, etc.)",
        "Manter o risco mapeado até o cliente confirmar o mapeamento como versão final",
      ],
    },
  },
  // ----- BS -----
  {
    code: "BS",
    shortLabel: "Crianças/Adolescentes",
    fullLabel:
      "Utilização de Dados Pessoais de Crianças e/ou Adolescentes sem a legitimação adequada",
    summary:
      "Uso de dados de crianças e/ou adolescentes sem observar os requisitos legais específicos.",
    help: {
      fato:
        "O processo trata dados pessoais de crianças (até 12 anos) e/ou adolescentes (12-18 anos).",
      fundamentoLegal:
        "Art. 14 da LGPD — tratamento de dados de crianças e adolescentes deve ser feito no melhor interesse, com consentimento específico de pelo menos um dos pais ou responsável legal (no caso de crianças).",
      riscoIdentificado:
        "Tratamento sem o consentimento adequado e fora do melhor interesse caracteriza descumprimento da LGPD e do ECA, com risco de multa e responsabilização civil.",
      recomendacoes: [
        "Definir base legal adequada (consentimento dos pais quando aplicável)",
        "Elaborar termo de consentimento específico pros responsáveis",
        "Manter pública a informação sobre tipos de dados coletados de menores",
      ],
    },
  },
  // ----- BT -----
  {
    code: "BT",
    shortLabel: "Dados excessivos",
    fullLabel:
      "Tratamento de dado pessoal excessivo em relação à finalidade do tratamento",
    summary:
      "Coleta ou uso de dados pessoais além do necessário para a finalidade proposta.",
    help: {
      fato:
        "A organização coleta ou tem acesso a dados pessoais além daqueles estritamente necessários pra finalidade declarada.",
      fundamentoLegal:
        "Art. 6º, III da LGPD — princípio da necessidade: o tratamento deve se limitar ao mínimo necessário pra realização das finalidades, com dados pertinentes, proporcionais e não excessivos.",
      riscoIdentificado:
        "Tratamento excessivo viola o princípio da necessidade e expõe a organização a multas, inclusive sem que tenha havido vazamento.",
      recomendacoes: [
        "Revisar quais dados são realmente necessários pra atividade",
        "Eliminar ou bloquear acesso a dados desnecessários",
        "Documentar a justificativa pra dados que parecem excessivos mas têm motivo legítimo",
      ],
    },
  },
  // ----- BU -----
  {
    code: "BU",
    shortLabel: "Falta de transparência",
    fullLabel:
      "Falta de transparência ao Titular sobre o tratamento de seus dados pessoais",
    summary:
      "Falta de apresentação de informações claras e adequadas pros titulares de dados.",
    help: {
      fato:
        "A organização não apresenta de forma clara e acessível como os dados são tratados, com quais finalidades e por quanto tempo.",
      fundamentoLegal:
        "Art. 6º, VI (princípio da transparência) e Art. 9º/18 da LGPD — o titular deve ter informações claras sobre finalidade, forma e duração do tratamento, identificação do controlador, compartilhamento e seus direitos.",
      riscoIdentificado:
        "Falta de transparência impede o exercício de direitos pelo titular e configura descumprimento da lei.",
      recomendacoes: [
        "Elaborar/revisar Política de Privacidade interna e externa",
        "Disponibilizar a política em local de fácil acesso",
        "Implementar canal de atendimento ao titular",
      ],
    },
  },
  // ----- BV -----
  {
    code: "BV",
    shortLabel: "Transferência internacional",
    fullLabel:
      "Transferência internacional de dados pessoais sem observância aos requisitos legais",
    summary:
      "Transferência internacional sem respaldo numa das hipóteses do Art. 33 da LGPD.",
    help: {
      fato:
        "Os dados pessoais são compartilhados com pessoas/sistemas localizados em outros países (inclusive servidores de cloud estrangeiros — AWS, Azure, OneDrive, etc.).",
      fundamentoLegal:
        "Art. 33 da LGPD — transferência internacional só é permitida em hipóteses específicas: cláusulas contratuais específicas/padrão, normas corporativas globais, selos/certificados, consentimento específico do titular, ou hipóteses dos incisos II, V e VI do Art. 7º.",
      riscoIdentificado:
        "Transferência sem respaldo numa dessas hipóteses configura descumprimento direto da LGPD.",
      recomendacoes: [
        "Adotar cláusulas contratuais específicas ou padrão pra a transferência",
        "Manter processo de gestão das empresas envolvidas",
        "Garantir transferência segura (criptografia em trânsito, controles de acesso)",
      ],
    },
  },
  // ----- BW -----
  {
    code: "BW",
    shortLabel: "Compartilhamento com terceiros",
    fullLabel:
      "Compartilhamento de dados pessoais com terceiros sem as devidas salvaguardas",
    summary:
      "Compartilhamento sem avaliação de privacidade/segurança e sem cláusulas contratuais adequadas.",
    help: {
      fato:
        "A organização compartilha dados pessoais com terceiros (parceiros, fornecedores, prestadores) sem ter feito avaliação de privacidade ou sem adequar contratos à LGPD.",
      fundamentoLegal:
        "Arts. 39 e 42 da LGPD — operadores que descumprem obrigações se equiparam a controladores; controladores envolvidos respondem solidariamente por danos.",
      riscoIdentificado:
        "Mesmo que o vazamento ou descumprimento tenha sido causado pelo terceiro, a organização pode ser responsabilizada solidariamente.",
      recomendacoes: [
        "Avaliar privacidade e segurança dos terceiros antes do compartilhamento",
        "Adequar contratos com cláusulas de proteção de dados (controlador↔operador, controlador↔controlador)",
        "Manter processo de gestão de terceiros pra verificação periódica",
      ],
    },
  },
  // ----- BX -----
  {
    code: "BX",
    shortLabel: "Armazenagem indeterminada",
    fullLabel: "Dado pessoal armazenado por prazo indeterminado",
    summary:
      "Retenção de dados sem prazo definido nem processo de eliminação após o fim da finalidade.",
    help: {
      fato:
        "Não existe política de retenção e descarte; dados ficam armazenados sem prazo definido, mesmo após esgotada a finalidade.",
      fundamentoLegal:
        "Arts. 15 e 16 da LGPD — o término do tratamento ocorre quando a finalidade é alcançada, o período termina, há revogação de consentimento ou determinação da ANPD. Após o término, os dados devem ser eliminados (com exceções previstas no Art. 16).",
      riscoIdentificado:
        "Retenção indeterminada é um dos riscos mais comuns e mais cobrados pela ANPD; aumenta exposição em caso de vazamento.",
      recomendacoes: [
        "Definir prazos de retenção compatíveis com obrigações legais",
        "Criar política clara de retenção e descarte",
        "Adotar processo automatizado de eliminação (ou anonimização) após o prazo",
      ],
    },
  },
  // ----- BY -----
  {
    code: "BY",
    shortLabel: "Finalidade diversa",
    fullLabel:
      "Possível utilização de dados pessoais para finalidade diversa da que foi coletada",
    summary:
      "Uso de dados pra finalidades diferentes daquela informada ao titular no momento da coleta.",
    help: {
      fato:
        "Os dados coletados pra uma finalidade específica são utilizados também pra outras finalidades, sem que o titular tenha sido informado.",
      fundamentoLegal:
        "Art. 6º, I e II da LGPD — princípios da finalidade e adequação: o tratamento deve ter propósito legítimo, específico, explícito e informado ao titular, e ser compatível com as finalidades informadas.",
      riscoIdentificado:
        "Uso pra outras finalidades sem nova comunicação viola os princípios da finalidade e adequação.",
      recomendacoes: [
        "Revisar dados coletados e estabelecer finalidades específicas pra cada um",
        "Informar o titular de modo a demonstrar a finalidade real do tratamento",
        "Documentar legítimo interesse (LIA) se for o caso de uso secundário",
      ],
    },
  },
  // ----- BZ -----
  {
    code: "BZ",
    shortLabel: "Empresas do grupo",
    fullLabel:
      "Compartilhamento de dados pessoais com empresas do mesmo grupo econômico",
    summary:
      "Compartilhamento dentro do grupo sem finalidade específica, concreta e informada ao titular.",
    help: {
      fato:
        "A organização compartilha dados com empresas do mesmo grupo econômico assumindo que isso é automático/permitido.",
      fundamentoLegal:
        "Mesmo entre empresas do mesmo grupo, o compartilhamento deve ser realizado para finalidade específica, concreta e informada ao titular.",
      riscoIdentificado:
        "Compartilhamento intra-grupo sem transparência e finalidade específica pode caracterizar descumprimento da LGPD.",
      recomendacoes: [
        "Avaliar a oportunidade de revisão dos processos de compartilhamento",
        "Formalizar Regras Corporativas de Proteção de Dados",
        "Garantir transferência segura entre as empresas do grupo",
      ],
    },
  },
  // ----- CA -----
  {
    code: "CA",
    shortLabel: "Aquisição indireta de base",
    fullLabel: "Aquisição indireta de banco de dados",
    summary:
      "Compra ou recebimento de banco de dados de terceiros sem garantia de legitimação e transparência.",
    help: {
      fato:
        "A organização adquire ou recebe banco de dados de terceiros, e o titular não tem expectativa de que seu dado esteja com essa organização.",
      fundamentoLegal:
        "Art. 6º, I (princípio da finalidade) e Art. 9º (direito à informação sobre uso compartilhado) da LGPD.",
      riscoIdentificado:
        "Aquisição indireta sem legitimação e transparência ao titular pode levar a organização a responder como se fosse controladora, aumentando significativamente sua responsabilidade.",
      recomendacoes: [
        "Verificar a legitimação do tratamento pelo terceiro fornecedor",
        "Verificar se o compartilhamento foi previsto na coleta original",
        "Revisar o contrato com a empresa fornecedora",
      ],
    },
  },
  // ----- CB -----
  {
    code: "CB",
    shortLabel: "Decisão automatizada",
    fullLabel: "Decisão automatizada (sem revisão humana adequada)",
    summary:
      "Tomada de decisão baseada unicamente em algoritmo, com risco de discriminação.",
    help: {
      fato:
        "O processo realiza tomada de decisão com base em critérios automatizados (algoritmo, ML), unicamente por máquina/robô.",
      fundamentoLegal:
        "Art. 20 da LGPD — o titular tem direito a solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado; o controlador deve fornecer informações claras sobre os critérios usados.",
      riscoIdentificado:
        "Algoritmos podem aprender padrões discriminatórios (ex: gênero, raça, idade). A não monitoração pode gerar violação ao princípio da não discriminação.",
      recomendacoes: [
        "Manter registro do procedimento pra eventual demanda da ANPD ou titular",
        "Elaborar DPIA (Relatório de Impacto)",
        "Revisar Política de Privacidade indicando o uso de decisão automatizada",
        "Monitorar continuamente o algoritmo pra detectar viés",
      ],
    },
  },
  // ----- CC -----
  {
    code: "CC",
    shortLabel: "Profiling",
    fullLabel: "Profiling — criação de perfis comportamentais",
    summary:
      "Monitoramento e rastreio de atividades pra criar perfis baseados em gostos e preferências.",
    help: {
      fato:
        "A organização monitora e rastreia atividades dos titulares pra criar perfis (clusters, segmentações) com base em comportamento, gostos e preferências.",
      fundamentoLegal:
        "Art. 5º, XVII e Art. 20 da LGPD — atividades de profiling exigem documentação de impacto (DPIA) quando podem gerar riscos às liberdades civis e direitos fundamentais.",
      riscoIdentificado:
        "Profiling pode resultar em discriminação (titular perde acesso a produto/serviço pelo perfil construído) e impactar diretamente direitos fundamentais.",
      recomendacoes: [
        "Manter registro do procedimento de profiling",
        "Elaborar DPIA pra avaliar impacto às liberdades dos titulares",
        "Dar transparência ao titular sobre como suas informações são utilizadas",
      ],
    },
  },
  // ----- CD -----
  {
    code: "CD",
    shortLabel: "Background check",
    fullLabel: "Background check (consulta de antecedentes)",
    summary:
      "Consulta de antecedentes criminais/score de crédito que pode impactar liberdades e garantias do titular.",
    help: {
      fato:
        "A organização realiza consultas de antecedentes criminais, trabalhistas ou score de crédito de seus titulares (geralmente candidatos ou colaboradores).",
      fundamentoLegal:
        "Posicionamento do TST e princípios da LGPD — background check só é admitido em casos excepcionais (cargos de confiança, atividades essenciais que justifiquem). Em outros casos pode gerar pleito de dano moral e Termo de Ajustamento de Conduta (TAC) do MPT.",
      riscoIdentificado:
        "Realização indiscriminada pode caracterizar discriminação e violação à LGPD, além de risco trabalhista (TAC, indenização).",
      recomendacoes: [
        "Limitar background check só aos casos legalmente justificáveis",
        "Restringir o acesso aos dados resultantes (apenas gestor/RH responsável)",
        "Documentar formalmente o motivo da consulta na atividade",
      ],
    },
  },
];

/** Mapa código → definição (lookup O(1)). */
export const RISCOS_BY_CODE: Record<RiskCode, RiskDefinition> =
  Object.fromEntries(RISCOS_CATALOG.map((r) => [r.code, r])) as Record<
    RiskCode,
    RiskDefinition
  >;

/**
 * Lookup do nome curto pra exibição. Sempre devolve string —
 * cai no próprio código se não achar (fail-safe pra dados antigos).
 *
 * Use em qualquer lugar onde o código bruto apareceria pra usuário
 * final (ex: "BU"). Combine com `formatRiskTitle()` quando montar
 * frases tipo "Tratar risco …".
 */
export function riskShortLabel(code: string | null | undefined): string {
  if (!code) return "";
  const def = RISCOS_BY_CODE[code as RiskCode];
  return def?.shortLabel ?? code;
}

/**
 * Frase pronta pra title de cards/recomendações:
 *   "Falta de transparência (BU)"
 * Caso o código não esteja no catálogo, devolve só ele.
 */
export function formatRiskTitle(code: string | null | undefined): string {
  if (!code) return "";
  const def = RISCOS_BY_CODE[code as RiskCode];
  if (!def) return code;
  return `${def.shortLabel} (${def.code})`;
}

// ============================================================
// Agrupamento por categoria — pra UI de Análise de Riscos exibir
// os 13 tipos em 3 grupos lógicos com barra de progresso por área.
// Decisão UX 2026-05-08: agrupar em vez de scrollar 13 toggles.
// ============================================================

export type RiskCategory = "TRATAMENTO" | "COMPARTILHAMENTO" | "DIREITOS";

export const RISK_CATEGORY_LABEL: Record<RiskCategory, string> = {
  TRATAMENTO: "Tratamento de Dados",
  COMPARTILHAMENTO: "Compartilhamento e Transferências",
  DIREITOS: "Decisões Automatizadas e Direitos do Titular",
};

export const RISK_CATEGORY_DESCRIPTION: Record<RiskCategory, string> = {
  TRATAMENTO:
    "Princípios da LGPD aplicados ao processamento: base legal, minimização, transparência, finalidade, retenção e formas de coleta (Arts. 6º, 7º, 11, 14, 15)",
  COMPARTILHAMENTO:
    "Riscos de quando os dados saem do controlador: transferência internacional, operadores terceiros, empresas do grupo (Arts. 26-33)",
  DIREITOS:
    "Riscos relacionados a decisões automatizadas, profiling e direitos do titular (Art. 20)",
};

/** Mapa código → categoria. Cobre os 13 riscos BR..CD do catálogo. */
export const RISK_CATEGORY_BY_CODE: Record<RiskCode, RiskCategory> = {
  // Tratamento (7) — bases legais + princípios + coleta
  BR: "TRATAMENTO", // Ausência de legitimação
  BS: "TRATAMENTO", // Crianças/Adolescentes
  BT: "TRATAMENTO", // Tratamento excessivo
  BU: "TRATAMENTO", // Falta de transparência
  BX: "TRATAMENTO", // Armazenagem indeterminada
  BY: "TRATAMENTO", // Finalidade diversa
  CA: "TRATAMENTO", // Aquisição indireta
  // Compartilhamento (3)
  BV: "COMPARTILHAMENTO", // Transferência internacional
  BW: "COMPARTILHAMENTO", // Compartilhamento com terceiro
  BZ: "COMPARTILHAMENTO", // Compartilhamento empresas do grupo
  // Decisões automatizadas + Direitos (3)
  CB: "DIREITOS", // Decisão automatizada
  CC: "DIREITOS", // Profiling
  CD: "DIREITOS", // Background check
};

/** Ordem de exibição das categorias na UI. */
export const RISK_CATEGORIES_ORDERED: RiskCategory[] = [
  "TRATAMENTO",
  "COMPARTILHAMENTO",
  "DIREITOS",
];

/** Helper: retorna riscos de uma categoria. */
export function riscosByCategory(cat: RiskCategory): RiskDefinition[] {
  return RISCOS_CATALOG.filter((r) => RISK_CATEGORY_BY_CODE[r.code] === cat);
}

// ============================================================
// Lifecycle / status helpers
// ============================================================

export const RISK_STATUS = {
  IDENTIFICADO: "IDENTIFICADO",
  EM_MITIGACAO: "EM_MITIGACAO",
  ACEITO: "ACEITO",
  ELIMINADO: "ELIMINADO",
} as const;

export function riskStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case RISK_STATUS.IDENTIFICADO:
      return "Identificado";
    case RISK_STATUS.EM_MITIGACAO:
      return "Em mitigação";
    case RISK_STATUS.ACEITO:
      return "Aceito pela organização";
    case RISK_STATUS.ELIMINADO:
      return "Eliminado";
    default:
      return "Identificado";
  }
}

export function riskStatusColor(status: string | null | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case RISK_STATUS.IDENTIFICADO:
      return {
        bg: "bg-red-100 dark:bg-red-950/40",
        text: "text-red-800 dark:text-red-300",
        border: "border-red-300 dark:border-red-800",
      };
    case RISK_STATUS.EM_MITIGACAO:
      return {
        bg: "bg-amber-100 dark:bg-amber-950/40",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-300 dark:border-amber-800",
      };
    case RISK_STATUS.ACEITO:
      return {
        bg: "bg-blue-100 dark:bg-blue-950/40",
        text: "text-blue-800 dark:text-blue-300",
        border: "border-blue-300 dark:border-blue-800",
      };
    case RISK_STATUS.ELIMINADO:
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/40",
        text: "text-emerald-800 dark:text-emerald-300",
        border: "border-emerald-300 dark:border-emerald-800",
      };
    default:
      return {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-300 dark:border-gray-700",
      };
  }
}

// ============================================================
// Severidade (Checkpoint 6 — Detalhamento de Riscos)
// ============================================================
//
// Matriz Probabilidade × Impacto → Severidade. Lógica padrão LGPD PRO
// (combinação dos níveis Baixo/Médio/Alto em cada eixo). DPO escolhe
// Probabilidade e Impacto manualmente; Severidade é DERIVADA — não dá
// pra editar direto.

export type RiskProbability = "BAIXA" | "MEDIA" | "ALTA";
export type RiskImpact = "BAIXO" | "MEDIO" | "ALTO";
export type RiskSeverity = "BAIXO" | "MEDIO" | "ALTO";

export const RISK_PROBABILITY = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
} as const;

export const RISK_IMPACT = {
  BAIXO: "BAIXO",
  MEDIO: "MEDIO",
  ALTO: "ALTO",
} as const;

export const RISK_SEVERITY = {
  BAIXO: "BAIXO",
  MEDIO: "MEDIO",
  ALTO: "ALTO",
} as const;

/**
 * Matriz 3×3 de severidade. Linhas = Probabilidade, Colunas = Impacto.
 *
 *               Impacto
 *               BAIXO  MEDIO  ALTO
 *   Prob BAIXA  BAIXO  BAIXO  MEDIO
 *        MEDIA  BAIXO  MEDIO  ALTO
 *        ALTA   MEDIO  ALTO   ALTO
 *
 * Justificativa: risco isolado de baixa probabilidade + alto impacto
 * ainda merece atenção (= MEDIO); alta probabilidade + baixo impacto
 * idem (recorrência amplifica). Os cantos opostos da diagonal são
 * neutralizados em MEDIO.
 */
const SEVERITY_MATRIX: Record<RiskProbability, Record<RiskImpact, RiskSeverity>> = {
  BAIXA: { BAIXO: "BAIXO", MEDIO: "BAIXO", ALTO: "MEDIO" },
  MEDIA: { BAIXO: "BAIXO", MEDIO: "MEDIO", ALTO: "ALTO" },
  ALTA:  { BAIXO: "MEDIO", MEDIO: "ALTO",  ALTO: "ALTO" },
};

export function computeSeverity(
  probability: RiskProbability,
  impact: RiskImpact,
): RiskSeverity {
  return SEVERITY_MATRIX[probability][impact];
}

/**
 * Persistência: salvamos os 3 valores juntos no campo `severityLevel`
 * do model `ProcessRisk` num formato chave-valor estável "P:M;I:A;S:ALTO".
 * Vantagens: 1 campo só (não precisa migration nova); fácil parse;
 * legível direto no banco.
 */
export interface SeverityState {
  probability: RiskProbability;
  impact: RiskImpact;
  severity: RiskSeverity;
}

export function encodeSeverity(s: SeverityState): string {
  return `P:${s.probability[0]};I:${s.impact[0]};S:${s.severity}`;
}

export function decodeSeverity(raw: string | null | undefined): SeverityState | null {
  if (!raw) return null;
  // Aceita formato novo "P:M;I:A;S:ALTO" e tolera ruído
  const m = raw.match(/P:([BMA]);I:([BMA]);S:(BAIXO|MEDIO|ALTO)/);
  if (m) {
    const probLetter = m[1] as "B" | "M" | "A";
    const impLetter = m[2] as "B" | "M" | "A";
    const probMap: Record<"B" | "M" | "A", RiskProbability> = {
      B: "BAIXA", M: "MEDIA", A: "ALTA",
    };
    const impMap: Record<"B" | "M" | "A", RiskImpact> = {
      B: "BAIXO", M: "MEDIO", A: "ALTO",
    };
    return {
      probability: probMap[probLetter],
      impact: impMap[impLetter],
      severity: m[3] as RiskSeverity,
    };
  }
  // Compat: se o campo só tem o nível final ("BAIXO"|"MEDIO"|"ALTO")
  // de uma versão antiga, devolvemos só severity (P/I null).
  if (raw === "BAIXO" || raw === "MEDIO" || raw === "ALTO") {
    return { probability: "MEDIA", impact: "MEDIO", severity: raw };
  }
  return null;
}

export function severityLabel(s: string | null | undefined): string {
  switch (s) {
    case "BAIXO": return "Baixo";
    case "MEDIO": return "Médio";
    case "ALTO":  return "Alto";
    default:      return "—";
  }
}

export function probabilityLabel(p: string | null | undefined): string {
  switch (p) {
    case "BAIXA": return "Baixa";
    case "MEDIA": return "Média";
    case "ALTA":  return "Alta";
    default:      return "—";
  }
}

export function impactLabel(i: string | null | undefined): string {
  switch (i) {
    case "BAIXO": return "Baixo";
    case "MEDIO": return "Médio";
    case "ALTO":  return "Alto";
    default:      return "—";
  }
}

/** Classes Tailwind pra badge de severidade. */
export function severityBadgeClass(s: string | null | undefined): string {
  switch (s) {
    case "ALTO":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
    case "MEDIO":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "BAIXO":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
}

/** Tooltip explicativo de cada nível de probabilidade. */
export const PROBABILITY_HINTS: Record<RiskProbability, string> = {
  BAIXA: "Pouco provável de ocorrer. Cenários raros, controles existentes funcionam bem.",
  MEDIA: "Pode ocorrer ocasionalmente. Existe alguma exposição mas não é frequente.",
  ALTA:  "Muito provável ou já ocorre. Falhas estruturais ou controles ausentes/falhos.",
};

/** Tooltip explicativo de cada nível de impacto. */
export const IMPACT_HINTS: Record<RiskImpact, string> = {
  BAIXO: "Consequência limitada: pequenos ajustes operacionais ou impacto restrito a poucos titulares.",
  MEDIO: "Multa moderada da ANPD, danos à imagem internos, indenização individual.",
  ALTO:  "Multa de até 2% do faturamento, dano massivo à reputação, ação coletiva ou TAC do MPT.",
};


// ============================================================
// Mono (Comitê) — texto pronto pra preencher recomendação/descrição do risco
// ============================================================

/** Descrição factual do risco (preenche ProcessRisk.descricao). */
export function descricaoDoRisco(code: RiskCode): string {
  const r = RISCOS_BY_CODE[code];
  if (!r) return "";
  return `${r.fullLabel} — ${r.help.fato}`;
}

/** Recomendação acionável + fundamento legal (preenche ProcessRisk.recomendacao). */
export function recomendacaoDoRisco(code: RiskCode): string {
  const r = RISCOS_BY_CODE[code];
  if (!r) return "";
  const recs = r.help.recomendacoes.map((x) => `- ${x}`).join("; ");
  return `${recs}. Fundamento: ${r.help.fundamentoLegal}`;
}
