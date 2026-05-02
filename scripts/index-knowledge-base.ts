/**
 * Indexa os arquivos em public/phase-documents/ na tabela document_chunks
 * (com embeddings vetoriais via Gemini), pra alimentar o RAG do chatbot.
 *
 * Uso:
 *   npx tsx --require dotenv/config scripts/index-knowledge-base.ts
 *
 * Pré-requisitos:
 *   - DATABASE_URL apontando pra um Postgres com pgvector (Neon)
 *   - GOOGLE_API_KEY no env
 *   - Tabela document_chunks já criada (`prisma db push`)
 *
 * Estratégia:
 *   1. Lista os arquivos da pasta public/phase-documents/
 *   2. Para cada um, descobre o `phase` consultando phase_documents
 *      (ou content_categories pras imagens) — caso não ache, indexa
 *      como global (phase=null)
 *   3. Extrai texto (pdf-parse / mammoth / xlsx)
 *   4. Quebra em chunks de ~1500 caracteres com 200 de sobreposição
 *   5. Gera embedding por chunk, salva via SQL bruto
 *
 * IDEMPOTENTE — pula arquivos que já têm chunks indexados.
 * Pra reindexar um arquivo do zero: deletar manualmente seus chunks
 * (DELETE FROM document_chunks WHERE source = '/phase-documents/...')
 * e rodar de novo.
 */
import fs from "fs";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";
import { embedText, EMBEDDING_DIMENSIONS, toVectorLiteral } from "../lib/embeddings";

// SDKs de extração
// pdfjs-dist: extrator oficial Mozilla — robusto em Node ESM,
// substituiu pdf-parse (que tinha bug de side-effect no entry point).
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    out += pageText + "\n";
  }
  return out;
}

const PUBLIC_DIR = path.resolve(process.cwd(), "public/phase-documents");
const CHUNK_SIZE = 1500; // caracteres
const CHUNK_OVERLAP = 200;
const MAX_CHARS_PER_FILE = 200_000; // proteção: ignora textos absurdamente grandes (~50 páginas)

const prisma = new PrismaClient();

interface ResolvedDoc {
  filename: string;
  source: string; // "/phase-documents/..." (local) ou URL completa (Blob)
  title: string;
  phase: string | null;
  blobUrl?: string; // se presente, baixar via fetch ao invés de ler do disco
}

async function listFiles(): Promise<string[]> {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ Pasta não encontrada: ${PUBLIC_DIR}`);
    process.exit(1);
  }
  return fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => /\.(pdf|docx|doc|xlsx|xls|txt)$/i.test(f));
}

/**
 * Mapeia cada arquivo da pasta pro registro correspondente em
 * phase_documents (que tem o phase + título legível).
 */
async function resolveDocs(filenames: string[]): Promise<ResolvedDoc[]> {
  const phaseDocs = await prisma.phaseDocument.findMany({
    select: { phase: true, title: true, cloud_storage_path: true, fileName: true },
  });

  const out: ResolvedDoc[] = [];
  for (const filename of filenames) {
    const source = `/phase-documents/${filename}`;
    const match = phaseDocs.find(
      (d) =>
        d.cloud_storage_path === source ||
        d.cloud_storage_path?.endsWith(`/${filename}`) ||
        d.fileName === filename
    );
    out.push({
      filename,
      source,
      title: match?.title ?? filename,
      phase: match?.phase ?? null,
    });
  }
  return out;
}

async function extractText(buf: Buffer, ext: string): Promise<string> {
  const e = ext.toLowerCase();

  if (e === ".pdf") {
    return await extractPdfText(buf);
  }

  if (e === ".docx") {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value || "";
  }

  if (e === ".xlsx" || e === ".xls") {
    const wb = XLSX.read(buf, { type: "buffer" });
    let allText = "";
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allText += `\n[Planilha: ${sheetName}]\n${csv}\n`;
    }
    return allText;
  }

  if (e === ".txt") {
    return buf.toString("utf-8");
  }

  // .doc legado: extração com mammoth não funciona; pula
  return "";
}

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  // Limpa whitespace excessivo
  const cleaned = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length === 0) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + size, cleaned.length);
    let chunk = cleaned.slice(i, end);

    // Tenta quebrar em fim de parágrafo/sentença pra não cortar palavras
    if (end < cleaned.length) {
      const lastBreak = Math.max(
        chunk.lastIndexOf("\n\n"),
        chunk.lastIndexOf(". "),
        chunk.lastIndexOf("? "),
        chunk.lastIndexOf("! ")
      );
      if (lastBreak > size * 0.5) {
        chunk = chunk.slice(0, lastBreak + 1);
      }
    }

    chunks.push(chunk.trim());
    i += chunk.length - overlap;
    if (chunk.length <= overlap) break; // segurança contra loop infinito
  }
  return chunks.filter((c) => c.length > 50); // descarta chunks muito curtos
}

async function indexDoc(doc: ResolvedDoc) {
  // Idempotência real: se já existem chunks pra esse source, pula.
  // (Re-executar só processa arquivos faltantes, sem queimar quota
  // de embeddings re-embedando o que já foi indexado.)
  const existing = await prisma.documentChunk.count({ where: { source: doc.source } });
  if (existing > 0) {
    console.log(`   ✅ ${doc.filename}: já indexado (${existing} chunks), pulando`);
    return { chunks: 0, skipped: true, alreadyIndexed: true };
  }

  const ext = path.extname(doc.filename);

  let buf: Buffer;
  try {
    if (doc.blobUrl) {
      const r = await fetch(doc.blobUrl);
      if (!r.ok) {
        console.warn(`   ⚠️  fetch ${doc.filename} status ${r.status}`);
        return { chunks: 0, skipped: true };
      }
      buf = Buffer.from(await r.arrayBuffer());
    } else {
      const filepath = path.join(PUBLIC_DIR, doc.filename);
      buf = fs.readFileSync(filepath);
    }
  } catch (e: any) {
    console.warn(`   ⚠️  falha lendo ${doc.filename}: ${e.message}`);
    return { chunks: 0, skipped: true };
  }

  let text = "";
  try {
    text = await extractText(buf, ext);
  } catch (e: any) {
    console.warn(`   ⚠️  falha extraindo ${doc.filename}: ${e.message}`);
    return { chunks: 0, skipped: true };
  }

  // Sanitiza null bytes (0x00) — Postgres rejeita em colunas TEXT/UTF8.
  // PDFs/DOCX às vezes injetam isso ao extrair.
  text = text.replace(/\x00/g, "");

  if (!text || text.length < 100) {
    console.log(`   ⏭️  ${doc.filename}: pouco texto extraído (${text.length} chars), pulando`);
    return { chunks: 0, skipped: true };
  }

  if (text.length > MAX_CHARS_PER_FILE) {
    console.log(`   ✂️  ${doc.filename}: truncando ${text.length} → ${MAX_CHARS_PER_FILE} chars`);
    text = text.substring(0, MAX_CHARS_PER_FILE);
  }

  const chunks = chunkText(text);
  console.log(`   📄 ${doc.filename}: ${text.length} chars, ${chunks.length} chunks`);

  // (Não há chunks antigos pra apagar — checamos acima.)

  // Insere cada chunk com embedding
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const vec = await embedText(chunk, "RETRIEVAL_DOCUMENT");
      // Insert via raw SQL para usar o cast vector
      await prisma.$executeRaw`
        INSERT INTO document_chunks (id, source, "sourceTitle", phase, "chunkIndex", text, embedding, "createdAt")
        VALUES (
          ${`c${Date.now()}${i}${Math.random().toString(36).slice(2, 8)}`},
          ${doc.source},
          ${doc.title},
          ${doc.phase},
          ${i},
          ${chunk},
          ${toVectorLiteral(vec)}::vector,
          NOW()
        )
      `;
    } catch (e: any) {
      console.warn(`   ⚠️  chunk ${i} falhou: ${e.message}`);
    }
  }

  return { chunks: chunks.length, skipped: false };
}

/**
 * Lista phase_documents cujo cloud_storage_path é uma URL HTTPS
 * (uploads novos via Vercel Blob não ficam na pasta local).
 * O `source` desses chunks é a URL completa, distinta de
 * "/phase-documents/..." dos arquivos locais.
 */
async function listBlobDocs(localSources: Set<string>): Promise<ResolvedDoc[]> {
  const rows = await prisma.phaseDocument.findMany({
    where: { cloud_storage_path: { startsWith: "http" } },
    select: { phase: true, title: true, cloud_storage_path: true, fileName: true },
  });
  const out: ResolvedDoc[] = [];
  for (const d of rows) {
    if (!d.cloud_storage_path) continue;
    if (localSources.has(d.cloud_storage_path)) continue; // já tratado como local
    const filenameFromPath = decodeURIComponent(d.cloud_storage_path.split("/").pop() ?? "");
    out.push({
      filename: d.fileName ?? filenameFromPath,
      source: d.cloud_storage_path,
      title: d.title,
      phase: d.phase,
      blobUrl: d.cloud_storage_path,
    });
  }
  return out;
}

async function main() {
  console.log(`📂 Pasta: ${PUBLIC_DIR}`);
  const filenames = await listFiles();
  console.log(`   ${filenames.length} arquivos locais elegíveis`);

  const localDocs = await resolveDocs(filenames);
  const localSources = new Set(localDocs.map((d) => d.source));
  const blobDocs = await listBlobDocs(localSources);
  console.log(`   ${blobDocs.length} docs no Vercel Blob\n`);

  const docs = [...localDocs, ...blobDocs];

  let totalChunks = 0;
  let totalDocs = 0;
  let totalSkipped = 0;

  for (const doc of docs) {
    console.log(`\n→ [${doc.phase ?? "global"}] ${doc.title}`);
    const r = await indexDoc(doc);
    if (r.skipped) totalSkipped++;
    else totalDocs++;
    totalChunks += r.chunks;
  }

  console.log(`\n\n🎉 Indexação completa:`);
  console.log(`   ${totalDocs} documentos indexados`);
  console.log(`   ${totalSkipped} pulados`);
  console.log(`   ${totalChunks} chunks no total`);
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
