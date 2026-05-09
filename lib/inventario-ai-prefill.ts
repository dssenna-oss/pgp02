/**
 * Engine de pré-preenchimento do Inventário a partir de URLs públicas
 * (Fatia "b" — 2026-05-11).
 *
 * Pipeline:
 *   1. Recebe N URLs do user (carta de serviços, página do serviço,
 *      ato normativo).
 *   2. Faz scrape com Firecrawl pra cada uma → markdown.
 *   3. Concatena os markdowns + manda pro Gemini com o schema do
 *      formulário como contrato (system prompt).
 *   4. Recebe JSON estruturado (`Partial<FormAnswers>`).
 *   5. Valida o JSON contra o schema (campos válidos, opções existentes
 *      em multi/single-choice).
 *   6. Marca a origem de cada campo como "firecrawl:<url>" ou
 *      "ai:gemini" pra UI exibir badge "🤖 IA".
 *
 * Decisões:
 *   - LLM é instruído a SÓ retornar o que está LITERAL/PRÓXIMO no texto.
 *     Sem inferência criativa em campos de armazenamento, segurança
 *     técnica, volume etc. (que são internos da instituição).
 *   - Quando opção do schema não bate exatamente, LLM pode escolher a
 *     mais próxima OU deixar em branco (preferência: deixar em branco).
 *   - Resposta vem como JSON estrito (`responseMimeType: application/json`).
 *
 * Limitações honestas:
 *   - Carta de Serviços típica cobre ~30-40% dos campos. Resto fica em
 *     branco e o user preenche manualmente.
 *   - Se o site bloqueia ou retorna pouca info, devolve `applied: 0` +
 *     o erro do Firecrawl pra UI exibir.
 */

import { GoogleGenAI } from "@google/genai";
import { scrapeMany, type FirecrawlScrapeResult } from "./firecrawl";
import {
  INVENTARIO_FORM_SCHEMA,
  type FormAnswers,
  type FormField,
  type FormSection,
} from "./inventario-form-schema";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ============================================================
// PROMPT — instruções detalhadas pro LLM
// ============================================================

/**
 * Constrói um descritor compacto do schema do form pra mandar pro LLM.
 * Resumimos pra economizar tokens — só os fields que dá pra extrair de
 * texto público (excluímos sec1 que é sobre o respondente, e campos
 * tipicamente internos como `store_location` ou `process_volume`).
 *
 * Cada field vira: id, label curto, type, options (se choice).
 */
function buildSchemaDigest(): string {
  // Campos que NÃO faz sentido o LLM tentar preencher de URL pública.
  const SKIP_FIELDS = new Set<string>([
    // Sec1 — vem da sessão
    "respondent_name",
    "respondent_role",
    "respondent_email",
    "respondent_department",
    // Campos internos (instituição-específicos) que firecrawl não cobre
    "process_volume",
    "use_unnecessary_access",
    "store_location",
    "store_paper_external_desc",
    "store_mobile_measures",
    "store_extra_retention_reason",
    "store_local_backup",
  ]);

  const lines: string[] = [];
  for (const step of INVENTARIO_FORM_SCHEMA) {
    if (step.kind !== "section") continue;
    const sec = step as FormSection;
    if (sec.id === "sec1") continue; // pula respondente
    lines.push(`\n## Seção ${sec.id} — ${sec.title}`);
    for (const f of sec.fields) {
      if (SKIP_FIELDS.has(f.id)) continue;
      const head = `- ${sec.id}.${f.id} (${f.type}): ${f.label.replace(/\s+/g, " ").slice(0, 140)}`;
      lines.push(head);
      if (f.options && f.options.length > 0) {
        lines.push(
          `  opções: ${f.options.map((o) => `"${o}"`).join(" | ")}`,
        );
      }
    }
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é um analista de proteção de dados (LGPD) ajudando a preencher um Inventário de Dados Pessoais a partir de páginas públicas (carta de serviços, página do serviço, ato normativo).

OBJETIVO: extrair campos do formulário de Inventário a partir do conteúdo das URLs fornecidas.

REGRAS RÍGIDAS:
1. Só preencha um campo se a informação estiver LITERAL ou MUITO PRÓXIMA no texto. Não invente.
2. Se a informação NÃO está no texto, OMITA o campo (não retorne o id).
3. Para campos do tipo single-choice ou multi-choice, escolha apenas valores que estão EXATAMENTE nas opções listadas. Se nenhuma opção bate, OMITA o campo.
4. Para multi-choice, retorne array de strings; para single-choice e text, retorne string.
5. Para campos de texto livre (text-short, text-long), seja CONCISO e use APENAS informação do texto fornecido. Cite normas que aparecem (ex: "Lei 13.460/2017") quando relevante.
6. Para o campo \`process_name\`, sintetize um nome curto e claro do serviço/processo.
7. Para o campo \`process_purpose\`, descreva a finalidade em 2-4 frases LITERAIS do que o texto diz.
8. Não invente CPFs, nomes de pessoas, sistemas internos, fornecedores, prazos de retenção arquivística que não estejam citados.
9. NUNCA preencha campos sobre VOLUME, LOCAL DE ARMAZENAMENTO, MEDIDAS DE SEGURANÇA TÉCNICAS ou BACKUP — esses são internos da instituição e não constam de texto público.

FORMATO DE RESPOSTA: JSON válido com a estrutura:
{
  "sec2": { "process_name": "...", "process_purpose": "..." },
  "sec3": { "data_official_ids": ["CPF"], ... },
  ...
}

Use apenas os IDs do schema abaixo. Não invente IDs novos.

ESQUEMA DO FORMULÁRIO:
`;

// ============================================================
// VALIDAÇÃO — filtra o que o LLM retornou contra o schema
// ============================================================

interface SchemaIndex {
  sections: Map<string, FormSection>;
  fields: Map<string, FormField>; // key: "secId.fieldId"
}

function buildSchemaIndex(): SchemaIndex {
  const sections = new Map<string, FormSection>();
  const fields = new Map<string, FormField>();
  for (const step of INVENTARIO_FORM_SCHEMA) {
    if (step.kind !== "section") continue;
    const sec = step as FormSection;
    sections.set(sec.id, sec);
    for (const f of sec.fields) {
      fields.set(`${sec.id}.${f.id}`, f);
    }
  }
  return { sections, fields };
}

/**
 * Limpa o JSON do LLM contra o schema:
 *   - descarta IDs que não existem
 *   - descarta valores fora das `options` em single/multi-choice
 *   - normaliza single-choice (string) e multi-choice (array)
 *
 * Retorna o subset válido + a lista de chaves descartadas (debug).
 */
function sanitizeLlmResult(
  raw: any,
  index: SchemaIndex,
): { clean: Partial<FormAnswers>; rejected: string[] } {
  const clean: Partial<FormAnswers> = {};
  const rejected: string[] = [];

  if (!raw || typeof raw !== "object") return { clean, rejected };

  for (const [secKey, secVal] of Object.entries(raw)) {
    if (!index.sections.has(secKey)) {
      rejected.push(secKey);
      continue;
    }
    if (!secVal || typeof secVal !== "object") {
      rejected.push(secKey);
      continue;
    }
    const target: Record<string, string | string[]> = {};
    for (const [fId, fVal] of Object.entries(secVal as object)) {
      const fKey = `${secKey}.${fId}`;
      const field = index.fields.get(fKey);
      if (!field) {
        rejected.push(fKey);
        continue;
      }

      if (field.type === "multi-choice") {
        const arr = Array.isArray(fVal) ? fVal : [fVal];
        const allowed = new Set(field.options ?? []);
        const filtered = arr
          .map((v) => (typeof v === "string" ? v : ""))
          .filter((v) => v && (allowed.size === 0 || allowed.has(v)));
        if (filtered.length === 0) {
          rejected.push(fKey);
          continue;
        }
        target[fId] = filtered;
      } else if (field.type === "single-choice") {
        if (typeof fVal !== "string" || !fVal) {
          rejected.push(fKey);
          continue;
        }
        const allowed = new Set(field.options ?? []);
        if (allowed.size > 0 && !allowed.has(fVal)) {
          rejected.push(fKey);
          continue;
        }
        target[fId] = fVal;
      } else {
        // text-short, text-long
        if (typeof fVal !== "string" || !fVal.trim()) {
          rejected.push(fKey);
          continue;
        }
        target[fId] = fVal.trim();
      }
    }
    if (Object.keys(target).length > 0) {
      (clean as any)[secKey] = target;
    }
  }
  return { clean, rejected };
}

// ============================================================
// MERGE — mistura o resultado do LLM em um FormAnswers existente
// ============================================================

export interface AiPrefillSummary {
  /** URLs scrapeadas com sucesso. */
  urlsOk: string[];
  /** URLs que falharam — incluem o motivo. */
  urlsErr: { url: string; error: string }[];
  /** Caminhos `sec.fieldId` aplicados (vazios → preenchidos). */
  applied: string[];
  /** Campos que o LLM retornou mas foram descartados pelo sanitizer. */
  rejected: string[];
  /** Texto curto pra log/UX explicando o resultado. */
  summary: string;
}

export interface AiPrefillResult {
  next: FormAnswers;
  summary: AiPrefillSummary;
}

/**
 * Aplica o resultado do LLM em `current`. Estratégia idêntica a
 * `applyTemplate` (não sobrescreve campos preenchidos), mas marca origem
 * como "firecrawl:<url-canônica>" pra a UI exibir badge "🤖 IA".
 */
function mergePrefill(
  current: FormAnswers,
  prefill: Partial<FormAnswers>,
  urlsOk: string[],
): { next: FormAnswers; applied: string[] } {
  const next: FormAnswers = JSON.parse(JSON.stringify(current ?? {}));
  const applied: string[] = [];
  const provenanceTag = `firecrawl:${urlsOk[0] ?? "unknown"}${urlsOk.length > 1 ? ` (+${urlsOk.length - 1})` : ""}`;

  for (const [secKey, fields] of Object.entries(prefill)) {
    if (!fields || typeof fields !== "object") continue;
    const target = ((next as any)[secKey] ??= {}) as Record<
      string,
      string | string[]
    >;
    for (const [fId, val] of Object.entries(fields as object)) {
      const existing = target[fId];
      const empty =
        existing == null ||
        (typeof existing === "string" && !existing.trim()) ||
        (Array.isArray(existing) && existing.length === 0);
      if (empty) {
        target[fId] = val as string | string[];
        applied.push(`${secKey}.${fId}`);
      }
    }
  }

  const meta = (next._meta ??= {}) as any;
  meta.provenance ??= {};
  meta.aiPrefilledAt = new Date().toISOString();
  meta.aiPrefillUrls = urlsOk;
  for (const path of applied) {
    meta.provenance[path] = provenanceTag;
  }

  return { next, applied };
}

// ============================================================
// PIPELINE — função pública usada pelo endpoint
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
 * Busca conteúdo das URLs e roda o LLM pra extrair campos do Inventário.
 * Junta no `current` sem sobrescrever entradas humanas.
 */
export async function aiPrefillFromUrls(
  current: FormAnswers,
  urls: string[],
): Promise<AiPrefillResult> {
  // 1. Scrape paralelo
  const scrapes: FirecrawlScrapeResult[] = await scrapeMany(urls, {
    timeoutMs: 35_000,
  });
  const urlsOk = scrapes.filter((s) => !s.error).map((s) => s.url);
  const urlsErr = scrapes
    .filter((s) => s.error)
    .map((s) => ({ url: s.url, error: s.error! }));

  if (urlsOk.length === 0) {
    return {
      next: current,
      summary: {
        urlsOk: [],
        urlsErr,
        applied: [],
        rejected: [],
        summary:
          "Não consegui acessar nenhuma das URLs. Verifique se estão públicas e tente de novo.",
      },
    };
  }

  // 2. Concatena markdown com cabeçalho de origem
  const corpus = scrapes
    .filter((s) => !s.error && s.markdown)
    .map(
      (s) =>
        `--- URL: ${s.url}${s.title ? `\nTÍTULO: ${s.title}` : ""}\n\n${s.markdown}`,
    )
    .join("\n\n");

  // Truncamento defensivo — Gemini Flash aguenta bem mas pra economizar
  // tokens limitamos a ~50K chars (~12K tokens).
  const corpusTrimmed =
    corpus.length > 50_000 ? corpus.slice(0, 50_000) + "\n[...truncado...]" : corpus;

  // 3. Chama LLM com responseMimeType=JSON
  const ai = getClient();
  const fullPrompt = `${SYSTEM_PROMPT}${buildSchemaDigest()}\n\n--- CONTEÚDO DAS URLs ---\n\n${corpusTrimmed}\n\n---\n\nRetorne APENAS o JSON estrito, sem markdown nem comentários.`;

  let llmJson: any = null;
  try {
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        temperature: 0.1, // baixa criatividade — só extração
        maxOutputTokens: 4_000,
        responseMimeType: "application/json",
      },
    });
    const text = resp.text ?? "";
    llmJson = JSON.parse(text);
  } catch (e: any) {
    return {
      next: current,
      summary: {
        urlsOk,
        urlsErr,
        applied: [],
        rejected: [],
        summary: `Erro do LLM: ${e?.message ?? "desconhecido"}`,
      },
    };
  }

  // 4. Sanitiza
  const index = buildSchemaIndex();
  const { clean, rejected } = sanitizeLlmResult(llmJson, index);

  // 5. Merge no `current`
  const { next, applied } = mergePrefill(current, clean, urlsOk);

  // 6. Resumo legível
  let summary = `Pré-preenchi ${applied.length} campo${applied.length === 1 ? "" : "s"} a partir de ${urlsOk.length} URL${urlsOk.length === 1 ? "" : "s"}.`;
  if (urlsErr.length > 0) {
    summary += ` ${urlsErr.length} URL${urlsErr.length === 1 ? "" : "s"} falharam.`;
  }
  if (applied.length === 0 && urlsOk.length > 0) {
    summary +=
      " O conteúdo das páginas não tinha informações que se encaixam no formulário, ou todos os campos relevantes já estavam preenchidos.";
  }

  return {
    next,
    summary: { urlsOk, urlsErr, applied, rejected, summary },
  };
}
