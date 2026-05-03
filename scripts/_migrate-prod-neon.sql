-- ============================================================
-- Migração consolidada PROD (Neon) — Etapas 2 + 4
-- ============================================================
-- Aplicar contra o Neon URL ANTES do próximo push pra main.
-- O DATABASE_URL de prod está no painel Vercel (env vars).
--
-- Uso:
--   psql "<neon-url>" -f scripts/_migrate-prod-neon.sql
--
-- Idempotente — pode rodar várias vezes sem efeito colateral.
-- Combina:
--   * scripts/_migrate-users-roles.sql (Etapa 2.1)
--   * scripts/_migrate-bases-legais.sql (Etapa 4)
-- ============================================================

BEGIN;

-- ====================================================================
-- ETAPA 2.1 — Sistema de usuários e papéis
-- ====================================================================

-- Users: setor + invitedById
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "setor" TEXT,
  ADD COLUMN IF NOT EXISTS "invitedById" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_invitedById_fkey') THEN
    ALTER TABLE users ADD CONSTRAINT "users_invitedById_fkey"
      FOREIGN KEY ("invitedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Default da role pra novos usuários (CONTRIBUIDOR)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CONTRIBUIDOR';

-- DataInventory: status + setor + createdBy + reviewer
ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
  ADD COLUMN IF NOT EXISTS "setor" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewComment" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_createdById_fkey') THEN
    ALTER TABLE data_inventories ADD CONSTRAINT "data_inventories_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_reviewedById_fkey') THEN
    ALTER TABLE data_inventories ADD CONSTRAINT "data_inventories_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "data_inventories_companyId_status_idx"
  ON data_inventories("companyId", "status");
CREATE INDEX IF NOT EXISTS "data_inventories_companyId_setor_idx"
  ON data_inventories("companyId", "setor");

-- Backfill: deriva status do isDraft legado
UPDATE data_inventories
SET status = CASE WHEN "isDraft" THEN 'RASCUNHO' ELSE 'APROVADO' END
WHERE status = 'RASCUNHO';

-- Backfill: cada inventário fica como criado pelo admin (DPO Principal
-- atual) — assume que a org tem 1 só admin, que é o caso pré-migração
DO $$
DECLARE
  admin_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    UPDATE data_inventories
    SET "createdById" = admin_id
    WHERE "createdById" IS NULL;
  END IF;
END $$;

-- ====================================================================
-- ETAPA 4 — Bases Legais
-- ====================================================================

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "previsaoLegal" TEXT,
  ADD COLUMN IF NOT EXISTS "legalBasisSensitive" TEXT,
  ADD COLUMN IF NOT EXISTS "legalBasisComments" TEXT,
  ADD COLUMN IF NOT EXISTS "legalReviewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "legalReviewedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_legalReviewedById_fkey') THEN
    ALTER TABLE data_inventories ADD CONSTRAINT "data_inventories_legalReviewedById_fkey"
      FOREIGN KEY ("legalReviewedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- ====================================================================
-- Verificação
-- ====================================================================
\echo ''
\echo '=== Resultado ==='

SELECT 'users.setor', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='users' AND column_name='setor');
SELECT 'users.invitedById', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='users' AND column_name='invitedById');
SELECT 'data_inventories.status', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='status');
SELECT 'data_inventories.previsaoLegal', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='previsaoLegal');
SELECT 'data_inventories.legalBasisSensitive', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='legalBasisSensitive');

\echo ''
\echo '=== Inventários por status ==='
SELECT status, COUNT(*) FROM data_inventories GROUP BY status;
