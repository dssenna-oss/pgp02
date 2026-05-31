// Cálculo do score de aderência do GAP Analysis.
// Pesos: Aderente=1, Parcial=0,5, Não aderente=0, N.A.=excluído do cálculo.

import { GAP_CONTROLS, GAP_DOMAINS, type GapControl } from "@/lib/gap-catalog";

export type Aderencia = "ADERENTE" | "PARCIAL" | "NAO_ADERENTE" | "NA";

export const ADERENCIA_PESO: Record<string, number> = {
  ADERENTE: 1,
  PARCIAL: 0.5,
  NAO_ADERENTE: 0,
};

export type RespostaMap = Record<string, { aderencia?: string | null }>;

export interface DomainScore {
  code: string;
  name: string;
  total: number;
  respondidos: number; // com aderência preenchida (inclui NA)
  avaliados: number; // não-NA (entram no cálculo)
  score: number | null; // 0-100 sobre os avaliados; null se nenhum avaliado
  aderentes: number;
  parciais: number;
  naoAderentes: number;
  na: number;
}

function scoreControls(controls: GapControl[], respostas: RespostaMap) {
  let respondidos = 0, avaliados = 0, soma = 0, aderentes = 0, parciais = 0, naoAderentes = 0, na = 0;
  for (const c of controls) {
    const ad = respostas[c.code]?.aderencia;
    if (!ad) continue;
    respondidos++;
    if (ad === "NA") { na++; continue; }
    avaliados++;
    soma += ADERENCIA_PESO[ad] ?? 0;
    if (ad === "ADERENTE") aderentes++;
    else if (ad === "PARCIAL") parciais++;
    else if (ad === "NAO_ADERENTE") naoAderentes++;
  }
  const score = avaliados > 0 ? Math.round((soma / avaliados) * 100) : null;
  return { total: controls.length, respondidos, avaliados, score, aderentes, parciais, naoAderentes, na };
}

export function scorePorDominio(respostas: RespostaMap): DomainScore[] {
  return GAP_DOMAINS.map((d) => ({ code: d.code, name: d.name, ...scoreControls(d.controls, respostas) }));
}

export function scoreGeral(respostas: RespostaMap) {
  const s = scoreControls(GAP_CONTROLS, respostas);
  return { ...s, totalCatalogo: GAP_CONTROLS.length };
}
