// Due Diligence do Operador — questionário Cyber + LGPD.
//
// Subset pedagógico do "Modelo Formulário de Avaliação de Terceiros" (52
// perguntas) → 12 perguntas representativas dos 7 blocos. Mantém a estrutura
// de pontuação Cyber/LGPD da planilha original:
//
//   - Cada pergunta = 1 ponto se "S" (Sim), 0 se "N" ou "NA"
//   - Score total = soma de pontos / total possível × 100
//   - Recomendação:
//        ≥ 80%  → Aprovado
//        50-80% → Aprovado com ressalvas
//        < 50%  → Reprovado (não contratar até adequação)
//
// O DPO marca S/N/NA e ganha 1 linha pra justificar (opcional).

export type RespostaDD = "S" | "N" | "NA";

export type PerguntaDD = {
  id: string;
  bloco: string;
  categoria: "CYBER" | "LGPD" | "AMBOS";
  pergunta: string;
  dica?: string;
};

export const BLOCOS_DD = [
  "I. Políticas e Governança",
  "II. Segurança Técnica",
  "III. Resposta a Incidentes",
  "IV. Privacidade / LGPD",
];

export const PERGUNTAS_DD: PerguntaDD[] = [
  // === I. Políticas e Governança ===
  {
    id: "Q01",
    bloco: "I. Políticas e Governança",
    categoria: "CYBER",
    pergunta:
      "A empresa possui política formal de Segurança da Informação e Cibernética aprovada pela alta administração?",
    dica: "Documento que estabelece diretrizes de confidencialidade, integridade, autenticidade e disponibilidade.",
  },
  {
    id: "Q02",
    bloco: "I. Políticas e Governança",
    categoria: "LGPD",
    pergunta:
      "A empresa mantém política institucional de Privacidade e Proteção de Dados Pessoais, aprovada pela alta administração?",
    dica: "Política específica de LGPD — pode ser documento separado ou seção da política geral.",
  },
  {
    id: "Q03",
    bloco: "I. Políticas e Governança",
    categoria: "AMBOS",
    pergunta:
      "A empresa designou Encarregado pela Proteção de Dados (DPO) e divulga seus contatos?",
    dica: "Art. 41 LGPD. Deve haver canal acessível pra titulares e ANPD.",
  },
  {
    id: "Q04",
    bloco: "I. Políticas e Governança",
    categoria: "AMBOS",
    pergunta:
      "A empresa oferece capacitação contínua de seu corpo funcional em Segurança da Informação e Proteção de Dados?",
    dica: "Treinamentos anuais ou trimestrais, com registro de presença e avaliação.",
  },
  // === II. Segurança Técnica ===
  {
    id: "Q05",
    bloco: "II. Segurança Técnica",
    categoria: "CYBER",
    pergunta:
      "A empresa possui políticas e controles de gestão de acessos e identidade (controle granular, MFA quando aplicável)?",
    dica: "Múltiplos fatores de autenticação, perfis por função, revisão periódica de acessos.",
  },
  {
    id: "Q06",
    bloco: "II. Segurança Técnica",
    categoria: "CYBER",
    pergunta:
      "A empresa realiza cópias de segurança periódicas e testa procedimentos de restauração?",
    dica: "Backups segregados, automáticos, em local protegido, com testes de restore documentados.",
  },
  {
    id: "Q07",
    bloco: "II. Segurança Técnica",
    categoria: "CYBER",
    pergunta:
      "Os dados pessoais em trânsito e em repouso são protegidos por criptografia adequada?",
    dica: "TLS 1.2+ em trânsito; AES-256 ou equivalente em repouso. Especialmente importante pra dados sensíveis.",
  },
  // === III. Resposta a Incidentes ===
  {
    id: "Q08",
    bloco: "III. Resposta a Incidentes",
    categoria: "AMBOS",
    pergunta:
      "A empresa possui Plano formal de Resposta a Incidentes Cibernéticos com procedimentos documentados?",
    dica:
      "Plano que define como detectar, conter, erradicar, recuperar e comunicar incidentes. " +
      "Deve prever comunicação tempestiva ao Controlador (Anexo art. 48 LGPD).",
  },
  {
    id: "Q09",
    bloco: "III. Resposta a Incidentes",
    categoria: "AMBOS",
    pergunta:
      "A empresa registra incidentes passados nos últimos 2 anos? (Marque 'Não' como POSITIVO — sem histórico de incidentes graves)",
    dica:
      "Interpretação invertida: 'Não' = ponto positivo (sem incidentes recentes). " +
      "'Sim' = atenção, investigar profundidade dos incidentes anteriores.",
  },
  // === IV. Privacidade / LGPD ===
  {
    id: "Q10",
    bloco: "IV. Privacidade / LGPD",
    categoria: "LGPD",
    pergunta:
      "A empresa mantém Registro das Atividades de Tratamento de Dados Pessoais (RoPA, art. 37 LGPD)?",
    dica: "Inventário das operações de tratamento — exigência do art. 37, atualizada periodicamente.",
  },
  {
    id: "Q11",
    bloco: "IV. Privacidade / LGPD",
    categoria: "LGPD",
    pergunta:
      "A empresa disponibiliza canais de atendimento ao titular pra exercer os direitos do art. 18 (acesso, correção, exclusão, portabilidade, etc)?",
    dica: "Canal eletrônico, físico ou outro acessível — art. 9º e 18 LGPD.",
  },
  {
    id: "Q12",
    bloco: "IV. Privacidade / LGPD",
    categoria: "LGPD",
    pergunta:
      "A empresa realiza tratamento de dados pessoais fora do território nacional (transferência internacional)?",
    dica:
      "Se Sim, exige mecanismo do art. 33 LGPD (cláusulas-padrão, decisão de adequação, etc). " +
      "Marque 'Não' se opera apenas em datacenters BR. 'Sim' sem mecanismo é risco alto.",
  },
];

// Quais perguntas têm interpretação INVERTIDA (Não = bom, Sim = ruim)
const PERGUNTAS_INVERTIDAS = new Set<string>(["Q09", "Q12"]);

// Calcula score e recomendação a partir das respostas marcadas.
export function calcularDueDiligence(respostas: Record<string, RespostaDD> | null | undefined): {
  total: number;
  respondidas: number;
  pontosObtidos: number;
  pontosPossiveis: number;
  percentual: number;
  recomendacao: "APROVADO" | "APROVADO_COM_RESSALVAS" | "REPROVADO" | "INCOMPLETO";
  porBloco: Record<string, { respondidas: number; total: number; pontos: number; max: number }>;
} {
  const total = PERGUNTAS_DD.length;
  const r = respostas || {};
  const respondidas = PERGUNTAS_DD.filter((p) => r[p.id] && r[p.id] !== "NA").length;

  // Pontuação: 1 ponto se interpretação positiva, 0 caso contrário
  let pontosObtidos = 0;
  const pontosPossiveis = PERGUNTAS_DD.filter((p) => r[p.id] !== "NA").length;

  const porBloco: Record<string, { respondidas: number; total: number; pontos: number; max: number }> = {};
  for (const bloco of BLOCOS_DD) {
    porBloco[bloco] = { respondidas: 0, total: 0, pontos: 0, max: 0 };
  }

  for (const p of PERGUNTAS_DD) {
    const bloco = porBloco[p.bloco];
    if (!bloco) continue;
    bloco.total++;
    const resp = r[p.id];
    if (!resp) continue;
    if (resp === "NA") continue;
    bloco.respondidas++;
    bloco.max++;
    const positivo = PERGUNTAS_INVERTIDAS.has(p.id) ? resp === "N" : resp === "S";
    if (positivo) {
      bloco.pontos++;
      pontosObtidos++;
    }
  }

  const percentual = pontosPossiveis > 0 ? Math.round((pontosObtidos / pontosPossiveis) * 100) : 0;

  let recomendacao: "APROVADO" | "APROVADO_COM_RESSALVAS" | "REPROVADO" | "INCOMPLETO" = "INCOMPLETO";
  if (respondidas < total) {
    recomendacao = "INCOMPLETO";
  } else if (percentual >= 80) {
    recomendacao = "APROVADO";
  } else if (percentual >= 50) {
    recomendacao = "APROVADO_COM_RESSALVAS";
  } else {
    recomendacao = "REPROVADO";
  }

  return { total, respondidas, pontosObtidos, pontosPossiveis, percentual, recomendacao, porBloco };
}

export const RECOMENDACAO_INFO: Record<string, { label: string; cor: string; mensagem: string }> = {
  APROVADO: {
    label: "Aprovado",
    cor: "emerald",
    mensagem:
      "Operador apresenta maturidade adequada em Cyber/LGPD. Pode ser contratado com cláusulas padrão.",
  },
  APROVADO_COM_RESSALVAS: {
    label: "Aprovado com ressalvas",
    cor: "amber",
    mensagem:
      "Operador tem lacunas relevantes mas pode ser contratado se incluir compromissos de adequação no contrato (cláusulas robustas + plano de ação).",
  },
  REPROVADO: {
    label: "Reprovado",
    cor: "red",
    mensagem:
      "Operador não atende requisitos mínimos. Não contratar até que evidencie adequação. Se já contratado, exigir plano de remediação urgente.",
  },
  INCOMPLETO: {
    label: "Avaliação incompleta",
    cor: "gray",
    mensagem: "Termine de responder todas as perguntas pra ver a recomendação final.",
  },
};
