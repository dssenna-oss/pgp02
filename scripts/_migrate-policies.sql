-- ============================================================
-- Migração: Políticas LGPD (Etapa 11 / Checkpoint 12)
-- ============================================================
-- Adiciona Company.slug + cria tabelas `policies` + `policy_versions`.
-- Fluxo: cada Policy é um documento "vivo" com 1 conteúdo de
-- rascunho e histórico de versões publicadas (1 PolicyVersion por
-- publicação).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) Company.slug (URL pública: /p/<slug>/<policySlug>)
-- ============================================================

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "slug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "companies_slug_key"
  ON "companies"("slug");

-- ============================================================
-- 2) policies — documento vivo de cada política
-- ============================================================

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

-- ============================================================
-- 3) policy_versions — snapshots de cada publicação
-- ============================================================

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

COMMIT;
