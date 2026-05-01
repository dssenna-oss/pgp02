import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const total = await prisma.documentChunk.count();
  const withEmbedding = await prisma.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*) AS c FROM document_chunks WHERE embedding IS NOT NULL`;
  const byPhase = await prisma.documentChunk.groupBy({
    by: ["phase"],
    _count: { _all: true },
    orderBy: { phase: "asc" },
  });
  const sources = await prisma.documentChunk.findMany({
    select: { source: true },
    distinct: ["source"],
  });

  console.log(`Total chunks:      ${total}`);
  console.log(`Com embedding:     ${withEmbedding[0].c}`);
  console.log(`Documentos únicos: ${sources.length}`);
  console.log(`\nPor fase:`);
  for (const row of byPhase) {
    console.log(`   ${row.phase ?? "(global)"}: ${row._count._all}`);
  }
  await prisma.$disconnect();
})();
