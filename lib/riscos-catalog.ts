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

import type { FormAnswers } from "./inventario-form-schema";

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
// Auto-suggest engine
// ============================================================

/**
 * Helpers de leitura defensiva do FormAnswers.
 *
 * As respostas vêm como JSON livre — formato pode variar entre rascunhos
 * antigos e atuais. Sempre tratar com tolerância.
 */

function getSection(answers: FormAnswers | null | undefined, sec: string): any {
  if (!answers) return {};
  const sections = (answers as any)?.sections ?? {};
  return sections?.[sec] ?? {};
}

function isYes(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase().startsWith("sim");
}

function arrIncludes(value: unknown, needle: string): boolean {
  if (!Array.isArray(value)) return false;
  const n = needle.toLowerCase();
  return value.some(
    (v) => typeof v === "string" && v.toLowerCase().includes(n)
  );
}

function hasNonNAValue(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.some(
    (v) => typeof v === "string" && v.trim() && v.trim().toUpperCase() !== "N/A"
  );
}

/**
 * Heurística de auto-sugestão: lê as respostas do wizard e devolve
 * um veredicto por código de risco.
 *
 * Filosofia (alinhada com a Denise):
 * - "preselect" só quando a resposta é quase mecânica (transferência
 *   internacional, automatizada, recebe de outra empresa, etc.).
 * - "alert" quando há sinal mas o DPO precisa avaliar contexto (criança,
 *   excessivo, falta de transparência).
 * - null quando o wizard não trouxe sinal claro.
 *
 * Bases legais ainda vazias geram preselect de BR (ausência de legitimação),
 * conforme prática da Denise: "mantenho o risco até o cliente confirmar
 * o mapeamento como versão final".
 */
export function suggestRisks(input: {
  answers?: FormAnswers | null;
  legalBasis?: string | null;
  legalBasisSensitive?: string | null;
  hasSensitiveData?: boolean;
}): Record<RiskCode, RiskSuggestion> {
  const { answers, legalBasis, legalBasisSensitive, hasSensitiveData } = input;
  const sec3 = getSection(answers, "sec3");
  const sec4 = getSection(answers, "sec4");
  const sec5 = getSection(answers, "sec5");
  const sec6 = getSection(answers, "sec6");
  const sec7 = getSection(answers, "sec7");

  const result = {} as Record<RiskCode, RiskSuggestion>;

  // ----- BR — Ausência de base legal -----
  // Pré-marca enquanto o DPO não preencher base legal pra dados comuns.
  // (Prática da Denise: mantém o risco até confirmação final do cliente.)
  const hasBaseComum = !!legalBasis && legalBasis.trim() !== "" &&
                       legalBasis !== "[Em preenchimento]";
  const needsSensivel = hasSensitiveData ||
                        isYes(sec3?.data_sensitive_yn);
  const hasBaseSensivel = !!legalBasisSensitive && legalBasisSensitive.trim() !== "";
  if (!hasBaseComum) {
    result.BR = {
      kind: "preselect",
      reason: "Ainda não há base legal preenchida pra dados comuns nesse processo.",
    };
  } else if (needsSensivel && !hasBaseSensivel) {
    result.BR = {
      kind: "alert",
      reason:
        "Há dados sensíveis no processo mas a base legal pra sensíveis (Art. 11) não foi preenchida.",
    };
  } else {
    result.BR = { kind: null };
  }

  // ----- BS — Crianças/Adolescentes -----
  // Bandeirinha (não pré-marca). Denise: "tem dado de criança não é risco
  // automático, mas levanta uma bandeirinha".
  const hasChildren = hasNonNAValue(sec3?.data_children);
  const hasTeens = hasNonNAValue(sec3?.data_teens);
  if (hasChildren || hasTeens) {
    const quem = hasChildren && hasTeens
      ? "crianças e adolescentes"
      : hasChildren
      ? "crianças"
      : "adolescentes";
    result.BS = {
      kind: "alert",
      reason: `O processo trata dados de ${quem}. Avaliar se o consentimento e a finalidade atendem ao Art. 14 da LGPD.`,
    };
  } else {
    result.BS = { kind: null };
  }

  // ----- BT — Tratamento excessivo -----
  // Bandeirinha se o usuário descreveu acesso a dados desnecessários
  // (campo `use_unnecessary_access` é texto-longo).
  const unnecessary = (sec4?.use_unnecessary_access ?? "").toString().trim();
  if (unnecessary && unnecessary.length > 5 &&
      !/^(n[aã]o|nada|nenhum|0)/i.test(unnecessary)) {
    result.BT = {
      kind: "alert",
      reason:
        "O respondente descreveu acesso a dados que pode não ser necessário pra finalidade. Avaliar se há tratamento excessivo.",
    };
  } else {
    result.BT = { kind: null };
  }

  // ----- BU — Falta de transparência -----
  const policyShown = (sec5?.collect_policy_shown ?? "").toString().trim();
  const policyMissing =
    !policyShown ||
    /^(n[aã]o|n[aã]o tem|nenhum|n[aã]o existe|0|sem)/i.test(policyShown);
  const subjectAware = sec6?.share_subject_aware;
  if (policyMissing) {
    result.BU = {
      kind: "preselect",
      reason:
        "Não há indicação de política/aviso apresentado ao titular informando finalidades do tratamento.",
    };
  } else if (subjectAware === "Não") {
    result.BU = {
      kind: "alert",
      reason:
        "Respondente indicou que o titular não sabe dos compartilhamentos. Avaliar transparência.",
    };
  } else {
    result.BU = { kind: null };
  }

  // ----- BV — Transferência internacional -----
  if (isYes(sec6?.share_international)) {
    const countries = sec6?.share_international_countries;
    let suggested: string | undefined;
    if (typeof countries === "string" && countries.trim()) {
      suggested = countries.trim().slice(0, 200);
    } else if (Array.isArray(countries) && countries.length > 0) {
      suggested = countries.filter(Boolean).join(", ").slice(0, 200);
    }
    result.BV = {
      kind: "preselect",
      reason: "Respondente confirmou transferência internacional de dados.",
      suggestedDescription: suggested,
    };
  } else {
    result.BV = { kind: null };
  }

  // ----- BW — Compartilhamento com terceiros -----
  // Pré-marca se compartilhamento envolve "terceiros/parceiros" ou
  // "instituições governamentais" (sem garantia de salvaguardas).
  const shareTargets = sec6?.share_targets;
  const sharesWithThirdParty =
    arrIncludes(shareTargets, "terceiros") ||
    arrIncludes(shareTargets, "parceiros") ||
    arrIncludes(shareTargets, "instituições governamentais");
  if (sharesWithThirdParty) {
    result.BW = {
      kind: "preselect",
      reason:
        "Respondente confirmou compartilhamento com terceiros/parceiros. Avaliar contratos e salvaguardas.",
    };
  } else {
    result.BW = { kind: null };
  }

  // ----- BX — Armazenagem por prazo indeterminado -----
  const retention = sec7?.store_retention;
  const hasIndefiniteRetention =
    arrIncludes(retention, "indefinidamente") ||
    arrIncludes(retention, "desconheço");
  if (hasIndefiniteRetention) {
    result.BX = {
      kind: "preselect",
      reason:
        "Respondente indicou que dados são retidos indefinidamente (ou que desconhece o procedimento).",
    };
  } else {
    result.BX = { kind: null };
  }

  // ----- BY — Finalidade diversa -----
  // Bandeirinha (Denise: "pode ser legítimo, depende"). Não pré-marca.
  if (isYes(sec4?.use_diff_purpose)) {
    result.BY = {
      kind: "alert",
      reason:
        "Respondente confirmou uso pra finalidade diferente da informada ao titular. Avaliar transparência e base legal.",
    };
  } else {
    result.BY = { kind: null };
  }

  // ----- BZ — Empresas do grupo -----
  if (arrIncludes(shareTargets, "empresas do grupo") ||
      arrIncludes(shareTargets, "grupo")) {
    result.BZ = {
      kind: "alert",
      reason:
        "Respondente confirmou compartilhamento com empresas do grupo. Avaliar finalidade específica e transparência.",
    };
  } else {
    result.BZ = { kind: null };
  }

  // ----- CA — Aquisição indireta de banco -----
  if (isYes(sec4?.use_received_external)) {
    result.CA = {
      kind: "preselect",
      reason:
        "Respondente confirmou recebimento de dados de outra instituição/empresa.",
    };
  } else {
    result.CA = { kind: null };
  }

  // ----- CB — Decisão automatizada -----
  if (isYes(sec4?.use_automated_decision)) {
    const desc = (sec4?.use_automated_decision_desc ?? "").toString().trim();
    result.CB = {
      kind: "preselect",
      reason: "Respondente confirmou decisão automatizada no processo.",
      suggestedDescription: desc.slice(0, 200) || undefined,
    };
  } else {
    result.CB = { kind: null };
  }

  // ----- CC — Profiling -----
  // Sinal forte: marketing OR finalidade fala em segmentação/perfil.
  const usesMarketing = isYes(sec4?.use_marketing);
  const purpose = (
    (sec4?.process_purpose ?? sec4?.use_purpose ?? "") as string
  )
    .toString()
    .toLowerCase();
  const purposeHasProfiling =
    purpose.includes("perfil") ||
    purpose.includes("profiling") ||
    purpose.includes("segmenta") ||
    purpose.includes("rastreio");
  if (purposeHasProfiling) {
    result.CC = {
      kind: "preselect",
      reason:
        "Finalidade do processo menciona perfil/segmentação/rastreio (profiling).",
    };
  } else if (usesMarketing) {
    result.CC = {
      kind: "alert",
      reason:
        "Processo usa dados em campanhas de marketing. Avaliar se há criação de perfis comportamentais.",
    };
  } else {
    result.CC = { kind: null };
  }

  // ----- CD — Background check -----
  const bgcheck = (sec5?.collect_background_check ?? "").toString().trim();
  const bgCheckIsYes =
    bgcheck.length > 5 &&
    !/^(n[aã]o|nada|nenhum|0|sem|n[aã]o se aplica|n\/a)/i.test(bgcheck);
  if (bgCheckIsYes) {
    result.CD = {
      kind: "preselect",
      reason:
        "Respondente descreveu realização de background check (antecedentes/score).",
      suggestedDescription: bgcheck.slice(0, 200),
    };
  } else {
    result.CD = { kind: null };
  }

  return result;
}

// ============================================================
// Tipo serializável pra a API
// ============================================================

export interface ProcessRiskDTO {
  id: string;
  riskCode: RiskCode;
  status: RiskStatus;
  description: string | null;
  autoSuggested: boolean;
  severityLevel: string | null;
  identifiedAt: string;
  reviewedAt: string | null;
  identifiedBy?: { name: string | null; email: string } | null;
  reviewedBy?: { name: string | null; email: string } | null;
}
