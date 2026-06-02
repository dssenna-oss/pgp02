-- =============================================================================
-- Ordem manual das Notícias/Artigos/Material (2026-06-02). Rodar no Neon.
-- Aditivo. A inicialização só toca linhas ainda em 0 (não desfaz ordem manual
-- já definida se rodar de novo).
-- =============================================================================

ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 0;

-- Numera as publicações existentes mantendo a ordem atual (mais recentes primeiro).
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "publicadoEm" DESC NULLS LAST, "updatedAt" DESC) AS rn
  FROM "articles"
)
UPDATE "articles" a
SET "ordem" = ranked.rn
FROM ranked
WHERE a.id = ranked.id AND a."ordem" = 0;
