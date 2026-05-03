-- Checkpoint 4 — Bases Legais (DPO/jurídico complementa após o mapeamento)
-- Adiciona 4 campos novos em data_inventories pras colunas J/K/L/M do Excel modelo.

BEGIN;

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "previsaoLegal" TEXT,
  ADD COLUMN IF NOT EXISTS "legalBasisSensitive" TEXT,
  ADD COLUMN IF NOT EXISTS "legalBasisComments" TEXT,
  ADD COLUMN IF NOT EXISTS "legalReviewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "legalReviewedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_legalReviewedById_fkey'
  ) THEN
    ALTER TABLE data_inventories
      ADD CONSTRAINT "data_inventories_legalReviewedById_fkey"
      FOREIGN KEY ("legalReviewedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

\echo '=== Resultado ==='
SELECT 'previsaoLegal exists' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='previsaoLegal'
) AS ok;

SELECT 'legalBasisSensitive exists', EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='legalBasisSensitive'
);

SELECT 'legalBasisComments exists', EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='legalBasisComments'
);

SELECT 'legalReviewedById FK exists', EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_legalReviewedById_fkey'
);
