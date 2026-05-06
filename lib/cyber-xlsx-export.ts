/**
 * Exporta a Maturidade Cibernética em Excel — paralelo ao GAP export.
 *
 * 3 abas:
 *  - Resumo: score consolidado + score por função
 *  - Controles: 80 linhas com código, função, categoria, pergunta,
 *    aderência, ponto de melhoria, evidência, audience, delegação
 *  - Recomendações: lista priorizada (NAO_ADERENTE → ALTA, PARCIAL → MEDIA)
 */

import * as XLSX from "xlsx";
import {
  CYBER_CONTROLS,
  CYBER_CATEGORIES,
  cyberFunctionLabel,
  cyberAudienceLabel,
} from "./cyber-catalog";
import {
  type CyberAnswerDTO,
  type CyberScore,
  cyberAderenciaLabel,
  cyberLevelLabel,
  buildCyberRecommendations,
} from "./cyber-helpers";

export interface CyberXlsxInput {
  companyName: string;
  generatedAt: Date;
  answers: ReadonlyArray<CyberAnswerDTO>;
  score: CyberScore;
}

export function buildCyberXlsx(input: CyberXlsxInput): Buffer {
  const wb = XLSX.utils.book_new();
  const answersByCode = new Map<string, CyberAnswerDTO>();
  for (const a of input.answers) answersByCode.set(a.controlCode, a);

  // ===== Aba 1: Resumo =====
  const resumo: any[][] = [
    ["Maturidade Cibernética — NIST CSF v1.1"],
    ["Organização", input.companyName],
    ["Gerado em", input.generatedAt.toLocaleString("pt-BR")],
    [],
    ["Score consolidado", `${input.score.overall} / 100`],
    ["Nível", cyberLevelLabel(input.score.level)],
    ["Controles respondidos", `${input.score.answered} de ${input.score.totalControls}`],
    [],
    ["Score por função"],
    ["Função", "Score (%)", "Respondidos", "Aderente", "Parcial", "Não aderente", "N/A", "Delegado TI"],
    ...input.score.byFunction.map((f) => [
      `${cyberFunctionLabel(f.function)} (${f.function})`,
      f.score,
      `${f.answered}/${f.totalControls}`,
      f.aderente,
      f.parcial,
      f.naoAderente,
      f.naoAplica,
      f.delegadoTi,
    ]),
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(resumo);
  ws1["!cols"] = [{ wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

  // ===== Aba 2: Controles =====
  const headers = [
    "Código",
    "Função",
    "Categoria",
    "Pergunta",
    "Aderência",
    "Ponto de melhoria",
    "Evidência",
    "Origem da pré-população",
    "Público",
    "NIST original",
  ];
  const rows: any[][] = [headers];

  for (const c of CYBER_CONTROLS) {
    const a = answersByCode.get(c.code);
    const cat = CYBER_CATEGORIES.find((k) => c.code.startsWith(k.code + "-"));
    rows.push([
      c.code,
      cyberFunctionLabel(c.function),
      cat ? `${cat.code} — ${cat.label}` : "",
      c.question,
      a ? cyberAderenciaLabel(a.aderencia) : "(não respondido)",
      a?.pontoMelhoria ?? "",
      a?.evidence ?? "",
      a?.evidenceFrom ?? "",
      cyberAudienceLabel(c.audience),
      c.nistRef,
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(rows);
  ws2["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 60 }, { wch: 16 },
    { wch: 50 }, { wch: 50 }, { wch: 14 }, { wch: 18 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Controles");

  // ===== Aba 3: Recomendações =====
  const recs = buildCyberRecommendations(
    input.answers.map((a) => ({
      controlCode: a.controlCode,
      aderencia: a.aderencia,
      pontoMelhoria: a.pontoMelhoria,
    }))
  );

  const recHeaders = ["Prioridade", "Código", "Função", "Categoria", "Pergunta", "Ponto de melhoria"];
  const recRows: any[][] = [recHeaders];
  for (const r of recs) {
    const cat = CYBER_CATEGORIES.find((k) => r.controlCode.startsWith(k.code + "-"));
    recRows.push([
      r.priority,
      r.controlCode,
      cyberFunctionLabel(r.control.function),
      cat ? `${cat.code} — ${cat.label}` : "",
      r.control.question,
      r.pontoMelhoria ?? "",
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(recRows);
  ws3["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 60 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Recomendações");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
