/**
 * Extração genérica de texto puro de PDFs.
 *
 * Usa `pdfjs-dist` (Mozilla) — `pdf-parse` tem bug crítico com PDFs
 * brasileiros que misturam encoding (HANDOVER #3 das armadilhas).
 *
 * Retorna texto concatenado de até `maxPages` páginas. Sanitiza null
 * bytes (Postgres rejeita) e colapsa espaços.
 *
 * Limitação conhecida: PDFs ESCANEADOS (sem camada de texto) retornam
 * vazio. O caller deve verificar `text.trim().length > 0` antes de
 * mandar pra LLM e responder com erro amigável caso contrário.
 */

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface PdfTextResult {
  text: string;
  totalPages: number;
  pagesRead: number;
  /** True se o PDF não tinha camada de texto extraível (provavelmente
   *  imagem escaneada). Caller decide se faz OCR ou rejeita. */
  noText: boolean;
}

/**
 * Extrai texto plano de um PDF.
 *
 * @param buffer Buffer ou Uint8Array do arquivo.
 * @param opts.maxPages Default 50. Cartas de Serviços costumam ter
 *   muitas páginas (uma por serviço); 50 cobre bem a maioria.
 */
export async function extractPdfText(
  buffer: Buffer | Uint8Array,
  opts: { maxPages?: number } = {},
): Promise<PdfTextResult> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  const totalPages = doc.numPages;
  const maxPages = Math.min(totalPages, opts.maxPages ?? 50);

  const pages: string[] = [];
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    if (pageText.trim()) {
      // Marcador de página ajuda LLM a entender boundaries
      pages.push(`--- Página ${i} ---\n${pageText}`);
    }
  }

  const raw = pages.join("\n\n");
  const text = raw
    .replace(/\x00/g, "") // null bytes (Postgres rejeita)
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    text,
    totalPages,
    pagesRead: maxPages,
    noText: text.length === 0,
  };
}
