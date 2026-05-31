/**
 * Catálogo da Autoavaliação TCU (iadLGPD) — Fase 7.
 *
 * Fonte: Acórdão 1.384/2022-TCU-Plenário — "Auditoria para elaborar diagnóstico
 * acerca dos controles implementados pelas organizações públicas federais para
 * adequação à LGPD". 9 dimensões; subconjunto de 42 questões compõe o indicador.
 *
 * Pontuação oficial: Sim=1 · Parcialmente=0,5 · Não=0. Indicador = soma ÷ 42
 * (0 a 1). 4 níveis: Inexpressivo ≤0,15 · Inicial ≤0,5 · Intermediário ≤0,8 ·
 * Aprimorado >0,8. As médias (`media`) são as do conjunto das 382 organizações
 * federais avaliadas (benchmark nacional), extraídas das Tabelas 1-10 do relatório.
 *
 * `autoKey` indica que a resposta pode ser SUGERIDA automaticamente a partir dos
 * dados do próprio app (ver lib/tcu-auto.ts). O Comitê confirma/ajusta.
 */

export type TcuResposta = "SIM" | "PARCIAL" | "NAO" | "NA";

export const TCU_NOTA: Record<string, number> = { SIM: 1, PARCIAL: 0.5, NAO: 0 };

export interface TcuQuestao {
  code: string;
  dim: string; // chave da dimensão
  texto: string;
  ref: string; // referência legal/normativa resumida
  escala: "SPN" | "SN"; // Sim/Parcial/Não ou Sim/Não
  permiteNA?: boolean;
  media: number; // média nacional (382 órgãos)
  autoKey?: string; // chave de auto-preenchimento (lib/tcu-auto.ts)
}

export interface TcuDimensao {
  key: string;
  nome: string;
  ordem: number;
  perspectiva: 1 | 2; // 1=Estruturação da iniciativa · 2=Medidas e controles implementados
  media: number; // média nacional da dimensão (Tabela 1)
}

export const TCU_DIMENSOES: ReadonlyArray<TcuDimensao> = [
  { key: "preparacao",     nome: "Preparação",                      ordem: 1, perspectiva: 1, media: 0.59 },
  { key: "contexto",       nome: "Contexto Organizacional",         ordem: 2, perspectiva: 1, media: 0.42 },
  { key: "lideranca",      nome: "Liderança",                       ordem: 3, perspectiva: 1, media: 0.36 },
  { key: "capacitacao",    nome: "Capacitação",                     ordem: 4, perspectiva: 1, media: 0.27 },
  { key: "conformidade",   nome: "Conformidade do Tratamento",      ordem: 5, perspectiva: 2, media: 0.24 },
  { key: "direitos",       nome: "Direitos do Titular",             ordem: 6, perspectiva: 2, media: 0.25 },
  { key: "compartilhamento", nome: "Compartilhamento de Dados",     ordem: 7, perspectiva: 2, media: 0.42 },
  { key: "violacao",       nome: "Violação de Dados Pessoais",      ordem: 8, perspectiva: 2, media: 0.23 },
  { key: "protecao",       nome: "Medidas de Proteção",             ordem: 9, perspectiva: 2, media: 0.32 },
];

export const TCU_MEDIA_GERAL = 0.35; // indicador médio nacional (382 órgãos)

export const TCU_QUESTOES: ReadonlyArray<TcuQuestao> = [
  // ---- Preparação ----
  { code: "2.1", dim: "preparacao", texto: "Conduziu iniciativa para identificar e planejar as medidas de adequação à LGPD?", ref: "LGPD art.50 §2 I; ISO 27701 5.4", escala: "SPN", media: 0.67, autoKey: "comite_iniciativa" },
  { code: "2.2", dim: "preparacao", texto: "Elaborou plano de ação/projeto para direcionar a adequação?", ref: "LGPD art.50 §2 I", escala: "SN", media: 0.51, autoKey: "plano_acao" },

  // ---- Contexto Organizacional ----
  { code: "3.1", dim: "contexto", texto: "Identificou outros normativos (além da LGPD) relativos à proteção de dados?", ref: "ISO 27701 5.2.1", escala: "SN", media: 0.76 },
  { code: "3.2", dim: "contexto", texto: "Identificou as categorias de titulares com quem se relaciona?", ref: "LGPD art.5 V", escala: "SPN", media: 0.46 },
  { code: "3.3", dim: "contexto", texto: "Identificou os operadores que tratam dados em seu nome?", ref: "LGPD art.5 VI/VII; art.39", escala: "SPN", media: 0.42, autoKey: "operadores" },
  { code: "3.4", dim: "contexto", texto: "Avaliou se há tratamento com controlador conjunto?", ref: "LGPD art.5 VI; art.7 §5", escala: "SN", media: 0.30 },
  { code: "3.5", dim: "contexto", texto: "Identificou os processos de negócio que tratam dados pessoais?", ref: "LGPD art.37", escala: "SPN", media: 0.39, autoKey: "inv_processos" },
  { code: "3.5.1", dim: "contexto", texto: "Identificou os responsáveis por esses processos?", ref: "LGPD art.37", escala: "SPN", media: 0.38, autoKey: "inv_responsaveis" },
  { code: "3.6", dim: "contexto", texto: "Identificou quais dados pessoais são tratados?", ref: "LGPD art.5 I; art.37", escala: "SPN", media: 0.43, autoKey: "inv_dados" },
  { code: "3.6.1", dim: "contexto", texto: "Identificou os locais onde os dados são armazenados?", ref: "LGPD art.37; ISO 27701 6.5.1", escala: "SPN", media: 0.44 },
  { code: "3.7", dim: "contexto", texto: "Avaliou os riscos dos processos de tratamento?", ref: "LGPD art.50 §1; ISO 27701 5.4.1.2", escala: "SN", media: 0.20, autoKey: "riscos" },

  // ---- Liderança ----
  { code: "4.1", dim: "lideranca", texto: "Possui Política de Segurança da Informação (PSI)?", ref: "LGPD art.46; ISO 27701 6.2", escala: "SN", media: 0.76, autoKey: "psi" },
  { code: "4.2", dim: "lideranca", texto: "Possui Política de Classificação da Informação?", ref: "LGPD art.46; ISO 27701 6.5.2", escala: "SN", media: 0.35 },
  { code: "4.2.1", dim: "lideranca", texto: "A Política de Classificação abrange a classificação de dados pessoais?", ref: "ISO 27701 6.5.2", escala: "SN", media: 0.20 },
  { code: "4.2.1.1", dim: "lideranca", texto: "Abrange diretrizes para identificar dados sensíveis?", ref: "LGPD art.5 II; art.46", escala: "SN", media: 0.04 },
  { code: "4.2.1.2", dim: "lideranca", texto: "Abrange diretrizes para identificar dados de crianças e adolescentes?", ref: "LGPD art.14; art.46", escala: "SN", media: 0.02 },
  { code: "4.3", dim: "lideranca", texto: "Possui Política (interna) de Proteção de Dados Pessoais?", ref: "LGPD art.46; ISO 27701 6.2.1", escala: "SN", media: 0.18, autoKey: "politica_protecao" },
  { code: "4.4", dim: "lideranca", texto: "Nomeou o encarregado (DPO)?", ref: "LGPD art.5 VIII; art.41", escala: "SN", media: 0.69, autoKey: "encarregado" },
  { code: "4.4.1", dim: "lideranca", texto: "A nomeação do encarregado foi publicada em veículo oficial?", ref: "LGPD art.41; IN SGD/ME 117/2020", escala: "SN", media: 0.52 },
  { code: "4.4.3", dim: "lideranca", texto: "Identidade e contato do encarregado divulgados na internet?", ref: "LGPD art.41 §1", escala: "SN", media: 0.46, autoKey: "encarregado_publico" },

  // ---- Capacitação ----
  { code: "5.1", dim: "capacitacao", texto: "Possui Plano de Capacitação/conscientização em proteção de dados?", ref: "ISO 27701 5.5.2-5.5.4", escala: "SN", media: 0.29 },
  { code: "5.1.1", dim: "capacitacao", texto: "O plano prevê treinamento diferenciado para funções essenciais?", ref: "ISO 27701 5.5.2-5.5.4", escala: "SN", media: 0.15 },
  { code: "5.2", dim: "capacitacao", texto: "Colaboradores envolvidos receberam treinamento no tema?", ref: "ISO 27701 5.5.2-5.5.4", escala: "SPN", media: 0.37 },

  // ---- Conformidade do Tratamento ----
  { code: "6.1", dim: "conformidade", texto: "Identificou e documentou as finalidades dos tratamentos?", ref: "LGPD art.6 I; ISO 27701 7.2.1", escala: "SPN", media: 0.29, autoKey: "inv_finalidade" },
  { code: "6.1.1", dim: "conformidade", texto: "Avaliou se coleta apenas o necessário (minimização)?", ref: "LGPD art.6 II/III", escala: "SN", media: 0.23 },
  { code: "6.1.2", dim: "conformidade", texto: "Avaliou se retém os dados só pelo tempo necessário?", ref: "LGPD art.40; ISO 27701 7.4.7", escala: "SN", media: 0.18, autoKey: "inv_retencao" },
  { code: "6.2", dim: "conformidade", texto: "Identificou e documentou as bases legais dos tratamentos?", ref: "LGPD art.7; ISO 27701 7.2.2", escala: "SPN", media: 0.35, autoKey: "inv_baselegal" },
  { code: "6.3", dim: "conformidade", texto: "Há registro/inventário das atividades de tratamento (ROPA)?", ref: "LGPD art.37; ISO 27701 7.2.8", escala: "SN", media: 0.18, autoKey: "inv_existe" },

  // ---- Direitos do Titular ----
  { code: "7.1", dim: "direitos", texto: "Possui Política de Privacidade / Aviso de Privacidade?", ref: "LGPD art.9; art.23 I", escala: "SN", media: 0.25, autoKey: "aviso" },
  { code: "7.1.1", dim: "direitos", texto: "A Política/Aviso de Privacidade está publicada na internet?", ref: "LGPD art.6 VI; art.50 I e", escala: "SN", media: 0.20, autoKey: "aviso_publicado" },
  { code: "7.2", dim: "direitos", texto: "Implementou mecanismos para atender os direitos do art. 18?", ref: "LGPD arts.17-22", escala: "SPN", media: 0.30, autoKey: "dsr" },

  // ---- Compartilhamento ----
  { code: "8.1", dim: "compartilhamento", texto: "Identificou os dados pessoais compartilhados com terceiros?", ref: "LGPD art.5 XVI; arts.26-27; art.39", escala: "SPN", permiteNA: true, media: 0.42, autoKey: "compartilhamento" },

  // ---- Violação de Dados Pessoais ----
  { code: "9.1", dim: "violacao", texto: "Possui Plano de Resposta a Incidentes (PRI)?", ref: "LGPD art.50 §2 I g", escala: "SN", media: 0.16, autoKey: "pri" },
  { code: "9.2", dim: "violacao", texto: "Possui sistema para registro de incidentes de violação de dados?", ref: "LGPD art.50 §2 I g", escala: "SN", media: 0.28, autoKey: "incidentes_sistema" },
  { code: "9.3", dim: "violacao", texto: "Possui sistema para registro das ações de solução dos incidentes?", ref: "ISO 27701 6.13.1.5", escala: "SN", media: 0.25, autoKey: "incidentes_acoes" },
  { code: "9.4", dim: "violacao", texto: "Monitora proativamente eventos associados a violação de dados?", ref: "ISO 27701 6.13.1.4", escala: "SN", media: 0.34 },
  { code: "9.5", dim: "violacao", texto: "Estabeleceu procedimento para comunicar ANPD e titular?", ref: "LGPD art.48", escala: "SN", media: 0.12, autoKey: "incidentes_anpd" },

  // ---- Medidas de Proteção ----
  { code: "10.1", dim: "protecao", texto: "Comprova medidas de segurança técnicas e administrativas?", ref: "LGPD art.46", escala: "SN", media: 0.46 },
  { code: "10.2", dim: "protecao", texto: "Tem processo de registro/cancelamento/provisionamento de acessos?", ref: "LGPD art.46; ISO 27701 6.6.2", escala: "SPN", media: 0.34 },
  { code: "10.3", dim: "protecao", texto: "Registra eventos (logs) das atividades de tratamento?", ref: "LGPD art.46; ISO 27701 6.9.4.1", escala: "SPN", media: 0.34 },
  { code: "10.4", dim: "protecao", texto: "Utiliza criptografia para proteger dados pessoais?", ref: "LGPD art.46; art.50 §2 I c", escala: "SPN", media: 0.33 },
  { code: "10.5", dim: "protecao", texto: "Adota Privacy by Design e by Default?", ref: "LGPD art.46 §2", escala: "SN", media: 0.15 },
];

export const TCU_TOTAL = TCU_QUESTOES.length; // 42

export type TcuNivel = { label: string; cor: string };
export function tcuNivel(indicador: number): TcuNivel {
  if (indicador <= 0.15) return { label: "Inexpressivo", cor: "text-red-600" };
  if (indicador <= 0.5) return { label: "Inicial", cor: "text-amber-600" };
  if (indicador <= 0.8) return { label: "Intermediário", cor: "text-blue-600" };
  return { label: "Aprimorado", cor: "text-emerald-600" };
}

export const RESPOSTA_LABEL: Record<TcuResposta, string> = {
  SIM: "Sim", PARCIAL: "Parcialmente", NAO: "Não", NA: "Não se aplica",
};
