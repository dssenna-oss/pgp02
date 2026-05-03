-- Checkpoint 2.1 — Sistema de usuários + papéis
-- Aplica as mudanças do schema.prisma via SQL bruto pq o Postgres
-- portátil local não tem pgvector (ver HANDOVER bug #2).
-- Idempotente (usa IF NOT EXISTS / IF EXISTS).

BEGIN;

-- ============================================================
-- USERS
-- ============================================================

-- Setor (texto livre, opcional)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "setor" TEXT;

-- Quem cadastrou este usuário (auto-relação opcional)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "invitedById" TEXT;

-- FK auto-relacionamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_invitedById_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT "users_invitedById_fkey"
      FOREIGN KEY ("invitedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Mudar default da coluna role pra "CONTRIBUIDOR"
-- (não atualiza linhas existentes — apenas novas inserções sem role)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CONTRIBUIDOR';

-- ============================================================
-- DATA_INVENTORIES
-- ============================================================

-- Novos campos
ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'RASCUNHO';

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "setor" TEXT;

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE data_inventories
  ADD COLUMN IF NOT EXISTS "reviewComment" TEXT;

-- FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_createdById_fkey'
  ) THEN
    ALTER TABLE data_inventories
      ADD CONSTRAINT "data_inventories_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'data_inventories_reviewedById_fkey'
  ) THEN
    ALTER TABLE data_inventories
      ADD CONSTRAINT "data_inventories_reviewedById_fkey"
      FOREIGN KEY ("reviewedById") REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices pra filtros (companyId+status e companyId+setor)
CREATE INDEX IF NOT EXISTS "data_inventories_companyId_status_idx"
  ON data_inventories("companyId", "status");

CREATE INDEX IF NOT EXISTS "data_inventories_companyId_setor_idx"
  ON data_inventories("companyId", "setor");

-- ============================================================
-- BACKFILL — derivar status a partir de isDraft (legado)
-- ============================================================
-- isDraft=true → status=RASCUNHO
-- isDraft=false → status=APROVADO (assume que registros não-rascunho
-- já passaram por revisão antes da migração)
-- Só atualiza linhas cujo status ainda está no default 'RASCUNHO',
-- pra ser idempotente. NÃO ROLA SOBRESCREVER linhas com status custom.
UPDATE data_inventories
SET status = CASE WHEN "isDraft" THEN 'RASCUNHO' ELSE 'APROVADO' END
WHERE status = 'RASCUNHO';

-- ============================================================
-- BACKFILL — renomear Company atual pra "LGPD - PGP AUTOMATIZADO"
-- ============================================================
-- Só atualiza se houver exatamente 1 organização (cenário pré-multi-org)
-- Pra evitar renomear N orgs por engano.
DO $$
DECLARE
  org_count INT;
BEGIN
  SELECT COUNT(*) INTO org_count FROM companies;
  IF org_count = 1 THEN
    UPDATE companies SET "companyName" = 'LGPD - PGP AUTOMATIZADO';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- Verificação pós-migração
-- ============================================================
\echo ''
\echo '=== Resultado ==='
SELECT 'users.setor exists' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='users' AND column_name='setor'
) AS ok;

SELECT 'data_inventories.status exists' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name='data_inventories' AND column_name='status'
) AS ok;

SELECT 'company name', "companyName" FROM companies LIMIT 5;

SELECT 'inventories by status', status, COUNT(*) FROM data_inventories GROUP BY status;
