/**
 * Extrator de dados de contratos a partir de PDF pesquisável
 * (Checkpoint 14 / H2-D2).
 *
 * Engine pura via regex + heurística — não usa LLM. Funciona em PDFs
 * com camada de texto (não-escaneados). PDFs escaneados sem OCR ficam
 * com texto vazio e devolvemos `noText: true` pra UI alertar.
 *
 * O que extrai:
 *   - CNPJ (regex de formato fixo XX.XXX.XXX/XXXX-XX)
 *   - Razão social (heurística baseada em "CONTRATANTE:", "CONTRATADO:",
 *     "Empresa:", linhas em CAIXA ALTA com indicador societário)
 *   - Data do contrato original (linhas com "celebrado em", "datado de",
 *     "em XX de mês de YYYY")
 *   - Vigência (busca padrão "vigência" / "prazo" próximo a datas)
 *   - Cláusulas LGPD presentes (busca por keywords específicas):
 *       - hasPrivacyClause: "LGPD", "Lei 13.709", "ANPD", "encarregado",
 *                          "tratamento de dados pessoais", "titular de dados"
 *       - hasIncidentClause: "notificação de incidente", "incidente de
 *                            segurança", "comunicação à ANPD", "72 horas"
 *
 * Uso:
 *   import { extractContractData } from "@/lib/pdf-contract-extractor";
 *   const result = await extractContractData(pdfBuffer);
 *   // → { fullText, noText, cnpjs, suggestedNames, hasPrivacyClause, ... }
 */

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ContractExtraction {
  /** True se o PDF não tem camada de texto (escaneado sem OCR). */
  noText: boolean;
  /** Tamanho do texto extraído (caracteres). 0 quando noText. */
  textLength: number;
  /** Texto completo extraído (truncado em 50k chars pra resposta da API). */
  fullText: string;

  // ----- Identificação -----
  /** CNPJs encontrados (formato XX.XXX.XXX/XXXX-XX). */
  cnpjs: string[];
  /** Candidatos a razão social. Ordem: do mais provável pro menos. */
  suggestedNames: string[];

  // ----- Datas -----
  /** Data do contrato original (ISO YYYY-MM-DD) — primeira data
   *  contextualizada como "celebrado em" / "datado de". */
  contractOriginalDate: string | null;
  /** Data de vigência/término (ISO) — primeira data próxima a "vigência",
   *  "vence em", "prazo até". */
  contractExpiresAt: string | null;

  // ----- Cláusulas LGPD detectadas -----
  hasPrivacyClause: boolean;
  hasIncidentClause: boolean;
  /** Snippets que dispararam a detecção (pra DPO conferir). */
  detectedKeywords: string[];
}

const TEXT_LIMIT = 50_000; // 50k chars no preview da API

// ============================================================
// Pipeline principal
// ============================================================

export async function extractContractData(
  pdfBuffer: Buffer
): Promise<ContractExtraction> {
  const fullText = await extractPdfText(pdfBuffer);
  const cleaned = normalize(fullText);

  if (cleaned.length < 50) {
    // Texto vazio ou quase: provavelmente PDF escaneado sem OCR
    return {
      noText: true,
      textLength: cleaned.length,
      fullText: fullText.slice(0, TEXT_LIMIT),
      cnpjs: [],
      suggestedNames: [],
      contractOriginalDate: null,
      contractExpiresAt: null,
      hasPrivacyClause: false,
      hasIncidentClause: false,
      detectedKeywords: [],
    };
  }

  const cnpjs = extractCnpjs(cleaned);
  const suggestedNames = extractCompanyNames(cleaned, cnpjs);
  const contractOriginalDate = extractContractDate(cleaned);
  const contractExpiresAt = extractExpiryDate(cleaned);
  const lgpd = detectLgpdClauses(cleaned);

  return {
    noText: false,
    textLength: cleaned.length,
    fullText: fullText.slice(0, TEXT_LIMIT),
    cnpjs,
    suggestedNames,
    contractOriginalDate,
    contractExpiresAt,
    hasPrivacyClause: lgpd.hasPrivacyClause,
    hasIncidentClause: lgpd.hasIncidentClause,
    detectedKeywords: lgpd.detectedKeywords,
  };
}

// ============================================================
// PDF → texto
// ============================================================

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  let out = "";
  // Limita às primeiras 30 páginas — contratos comuns têm 5-15;
  // o que precisamos pra extração tá no início (qualificação das partes
  // + datas) e fim (cláusulas).
  const maxPages = Math.min(doc.numPages, 30);
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    out += pageText + "\n";
  }
  return out;
}

function normalize(s: string): string {
  return s
    .replace(/\x00/g, "") // sanitiza null bytes (Postgres não aceita)
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// CNPJ
// ============================================================

const CNPJ_REGEX = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;

function extractCnpjs(text: string): string[] {
  const matches = text.match(CNPJ_REGEX) ?? [];
  // Dedup preservando ordem (1ª ocorrência costuma ser do contratante)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of matches) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 5) break;
  }
  return out;
}

// ============================================================
// Razão social
// ============================================================

/** Sufixos societários que terminam um nome de empresa. */
const COMPANY_SUFFIXES =
  /\b(LTDA|S\.?A\.?|EIRELI|MEI|EPP|ME|S\.?S\.?|FUNDA[ÇC][AÃ]O|ASSOCIA[ÇC][AÃ]O|INSTITUTO|COOPERATIVA)\.?/i;

/** Captura "ACME TECNOLOGIA LTDA" antes de ", inscrita..." ou ", CNPJ". */
const NAME_BEFORE_CNPJ_REGEX =
  /([A-ZÀ-Ü0-9 &.\-/]{4,80}\b(?:LTDA|S\.?A\.?|EIRELI|MEI|EPP|ME|S\.?S\.?|FUNDA[ÇC][AÃ]O|ASSOCIA[ÇC][AÃ]O|INSTITUTO|COOPERATIVA)\.?)\s*,?\s*(?:inscrita|com sede|CNPJ|cnpj|por seu)/g;

/** Captura padrões "CONTRATANTE: NOME", "CONTRATADO: NOME". */
const PARTY_LABEL_REGEX =
  /\b(CONTRATANTE|CONTRATADO|CONTRATADA|FORNECEDOR|PRESTADOR(?:A)?|EMPRESA|RAZ[AÃ]O SOCIAL)\b\s*[:\-]?\s*([A-ZÀ-Ü][A-ZÀ-Ü0-9 &.\-/]{4,100})/gi;

function extractCompanyNames(text: string, cnpjs: string[]): string[] {
  const candidates = new Map<string, number>(); // name → score

  // Estratégia 1: nomes próximos a CNPJ ("ACME LTDA, CNPJ ...")
  const m1 = text.matchAll(NAME_BEFORE_CNPJ_REGEX);
  for (const match of m1) {
    const name = cleanName(match[1]);
    if (isValidCompanyName(name)) {
      candidates.set(name, (candidates.get(name) ?? 0) + 5); // alta confiança
    }
  }

  // Estratégia 2: rótulos de parte ("CONTRATADO: NOME")
  const m2 = text.matchAll(PARTY_LABEL_REGEX);
  for (const match of m2) {
    const raw = match[2];
    // Tenta cortar no primeiro sufixo societário, senão usa primeiras 60 chars
    const sufMatch = raw.match(COMPANY_SUFFIXES);
    const cut = sufMatch
      ? raw.slice(0, sufMatch.index! + sufMatch[0].length)
      : raw.slice(0, 60);
    const name = cleanName(cut);
    if (isValidCompanyName(name)) {
      // CONTRATANTE costuma ser a empresa do user — peso menor pra
      // priorizar o terceiro (CONTRATADO).
      const isContratante = /^CONTRATANTE/i.test(match[1]);
      candidates.set(
        name,
        (candidates.get(name) ?? 0) + (isContratante ? 1 : 4)
      );
    }
  }

  // Estratégia 3: caixa-alta isolada com sufixo societário (sem rótulo)
  const allCapsRegex = /\b([A-ZÀ-Ü][A-ZÀ-Ü0-9 &.\-/]{6,80}\b(?:LTDA|S\.?A\.?|EIRELI|MEI|EPP|ME)\.?)\b/g;
  const m3 = text.matchAll(allCapsRegex);
  for (const match of m3) {
    const name = cleanName(match[1]);
    if (isValidCompanyName(name)) {
      candidates.set(name, (candidates.get(name) ?? 0) + 1);
    }
  }

  // Ordenar por score desc, devolver até 5
  return Array.from(candidates.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
}

function cleanName(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[,;.]+$/, "")
    .replace(/^[,;.]+/, "")
    .trim();
}

function isValidCompanyName(s: string): boolean {
  if (s.length < 5 || s.length > 100) return false;
  // Deve ter ao menos um sufixo societário OU 3+ palavras
  if (COMPANY_SUFFIXES.test(s)) return true;
  const words = s.split(/\s+/).filter(Boolean);
  return words.length >= 3;
}

// ============================================================
// Datas
// ============================================================

const DATE_DDMMYYYY = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/;
const DATE_PT_BR =
  /\b(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})\b/i;

const PT_MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  "março": 3,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function findDateNear(text: string, contextRegex: RegExp): string | null {
  const idx = text.search(contextRegex);
  if (idx < 0) return null;
  // Janela de ±200 chars em torno do contexto
  const start = Math.max(0, idx - 200);
  const end = Math.min(text.length, idx + 200);
  const window = text.slice(start, end);

  const m1 = window.match(DATE_DDMMYYYY);
  if (m1) {
    return toIsoDate(parseInt(m1[1]), parseInt(m1[2]), parseInt(m1[3]));
  }
  const m2 = window.match(DATE_PT_BR);
  if (m2) {
    const month = PT_MONTHS[m2[2].toLowerCase()];
    if (month) {
      return toIsoDate(parseInt(m2[1]), month, parseInt(m2[3]));
    }
  }
  return null;
}

function toIsoDate(d: number, m: number, y: number): string | null {
  if (y < 1980 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function extractContractDate(text: string): string | null {
  // Procura datas próximas a "celebrado em", "datado de", "firmado em",
  // "data: dd/mm/yyyy", "em DD de MÊS de AAAA"
  const contexts = [
    /celebrado\s+em/i,
    /datado\s+de/i,
    /firmado\s+em/i,
    /assinado\s+em/i,
    /\bdata\s*:?/i,
  ];
  for (const ctx of contexts) {
    const date = findDateNear(text, ctx);
    if (date) return date;
  }
  // Fallback: 1ª data PT-BR no documento
  const m = text.match(DATE_PT_BR);
  if (m) {
    const month = PT_MONTHS[m[2].toLowerCase()];
    if (month) return toIsoDate(parseInt(m[1]), month, parseInt(m[3]));
  }
  return null;
}

function extractExpiryDate(text: string): string | null {
  const contexts = [
    /vig[êe]ncia\s+at[ée]/i,
    /vence\s+em/i,
    /prazo\s+at[ée]/i,
    /at[ée]\s+\d{1,2}/i, // "até 31/12/2026"
    /encerra(?:r|-se)\s+em/i,
    /t[ée]rmino/i,
    /expira(?:r)?\s+em/i,
  ];
  for (const ctx of contexts) {
    const date = findDateNear(text, ctx);
    if (date) return date;
  }
  return null;
}

// ============================================================
// Cláusulas LGPD
// ============================================================

const PRIVACY_KEYWORDS = [
  /\bLGPD\b/i,
  /lei\s+(?:n[º°.]?\s*)?13\.?709/i,
  /\bANPD\b/i,
  /\bencarregado\b/i,
  /tratamento\s+de\s+dados\s+pessoais/i,
  /titular(?:es)?\s+de\s+dados/i,
  /prote[çc][ãa]o\s+de\s+dados\s+pessoais/i,
];

const INCIDENT_KEYWORDS = [
  /notifica[çc][ãa]o\s+de\s+incidente/i,
  /incidente\s+de\s+seguran[çc]a/i,
  /comunica[çc][ãa]o\s+(?:à|ao|para a)\s*ANPD/i,
  /\b72\s+horas\b/i,
  /viola[çc][ãa]o\s+de\s+dados/i,
  /vazamento\s+de\s+dados/i,
];

function detectLgpdClauses(text: string): {
  hasPrivacyClause: boolean;
  hasIncidentClause: boolean;
  detectedKeywords: string[];
} {
  const detected: string[] = [];

  let hasPrivacy = false;
  for (const kw of PRIVACY_KEYWORDS) {
    const m = text.match(kw);
    if (m) {
      hasPrivacy = true;
      detected.push(m[0]);
    }
  }

  let hasIncident = false;
  for (const kw of INCIDENT_KEYWORDS) {
    const m = text.match(kw);
    if (m) {
      hasIncident = true;
      detected.push(m[0]);
    }
  }

  // Dedup keywords (case-insensitive)
  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const k of detected) {
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(k);
  }

  return {
    hasPrivacyClause: hasPrivacy,
    hasIncidentClause: hasIncident,
    detectedKeywords: dedup,
  };
}
