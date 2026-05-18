// Setores de apoio que o DPO pode solicitar pra avaliar um controle do GAP.
// Reflete os papéis efetivamente presentes no grupo (lib/seeds/processos-vegas.ts)
// + opção genérica pra órgãos que tenham nomenclatura própria.
//
// Sugestões automáticas mapeiam controles específicos (por ID do catálogo)
// para o setor mais provável de ter o conhecimento — DPO pode sobrescrever.

export type SetorApoio = {
  id: string;
  nome: string;
  emoji: string;
  competencias: string; // por que o DPO pediria apoio aqui
};

export const SETORES_APOIO: SetorApoio[] = [
  { id: "TI",             nome: "TI / Tecnologia",                emoji: "💻", competencias: "Controle de acesso, MFA, backup, criptografia, logs, segurança técnica" },
  { id: "JURIDICO",       nome: "Jurídico / Procuradoria",        emoji: "⚖️", competencias: "Bases legais, contratos, cláusulas LGPD, comunicação ANPD, interpretação normativa" },
  { id: "ADMINISTRATIVO", nome: "Administrativo / Contratos",     emoji: "📋", competencias: "Contratos com operadores, vigências, cláusulas LGPD, gestão de terceirizados" },
  { id: "COMUNICACAO",    nome: "Comunicação",                    emoji: "📢", competencias: "Aviso de Privacidade público, canais de divulgação, linguagem cidadã" },
  { id: "RH",             nome: "RH / Gestão de Pessoas",         emoji: "👥", competencias: "Treinamento, sensibilização, onboarding, programas de cultura" },
  { id: "DONO_PROCESSO",  nome: "Área de Negócio (dono do processo)", emoji: "🏢", competencias: "Saúde, Tributário, Ouvidoria, Cerimonial — quem efetivamente trata os dados" },
  { id: "OUTRO",          nome: "Outro setor",                    emoji: "❓", competencias: "Setor específico do órgão que não se encaixa nos acima" },
];

// Sugestão por controle (ID do gap-catalogo.ts). Se o controle não tem entrada
// aqui, abre o seletor sem pré-seleção.
export const SUGESTAO_POR_CONTROLE: Record<number, string> = {
  // Fase Preliminar
  1: "RH",              // Equipe treinada
  2: "COMUNICACAO",     // Sensibilização
  3: "RH",              // Onboarding

  // Fase 1
  4: "JURIDICO",        // DPO designado por ato formal
  5: "JURIDICO",        // Comitê instituído
  6: "JURIDICO",        // Declaração institucional
  7: "ADMINISTRATIVO",  // Orçamento

  // Fase 2
  8: "TI",              // Levantamento de sistemas
  9: "DONO_PROCESSO",   // Processos críticos

  // Fase 3
  10: "DONO_PROCESSO",  // Inventário
  11: "JURIDICO",       // Base legal
  12: "DONO_PROCESSO",  // Tipos de dados
  13: "DONO_PROCESSO",  // Fluxos
  14: "DONO_PROCESSO",  // Análise de riscos

  // Fase 5
  15: "JURIDICO",       // PGP formalizado
  16: "ADMINISTRATIVO", // Plano de Ação
  17: "ADMINISTRATIVO", // Cronograma

  // Fase 6
  18: "JURIDICO",       // RIPD
  19: "TI",             // PSI
  20: "TI",             // Backup criptografado
  21: "TI",             // Logs
  22: "JURIDICO",       // Contratos com operadores (foco jurídico) -- ou ADMIN, mas jurídico tem mais peso
  23: "COMUNICACAO",    // Canal DSR divulgado
  24: "JURIDICO",       // Prazo 15 dias monitorado
  25: "COMUNICACAO",    // Aviso de Privacidade
  26: "TI",             // Anonimização
  27: "TI",             // Retenção

  // Fase 7
  28: "TI",             // Plano de resposta a incidente
  29: "JURIDICO",       // Comunicação ANPD
  30: "JURIDICO",       // Revisão anual do PGP
};

export function getSetorById(id: string): SetorApoio | undefined {
  return SETORES_APOIO.find((s) => s.id === id);
}

export function sugerirSetor(controleId: number): string | undefined {
  return SUGESTAO_POR_CONTROLE[controleId];
}
