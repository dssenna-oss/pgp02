-- ============================================================
-- Migração: Plano de Ação institucional (Etapa 10 / Checkpoint 11)
-- ============================================================
-- DROP da tabela legacy `action_plans` (placeholder Abacus com schema
-- diferente) e recria com schema novo, voltado pro Plano de Ação real
-- da org com refs polimórficos pra GAP/Risco/Inventário.
--
-- ATENÇÃO: drop é destrutivo. As 2 linhas-seed do Abacus (Pedro Santos
-- e Ana Costa, demos) são descartadas — sem valor de produção.
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- Drop o schema antigo se existir
DROP TABLE IF EXISTS "action_plans" CASCADE;

CREATE TABLE "action_plans" (
  "id"             TEXT PRIMARY KEY,
  "companyId"      TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "notes"          TEXT,
  "origin"         TEXT NOT NULL DEFAULT 'MANUAL',
  "refGapCode"     TEXT,
  "refRiskId"      TEXT,
  "refInventoryId" TEXT,
  "assigneeId"     TEXT,
  "dueDate"        TIMESTAMP(3),
  "priority"       TEXT NOT NULL DEFAULT 'MEDIA',
  "status"         TEXT NOT NULL DEFAULT 'A_FAZER',
  "completedAt"    TIMESTAMP(3),
  "createdById"    TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "action_plans_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "action_plans_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "action_plans_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "action_plans_companyId_status_idx"
  ON "action_plans"("companyId", "status");

CREATE INDEX IF NOT EXISTS "action_plans_companyId_assigneeId_idx"
  ON "action_plans"("companyId", "assigneeId");

CREATE INDEX IF NOT EXISTS "action_plans_companyId_dueDate_idx"
  ON "action_plans"("companyId", "dueDate");

COMMIT;
