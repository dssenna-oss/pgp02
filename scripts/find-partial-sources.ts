/**
 * Diagnóstico: lista sources que provavelmente perderam chunks
 * por causa do incidente de indexação (delete sem re-insert).
 *
 * Heurística: se um source tem chunks com chunkIndex não-contíguos
 * a partir de 0, ou se o maior chunkIndex + 1 != count, é provável
 * que tenham sumido chunks no meio.
 *
 * Uso:
 *   DATABASE_URL="..." npx tsx scripts/find-partial-sources.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.$queryRaw<
    Array<{
      source: string;
      sourceTitle: string | null;
      phase: string | null;
      total: bigint;
      max_idx: number;
      min_idx: number;
    }>
  >`
    SELECT source,
           "sourceTitle",
           phase,
           COUNT(*)::bigint AS total,
           MAX("chunkIndex") AS max_idx,
           MIN("chunkIndex") AS min_idx
    FROM document_chunks
    GROUP BY source, "sourceTitle", phase
    ORDER BY phase NULLS FIRST, source
  `;

  const partial: typeof rows = [];
  const ok: typeof rows = [];
  for (const r of rows) {
    const expected = r.max_idx + 1;
    if (Number(r.total) !== expected || r.min_idx !== 0) {
      partial.push(r);
    } else {
      ok.push(r);
    }
  }

  console.log(`\n📊 ${rows.length} sources únicos no índice`);
  console.log(`   ✅ ${ok.length} contíguos (chunks 0..N completos)`);
  console.log(`   ⚠️  ${partial.length} parciais (gap nos chunkIndex)`);

  if (partial.length === 0) {
    console.log("\nNenhum source parcial detectado.");
  } else {
    console.log(`\nParciais (provavelmente afetados pelo incidente):\n`);
    for (const r of partial) {
      console.log(
        `  [${r.phase ?? "global"}] count=${r.total} min=${r.min_idx} max=${r.max_idx}  ${r.source}`
      );
    }
  }

  // Também lista sources de phase_documents que NÃO estão em document_chunks
  const allPhaseDocs = await prisma.phaseDocument.findMany({
    select: { phase: true, title: true, cloud_storage_path: true, fileName: true },
  });
  const indexedSources = new Set(rows.map((r) => r.source));
  const missing: typeof allPhaseDocs = [];
  for (const d of allPhaseDocs) {
    const candidate1 = d.cloud_storage_path;
    const candidate2 = `/phase-documents/${d.fileName ?? ""}`;
    if (
      (candidate1 && indexedSources.has(candidate1)) ||
      (d.fileName && indexedSources.has(candidate2))
    ) {
      continue;
    }
    missing.push(d);
  }
  console.log(
    `\n📂 ${missing.length} documentos de phase_documents sem nenhum chunk no índice:`
  );
  for (const d of missing.slice(0, 50)) {
    console.log(`   [${d.phase ?? "?"}] ${d.title} (${d.fileName ?? d.cloud_storage_path})`);
  }
  if (missing.length > 50) console.log(`   ... e mais ${missing.length - 50}`);

  await prisma.$disconnect();
})();
