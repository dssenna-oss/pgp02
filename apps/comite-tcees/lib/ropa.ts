// =============================================================================
// ROPA — Registro das Operações de Tratamento (Art. 37 LGPD)
//
// O ROPA NÃO duplica o Inventário: ele LÊ as atividades de tratamento já
// cadastradas (cada processo do Inventário = uma atividade do ROPA), formaliza
// no formato do template ANPD e avalia a completude de cada uma.
//
// Hierarquia (guia Confidata / ANPD):
//   mapear (Inventário) → registrar no ROPA → identificar alto risco (Riscos)
//   → elaborar RIPD para os de maior risco.
// =============================================================================

import { nivelRisco } from "@/lib/comite-ui";

/** Uma atividade do ROPA = um processo do Inventário + seus riscos. */
export type RopaAtividade = {
  id: string;
  nome: string;
  unidadeGestora: string | null;
  finalidade: string | null;
  baseLegal: string | null;
  tiposDados: string | null;
  dadosSensiveis: boolean;
  categoriasTitulares: string | null;
  fonteDados: string | null;
  compartilhamento: string | null;
  destinatariosInternos: string | null;
  transfInternacional: string | null;
  retencao: string | null;
  criterioDescarte: string | null;
  medidasSeguranca: string | null;
  /** maior nível de risco entre os riscos do processo (para sinalizar alto risco) */
  riscoMax: "BAIXO" | "MEDIO" | "ALTO" | null;
};

/** Item do checklist de completude (derivado do checklist do guia/ANPD). */
export type ChecklistItem = { campo: string; ok: boolean; obrigatorio: boolean };

const preenchido = (v: string | null) => !!(v && v.trim().length > 0);

/**
 * Avalia a completude de uma atividade frente ao template ANPD.
 * Campos sensíveis só são exigidos quando dadosSensiveis = true (descarte e
 * base legal ganham peso). Transferência internacional NÃO é obrigatória
 * (a maioria não tem) — só conta como "preenchível".
 */
export function checklistAtividade(a: RopaAtividade): ChecklistItem[] {
  return [
    { campo: "Finalidade específica", ok: preenchido(a.finalidade), obrigatorio: true },
    { campo: "Base legal (Art. 7º/11)", ok: preenchido(a.baseLegal), obrigatorio: true },
    { campo: "Categorias de titulares", ok: preenchido(a.categoriasTitulares), obrigatorio: true },
    { campo: "Dados tratados", ok: preenchido(a.tiposDados), obrigatorio: true },
    { campo: "Fonte dos dados", ok: preenchido(a.fonteDados), obrigatorio: false },
    { campo: "Compartilhamento/destinatários", ok: preenchido(a.compartilhamento) || preenchido(a.destinatariosInternos), obrigatorio: true },
    { campo: "Prazo de retenção", ok: preenchido(a.retencao), obrigatorio: true },
    { campo: "Critério de descarte", ok: preenchido(a.criterioDescarte), obrigatorio: false },
    { campo: "Medidas de segurança", ok: preenchido(a.medidasSeguranca), obrigatorio: true },
  ];
}

export type CompletudeAtividade = {
  itens: ChecklistItem[];
  obrigatoriosOk: number;
  obrigatoriosTotal: number;
  pct: number; // % de obrigatórios preenchidos
  completa: boolean; // todos os obrigatórios ok
};

export function completudeAtividade(a: RopaAtividade): CompletudeAtividade {
  const itens = checklistAtividade(a);
  const obr = itens.filter((i) => i.obrigatorio);
  const ok = obr.filter((i) => i.ok).length;
  const pct = obr.length ? Math.round((ok / obr.length) * 100) : 0;
  return { itens, obrigatoriosOk: ok, obrigatoriosTotal: obr.length, pct, completa: ok === obr.length };
}

/** Resumo geral do ROPA (para os KPIs do topo da tela). */
export function resumoRopa(atividades: RopaAtividade[]) {
  const total = atividades.length;
  const completas = atividades.filter((a) => completudeAtividade(a).completa).length;
  const altoRisco = atividades.filter((a) => a.riscoMax === "ALTO").length;
  const comSensiveis = atividades.filter((a) => a.dadosSensiveis).length;
  const pctGeral = total ? Math.round((completas / total) * 100) : 0;
  return { total, completas, altoRisco, comSensiveis, pctGeral };
}

/** Converte os riscos de um processo no nível máximo (para sinalizar alto risco). */
export function riscoMaximo(riscos: { probabilidade: number; impacto: number }[]): RopaAtividade["riscoMax"] {
  if (!riscos.length) return null;
  const niveis = riscos.map((r) => nivelRisco(r.probabilidade, r.impacto).nivel);
  if (niveis.includes("ALTO")) return "ALTO";
  if (niveis.includes("MEDIO")) return "MEDIO";
  return "BAIXO";
}

/** Cabeçalho institucional do ROPA (dados organizacionais do template ANPD). */
export type RopaCabecalho = {
  controlador: string;
  cnpj: string;
  sede: string;
  encarregadoNome: string;
  encarregadoContato: string;
};
