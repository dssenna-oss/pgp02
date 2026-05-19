// Catálogo do Plano de Resposta a Incidentes (PRI) — Missão 5 preparação.
//
// Lição central: a equipe TEM que estar preparada COM ANTECEDÊNCIA. Quando o
// incidente acontecer, ninguém vai improvisar. O PRI é o "manual de bombeiro"
// que define QUEM faz O QUÊ — pré-aprovado pela Alta Gestão.

// === 5 etapas do ciclo NIST de Resposta a Incidentes ===
// Referência: NIST SP 800-61r2 (Computer Security Incident Handling Guide)
// Simplificado pra 5 etapas pedagógicas (a versão completa do NIST tem 4
// fases: Preparation / Detection & Analysis / Containment, Eradication &
// Recovery / Post-Incident Activity. Subdividimos a 3ª em 3 etapas separadas
// pra deixar mais claro o que fazer em cada momento.)

export type EtapaNistId = "DETECTAR" | "CONTER" | "ERRADICAR" | "RECUPERAR" | "LICOES";

export type EtapaNist = {
  id: EtapaNistId;
  ordem: number;
  rotulo: string;
  resumo: string;
  exemplos: string[]; // exemplos pedagógicos do que a equipe faz nessa etapa
  emoji: string;
};

export const ETAPAS_NIST: EtapaNist[] = [
  {
    id: "DETECTAR",
    ordem: 1,
    rotulo: "Detectar e Analisar",
    resumo:
      "Identificar que algo aconteceu, classificar a severidade, escalar pra equipe. " +
      "Quanto mais rápido detectar, menor o dano.",
    exemplos: [
      "TI nota acesso suspeito nos logs",
      "Cidadão liga reportando que viu dados dele vazados",
      "Servidor avisa que perdeu pendrive",
      "Imprensa contata pedindo posicionamento",
    ],
    emoji: "🔍",
  },
  {
    id: "CONTER",
    ordem: 2,
    rotulo: "Conter",
    resumo:
      "Impedir que o incidente se espalhe ou cause mais dano. " +
      "Bloquear acessos, isolar sistemas, suspender contas comprometidas.",
    exemplos: [
      "Bloquear conta de usuário comprometida",
      "Desligar servidor afetado",
      "Trocar senhas de acesso ao sistema",
      "Tirar do ar o portal vazando dados",
    ],
    emoji: "🛡️",
  },
  {
    id: "ERRADICAR",
    ordem: 3,
    rotulo: "Erradicar",
    resumo:
      "Eliminar a causa raiz. Tirar o malware do sistema, fechar a falha que " +
      "permitiu o acesso, remover credenciais vazadas.",
    exemplos: [
      "Remover malware identificado",
      "Aplicar patch da vulnerabilidade explorada",
      "Apagar dados vazados dos canais externos (se possível)",
      "Revogar tokens/credenciais comprometidos",
    ],
    emoji: "🧹",
  },
  {
    id: "RECUPERAR",
    ordem: 4,
    rotulo: "Recuperar",
    resumo:
      "Voltar à operação normal com segurança. Restaurar de backup, validar " +
      "que tudo está limpo, comunicar autoridades e titulares.",
    exemplos: [
      "Restaurar dados de backup limpo",
      "Voltar sistemas pro ar com monitoramento intensificado",
      "Comunicar ANPD (Res. nº 15/2024 · até 3 dias úteis)",
      "Enviar Carta aos Titulares afetados",
    ],
    emoji: "🔄",
  },
  {
    id: "LICOES",
    ordem: 5,
    rotulo: "Lições Aprendidas",
    resumo:
      "Reunião pós-incidente. O que falhou? O que funcionou? Atualizar o PRI " +
      "com base no que aprendeu. Treinar a equipe nos pontos fracos.",
    exemplos: [
      "RCA — Análise de Causa Raiz documentada",
      "Reunião com toda equipe 1 semana após o incidente",
      "Atualizar a Política de Segurança",
      "Incluir novo cenário em próximo treinamento",
    ],
    emoji: "📚",
  },
];

// === Papéis da Equipe de Tratamento de Incidentes (ETIR/CSIRT) ===

export type PapelEquipeId =
  | "DPO"
  | "TI"
  | "JURIDICO"
  | "COMUNICACAO"
  | "ALTA_GESTAO"
  | "DONO_PROCESSO";

export type PapelEquipe = {
  id: PapelEquipeId;
  rotulo: string;
  descricao: string;
  emoji: string;
};

export const PAPEIS_EQUIPE: PapelEquipe[] = [
  {
    id: "DPO",
    rotulo: "DPO / Encarregado",
    descricao: "Coordena a resposta. Canal com ANPD e titulares. Decisão final.",
    emoji: "🎯",
  },
  {
    id: "TI",
    rotulo: "TI / Segurança da Informação",
    descricao: "Contém tecnicamente o incidente. Forense. Logs. Patches.",
    emoji: "💻",
  },
  {
    id: "JURIDICO",
    rotulo: "Jurídico / Procuradoria",
    descricao: "Avalia riscos legais. Redige documentos formais. BO se necessário.",
    emoji: "⚖️",
  },
  {
    id: "COMUNICACAO",
    rotulo: "Comunicação / Imprensa",
    descricao: "Posicionamento público. Linguagem da Carta aos Titulares.",
    emoji: "📢",
  },
  {
    id: "ALTA_GESTAO",
    rotulo: "Alta Gestão (Prefeito / Presidente da Câmara)",
    descricao: "Aprovação política. Liberação de recursos extraordinários.",
    emoji: "🏛️",
  },
  {
    id: "DONO_PROCESSO",
    rotulo: "Dono do Processo afetado",
    descricao: "Conhece o contexto operacional. Lista titulares e dados afetados.",
    emoji: "👤",
  },
];

// === Matriz RACI default ===
// Sugestão pedagógica de quem é R/A/C/I em cada etapa. Pode ser editada
// pelo DPO. R = Responsável (executa). A = Aprovador (autoriza/decide).
// C = Consultado (opinião antes da decisão). I = Informado (avisa depois).

export type TipoRaci = "R" | "A" | "C" | "I";

export const TIPOS_RACI: Array<{ id: TipoRaci; rotulo: string; cor: string; descricao: string }> = [
  { id: "R", rotulo: "Responsável", cor: "emerald", descricao: "Executa a etapa" },
  { id: "A", rotulo: "Aprovador",   cor: "blue",    descricao: "Aprova / decide" },
  { id: "C", rotulo: "Consultado",  cor: "amber",   descricao: "Opina antes" },
  { id: "I", rotulo: "Informado",   cor: "gray",    descricao: "Avisa depois" },
];

// RACI default: cada elemento define um par (etapa, papel) → tipo.
export type RaciEntry = { etapaNist: EtapaNistId; papel: PapelEquipeId; tipo: TipoRaci };

export const RACI_DEFAULT: RaciEntry[] = [
  // === Etapa 1: Detectar e Analisar ===
  { etapaNist: "DETECTAR", papel: "TI",            tipo: "R" }, // TI detecta nos logs
  { etapaNist: "DETECTAR", papel: "DONO_PROCESSO", tipo: "R" }, // Dono também detecta
  { etapaNist: "DETECTAR", papel: "DPO",           tipo: "A" }, // DPO aprova classificação
  { etapaNist: "DETECTAR", papel: "JURIDICO",      tipo: "C" }, // Consulta jurídica
  { etapaNist: "DETECTAR", papel: "ALTA_GESTAO",   tipo: "I" }, // Alta Gestão informada

  // === Etapa 2: Conter ===
  { etapaNist: "CONTER", papel: "TI",            tipo: "R" }, // TI faz contenção técnica
  { etapaNist: "CONTER", papel: "DPO",           tipo: "A" }, // DPO autoriza ações que afetam negócio
  { etapaNist: "CONTER", papel: "DONO_PROCESSO", tipo: "C" }, // Consulta dono pra entender impacto
  { etapaNist: "CONTER", papel: "ALTA_GESTAO",   tipo: "I" },
  { etapaNist: "CONTER", papel: "COMUNICACAO",   tipo: "I" }, // Pode precisar comunicar

  // === Etapa 3: Erradicar ===
  { etapaNist: "ERRADICAR", papel: "TI",        tipo: "R" },
  { etapaNist: "ERRADICAR", papel: "DPO",       tipo: "A" },
  { etapaNist: "ERRADICAR", papel: "JURIDICO",  tipo: "C" }, // BO contra autor do ataque?
  { etapaNist: "ERRADICAR", papel: "ALTA_GESTAO", tipo: "I" },

  // === Etapa 4: Recuperar (inclui comunicações obrigatórias) ===
  { etapaNist: "RECUPERAR", papel: "TI",            tipo: "R" }, // restaura sistemas
  { etapaNist: "RECUPERAR", papel: "DPO",           tipo: "R" }, // comunica ANPD + titulares
  { etapaNist: "RECUPERAR", papel: "COMUNICACAO",   tipo: "R" }, // redige Carta Titulares
  { etapaNist: "RECUPERAR", papel: "JURIDICO",      tipo: "A" }, // aprova textos legais
  { etapaNist: "RECUPERAR", papel: "ALTA_GESTAO",   tipo: "A" }, // aprova comunicação pública
  { etapaNist: "RECUPERAR", papel: "DONO_PROCESSO", tipo: "C" },

  // === Etapa 5: Lições Aprendidas ===
  { etapaNist: "LICOES", papel: "DPO",           tipo: "R" }, // DPO conduz RCA
  { etapaNist: "LICOES", papel: "TI",            tipo: "R" }, // TI traz dados técnicos
  { etapaNist: "LICOES", papel: "DONO_PROCESSO", tipo: "C" },
  { etapaNist: "LICOES", papel: "JURIDICO",      tipo: "C" },
  { etapaNist: "LICOES", papel: "COMUNICACAO",   tipo: "I" },
  { etapaNist: "LICOES", papel: "ALTA_GESTAO",   tipo: "I" }, // resultado vira deliberação
];

// === Helpers ===

export function rotuloPapel(id: string): string {
  return PAPEIS_EQUIPE.find((p) => p.id === id)?.rotulo || id;
}

export function emojiPapel(id: string): string {
  return PAPEIS_EQUIPE.find((p) => p.id === id)?.emoji || "👤";
}

export function rotuloEtapa(id: string): string {
  return ETAPAS_NIST.find((e) => e.id === id)?.rotulo || id;
}

// Verifica se o PRI está minimamente preenchido (≥ 1 membro por papel
// essencial + RACI cobrindo as 5 etapas).
export function completudePri(membros: Array<{ papel: string }>, raci: Array<{ etapaNist: string }>): {
  equipeOk: boolean;
  raciOk: boolean;
  papeisFaltantes: PapelEquipeId[];
  etapasSemRaci: EtapaNistId[];
} {
  // Papéis essenciais que o PRI precisa ter alguém
  const essenciais: PapelEquipeId[] = ["DPO", "TI"];
  const papeisPresentes = new Set(membros.map((m) => m.papel));
  const papeisFaltantes = essenciais.filter((p) => !papeisPresentes.has(p));

  const etapasComRaci = new Set(raci.map((r) => r.etapaNist));
  const etapasSemRaci = ETAPAS_NIST
    .filter((e) => !etapasComRaci.has(e.id))
    .map((e) => e.id);

  return {
    equipeOk: papeisFaltantes.length === 0 && membros.length >= 2,
    raciOk: etapasSemRaci.length === 0,
    papeisFaltantes,
    etapasSemRaci,
  };
}
