/**
 * Embeddings via Google Gemini.
 *
 * Modelo: text-embedding-004 (768 dimensões, gratuito).
 * Limite free tier: 1.500 RPM, suficiente pra indexar nossos documentos
 * com batches pequenos.
 */
import { GoogleGenAI } from "@google/genai";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY não definida");
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * Gera o embedding de um único texto.
 *
 * `taskType` ajuda o modelo a otimizar o vetor pra cada uso:
 *   - RETRIEVAL_DOCUMENT — usado ao indexar um chunk de documento
 *   - RETRIEVAL_QUERY    — usado na busca (consulta do usuário)
 *   - SEMANTIC_SIMILARITY, CLASSIFICATION, CLUSTERING — outros casos
 */
export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  const ai = getClient();
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Embedding vazio retornado pelo Gemini");
  }
  return values;
}

/**
 * Embedding em batch — útil pra indexação em lote.
 */
export async function embedBatch(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const ai = getClient();
  const result = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
  });
  const out: number[][] = [];
  for (const e of result.embeddings ?? []) {
    if (e.values) out.push(e.values);
  }
  if (out.length !== texts.length) {
    throw new Error(`Embeddings retornados (${out.length}) != textos enviados (${texts.length})`);
  }
  return out;
}

/**
 * Converte um array JS de floats no literal SQL aceito pelo pgvector:
 *   [0.1, 0.2, 0.3] → "[0.1,0.2,0.3]"
 */
export function toVectorLiteral(vec: number[]): string {
  return "[" + vec.join(",") + "]";
}
