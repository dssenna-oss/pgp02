-- ============================================================
-- Migração: Análise de Riscos (Checkpoint 5)
-- ============================================================
-- Cria a tabela `process_risks` que armazena 1 linha por risco
-- identificado em cada processo aprovado do inventário (DataInventory).
--
-- Estrutura espelha as colunas BR-CD do Excel modelo:
--   1 ProcessRisk = 1 "x" marcado pelo DPO numa dessas colunas.
--
-- Campos `severityLevel`, `mitigationPlan`, `legalBasisRef` ficam null
-- no Checkpoint 5; serão usados no Checkpoint 6 (Detalhamento).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

CREATE TABLE IF NOT EXISTS "process_risks" (
  "id"               TEXT PRIMARY KEY,
  "companyId"        TEXT NOT NULL,
  "dataInventoryId"  TEXT NOT NULL,
  "riskCode"         TEXT NOT NULL,
  "status"           TEXT NOT NULL DEFAULT 'IDENTIFICADO',
  "description"      TEXT,
  "autoSuggested"    BOOLEAN NOT NULL DEFAULT false,
  "severityLevel"    TEXT,
  "mitigationPlan"   TEXT,
  "legalBasisRef"    TEXT,
  "identifiedById"   TEXT,
  "identifiedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedById"     TEXT,
  "reviewedAt"       TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FKs (idempotentes via DO block — Postgres não tem ADD CONSTRAINT IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'process_risks_companyId_fkey') THEN
    ALTER TABLE "process_risks"
      ADD CONSTRAINT "process_risks_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'process_risks_dataInventoryId_fkey') THEN
    ALTER TABLE "process_risks"
      ADD CONSTRAINT "process_risks_dataInventoryId_fkey"
      FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'process_risks_identifiedById_fkey') THEN
    ALTER TABLE "process_risks"
      ADD CONSTRAINT "process_risks_identifiedById_fkey"
      FOREIGN KEY ("identifiedById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'process_risks_reviewedById_fkey') THEN
    ALTER TABLE "process_risks"
      ADD CONSTRAINT "process_risks_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS "process_risks_dataInventoryId_riskCode_key"
  ON "process_risks"("dataInventoryId", "riskCode");

CREATE INDEX IF NOT EXISTS "process_risks_companyId_status_idx"
  ON "process_risks"("companyId", "status");

CREATE INDEX IF NOT EXISTS "process_risks_dataInventoryId_idx"
  ON "process_risks"("dataInventoryId");
