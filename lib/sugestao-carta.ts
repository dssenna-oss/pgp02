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
import { mapSite, scrapeMany, type FirecrawlScrapeResult } from "./firecrawl";
import { classifyUrl } from "./url-keywords";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** Limite defensivo: scrape no máx N URLs (custo Firecrawl). */
const MAX_SCRAPE = 8;

/** Limite defensivo: corpus enviado ao LLM. */
const MAX_CORPUS_CHARS = 60_000;

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
  totalUrlsMapped: number;
  totalUrlsCandidate: number;
  totalUrlsScraped: number;
  totalServicesExtracted: number;
  bySuggested: number;
  byMaybe: number;
  byNo: number;
  scrapeErrors: number;
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
 * Filtra URLs do site mapeado pra apenas aquelas relevantes pra Carta
 * de Serviços. Categorias incluídas: carta_servicos (alvo principal),
 * ouvidoria, sic, edital, rh — todas boas fontes de serviços ao cidadão.
 *
 * Limite MAX_SCRAPE preserva budget (Firecrawl cobra por URL scrapeada).
 */
function pickCandidateUrls(allUrls: string[]): string[] {
  const RELEVANT_CATS = new Set([
    "carta_servicos",
    "ouvidoria",
    "sic",
    "edital",
    "rh",
  ]);

  // Pontuação simples: mais palavras-chave casadas = mais relevante
  const scored = allUrls
    .map((url) => {
      const cats = classifyUrl(url);
      const score = cats.filter((c) => RELEVANT_CATS.has(c)).length;
      return { url, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Dedup por path (alguns sites repetem com query strings)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { url } of scored) {
    try {
      const u = new URL(url);
      const key = u.host + u.pathname;
      if (seen.has(key)) continue;
      seen.add(key);
    } catch {
      // url inválida — usa string inteira
      if (seen.has(url)) continue;
      seen.add(url);
    }
    out.push(url);
    if (out.length >= MAX_SCRAPE) break;
  }
  return out;
}

/**
 * Função pública (variante PDF): recebe TEXTO já extraído e classifica.
 *
 * Pula totalmente Firecrawl/mapSite — o user fez upload do PDF da Carta
 * de Serviços e o caller (endpoint) já chamou `extractPdfText`.
 *
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

  // Mesmo prompt da rota domain, mas com cabeçalho de fonte explícita
  const wrappedCorpus = `--- FONTE: ${sourceLabel} ---\n\n${corpus}`;
  return await callLlmAndSanitize(wrappedCorpus, sourceLabel, warnings);
}

/**
 * Função pública: descobre + extrai + classifica.
 */
export async function suggestServicesFromCarta(
  domain: string,
): Promise<SuggestionResult> {
  const warnings: string[] = [];

  // 1. mapSite
  const mapResult = await mapSite(domain, { limit: 500, timeoutMs: 35_000 });
  if (mapResult.error) {
    return {
      services: [],
      stats: emptyStats(0),
      blockingError: `Não consegui mapear o site: ${mapResult.error}`,
      warnings,
    };
  }

  const totalMapped = mapResult.urls.length;
  if (totalMapped === 0) {
    return {
      services: [],
      stats: emptyStats(0),
      blockingError: "O site não retornou URLs. Confirme o domínio.",
      warnings,
    };
  }

  // 2. Filtra candidatos
  const candidates = pickCandidateUrls(mapResult.urls);
  if (candidates.length === 0) {
    return {
      services: [],
      stats: { ...emptyStats(0), totalUrlsMapped: totalMapped },
      blockingError:
        "Não encontrei páginas que pareçam Carta de Serviços / Ouvidoria / SIC neste domínio. Verifique se a Carta está publicada e tente outro endereço.",
      warnings,
    };
  }

  // 3. Scrape paralelo
  const scrapes: FirecrawlScrapeResult[] = await scrapeMany(candidates, {
    timeoutMs: 35_000,
  });
  const okScrapes = scrapes.filter((s) => !s.error && s.markdown);
  const failedScrapes = scrapes.filter((s) => s.error);
  if (failedScrapes.length > 0) {
    warnings.push(
      `${failedScrapes.length} URL${failedScrapes.length === 1 ? "" : "s"} falharam no scrape (resultados parciais).`,
    );
  }

  if (okScrapes.length === 0) {
    return {
      services: [],
      stats: {
        totalUrlsMapped: totalMapped,
        totalUrlsCandidate: candidates.length,
        totalUrlsScraped: 0,
        totalServicesExtracted: 0,
        bySuggested: 0,
        byMaybe: 0,
        byNo: 0,
        scrapeErrors: failedScrapes.length,
      },
      blockingError:
        "Não consegui ler nenhuma página candidata. Pode ser bloqueio do site ou timeout.",
      warnings,
    };
  }

  // 4. Concat markdown
  let corpus = okScrapes
    .map(
      (s) =>
        `--- URL: ${s.url}${s.title ? `\nTÍTULO: ${s.title}` : ""}\n\n${s.markdown}`,
    )
    .join("\n\n---\n\n");
  if (corpus.length > MAX_CORPUS_CHARS) {
    corpus = corpus.slice(0, MAX_CORPUS_CHARS) + "\n[...truncado por limite de contexto...]";
  }

  // 5+6. Delega LLM + sanitize pro helper compartilhado
  const llmResult = await callLlmAndSanitize(corpus, domain, warnings);

  // Mistura stats da pipeline (mapSite + scrape) com stats do LLM
  return {
    ...llmResult,
    stats: {
      ...llmResult.stats,
      totalUrlsMapped: totalMapped,
      totalUrlsCandidate: candidates.length,
      totalUrlsScraped: okScrapes.length,
      scrapeErrors: failedScrapes.length,
    },
  };
}

/**
 * Helper interno: roda Gemini + sanitiza + monta SuggestionResult.
 *
 * Compartilhado entre:
 *  - `suggestServicesFromCarta(domain)` (pipeline Firecrawl)
 *  - `suggestServicesFromText(text, label)` (PDF upload)
 *
 * Retorna stats com campos URL zerados — o caller que veio do
 * pipeline Firecrawl preenche depois.
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
      stats: emptyStats(0),
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
    // PDF: o LLM frequentemente não tem URL pra colocar — usa label
    // ("pdf:Carta.pdf") como sourceUrl pra UI exibir.
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
      totalUrlsMapped: 0,
      totalUrlsCandidate: 0,
      totalUrlsScraped: 0,
      totalServicesExtracted: services.length,
      bySuggested,
      byMaybe,
      byNo,
      scrapeErrors: 0,
    },
    blockingError: null,
    warnings,
  };
}

function emptyStats(totalMapped: number): SuggestionStats {
  return {
    totalUrlsMapped: totalMapped,
    totalUrlsCandidate: 0,
    totalUrlsScraped: 0,
    totalServicesExtracted: 0,
    bySuggested: 0,
    byMaybe: 0,
    byNo: 0,
    scrapeErrors: 0,
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
