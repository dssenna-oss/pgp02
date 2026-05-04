-- ============================================================
-- Migração consolidada PROD (Neon) — Etapas 2 + 4 + 5
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
--   * scripts/_migrate-process-risks.sql (Etapa 5 — Análise de Riscos)
--   * scripts/_migrate-tasks.sql (Etapa 6 — Tarefas pessoais + Marcadores)
--   * scripts/_migrate-forum.sql (Etapa 7 — Fórum + Mensagens diretas)
--   * scripts/_migrate-gap.sql   (Etapa 8 — GAP Analysis: gap_answers + gap_snapshots)
--   * scripts/_migrate-gap-notes.sql (Etapa 9 — Polimento C5: campo notes em gap_answers)
--   * scripts/_migrate-action-plan.sql (Etapa 10 — Checkpoint 11: action_plans refatorada)
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

-- ====================================================================
-- ETAPA 5 — Análise de Riscos (process_risks)
-- ====================================================================

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

CREATE UNIQUE INDEX IF NOT EXISTS "process_risks_dataInventoryId_riskCode_key"
  ON "process_risks"("dataInventoryId", "riskCode");
CREATE INDEX IF NOT EXISTS "process_risks_companyId_status_idx"
  ON "process_risks"("companyId", "status");
CREATE INDEX IF NOT EXISTS "process_risks_dataInventoryId_idx"
  ON "process_risks"("dataInventoryId");

-- ====================================================================
-- ETAPA 6 — Tarefas pessoais + Marcadores
-- ====================================================================

CREATE TABLE IF NOT EXISTS "task_markers" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name"      VARCHAR(60) NOT NULL,
  "color"     TEXT NOT NULL DEFAULT 'slate',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_markers_userId_fkey') THEN
    ALTER TABLE "task_markers"
      ADD CONSTRAINT "task_markers_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_markers_companyId_fkey') THEN
    ALTER TABLE "task_markers"
      ADD CONSTRAINT "task_markers_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "task_markers_userId_name_key"
  ON "task_markers"("userId", "name");
CREATE INDEX IF NOT EXISTS "task_markers_userId_idx"
  ON "task_markers"("userId");

CREATE TABLE IF NOT EXISTS "tasks" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "companyId"       TEXT NOT NULL,
  "title"           VARCHAR(200) NOT NULL,
  "description"     TEXT,
  "status"          TEXT NOT NULL DEFAULT 'A_FAZER',
  "priority"        TEXT NOT NULL DEFAULT 'MEDIA',
  "dueDate"         TIMESTAMP(3),
  "markers"         TEXT,
  "dataInventoryId" TEXT,
  "completedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_userId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_companyId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_dataInventoryId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_dataInventoryId_fkey"
      FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "tasks_userId_status_idx"
  ON "tasks"("userId", "status");
CREATE INDEX IF NOT EXISTS "tasks_userId_dueDate_idx"
  ON "tasks"("userId", "dueDate");
CREATE INDEX IF NOT EXISTS "tasks_companyId_idx"
  ON "tasks"("companyId");

-- ====================================================================
-- ETAPA 7 — Fórum + Mensagens diretas
-- ====================================================================

CREATE TABLE IF NOT EXISTS "forum_posts" (
  "id"           TEXT PRIMARY KEY,
  "companyId"    TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "recipientId"  TEXT,
  "type"         TEXT NOT NULL DEFAULT 'DISCUSSION',
  "category"     TEXT,
  "title"        VARCHAR(200) NOT NULL,
  "content"      TEXT NOT NULL,
  "pinned"       BOOLEAN NOT NULL DEFAULT false,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_companyId_fkey') THEN
    ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_authorId_fkey') THEN
    ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_recipientId_fkey') THEN
    ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_recipientId_fkey"
      FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "forum_posts_companyId_recipientId_idx"
  ON "forum_posts"("companyId", "recipientId");
CREATE INDEX IF NOT EXISTS "forum_posts_companyId_pinned_createdAt_idx"
  ON "forum_posts"("companyId", "pinned", "createdAt");
CREATE INDEX IF NOT EXISTS "forum_posts_companyId_category_idx"
  ON "forum_posts"("companyId", "category");
CREATE INDEX IF NOT EXISTS "forum_posts_authorId_idx"
  ON "forum_posts"("authorId");
CREATE INDEX IF NOT EXISTS "forum_posts_recipientId_idx"
  ON "forum_posts"("recipientId");

CREATE TABLE IF NOT EXISTS "forum_replies" (
  "id"        TEXT PRIMARY KEY,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_postId_fkey') THEN
    ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_authorId_fkey') THEN
    ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "forum_replies_postId_idx" ON "forum_replies"("postId");
CREATE INDEX IF NOT EXISTS "forum_replies_authorId_idx" ON "forum_replies"("authorId");

CREATE TABLE IF NOT EXISTS "forum_post_reads" (
  "id"     TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_post_reads_postId_fkey') THEN
    ALTER TABLE "forum_post_reads" ADD CONSTRAINT "forum_post_reads_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_post_reads_userId_fkey') THEN
    ALTER TABLE "forum_post_reads" ADD CONSTRAINT "forum_post_reads_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "forum_post_reads_postId_userId_key"
  ON "forum_post_reads"("postId", "userId");
CREATE INDEX IF NOT EXISTS "forum_post_reads_userId_idx"
  ON "forum_post_reads"("userId");

-- ====================================================================
-- ETAPA 8 — GAP Analysis (gap_answers + gap_snapshots)
-- ====================================================================
-- Substitui o placeholder Abacus `gap_analyses` (drop seguro com IF EXISTS).
-- Catálogo dos 119 controles fica em código (`lib/gap-catalog.ts`).

DROP TABLE IF EXISTS "gap_analyses" CASCADE;

CREATE TABLE IF NOT EXISTS "gap_answers" (
  "id"             TEXT PRIMARY KEY,
  "companyId"      TEXT NOT NULL,
  "controlCode"    TEXT NOT NULL,
  "cenarioAtual"   TEXT,
  "mapeamento"     TEXT,
  "aderencia"      TEXT,
  "pontoMelhoria"  TEXT,
  "autoSuggested"  BOOLEAN NOT NULL DEFAULT false,
  "answeredById"   TEXT,
  "answeredAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_answers_companyId_fkey') THEN
    ALTER TABLE "gap_answers" ADD CONSTRAINT "gap_answers_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_answers_answeredById_fkey') THEN
    ALTER TABLE "gap_answers" ADD CONSTRAINT "gap_answers_answeredById_fkey"
      FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "gap_answers_companyId_controlCode_key"
  ON "gap_answers"("companyId", "controlCode");
CREATE INDEX IF NOT EXISTS "gap_answers_companyId_mapeamento_idx"
  ON "gap_answers"("companyId", "mapeamento");
CREATE INDEX IF NOT EXISTS "gap_answers_companyId_aderencia_idx"
  ON "gap_answers"("companyId", "aderencia");

CREATE TABLE IF NOT EXISTS "gap_snapshots" (
  "id"          TEXT PRIMARY KEY,
  "companyId"   TEXT NOT NULL,
  "label"       VARCHAR(120) NOT NULL,
  "notes"       TEXT,
  "payload"     JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_snapshots_companyId_fkey') THEN
    ALTER TABLE "gap_snapshots" ADD CONSTRAINT "gap_snapshots_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_snapshots_createdById_fkey') THEN
    ALTER TABLE "gap_snapshots" ADD CONSTRAINT "gap_snapshots_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "gap_snapshots_companyId_createdAt_idx"
  ON "gap_snapshots"("companyId", "createdAt");

-- ====================================================================
-- ETAPA 9 — Polimento C5: campo notes em gap_answers
-- ====================================================================

ALTER TABLE "gap_answers"
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ====================================================================
-- ETAPA 10 — Checkpoint 11: Plano de Ação (action_plans refatorada)
-- ====================================================================
-- DROP da tabela legacy do Abacus + recria com schema novo (refs
-- polimórficos pra GAP/Risco/Inventário). Em prod a tabela antiga
-- pode estar vazia ou com seeds — sem valor de produção.

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
SELECT 'process_risks (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='process_risks');
SELECT 'tasks (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='tasks');
SELECT 'task_markers (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='task_markers');
SELECT 'forum_posts (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='forum_posts');
SELECT 'forum_replies (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='forum_replies');
SELECT 'forum_post_reads (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='forum_post_reads');
SELECT 'gap_answers (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='gap_answers');
SELECT 'gap_snapshots (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='gap_snapshots');
SELECT 'gap_analyses dropped', NOT EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='gap_analyses');

\echo ''
\echo '=== Inventários por status ==='
SELECT status, COUNT(*) FROM data_inventories GROUP BY status;
