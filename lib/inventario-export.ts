/**
 * Builder do XLSX consolidado do Inventário (Checkpoint 8).
 *
 * Replica a estrutura do template oficial "Data Mapping com riscos"
 * (LGPD PRO / Denise) — 3 abas:
 *
 *   1. INVENTÁRIO   — 84 colunas (A-CF), 1 linha por processo APROVADO.
 *      Inclui Bloco 4 (BR-CE) com marcações "x" da Análise de Riscos.
 *   2. RISCOS       — 8 colunas, 1 linha por ProcessRisk identificado,
 *      com Severidade × Probabilidade × Impacto e plano de mitigação.
 *   3. TAB. VISÃO DE RISCOS — contagens por tipo de risco × severidade.
 *
 * Estrutura herdada de `scripts/_excel-modelo-raw-v2.json` (análise
 * documentada em `scripts/_excel-mapping-analysis.md`). Em vez de
 * clonar o XLSX (não está no repo), gera do zero — mais leve e dá pra
 * testar offline.
 *
 * Função pura: caller passa os dados já carregados do banco.
 */

import * as XLSX from "xlsx";
import type { FormAnswers } from "@/lib/inventario-form-schema";
import {
  RISCOS_BY_CODE,
  decodeSeverity,
  type RiskCode,
} from "@/lib/riscos-catalog";

// ============================================================
// Input
// ============================================================

export interface InventarioExportProcess {
  id: string;
  serviceName: string;
  setor: string | null;
  dataCategory: string | null;
  personalData: string | null;
  legalBasis: string | null;
  legalBasisSensitive: string | null;
  legalBasisComments: string | null;
  previsaoLegal: string | null;
  purpose: string | null;
  dataSubjects: string | null;
  retention: string | null;
  storage: string | null;
  sharing: string | null;
  security: string | null;
  formAnswers: FormAnswers | null;
  createdBy: { name: string | null; email: string } | null;
  reviewedAt: Date | null;
  /** Riscos identificados nesse processo (ProcessRisk). */
  risks: ReadonlyArray<{
    riskCode: string;
    status: string;
    description: string | null;
    severityLevel: string | null;
    mitigationPlan: string | null;
  }>;
}

export interface InventarioExportInput {
  companyName: string;
  processes: ReadonlyArray<InventarioExportProcess>;
}

// ============================================================
// Mapeamento de severidade pra escala 1-3 (template usa números)
// ============================================================

function probabilityToScore(p: string | null): number | null {
  if (p === "BAIXA") return 1;
  if (p === "MEDIA") return 2;
  if (p === "ALTA") return 3;
  return null;
}
function impactToScore(i: string | null): number | null {
  if (i === "BAIXO") return 1;
  if (i === "MEDIO") return 2;
  if (i === "ALTO") return 3;
  return null;
}
function severityToLabel(s: string | null): string {
  switch (s) {
    case "BAIXO": return "Baixo";
    case "MEDIO": return "Médio";
    case "ALTO": return "Alto";
    default: return "";
  }
}

// ============================================================
// Helpers de leitura defensiva do FormAnswers
// ============================================================

function getSec(answers: FormAnswers | null, sec: string): any {
  return (answers as any)?.sections?.[sec] ?? {};
}

function asLine(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return String(v);
}

// ============================================================
// Headers das 3 abas (na ordem oficial do modelo)
// ============================================================

// Coluna A=0, B=1, C=2... — usamos índice numérico no aoa_to_sheet.
// 84 colunas (A-CF) na aba INVENTÁRIO.

interface ColumnDef {
  letter: string;
  header: string;
  /** Função que extrai o valor pra essa coluna a partir do processo. */
  value: (p: InventarioExportProcess) => string | number | null;
}

const RISK_CODE_COLUMNS: { code: RiskCode; col: string }[] = [
  { code: "BR", col: "BR" },
  { code: "BS", col: "BS" },
  { code: "BT", col: "BT" },
  { code: "BU", col: "BU" },
  { code: "BV", col: "BV" },
  { code: "BW", col: "BW" },
  { code: "BX", col: "BX" },
  { code: "BY", col: "BY" },
  { code: "BZ", col: "BZ" },
  { code: "CA", col: "CA" },
  { code: "CB", col: "CB" },
  { code: "CC", col: "CC" },
  { code: "CD", col: "CD" },
];

const INVENTARIO_COLUMNS: ColumnDef[] = [
  { letter: "A", header: "# ID", value: (p) => p.id.slice(-8).toUpperCase() },
  { letter: "B", header: "Nome da área ou departamento responsável", value: (p) => p.setor ?? "" },
  {
    letter: "C",
    header: "Nome e contato do respondente",
    value: (p) => {
      const sec1 = getSec(p.formAnswers, "sec1");
      const name = asLine(sec1?.respondent_name) || p.createdBy?.name || "";
      const email = asLine(sec1?.respondent_email) || p.createdBy?.email || "";
      return [name, email].filter(Boolean).join(" — ");
    },
  },
  { letter: "D", header: "Categoria de dados pessoais", value: (p) => p.dataCategory ?? "" },
  { letter: "E", header: "Lista de dados pessoais envolvidos por categoria", value: (p) => p.personalData ?? "" },
  {
    letter: "F",
    header: "Dados pessoais sensíveis (Sim ou Não). Quais?",
    value: (p) => {
      const sec3 = getSec(p.formAnswers, "sec3");
      const yn = asLine(sec3?.data_sensitive_yn);
      const list = asLine(sec3?.data_sensitive_list);
      if (!yn) return "";
      return list ? `${yn} — ${list}` : yn;
    },
  },
  { letter: "G", header: "", value: () => "" },
  { letter: "H", header: "Finalidade de tratamento do dado pessoal", value: (p) => p.purpose ?? "" },
  {
    letter: "I",
    header: "Descrição detalhada do processo / atividade",
    value: (p) => {
      const sec2 = getSec(p.formAnswers, "sec2");
      return asLine(sec2?.process_purpose);
    },
  },
  { letter: "J", header: "Previsão Legal", value: (p) => p.previsaoLegal ?? "" },
  { letter: "K", header: "Base Legal Dados Pessoais Sensíveis", value: (p) => p.legalBasisSensitive ?? "" },
  { letter: "L", header: "Base Legal Dados Pessoais", value: (p) => p.legalBasis ?? "" },
  { letter: "M", header: "Comentários sobre as Bases Legais sugeridas", value: (p) => p.legalBasisComments ?? "" },
  { letter: "N", header: "Categoria do Titular do Dado Pessoal", value: (p) => p.dataSubjects ?? "" },
  {
    letter: "O",
    header: "Como teve acesso ao dado pessoal?",
    value: (p) => asLine(getSec(p.formAnswers, "sec5")?.collect_source),
  },
  { letter: "P", header: "É apresentado ao titular Política de Privacidade?", value: (p) => asLine(getSec(p.formAnswers, "sec5")?.collect_policy_shown) },
  { letter: "Q", header: "", value: () => "" },
  { letter: "R", header: "É solicitado consentimento ao titular?", value: (p) => asLine(getSec(p.formAnswers, "sec5")?.collect_consent) },
  { letter: "S", header: "", value: () => "" },
  { letter: "T", header: "Acesso a dado pessoal não necessário?", value: (p) => asLine(getSec(p.formAnswers, "sec4")?.use_unnecessary_access) },
  { letter: "U", header: "", value: () => "" },
  { letter: "V", header: "Como o dado pessoal é coletado?", value: (p) => asLine(getSec(p.formAnswers, "sec5")?.collect_source_desc) },
  {
    letter: "W",
    header: "Recebido de outra empresa para prestação de serviço?",
    value: (p) => {
      const sec4 = getSec(p.formAnswers, "sec4");
      const yn = asLine(sec4?.use_received_external);
      const desc = asLine(sec4?.use_received_external_desc);
      return yn && desc ? `${yn} — ${desc}` : yn;
    },
  },
  { letter: "X", header: "", value: () => "" },
  { letter: "Y", header: "Dado pessoal é comprado de outra empresa?", value: () => "" },
  { letter: "Z", header: "", value: () => "" },
  { letter: "AA", header: "Compartilhado com áreas internas?", value: (p) => asLine(getSec(p.formAnswers, "sec6")?.share_targets) },
  { letter: "AB", header: "Compartilhado com terceiros?", value: (p) => asLine(getSec(p.formAnswers, "sec6")?.share_with_whom) },
  { letter: "AC", header: "Como é feito o compartilhamento?", value: () => "" },
  { letter: "AD", header: "", value: () => "" },
  {
    letter: "AE",
    header: "Compartilhado com outros países? Quais?",
    value: (p) => {
      const sec6 = getSec(p.formAnswers, "sec6");
      const yn = asLine(sec6?.share_international);
      const countries = asLine(sec6?.share_international_countries);
      return yn && countries ? `${yn} — ${countries}` : yn;
    },
  },
  { letter: "AF", header: "", value: () => "" },
  { letter: "AG", header: "Titular sabe dos compartilhamentos?", value: (p) => asLine(getSec(p.formAnswers, "sec6")?.share_subject_aware) },
  { letter: "AH", header: "", value: () => "" },
  { letter: "AI", header: "Armazenamento lógico (sistemas)", value: (p) => p.storage ?? "" },
  { letter: "AJ", header: "Armazenamento impresso", value: () => "" },
  { letter: "AK", header: "", value: () => "" },
  { letter: "AL", header: "Local único sem redundância/backup?", value: () => "" },
  { letter: "AM", header: "", value: () => "" },
  { letter: "AN", header: "Como o dado é destruído?", value: () => "" },
  { letter: "AO", header: "Tempo de retenção do dado pessoal", value: (p) => p.retention ?? "" },
  { letter: "AP", header: "", value: () => "" },
  {
    letter: "AQ",
    header: "Dado submetido a decisão automatizada?",
    value: (p) => {
      const sec4 = getSec(p.formAnswers, "sec4");
      const yn = asLine(sec4?.use_automated_decision);
      const desc = asLine(sec4?.use_automated_decision_desc);
      return yn && desc ? `${yn} — ${desc}` : yn;
    },
  },
  {
    letter: "AR",
    header: "Dado utilizado para finalidade diferente da informada?",
    value: (p) => {
      const sec4 = getSec(p.formAnswers, "sec4");
      const yn = asLine(sec4?.use_diff_purpose);
      const desc = asLine(sec4?.use_diff_purpose_desc);
      return yn && desc ? `${yn} — ${desc}` : yn;
    },
  },
  { letter: "AS", header: "Dado revisado periodicamente?", value: () => "" },
  { letter: "AT", header: "Sistemas/repositórios próprios ou terceiros?", value: () => "" },
  { letter: "AU", header: "Localização geográfica dos sistemas", value: () => "" },
  { letter: "AV", header: "Medidas de segurança nas transferências", value: (p) => p.security ?? "" },
  { letter: "AW", header: "Área realiza armazenamento local adicional?", value: () => "" },
  { letter: "AX", header: "Acesso a redes sociais/cloud externos?", value: () => "" },
  { letter: "AY", header: "Medidas de segurança em equipamentos pessoais", value: () => "" },
  { letter: "AZ", header: "Medidas de segurança/privacidade dos dados", value: (p) => p.security ?? "" },
  { letter: "BA", header: "Observação", value: () => "" },
  // BB-BP: bloco-legado vazio (lista de tipos de risco como referência) — pulamos
];

// Total de colunas (A=0 até CE=82) — vamos preencher até CE com vazio nos slots não-mapeados
const TOTAL_COLUMNS = 84; // A-CF

// ============================================================
// Builder
// ============================================================

export function buildInventarioExportXLSX(input: InventarioExportInput): Buffer {
  const wb = XLSX.utils.book_new();

  // ---------- Aba INVENTÁRIO ----------
  const invRows: any[][] = [];

  // L1: Título da exportação (similar a "OBSERVAÇÕES GERAIS" do modelo)
  invRows.push([
    `Inventário de Dados Pessoais — ${input.companyName} — exportado em ${new Date().toLocaleString("pt-BR")}`,
  ]);
  // L2: vazia (no modelo é "OBSERVAÇÕES SOBRE OS RISCOS")
  invRows.push([]);
  // L3: vazia
  invRows.push([]);

  // L4: Headers — coluna A até CE
  const headerRow = new Array<string>(TOTAL_COLUMNS).fill("");
  for (const col of INVENTARIO_COLUMNS) {
    headerRow[XLSX.utils.decode_col(col.letter)] = col.header;
  }
  // Headers do bloco 4 (BR-CD = riscos identificados, marcação "x")
  for (const r of RISK_CODE_COLUMNS) {
    headerRow[XLSX.utils.decode_col(r.col)] = RISCOS_BY_CODE[r.code].fullLabel;
  }
  headerRow[XLSX.utils.decode_col("CE")] = "TOTAL";
  invRows.push(headerRow);

  // L5+: 1 linha por processo APROVADO
  for (const p of input.processes) {
    const row = new Array<string | number>(TOTAL_COLUMNS).fill("");
    for (const col of INVENTARIO_COLUMNS) {
      const v = col.value(p);
      if (v != null) row[XLSX.utils.decode_col(col.letter)] = v as any;
    }
    // Marca os riscos identificados nas colunas BR-CD
    let total = 0;
    for (const r of RISK_CODE_COLUMNS) {
      const has = p.risks.find((rk) => rk.riskCode === r.code);
      if (has) {
        // Se tem descrição, usa; senão "x"
        row[XLSX.utils.decode_col(r.col)] = has.description?.trim() || "x";
        total += 1;
      }
    }
    row[XLSX.utils.decode_col("CE")] = total;
    invRows.push(row);
  }

  const wsInv = XLSX.utils.aoa_to_sheet(invRows);
  // Ajusta largura das colunas-chave pra ficar legível
  wsInv["!cols"] = new Array(TOTAL_COLUMNS).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, wsInv, "INVENTÁRIO");

  // ---------- Aba RISCOS ----------
  const riskRows: any[][] = [];
  // L1: Título
  riskRows.push(["RISCOS"]);
  // L2: Headers
  riskRows.push([
    "Nº do ID correspondente na aba INVENTÁRIO",
    "Indicação do motivo pelo qual o risco foi identificado",
    "Grau de impacto (1 a 3)",
    "Grau de Probabilidade (1 a 3)",
    "Multiplicação dos dois",
    "Baixo / Médio / Alto",
    "Tipo de Risco (categoria)",
    "Ações para mitigação do risco",
  ]);
  // L3+: 1 linha por ProcessRisk
  for (const p of input.processes) {
    for (const r of p.risks) {
      const decoded = decodeSeverity(r.severityLevel);
      const probScore = decoded ? probabilityToScore(decoded.probability) : null;
      const impScore = decoded ? impactToScore(decoded.impact) : null;
      const product = probScore && impScore ? probScore * impScore : null;
      const sev = decoded ? severityToLabel(decoded.severity) : "";
      const cat = RISCOS_BY_CODE[r.riskCode as RiskCode]?.fullLabel ?? r.riskCode;
      riskRows.push([
        p.id.slice(-8).toUpperCase(),
        r.description ?? "",
        impScore ?? "",
        probScore ?? "",
        product ?? "",
        sev,
        cat,
        r.mitigationPlan ?? "",
      ]);
    }
  }
  const wsRis = XLSX.utils.aoa_to_sheet(riskRows);
  wsRis["!cols"] = [
    { wch: 14 }, { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 30 }, { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRis, "RISCOS");

  // ---------- Aba TAB. VISÃO DE RISCOS ----------
  // Conta riscos por (riskCode × severidade)
  const visaoRows: any[][] = [];
  visaoRows.push(["Tipo de Risco", "", "Classificação Final do Risco"]);
  visaoRows.push(["Código", "Nome", "Baixo", "Médio", "Alto", "Total"]);

  for (const r of RISK_CODE_COLUMNS) {
    const def = RISCOS_BY_CODE[r.code];
    let baixo = 0, medio = 0, alto = 0;
    for (const p of input.processes) {
      for (const risk of p.risks) {
        if (risk.riskCode !== r.code) continue;
        const decoded = decodeSeverity(risk.severityLevel);
        if (decoded?.severity === "BAIXO") baixo += 1;
        else if (decoded?.severity === "MEDIO") medio += 1;
        else if (decoded?.severity === "ALTO") alto += 1;
      }
    }
    visaoRows.push([r.code, def.fullLabel, baixo, medio, alto, baixo + medio + alto]);
  }
  const wsVisao = XLSX.utils.aoa_to_sheet(visaoRows);
  wsVisao["!cols"] = [
    { wch: 8 }, { wch: 50 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVisao, "TAB. VISÃO DE RISCOS");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buf as Buffer;
}

// ============================================================
// Filename helper
// ============================================================

export function suggestInventarioFilename(companyName: string): string {
  const safe = (s: string) =>
    s.normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `Inventario_${safe(companyName) || "Organizacao"}_${date}.xlsx`;
}
