/**
 * Camada de abstração do LLM.
 *
 * Hoje usa Google Gemini via @google/genai. Trocar de provedor é uma
 * questão de implementar `streamChat` em outro arquivo e apontar para
 * ele aqui — toda a app usa apenas `streamChat`.
 *
 * Variáveis de ambiente:
 *   GOOGLE_API_KEY        — obrigatório
 *   GEMINI_MODEL          — default "gemini-2.5-flash"
 */
import { GoogleGenAI } from "@google/genai";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type StreamChatOptions = {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
  temperature?: number;
  maxOutputTokens?: number;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_API_KEY não definida. Crie uma chave em https://aistudio.google.com/apikey"
      );
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/**
 * Converte histórico estilo OpenAI ({role: "system"|"user"|"assistant"})
 * para o formato do Gemini ({role: "user"|"model", parts: [{text}]}).
 * Mensagens "system" são mescladas no systemInstruction (não vão como turn).
 */
function toGeminiContents(history: ChatMessage[], userMessage: string) {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const msg of history) {
    if (msg.role === "system") continue; // tratado separadamente
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Adiciona a pergunta atual
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  return contents;
}

/**
 * Streama uma resposta do LLM, emitindo apenas os chunks de texto.
 * O caller é responsável por formatá-los em SSE pro browser.
 */
export async function* streamChat(opts: StreamChatOptions): AsyncGenerator<string> {
  const { systemPrompt, history, userMessage, temperature = 0.7, maxOutputTokens = 1500 } = opts;

  const ai = getClient();
  const contents = toGeminiContents(history, userMessage);

  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/**
 * Versão não-streaming. Retorna o texto completo de uma só vez.
 * Útil pra resumo, classificação, embeddings simples etc.
 */
export async function generateText(opts: StreamChatOptions): Promise<string> {
  let full = "";
  for await (const chunk of streamChat(opts)) {
    full += chunk;
  }
  return full;
}
