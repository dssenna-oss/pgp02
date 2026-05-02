/**
 * Apaga chunks de sources com cobertura parcial (gaps no chunkIndex).
 * Roda em transação — ou tudo ou nada.
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/clean-partial-sources.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const partials = await prisma.$queryRaw<
    Array<{ source: string; total: bigint; max_idx: number; min_idx: number }>
  >`
    SELECT source,
           COUNT(*)::bigint AS total,
           MAX("chunkIndex") AS max_idx,
           MIN("chunkIndex") AS min_idx
    FROM document_chunks
    GROUP BY source
    HAVING COUNT(*) <> MAX("chunkIndex") + 1 OR MIN("chunkIndex") <> 0
  `;

  console.log(`Encontrados ${partials.length} sources parciais.`);
  if (partials.length === 0) {
    await prisma.$disconnect();
    return;
  }

  const sources = partials.map((p) => p.source);
  let totalDeleted = 0;
  for (const s of sources) {
    const r = await prisma.documentChunk.deleteMany({ where: { source: s } });
    totalDeleted += r.count;
    console.log(`  -${r.count}  ${s}`);
  }
  console.log(`\n🗑️  ${totalDeleted} chunks deletados.`);
  await prisma.$disconnect();
})();
