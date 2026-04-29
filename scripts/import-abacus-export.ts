/**
 * Importa conteúdos didáticos, e-books de fase e documentos de fase
 * a partir de um JSON exportado do Abacus.
 *
 * Uso:
 *   npx tsx --require dotenv/config scripts/import-abacus-export.ts <caminho-do-json>
 *
 * Exemplo:
 *   npx tsx --require dotenv/config scripts/import-abacus-export.ts "C:/Users/User/Downloads/pgp_export_data.json"
 *
 * Estratégia de paths:
 *   No export, paths como "3850/phase-documents/123-foo.pdf" referenciam
 *   o bucket S3 do Abacus (prefixo 3850). Aqui convertemos para
 *   "/phase-documents/123-foo.pdf" — servidos diretamente pelo Next.js
 *   a partir de public/phase-documents/.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ExportData {
  content_categories: Array<{
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    order: number;
  }>;
  content_items: Array<{
    categoryName: string;
    title: string;
    description?: string | null;
    type: string;
    order: number;
    fileName?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    cloud_storage_path?: string | null;
    embedUrl?: string | null;
  }>;
  phase_ebooks: Array<{
    phase: string;
    title: string;
    embedUrl: string;
    order: number;
  }>;
  phase_documents: Array<{
    phase: string;
    title: string;
    description?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    cloud_storage_path?: string | null;
    videoUrl?: string | null;
    isVideoUrl?: boolean;
  }>;
}

/** Converte path S3 do Abacus em URL relativa servida pelo Next.js. */
function localizeStoragePath(p: string | null | undefined): string | null {
  if (!p) return null;
  // "3850/phase-documents/foo.pdf" → "/phase-documents/foo.pdf"
  // "phase-documents/foo.pdf" → "/phase-documents/foo.pdf"
  if (p.startsWith("/")) return p;
  const idx = p.indexOf("phase-documents/");
  if (idx === -1) return p;
  return "/" + p.substring(idx);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("❌ Uso: npx tsx scripts/import-abacus-export.ts <caminho-do-json>");
    process.exit(1);
  }

  const absPath = path.resolve(arg);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ Arquivo não encontrado: ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");
  const data: ExportData = JSON.parse(raw);

  console.log(`📥 Lendo ${absPath}`);
  console.log(
    `   ${data.content_categories?.length ?? 0} categorias, ${data.content_items?.length ?? 0} itens, ${data.phase_ebooks?.length ?? 0} e-books de fase, ${data.phase_documents?.length ?? 0} documentos de fase`
  );

  // Resolve a empresa do admin (mesma usada pelo seed)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("❌ SEED_ADMIN_EMAIL não definido no .env");
    process.exit(1);
  }
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { company: true },
  });
  if (!adminUser?.companyId) {
    console.error(`❌ Admin ${adminEmail} não tem empresa associada.`);
    process.exit(1);
  }
  const companyId = adminUser.companyId;
  console.log(`✅ Empresa do admin: ${companyId}\n`);

  // ---------- 1) Categorias de conteúdos didáticos ----------
  console.log("📚 content_categories");
  const categoryIdByName = new Map<string, string>();
  for (const cat of data.content_categories ?? []) {
    const existing = await prisma.contentCategory.findFirst({ where: { name: cat.name } });
    const localizedImageUrl = localizeStoragePath(cat.imageUrl);

    if (existing) {
      const updated = await prisma.contentCategory.update({
        where: { id: existing.id },
        data: {
          description: cat.description ?? null,
          imageUrl: localizedImageUrl,
          order: cat.order ?? 0,
        },
      });
      categoryIdByName.set(cat.name, updated.id);
      console.log(`   ↻ atualizada: ${cat.name}`);
    } else {
      const created = await prisma.contentCategory.create({
        data: {
          name: cat.name,
          description: cat.description ?? null,
          imageUrl: localizedImageUrl,
          order: cat.order ?? 0,
        },
      });
      categoryIdByName.set(cat.name, created.id);
      console.log(`   + criada:    ${cat.name}`);
    }
  }

  // ---------- 2) Itens de conteúdos didáticos ----------
  console.log("\n📖 content_items");
  for (const item of data.content_items ?? []) {
    const categoryId = categoryIdByName.get(item.categoryName);
    if (!categoryId) {
      console.warn(`   ⚠️  pulou (categoria não achada: ${item.categoryName}): ${item.title}`);
      continue;
    }
    const existing = await prisma.contentItem.findFirst({
      where: { categoryId, title: item.title },
    });
    const payload = {
      categoryId,
      title: item.title,
      description: item.description ?? null,
      type: item.type,
      order: item.order ?? 0,
      fileName: item.fileName ?? null,
      fileSize: item.fileSize ?? null,
      mimeType: item.mimeType ?? null,
      cloud_storage_path: localizeStoragePath(item.cloud_storage_path),
      embedUrl: item.embedUrl ?? null,
    };
    if (existing) {
      await prisma.contentItem.update({ where: { id: existing.id }, data: payload });
      console.log(`   ↻ ${item.title}`);
    } else {
      await prisma.contentItem.create({ data: payload });
      console.log(`   + ${item.title}`);
    }
  }

  // ---------- 3) E-books de fase ----------
  console.log("\n📕 phase_ebooks");
  for (const ebook of data.phase_ebooks ?? []) {
    const existing = await prisma.phaseEbook.findFirst({
      where: { companyId, phase: ebook.phase, title: ebook.title },
    });
    const payload = {
      companyId,
      phase: ebook.phase,
      title: ebook.title,
      embedUrl: ebook.embedUrl,
      order: ebook.order ?? 0,
    };
    if (existing) {
      await prisma.phaseEbook.update({ where: { id: existing.id }, data: payload });
      console.log(`   ↻ [${ebook.phase}] ${ebook.title}`);
    } else {
      await prisma.phaseEbook.create({ data: payload });
      console.log(`   + [${ebook.phase}] ${ebook.title}`);
    }
  }

  // ---------- 4) Documentos de fase ----------
  console.log("\n📁 phase_documents");
  for (const doc of data.phase_documents ?? []) {
    const existing = await prisma.phaseDocument.findFirst({
      where: { phase: doc.phase, title: doc.title },
    });
    const payload = {
      companyId,
      phase: doc.phase,
      title: doc.title,
      description: doc.description ?? null,
      fileName: doc.fileName ?? null,
      fileType: doc.fileType ?? null,
      fileSize: doc.fileSize ?? null,
      mimeType: doc.mimeType ?? null,
      cloud_storage_path: localizeStoragePath(doc.cloud_storage_path),
      videoUrl: doc.videoUrl ?? null,
      isVideoUrl: doc.isVideoUrl ?? false,
    };
    if (existing) {
      await prisma.phaseDocument.update({ where: { id: existing.id }, data: payload });
      console.log(`   ↻ [${doc.phase}] ${doc.title}`);
    } else {
      await prisma.phaseDocument.create({ data: payload });
      console.log(`   + [${doc.phase}] ${doc.title}`);
    }
  }

  console.log("\n🎉 Import finalizado!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
