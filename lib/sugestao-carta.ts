/**
 * Engine de "Sugerir processos a partir da Carta de Serviços".
 *
 * Pipeline:
 *   1. Recebe `domain` (ex: tcees.tc.br)
 *   2. Firecrawl /v1/map → URLs do site
 *   3. Filtra URLs candidatas (carta_servicos/ouvidoria/sic/edital/rh)
 *      via heurística existente em lib/url-keywords.ts
 *   4. Scrape paralelo das URLs candidatas (até MAX_SCRAPE) → markdown
 *   5. Manda corpus pro Gemini com schema de extração + classificação
 *   6. Gemini retorna lista de serviços com:
 *      - name, description, sourceUrl, category
 *      - classification: SUGERIDO/TALVEZ/NAO + reason
 *      - prefill: subset de FormAnswers (só campos com info no texto)
 *   7. Caller compara contra Inventários existentes pra marcar "Já mapeado"
 *
 * Decisões:
 *   - thinkingBudget: 0 (extração estruturada — sem raciocínio).
 *     Lição registrada na sessão 2026-05-12.
 *   - JSON repair como rede de segurança (mesma lib/inventario-ai-prefill).
 *   - Conservador: só preenche campos com info LITERAL no texto. Volume,
 *     armazenamento, segurança técnica = NUNCA (são internos).
 *   - Classification "TALVEZ" pra caso ambíguo (Carta menciona dado mas
 *     não detalha quais) — força revisão humana.
 */

import { GoogleGenAI } from "@google/genai";
import { mapSite, scrapeMany } from "./firecrawl";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** Limite defensivo: corpus enviado ao LLM. Reduzido pra acelerar
 *  resposta do Gemini (input pesado aumenta TTFB). */
const MAX_CORPUS_CHARS = 50_000;

/** Quantas páginas (URL fornecida + filhas) raspar em paralelo.
 *  Cada scrape custa 1 unidade Firecrawl (~R$0,01).
 *
 *  Histórico:
 *  - 2026-05-12 (Hobby): apertamos pra 5 pra caber no 60s do plano free
 *  - 2026-05-13 (Pro upgrade): voltamos a 10 — agora cabe em 300s e
 *    Cartas de instituições grandes (ministérios, tribunais) com ~10-15
 *    sub-páginas funcionam direito. Cada análise custa ~R$0,10 em
 *    Firecrawl, dentro dos $20/mês incluídos no Pro. */
const MAX_SCRAPE_PAGES = 10;

export type ServiceClassification = "SUGERIDO" | "TALVEZ" | "NAO";

export interface SuggestedService {
  /** Hash-like id estável (gerado a partir de name+url) — usado pelo client
   *  pra selecionar e materializar sem recriar a lista. */
  id: string;
  name: string;
  description: string;
  classification: ServiceClassification;
  /** Justificativa curta (1-2 frases) do porquê dessa classificação. */
  classificationReason: string;
  sourceUrl: string;
  /** Categoria leve pra UI (SIC, Ouvidoria, RH, etc.). Vem do LLM. */
  category: string | null;
  /** Subset de FormAnswers — só seções 2/4/5/6 (campos extraíveis). */
  prefill: ServicePrefill;
}

export interface ServicePrefill {
  /** sec2.process_name */
  process_name?: string;
  /** sec2.process_purpose (2-4 frases literais). */
  process_purpose?: string;
  /** sec5.data_subjects — público-alvo (multi). Opções típicas:
   *  "Cidadãos", "Servidores", "Fornecedores", "Estudantes". */
  data_subjects?: string[];
  /** sec4.legalBasis — base legal mencionada (texto livre curto). */
  legalBasis?: string;
  /** sec6.share_targets — multi. */
  share_targets?: string[];
  /** sec6.share_with_whom — texto livre. */
  share_with_whom?: string;
}

export interface SuggestionStats {
  totalServicesExtracted: number;
  bySuggested: number;
  byMaybe: number;
  byNo: number;
  /** Tamanho em caracteres do corpus que foi pro LLM (pra debug/UX). */
  corpusChars: number;
}

export interface SuggestionResult {
  services: SuggestedService[];
  stats: SuggestionStats;
  /** Erros bloqueantes (sem candidatos / Firecrawl down / etc.) — UI mostra. */
  blockingError: string | null;
  /** Avisos não-bloqueantes (algumas URLs falharam etc.). */
  warnings: string[];
}

// ============================================================
// PROMPT — instrução pro Gemini
// ============================================================

const SYSTEM_PROMPT = `Você é um analista de proteção de dados (LGPD) ajudando uma instituição pública a IDENTIFICAR quais serviços oferecidos ao cidadão devem entrar no Inventário de Dados Pessoais.

CONTEXTO: Você recebe markdown extraído de páginas públicas (Carta de Serviços, Ouvidoria, SIC, RH, etc.). Cada página descreve um ou mais SERVIÇOS oferecidos pela instituição.

SUA TAREFA: extrair a lista de serviços e, pra cada um, classificar se ele TRATA DADOS PESSOAIS:

- "SUGERIDO": o texto MENCIONA explicitamente coleta de dados que identificam pessoa natural (CPF, RG, nome, e-mail, telefone, endereço, biometria, currículo, dados financeiros, dados de saúde, etc.)
- "TALVEZ": serviço claramente destinado a pessoas (cidadão/servidor/estudante) MAS o texto não detalha quais dados são coletados. Pode envolver dado pessoal mínimo (nome+contato) ou pode coletar mais.
- "NAO": serviço anônimo (consulta pública sem cadastro, download de norma, leitura de diário oficial, acompanhamento de processo público).

REGRAS RÍGIDAS:
1. NÃO invente serviços. Cada item da lista deve corresponder a um serviço LITERAL no texto.
2. NÃO repita o mesmo serviço (mesmo se aparecer em várias páginas — mantenha o melhor sourceUrl).
3. NÃO classifique como SUGERIDO se a única coleta é "dados anônimos" ou "estatísticos".
4. Em "classificationReason": cite uma evidência concreta do texto em até 240 caracteres.
5. Em "prefill": SÓ preencha campos que estão EXPLÍCITOS no texto. Omita campos sem evidência.
6. NUNCA preencha volume de titulares, sistemas internos, medidas técnicas de segurança, retenção arquivística específica.

CAMPOS DE PREFILL aceitos:
- process_name (string): nome curto e claro do serviço.
- process_purpose (string): 2-4 frases literais sobre a finalidade. Cite leis se mencionadas (ex: "Lei 13.460/2017").
- data_subjects (array): quem é o público-alvo. Use APENAS valores nesse vocabulário fechado: ["Cidadãos", "Servidores públicos", "Estudantes", "Fornecedores", "Empresas privadas", "Outros".
- legalBasis (string): base legal mencionada (LAI, LGPD, Lei XXX/AAAA). Não invente.
- share_targets (array): use APENAS desse vocabulário: ["Sim, entre os departamentos da empresa", "Sim, entre empresas do Grupo", "Sim, com terceiros ou parceiros de negócio", "Instituições governamentais", "Não são compartilhados"].
- share_with_whom (string): nome de departamentos/órgãos/empresas mencionados no texto (texto livre).

FORMATO DE RESPOSTA: JSON estrito com a estrutura:
{
  "services": [
    {
      "name": "...",
      "description": "...",
      "classification": "SUGERIDO" | "TALVEZ" | "NAO",
      "classificationReason": "...",
      "sourceUrl": "...",
      "category": "SIC" | "Ouvidoria" | "RH" | "Atendimento" | "Licitação" | "Patrimônio" | "Outros" | null,
      "prefill": { ... }
    }
  ]
}

Use APENAS os IDs/valores listados acima. Não invente IDs novos. Não retorne markdown nem comentários — APENAS o JSON.`;

// ============================================================
// JSON REPAIR (igual ao inventario-ai-prefill.ts)
// ============================================================

function repairTruncatedJson(text: string): string {
  let s = text.trim();
  if (!s) return s;
  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        escapeNext = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" && stack[stack.length - 1] === "{") stack.pop();
    else if (c === "]" && stack[stack.length - 1] === "[") stack.pop();
  }
  if (inString) s += '"';
  s = s.replace(/,\s*$/, "");
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  return s;
}

function parseLlmJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch (firstErr) {
    try {
      return JSON.parse(repairTruncatedJson(text));
    } catch {
      throw firstErr;
    }
  }
}

// ============================================================
// SANITIZER — filtra/normaliza o output do LLM
// ============================================================

const ALLOWED_DATA_SUBJECTS = new Set([
  "Cidadãos",
  "Servidores públicos",
  "Estudantes",
  "Fornecedores",
  "Empresas privadas",
  "Outros",
]);

const ALLOWED_SHARE_TARGETS = new Set([
  "Sim, entre os departamentos da empresa",
  "Sim, entre empresas do Grupo",
  "Sim, com terceiros ou parceiros de negócio",
  "Instituições governamentais",
  "Não são compartilhados",
]);

const ALLOWED_CLASSIFICATION = new Set<ServiceClassification>([
  "SUGERIDO",
  "TALVEZ",
  "NAO",
]);

/**
 * Hash estável de uma string (djb2-like). Suficiente pra ID local da UI.
 */
function stableHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function sanitizeService(raw: any): SuggestedService | null {
  if (!raw || typeof raw !== "object") return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  if (!name || name.length < 4) return null;
  if (!description) return null;

  const classification = ALLOWED_CLASSIFICATION.has(raw.classification)
    ? (raw.classification as ServiceClassification)
    : "TALVEZ";
  const reason =
    typeof raw.classificationReason === "string"
      ? raw.classificationReason.trim().slice(0, 280)
      : "";
  const sourceUrl =
    typeof raw.sourceUrl === "string" && /^https?:\/\//.test(raw.sourceUrl)
      ? raw.sourceUrl
      : "";
  const category =
    typeof raw.category === "string" && raw.category.trim()
      ? raw.category.trim().slice(0, 40)
      : null;

  const prefillRaw = (raw.prefill ?? {}) as Record<string, unknown>;
  const prefill: ServicePrefill = {};
  if (typeof prefillRaw.process_name === "string" && prefillRaw.process_name.trim()) {
    prefill.process_name = prefillRaw.process_name.trim().slice(0, 200);
  }
  if (
    typeof prefillRaw.process_purpose === "string" &&
    prefillRaw.process_purpose.trim()
  ) {
    prefill.process_purpose = prefillRaw.process_purpose.trim().slice(0, 1200);
  }
  if (Array.isArray(prefillRaw.data_subjects)) {
    const filtered = (prefillRaw.data_subjects as unknown[])
      .filter((v): v is string => typeof v === "string")
      .filter((v) => ALLOWED_DATA_SUBJECTS.has(v));
    if (filtered.length > 0) prefill.data_subjects = Array.from(new Set(filtered));
  }
  if (typeof prefillRaw.legalBasis === "string" && prefillRaw.legalBasis.trim()) {
    prefill.legalBasis = prefillRaw.legalBasis.trim().slice(0, 240);
  }
  if (Array.isArray(prefillRaw.share_targets)) {
    const filtered = (prefillRaw.share_targets as unknown[])
      .filter((v): v is string => typeof v === "string")
      .filter((v) => ALLOWED_SHARE_TARGETS.has(v));
    if (filtered.length > 0) prefill.share_targets = Array.from(new Set(filtered));
  }
  if (
    typeof prefillRaw.share_with_whom === "string" &&
    prefillRaw.share_with_whom.trim()
  ) {
    prefill.share_with_whom = prefillRaw.share_with_whom.trim().slice(0, 600);
  }

  return {
    id: stableHash(`${name}|${sourceUrl}`),
    name: name.slice(0, 200),
    description: description.slice(0, 800),
    classification,
    classificationReason: reason,
    sourceUrl,
    category,
    prefill,
  };
}

// ============================================================
// PIPELINE
// ============================================================

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY não definida");
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * Função pública (variante PDF): recebe TEXTO já extraído e classifica.
 *
 * O caller (endpoint /from-pdf) já chamou `extractPdfText`.
 * `sourceLabel` é usado em prefill provenance e no `sourceUrl` de cada
 * serviço (ex: "pdf:Carta_Sisouv_2025.pdf"). Não é uma URL real — é só
 * um identificador da fonte pra a UI mostrar.
 */
export async function suggestServicesFromText(
  text: string,
  sourceLabel: string,
): Promise<SuggestionResult> {
  const warnings: string[] = [];

  if (!text || text.trim().length < 200) {
    return {
      services: [],
      stats: emptyStats(0),
      blockingError:
        "O conteúdo está muito curto ou vazio. Se for um PDF escaneado (imagem), preciso de uma versão com texto pesquisável.",
      warnings,
    };
  }

  const corpus =
    text.length > MAX_CORPUS_CHARS
      ? text.slice(0, MAX_CORPUS_CHARS) +
        "\n[...truncado por limite de contexto...]"
      : text;
  if (text.length > MAX_CORPUS_CHARS) {
    warnings.push(
      `Texto truncado em ${MAX_CORPUS_CHARS.toLocaleString()} caracteres (resto ignorado).`,
    );
  }

  const wrappedCorpus = `--- FONTE: ${sourceLabel} ---\n\n${corpus}`;
  return await callLlmAndSanitize(wrappedCorpus, sourceLabel, warnings);
}

// ============================================================
// COLETA (Etapa 1 do fluxo 2-cliques)
// ============================================================

/** Resultado da Etapa 1: corpus de texto pronto pra mandar pro LLM
 *  na Etapa 2. */
export interface CollectionResult {
  /** Texto concatenado de todas as fontes lidas. */
  corpus: string;
  /** Identificador da fonte ("URL fornecida" ou "pdf:filename.pdf"). */
  sourceLabel: string;
  /** Quantas fontes leu (páginas web ou páginas do PDF). */
  pagesRead: number;
  /** URLs efetivamente lidas (vazio quando vem de PDF). */
  urlsRead: string[];
  /** Total de páginas do PDF (vazio quando vem de URL). */
  pdfTotalPages?: number;
  /** Tamanho do corpus em chars (UX). */
  charCount: number;
  /** Erro bloqueante (sem corpus → não dá pra ir pra Etapa 2). */
  blockingError: string | null;
  /** Avisos não-bloqueantes (URLs que falharam etc.). */
  warnings: string[];
}

/**
 * Etapa 1 (URL): mapSite + scrape paralelo + concat markdown.
 * NÃO chama o LLM. Retorna corpus pra UI mostrar ao user antes
 * de proceder pra Etapa 2 (classificação).
 *
 * Tempo médio em prod: ~15-30s (cabe folgada em maxDuration:60s).
 */
export async function collectFromUrl(url: string): Promise<CollectionResult> {
  const warnings: string[] = [];

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return {
      corpus: "",
      sourceLabel: url,
      pagesRead: 0,
      urlsRead: [],
      charCount: 0,
      blockingError: "URL inválida.",
      warnings,
    };
  }

  const pathPrefix = urlObj.pathname.replace(/\/+$/, "") + "/";
  const isRootPath = pathPrefix === "/";

  const candidatePaths = new Set<string>([
    urlObj.pathname.replace(/\/+$/, "") || "/",
  ]);
  const candidates: string[] = [url];

  if (!isRootPath) {
    const mapResult = await mapSite(urlObj.host, {
      limit: 500,
      timeoutMs: 10_000,
    });
    if (mapResult.error) {
      warnings.push(
        `Não consegui mapear sub-páginas (${mapResult.error}). Lendo apenas a URL fornecida.`,
      );
    } else {
      for (const u of mapResult.urls) {
        try {
          const cu = new URL(u);
          if (cu.host !== urlObj.host) continue;
          if (!cu.pathname.startsWith(pathPrefix)) continue;
          const key = cu.pathname.replace(/\/+$/, "") || "/";
          if (candidatePaths.has(key)) continue;
          candidatePaths.add(key);
          candidates.push(u);
          if (candidates.length >= MAX_SCRAPE_PAGES) break;
        } catch {
          // ignora
        }
      }
    }
  }

  const scrapes = await scrapeMany(candidates, { timeoutMs: 18_000 });
  const ok = scrapes.filter(
    (s) => !s.error && s.markdown && s.markdown.trim().length > 100,
  );
  const failed = scrapes.filter((s) => s.error);
  if (failed.length > 0) {
    warnings.push(
      `${failed.length} de ${scrapes.length} URL${scrapes.length === 1 ? "" : "s"} falharam (resultados parciais).`,
    );
  }

  if (ok.length === 0) {
    return {
      corpus: "",
      sourceLabel: url,
      pagesRead: 0,
      urlsRead: [],
      charCount: 0,
      blockingError:
        "Não consegui ler nenhuma página. Confirme se a URL está pública e acessível, ou tente fazer upload do PDF da Carta.",
      warnings,
    };
  }

  let corpus = ok
    .map(
      (s) =>
        `--- URL: ${s.url}${s.title ? `\nTÍTULO: ${s.title}` : ""}\n\n${s.markdown}`,
    )
    .join("\n\n---\n\n");
  if (corpus.length > MAX_CORPUS_CHARS) {
    corpus =
      corpus.slice(0, MAX_CORPUS_CHARS) +
      "\n[...truncado por limite de contexto...]";
    warnings.push(
      `Conteúdo truncado em ${MAX_CORPUS_CHARS.toLocaleString()} caracteres.`,
    );
  }

  if (ok.length > 1) {
    warnings.unshift(
      `Li ${ok.length} página${ok.length === 1 ? "" : "s"} a partir de ${url}.`,
    );
  }

  return {
    corpus,
    sourceLabel: url,
    pagesRead: ok.length,
    urlsRead: ok.map((s) => s.url),
    charCount: corpus.length,
    blockingError: null,
    warnings,
  };
}

/**
 * Etapa 1 (PDF): extrai texto + concat. Caller passa texto já
 * extraído (via `lib/pdf-text.ts:extractPdfText`) — esta função só
 * envelopa no formato CollectionResult.
 */
export function buildCollectionFromPdf(
  text: string,
  filename: string,
  pdfPagesRead: number,
  pdfTotalPages: number,
): CollectionResult {
  const warnings: string[] = [];
  if (!text || text.trim().length < 200) {
    return {
      corpus: "",
      sourceLabel: `pdf:${filename}`,
      pagesRead: 0,
      urlsRead: [],
      pdfTotalPages,
      charCount: 0,
      blockingError:
        "O conteúdo está muito curto ou vazio. Se for um PDF escaneado (imagem), preciso de uma versão com texto pesquisável.",
      warnings,
    };
  }
  let corpus =
    text.length > MAX_CORPUS_CHARS
      ? text.slice(0, MAX_CORPUS_CHARS) +
        "\n[...truncado por limite de contexto...]"
      : text;
  if (text.length > MAX_CORPUS_CHARS) {
    warnings.push(
      `Conteúdo truncado em ${MAX_CORPUS_CHARS.toLocaleString()} caracteres.`,
    );
  }
  const sourceLabel = `pdf:${filename}`;
  corpus = `--- FONTE: ${sourceLabel} ---\n\n${corpus}`;
  return {
    corpus,
    sourceLabel,
    pagesRead: pdfPagesRead,
    urlsRead: [],
    pdfTotalPages,
    charCount: corpus.length,
    blockingError: null,
    warnings,
  };
}

/**
 * Etapa 2: pega o corpus já coletado e roda o LLM pra classificar.
 *
 * Tempo médio: ~10-20s (cabe folgada em maxDuration:60s).
 */
export async function classifyCorpus(
  corpus: string,
  sourceLabel: string,
): Promise<SuggestionResult> {
  return await callLlmAndSanitize(corpus, sourceLabel, []);
}

// ============================================================
// 1-SHOT (legado — usado pelas rotas antigas, mantém retrocompat)
// ============================================================

/**
 * Função pública (variante URL): recebe a URL da Carta de Serviços e
 * RAPA TAMBÉM as sub-páginas filhas (mesmo path prefix), pra cobrir
 * Cartas que se desdobram em links/dropdowns.
 *
 * Pipeline:
 *  1. mapSite no host → URLs do domínio
 *  2. Filtra URLs cujo path começa com o path da URL fornecida
 *     (ex: URL=tcees.tc.br/carta-de-servicos/ → match /carta-de-servicos/*)
 *  3. Scrape paralelo (URL fornecida + até 7 filhas) com timeout curto
 *  4. Concat markdown → LLM
 *
 * Se mapSite falhar (Firecrawl down, domínio inválido), faz fallback
 * pra single-scrape da URL fornecida — não bloqueia o user.
 */
export async function suggestServicesFromUrl(
  url: string,
): Promise<SuggestionResult> {
  const warnings: string[] = [];

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return {
      services: [],
      stats: emptyStats(0),
      blockingError: "URL inválida.",
      warnings,
    };
  }

  // Path prefix pra matchar filhas. Normaliza com trailing slash:
  //   /carta-de-servicos    → /carta-de-servicos/
  //   /carta-de-servicos/   → /carta-de-servicos/
  //   /                     → / (não filtra nada — fica só na URL fornecida)
  const pathPrefix = urlObj.pathname.replace(/\/+$/, "") + "/";
  const isRootPath = pathPrefix === "/";

  // 1. Lista de URLs candidatas — sempre inclui a URL fornecida
  const candidatePaths = new Set<string>([
    urlObj.pathname.replace(/\/+$/, "") || "/",
  ]);
  const candidates: string[] = [url];

  // 2. mapSite (só se a URL não for raiz — pra raiz seria sem foco)
  if (!isRootPath) {
    const mapResult = await mapSite(urlObj.host, {
      limit: 500,
      timeoutMs: 10_000,
    });
    if (mapResult.error) {
      warnings.push(
        `Não consegui mapear sub-páginas (${mapResult.error}). Lendo apenas a URL fornecida.`,
      );
    } else {
      for (const u of mapResult.urls) {
        try {
          const cu = new URL(u);
          if (cu.host !== urlObj.host) continue;
          if (!cu.pathname.startsWith(pathPrefix)) continue;
          const key = cu.pathname.replace(/\/+$/, "") || "/";
          if (candidatePaths.has(key)) continue;
          candidatePaths.add(key);
          candidates.push(u);
          if (candidates.length >= MAX_SCRAPE_PAGES) break;
        } catch {
          // url inválida — ignora
        }
      }
    }
  }

  // 3. Scrape paralelo (timeout 18s por URL — em paralelo o total
  // continua ~18s, deixando margem pro LLM dentro de maxDuration 60s
  // do Vercel Hobby. Cold start consome 5-10s extras em prod.)
  const scrapes = await scrapeMany(candidates, { timeoutMs: 18_000 });
  const ok = scrapes.filter((s) => !s.error && s.markdown && s.markdown.trim().length > 100);
  const failed = scrapes.filter((s) => s.error);
  if (failed.length > 0) {
    warnings.push(
      `${failed.length} de ${scrapes.length} URL${scrapes.length === 1 ? "" : "s"} falharam (resultados parciais).`,
    );
  }

  if (ok.length === 0) {
    return {
      services: [],
      stats: emptyStats(0),
      blockingError:
        "Não consegui ler nenhuma página. Confirme se a URL está pública e acessível, ou tente fazer upload do PDF da Carta.",
      warnings,
    };
  }

  // 4. Concat markdown
  let corpus = ok
    .map(
      (s) =>
        `--- URL: ${s.url}${s.title ? `\nTÍTULO: ${s.title}` : ""}\n\n${s.markdown}`,
    )
    .join("\n\n---\n\n");
  if (corpus.length > MAX_CORPUS_CHARS) {
    corpus =
      corpus.slice(0, MAX_CORPUS_CHARS) +
      "\n[...truncado por limite de contexto...]";
    warnings.push(
      `Conteúdo truncado em ${MAX_CORPUS_CHARS.toLocaleString()} caracteres.`,
    );
  }

  // Aviso útil pra UI: quantas páginas foram lidas vs candidatas
  if (ok.length > 1) {
    warnings.unshift(
      `Li ${ok.length} página${ok.length === 1 ? "" : "s"} a partir de ${url} (URL fornecida + sub-páginas filhas).`,
    );
  }

  return await callLlmAndSanitize(corpus, url, warnings);
}

/**
 * Helper interno: roda Gemini + sanitiza + monta SuggestionResult.
 *
 * Compartilhado entre:
 *  - `suggestServicesFromUrl(url)` (variante URL — scrape Firecrawl)
 *  - `suggestServicesFromText(text, label)` (variante PDF upload)
 */
async function callLlmAndSanitize(
  corpus: string,
  sourceLabel: string,
  initialWarnings: string[],
): Promise<SuggestionResult> {
  const warnings = [...initialWarnings];
  const ai = getClient();
  const fullPrompt = `${SYSTEM_PROMPT}\n\n--- CONTEÚDO ---\n\n${corpus}\n\n---\n\nRetorne APENAS o JSON.`;

  let llmJson: any = null;
  try {
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 0.1,
        // 16k tokens cobrem ~80 serviços em JSON estruturado — folga
        // confortável pra Cartas grandes (ministérios, tribunais).
        // Voltado pra 16k após upgrade Pro (maxDuration:300s permite
        // resposta mais longa do Gemini sem estourar).
        maxOutputTokens: 16_000,
        responseMimeType: "application/json",
        // Pra extração estruturada — desliga thinking pra liberar todo o
        // budget pra resposta. Lição em feedback_gemini_thinking_budget.md.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const text = resp.text ?? "";
    llmJson = parseLlmJson(text);
  } catch (e: any) {
    return {
      services: [],
      stats: emptyStats(corpus.length),
      blockingError: `Erro do LLM: ${e?.message ?? "desconhecido"}`,
      warnings,
    };
  }

  const rawServices: any[] = Array.isArray(llmJson?.services)
    ? llmJson.services
    : [];
  const seen = new Set<string>();
  const services: SuggestedService[] = [];
  for (const raw of rawServices) {
    const s = sanitizeService(raw);
    if (!s) continue;
    // PDF / sem URL no LLM: usa o sourceLabel como fonte da UI.
    // - sourceLabel = URL http://... → vira sourceUrl (link clicável)
    // - sourceLabel = "Carta.pdf"   → vira "pdf:Carta.pdf" (sem link)
    if (!s.sourceUrl) {
      (s as any).sourceUrl = sourceLabel.startsWith("http")
        ? sourceLabel
        : `pdf:${sourceLabel}`;
    }
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    services.push(s);
  }

  const bySuggested = services.filter((s) => s.classification === "SUGERIDO").length;
  const byMaybe = services.filter((s) => s.classification === "TALVEZ").length;
  const byNo = services.filter((s) => s.classification === "NAO").length;

  return {
    services,
    stats: {
      totalServicesExtracted: services.length,
      bySuggested,
      byMaybe,
      byNo,
      corpusChars: corpus.length,
    },
    blockingError: null,
    warnings,
  };
}

function emptyStats(corpusChars: number): SuggestionStats {
  return {
    totalServicesExtracted: 0,
    bySuggested: 0,
    byMaybe: 0,
    byNo: 0,
    corpusChars,
  };
}

// ============================================================
// HELPERS PRA CALLER
// ============================================================

/**
 * Marca quais serviços já estão mapeados no Inventário (match por
 * nome — case-insensitive, ignora pontuação e espaços extras).
 *
 * Retorna o array original com `alreadyMapped` populado quando bate.
 */
export function annotateAlreadyMapped(
  services: SuggestedService[],
  existingNames: Array<{ id: string; name: string; updatedAt: string }>,
): Array<SuggestedService & { alreadyMapped?: { inventoryId: string; mappedAt: string } }> {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // remove acentos
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const byNorm = new Map<string, { id: string; updatedAt: string }>();
  for (const inv of existingNames) {
    if (!inv.name) continue;
    byNorm.set(norm(inv.name), { id: inv.id, updatedAt: inv.updatedAt });
  }

  return services.map((s) => {
    const hit = byNorm.get(norm(s.name));
    if (hit) {
      return {
        ...s,
        alreadyMapped: { inventoryId: hit.id, mappedAt: hit.updatedAt },
      };
    }
    return s;
  });
}

/**
 * Converte um SuggestedService.prefill em FormAnswers parcial pronto
 * pra inserção em DataInventory.formAnswers (com provenance "firecrawl:suggest").
 */
export function prefillToFormAnswers(
  service: SuggestedService,
): { formAnswers: Record<string, any>; provenance: Record<string, string> } {
  const tag = `firecrawl:suggest:${service.sourceUrl}`;
  const sec2: Record<string, string | string[]> = {};
  const sec4: Record<string, string | string[]> = {};
  const sec5: Record<string, string | string[]> = {};
  const sec6: Record<string, string | string[]> = {};
  const provenance: Record<string, string> = {};

  if (service.prefill.process_name) {
    sec2.process_name = service.prefill.process_name;
    provenance["sec2.process_name"] = tag;
  }
  if (service.prefill.process_purpose) {
    sec2.process_purpose = service.prefill.process_purpose;
    provenance["sec2.process_purpose"] = tag;
  }
  if (service.prefill.legalBasis) {
    sec4.legalBasis = service.prefill.legalBasis;
    provenance["sec4.legalBasis"] = tag;
  }
  if (service.prefill.data_subjects && service.prefill.data_subjects.length > 0) {
    sec5.data_subjects = service.prefill.data_subjects;
    provenance["sec5.data_subjects"] = tag;
  }
  if (service.prefill.share_targets && service.prefill.share_targets.length > 0) {
    sec6.share_targets = service.prefill.share_targets;
    provenance["sec6.share_targets"] = tag;
  }
  if (service.prefill.share_with_whom) {
    sec6.share_with_whom = service.prefill.share_with_whom;
    provenance["sec6.share_with_whom"] = tag;
  }

  const formAnswers: Record<string, any> = {};
  if (Object.keys(sec2).length > 0) formAnswers.sec2 = sec2;
  if (Object.keys(sec4).length > 0) formAnswers.sec4 = sec4;
  if (Object.keys(sec5).length > 0) formAnswers.sec5 = sec5;
  if (Object.keys(sec6).length > 0) formAnswers.sec6 = sec6;

  return { formAnswers, provenance };
}
