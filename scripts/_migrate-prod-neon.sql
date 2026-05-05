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
--   * scripts/_migrate-policies.sql    (Etapa 11 — Checkpoint 12: policies + policy_versions + Company.slug)
--   * scripts/_migrate-ripd-v2.sql     (Etapa 12 — Checkpoint 13: ripds refatorada + ripd_versions)
--   * scripts/_migrate-terceiros.sql   (Etapa 13 — Checkpoint 14 G1: operators + operator_process_links)
--   * scripts/_migrate-terceiros-assessment.sql (Etapa 14 — Checkpoint 14 G2: operator_assessments)
--   * scripts/_migrate-action-plan-operator.sql (Etapa 15 — Checkpoint 14 G4: action_plans.refOperatorId)
--   * scripts/_migrate-terceiros-adequacao.sql (Etapa 16 — Checkpoint 14 H1: lgpdComplianceStatus + contractOriginalDate)
--   * scripts/_migrate-incidents.sql (Etapa 17 — Checkpoint 16: Incidentes refatorado + IncidentCommunication + action_plans.refIncidentId)
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

-- ====================================================================
-- ETAPA 11 — Checkpoint 12: Políticas (slug + policies + policy_versions)
-- ====================================================================

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "slug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key"
  ON "companies"("slug");

CREATE TABLE IF NOT EXISTS "policies" (
  "id"               TEXT PRIMARY KEY,
  "companyId"        TEXT NOT NULL,
  "type"             TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "slug"             TEXT NOT NULL,
  "status"           TEXT NOT NULL DEFAULT 'RASCUNHO',
  "currentContent"   TEXT NOT NULL,
  "publishedContent" TEXT,
  "currentVersion"   INTEGER NOT NULL DEFAULT 0,
  "publishedAt"      TIMESTAMP(3),
  "publishedById"    TEXT,
  "createdById"      TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "policies_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "policies_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "policies_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION
);
CREATE UNIQUE INDEX IF NOT EXISTS "policies_companyId_type_slug_key"
  ON "policies"("companyId", "type", "slug");
CREATE INDEX IF NOT EXISTS "policies_companyId_status_idx"
  ON "policies"("companyId", "status");
CREATE INDEX IF NOT EXISTS "policies_companyId_type_idx"
  ON "policies"("companyId", "type");

CREATE TABLE IF NOT EXISTS "policy_versions" (
  "id"            TEXT PRIMARY KEY,
  "policyId"      TEXT NOT NULL,
  "version"       INTEGER NOT NULL,
  "content"       TEXT NOT NULL,
  "changeLog"     TEXT,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById" TEXT NOT NULL,
  CONSTRAINT "policy_versions_policyId_fkey"
    FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE,
  CONSTRAINT "policy_versions_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE NO ACTION
);
CREATE UNIQUE INDEX IF NOT EXISTS "policy_versions_policyId_version_key"
  ON "policy_versions"("policyId", "version");
CREATE INDEX IF NOT EXISTS "policy_versions_policyId_publishedAt_idx"
  ON "policy_versions"("policyId", "publishedAt");

-- ====================================================================
-- ETAPA 12 — Checkpoint 13: RIPD v2 institucional (ripds + ripd_versions)
-- ====================================================================
-- Refatora a `ripds` antiga (placeholder Abacus, 13 colunas texto-livre,
-- 0 registros em prod verificado em 2026-05-04) pra v2 institucional:
-- documento estruturado em 8 seções (JSON), vínculo opcional a processo
-- do Inventário, fluxo de aprovação Contribuidor → DPO, versionamento
-- por snapshot a cada aprovação.
-- ====================================================================

DROP TABLE IF EXISTS "ripd_versions" CASCADE;
DROP TABLE IF EXISTS "ripds" CASCADE;

CREATE TABLE "ripds" (
  "id"                  TEXT PRIMARY KEY,
  "companyId"           TEXT NOT NULL,
  "inventoryId"         TEXT,
  "title"               TEXT NOT NULL,
  "status"              TEXT NOT NULL DEFAULT 'RASCUNHO',
  "data"                JSONB NOT NULL,
  "rejectionNote"       TEXT,
  "approvedById"        TEXT,
  "approvedAt"          TIMESTAMP(3),
  "publishedContent"    JSONB,
  "publishedAt"         TIMESTAMP(3),
  "publishedVersionNum" INTEGER,
  "createdById"         TEXT NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ripds_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "ripds_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "data_inventories"("id") ON DELETE SET NULL,
  CONSTRAINT "ripds_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "ripds_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION
);
CREATE INDEX IF NOT EXISTS "ripds_companyId_status_idx"
  ON "ripds"("companyId", "status");
CREATE INDEX IF NOT EXISTS "ripds_companyId_createdById_idx"
  ON "ripds"("companyId", "createdById");
CREATE INDEX IF NOT EXISTS "ripds_inventoryId_idx"
  ON "ripds"("inventoryId");

CREATE TABLE "ripd_versions" (
  "id"           TEXT PRIMARY KEY,
  "ripdId"       TEXT NOT NULL,
  "version"      INTEGER NOT NULL,
  "content"      JSONB NOT NULL,
  "changeLog"    TEXT,
  "approvedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" TEXT NOT NULL,
  CONSTRAINT "ripd_versions_ripdId_fkey"
    FOREIGN KEY ("ripdId") REFERENCES "ripds"("id") ON DELETE CASCADE,
  CONSTRAINT "ripd_versions_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION
);
CREATE UNIQUE INDEX IF NOT EXISTS "ripd_versions_ripdId_version_key"
  ON "ripd_versions"("ripdId", "version");
CREATE INDEX IF NOT EXISTS "ripd_versions_ripdId_approvedAt_idx"
  ON "ripd_versions"("ripdId", "approvedAt");

-- ====================================================================
-- ETAPA 13 — Checkpoint 14 G1: Gestão de Terceiros (operators +
-- operator_process_links). Inspirado nos materiais da Denise — modelo
-- com 6 critérios ANPD pra régua de risco do contrato.
-- ====================================================================

CREATE TABLE IF NOT EXISTS "operators" (
  "id"                              TEXT PRIMARY KEY,
  "companyId"                       TEXT NOT NULL,
  "name"                            TEXT NOT NULL,
  "tradeName"                       TEXT,
  "cnpj"                            TEXT,
  "country"                         TEXT DEFAULT 'Brasil',
  "operatorType"                    TEXT,
  "description"                     TEXT,
  "notes"                           TEXT,
  "relationType"                    TEXT NOT NULL DEFAULT 'INDEFINIDO',
  "classificationAnswers"           JSONB,
  "thirdPartyDpoName"               TEXT,
  "thirdPartyDpoEmail"              TEXT,
  "thirdPartyDpoPhone"              TEXT,
  "responsibleId"                   TEXT,
  "confidentialityTermSignedAt"     TIMESTAMP(3),
  "confidentialityTermAttachment"   TEXT,
  "contractLabel"                   TEXT,
  "contractSignedAt"                TIMESTAMP(3),
  "contractExpiresAt"               TIMESTAMP(3),
  "contractLastReviewedAt"          TIMESTAMP(3),
  "contractStatus"                  TEXT NOT NULL DEFAULT 'SEM_CONTRATO',
  "largaEscala"                     BOOLEAN NOT NULL DEFAULT false,
  "afetaTitulares"                  BOOLEAN NOT NULL DEFAULT false,
  "novasTecnologias"                BOOLEAN NOT NULL DEFAULT false,
  "vigilanciaPublica"               BOOLEAN NOT NULL DEFAULT false,
  "decisaoAutomatizada"             BOOLEAN NOT NULL DEFAULT false,
  "dadosSensiveis"                  BOOLEAN NOT NULL DEFAULT false,
  "contractRiskClass"               TEXT NOT NULL DEFAULT 'BAIXO',
  "recommendedClause"               TEXT NOT NULL DEFAULT 'INDEFINIDO',
  "hasPrivacyClause"                BOOLEAN NOT NULL DEFAULT false,
  "hasIncidentClause"               BOOLEAN NOT NULL DEFAULT false,
  "incidentNotificationDays"        INTEGER,
  "permitsSubcontracting"           BOOLEAN NOT NULL DEFAULT false,
  "permitsInternationalTransfer"    BOOLEAN NOT NULL DEFAULT false,
  "isStandardMinute"                BOOLEAN NOT NULL DEFAULT false,
  "contractAttachments"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdById"                     TEXT NOT NULL,
  "createdAt"                       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operators_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "operators_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION,
  CONSTRAINT "operators_responsibleId_fkey"
    FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "operators_companyId_relationType_idx"
  ON "operators"("companyId", "relationType");
CREATE INDEX IF NOT EXISTS "operators_companyId_contractRiskClass_idx"
  ON "operators"("companyId", "contractRiskClass");
CREATE INDEX IF NOT EXISTS "operators_companyId_contractStatus_idx"
  ON "operators"("companyId", "contractStatus");

CREATE TABLE IF NOT EXISTS "operator_process_links" (
  "id"                  TEXT PRIMARY KEY,
  "operatorId"          TEXT NOT NULL,
  "dataInventoryId"     TEXT NOT NULL,
  "activityDescription" TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "operator_process_links_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE,
  CONSTRAINT "operator_process_links_dataInventoryId_fkey"
    FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "operator_process_links_operatorId_dataInventoryId_key"
  ON "operator_process_links"("operatorId", "dataInventoryId");
CREATE INDEX IF NOT EXISTS "operator_process_links_dataInventoryId_idx"
  ON "operator_process_links"("dataInventoryId");

-- ====================================================================
-- ETAPA 14 — Checkpoint 14 G2: Avaliação de Terceiros via Formulário
-- (operator_assessments). Inspirado no XLSX modelo da Denise — 52
-- perguntas em 7 blocos, com pontuação Cyber e LGPD separadas.
-- ====================================================================

CREATE TABLE IF NOT EXISTS "operator_assessments" (
  "id"                       TEXT PRIMARY KEY,
  "operatorId"               TEXT NOT NULL,
  "label"                    TEXT,
  "status"                   TEXT NOT NULL DEFAULT 'PENDENTE',
  "publicToken"              TEXT,
  "sentAt"                   TIMESTAMP(3),
  "thirdPartyStartedAt"      TIMESTAMP(3),
  "thirdPartyCompletedAt"    TIMESTAMP(3),
  "thirdPartyAnswers"        JSONB NOT NULL DEFAULT '{}'::jsonb,
  "dpoNotes"                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  "reviewedById"             TEXT,
  "reviewedAt"               TIMESTAMP(3),
  "cyberScore"               INTEGER NOT NULL DEFAULT 0,
  "cyberMax"                 INTEGER NOT NULL DEFAULT 0,
  "cyberPercentage"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cyberRiskClass"           TEXT,
  "lgpdScore"                INTEGER NOT NULL DEFAULT 0,
  "lgpdMax"                  INTEGER NOT NULL DEFAULT 0,
  "lgpdPercentage"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lgpdRiskClass"            TEXT,
  "overallPercentage"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overallRiskClass"         TEXT,
  "createdById"              TEXT NOT NULL,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL,
  CONSTRAINT "operator_assessments_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE,
  CONSTRAINT "operator_assessments_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION,
  CONSTRAINT "operator_assessments_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "operator_assessments_publicToken_key"
  ON "operator_assessments"("publicToken")
  WHERE "publicToken" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "operator_assessments_operatorId_status_idx"
  ON "operator_assessments"("operatorId", "status");
CREATE INDEX IF NOT EXISTS "operator_assessments_publicToken_idx"
  ON "operator_assessments"("publicToken");

-- ====================================================================
-- ETAPA 15 — Plano de Ação ganha ref pra Operadores (Checkpoint 14 G4)
-- ====================================================================

ALTER TABLE "action_plans"
  ADD COLUMN IF NOT EXISTS "refOperatorId" TEXT;
CREATE INDEX IF NOT EXISTS "action_plans_companyId_refOperatorId_idx"
  ON "action_plans"("companyId", "refOperatorId");

-- ====================================================================
-- ETAPA 16 — Adequação de Terceiros (Checkpoint 14 H1)
-- ====================================================================

ALTER TABLE "operators"
  ADD COLUMN IF NOT EXISTS "lgpdComplianceStatus" TEXT NOT NULL DEFAULT 'NAO_AVALIADO',
  ADD COLUMN IF NOT EXISTS "contractOriginalDate" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "operators_companyId_lgpdComplianceStatus_idx"
  ON "operators"("companyId", "lgpdComplianceStatus");

-- ====================================================================
-- ETAPA 17 — Incidentes refatorado (Checkpoint 16)
-- ====================================================================
-- Substitui o módulo Incidentes legado pela estrutura definitiva.
-- Mapeamento legado → novo (rename + drop + UPDATE de status/severity).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='detectionDate') THEN
    ALTER TABLE "incidents" RENAME COLUMN "detectionDate" TO "detectedAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='anpdReportDate') THEN
    ALTER TABLE "incidents" RENAME COLUMN "anpdReportDate" TO "anpdNotifiedAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='affectedData') THEN
    ALTER TABLE "incidents" RENAME COLUMN "affectedData" TO "affectedDataTypes";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='affectedSubjects') THEN
    ALTER TABLE "incidents" RENAME COLUMN "affectedSubjects" TO "affectedSubjectsCount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='cause') THEN
    ALTER TABLE "incidents" RENAME COLUMN "cause" TO "rootCause";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='containmentActions') THEN
    ALTER TABLE "incidents" RENAME COLUMN "containmentActions" TO "containmentMeasures";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='correctiveActions') THEN
    ALTER TABLE "incidents" RENAME COLUMN "correctiveActions" TO "correctiveMeasures";
  END IF;
END $$;

ALTER TABLE "incidents"
  ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subjectsNotifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hasSensitiveData" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "affectedSubjectsCategories" TEXT,
  ADD COLUMN IF NOT EXISTS "attackVector" TEXT,
  ADD COLUMN IF NOT EXISTS "affectedSystems" TEXT,
  ADD COLUMN IF NOT EXISTS "affectedOperators" TEXT,
  ADD COLUMN IF NOT EXISTS "riskAssessment" TEXT,
  ADD COLUMN IF NOT EXISTS "securityMeasuresInPlace" TEXT,
  ADD COLUMN IF NOT EXISTS "delayJustification" TEXT,
  ADD COLUMN IF NOT EXISTS "closureNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "closedById" TEXT;

UPDATE "incidents" SET "status" = 'DETECTADO'
  WHERE "status" IN ('Aberto', 'aberto', 'Pendente', 'pendente');
UPDATE "incidents" SET "status" = 'EM_ANALISE'
  WHERE "status" IN ('Em análise', 'Em analise', 'Em Análise', 'em_analise');
UPDATE "incidents" SET "status" = 'EM_CONTENCAO'
  WHERE "status" IN ('Em contenção', 'Em Contenção', 'em_contencao');
UPDATE "incidents" SET "status" = 'ENCERRADO'
  WHERE "status" IN ('Resolvido', 'Fechado', 'Encerrado', 'resolvido', 'fechado');
UPDATE "incidents" SET "status" = 'FALSO_POSITIVO'
  WHERE "status" IN ('Falso positivo', 'falso_positivo');
UPDATE "incidents" SET "status" = 'DETECTADO'
  WHERE "status" NOT IN (
    'DETECTADO', 'EM_ANALISE', 'EM_CONTENCAO', 'COMUNICADO_ANPD',
    'COMUNICADO_TITULARES', 'ENCERRADO', 'FALSO_POSITIVO'
  );

UPDATE "incidents" SET "severity" = 'ALTO'
  WHERE "severity" IN ('Alta', 'alta', 'Crítica', 'Critica', 'critica', 'Critical');
UPDATE "incidents" SET "severity" = 'MEDIO'
  WHERE "severity" IN ('Média', 'Media', 'media', 'Medium');
UPDATE "incidents" SET "severity" = 'BAIXO'
  WHERE "severity" IN ('Baixa', 'baixa', 'Low');
UPDATE "incidents" SET "severity" = 'MEDIO'
  WHERE "severity" NOT IN ('ALTO', 'MEDIO', 'BAIXO');

UPDATE "incidents" SET "incidentType" = 'VAZAMENTO'
  WHERE "incidentType" ILIKE '%vazamento%';
UPDATE "incidents" SET "incidentType" = 'ACESSO_NAO_AUTORIZADO'
  WHERE "incidentType" ILIKE '%acesso%';
UPDATE "incidents" SET "incidentType" = 'PERDA'
  WHERE "incidentType" ILIKE '%perda%';
UPDATE "incidents" SET "incidentType" = 'ALTERACAO_INDEVIDA'
  WHERE "incidentType" ILIKE '%altera%';
UPDATE "incidents" SET "incidentType" = 'INDISPONIBILIDADE'
  WHERE "incidentType" ILIKE '%indisp%';
UPDATE "incidents" SET "incidentType" = 'OUTRO'
  WHERE "incidentType" NOT IN (
    'VAZAMENTO', 'ACESSO_NAO_AUTORIZADO', 'PERDA',
    'ALTERACAO_INDEVIDA', 'INDISPONIBILIDADE', 'OUTRO'
  );

ALTER TABLE "incidents"
  DROP COLUMN IF EXISTS "preventiveActions",
  DROP COLUMN IF EXISTS "reportDate",
  DROP COLUMN IF EXISTS "reportedToAnpd";

ALTER TABLE "incidents"
  ALTER COLUMN "status" SET DEFAULT 'DETECTADO',
  ALTER COLUMN "severity" SET DEFAULT 'MEDIO';

-- O legado tinha affectedData NOT NULL; novo schema torna opcional.
ALTER TABLE "incidents"
  ALTER COLUMN "affectedDataTypes" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_createdById_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_closedById_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_closedById_fkey"
      FOREIGN KEY ("closedById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "incidents_companyId_status_idx"
  ON "incidents"("companyId", "status");
CREATE INDEX IF NOT EXISTS "incidents_companyId_severity_idx"
  ON "incidents"("companyId", "severity");
CREATE INDEX IF NOT EXISTS "incidents_companyId_detectedAt_idx"
  ON "incidents"("companyId", "detectedAt");

CREATE TABLE IF NOT EXISTS "incident_communications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "incidentId" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "channel" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_communications_incidentId_fkey') THEN
    ALTER TABLE "incident_communications" ADD CONSTRAINT "incident_communications_incidentId_fkey"
      FOREIGN KEY ("incidentId") REFERENCES "incidents"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_communications_createdById_fkey') THEN
    ALTER TABLE "incident_communications" ADD CONSTRAINT "incident_communications_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "incident_communications_incidentId_idx"
  ON "incident_communications"("incidentId");

ALTER TABLE "action_plans"
  ADD COLUMN IF NOT EXISTS "refIncidentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_refIncidentId_fkey') THEN
    ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_refIncidentId_fkey"
      FOREIGN KEY ("refIncidentId") REFERENCES "incidents"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "action_plans_companyId_refIncidentId_idx"
  ON "action_plans"("companyId", "refIncidentId");

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
SELECT 'ripds (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='ripds');
SELECT 'ripds.data (jsonb)', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='ripds' AND column_name='data' AND data_type='jsonb');
SELECT 'ripd_versions (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='ripd_versions');
SELECT 'operators (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='operators');
SELECT 'operators.contractRiskClass', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='operators' AND column_name='contractRiskClass');
SELECT 'operator_process_links (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='operator_process_links');
SELECT 'operator_assessments (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='operator_assessments');
SELECT 'operator_assessments.publicToken', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='operator_assessments' AND column_name='publicToken');
SELECT 'action_plans.refOperatorId', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='action_plans' AND column_name='refOperatorId');
SELECT 'operators.lgpdComplianceStatus', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='operators' AND column_name='lgpdComplianceStatus');
SELECT 'operators.contractOriginalDate', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='operators' AND column_name='contractOriginalDate');
SELECT 'incidents.detectedAt', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='detectedAt');
SELECT 'incidents.anpdNotifiedAt', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='anpdNotifiedAt');
SELECT 'incidents.hasSensitiveData', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='hasSensitiveData');
SELECT 'incidents.createdById', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='createdById');
SELECT 'incident_communications (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='incident_communications');
SELECT 'action_plans.refIncidentId', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='action_plans' AND column_name='refIncidentId');

\echo ''
\echo '=== Inventários por status ==='
SELECT status, COUNT(*) FROM data_inventories GROUP BY status;
