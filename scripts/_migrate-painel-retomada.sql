-- ============================================================
-- Migração: Painel de Retomada (Etapa 25 / Checkpoint 27)
-- ============================================================
-- 2 mudanças:
--   1) users ganha lastLoginAt + previousLoginAt
--   2) tabela nova user_last_actions pra rastrear o que cada
--      user editou recentemente (alimentar "Continue de onde parou")
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) users.lastLoginAt + users.previousLoginAt
-- ============================================================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "lastLoginAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "previousLoginAt" TIMESTAMP(3);

-- ============================================================
-- 2) user_last_actions — rastreio de retomada
-- ============================================================

CREATE TABLE IF NOT EXISTS "user_last_actions" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL,
  "refType"        TEXT NOT NULL,
  "refId"          TEXT NOT NULL,
  "route"          TEXT NOT NULL,
  "label"          TEXT NOT NULL,
  "completeness"   INTEGER,
  "openedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedCleanly"  BOOLEAN NOT NULL DEFAULT false
);

-- FK + unique + index (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_last_actions_userId_fkey') THEN
    ALTER TABLE "user_last_actions"
      ADD CONSTRAINT "user_last_actions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "user_last_actions_userId_refType_refId_key"
  ON "user_last_actions"("userId", "refType", "refId");

CREATE INDEX IF NOT EXISTS "user_last_actions_userId_openedAt_idx"
  ON "user_last_actions"("userId", "openedAt" DESC);

COMMIT;
