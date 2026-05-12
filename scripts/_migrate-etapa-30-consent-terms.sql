-- Etapa 30 — Termo de Consentimento do Titular (2026-05-10)
--
-- Adiciona 4 tabelas novas pra implementar coleta formal de consentimento
-- conforme Art. 8º LGPD: consent_terms (catálogo de termos por org),
-- consent_term_versions (snapshots publicados), consent_term_inventory_links
-- (M:N termo↔processo), consent_records (evidência de aceite digital).
--
-- Sem ALTER em tabelas existentes — aditiva e segura pra aplicar enquanto
-- prod está rodando (sem downtime).
--
-- Aplicação:
--   - DEV LOCAL: aplicado via `prisma db execute --file <este arquivo>`
--   - NEON PROD: rodar manualmente no Neon SQL Editor
--     (https://console.neon.tech/) ANTES do merge no Vercel — senão prod
--     buildaria Prisma Client com tabelas que o banco não tem.

-- ============================================================
-- consent_terms
-- ============================================================
CREATE TABLE IF NOT EXISTS "consent_terms" (
  "id"               TEXT         NOT NULL,
  "companyId"        TEXT         NOT NULL,
  "templateType"     TEXT         NOT NULL,
  "slug"             TEXT         NOT NULL,
  "title"            TEXT         NOT NULL,
  "status"           TEXT         NOT NULL DEFAULT 'RASCUNHO',
  "currentContent"   TEXT         NOT NULL,
  "publishedContent" TEXT,
  "currentVersion"   INTEGER      NOT NULL DEFAULT 0,
  "allowsPhysical"   BOOLEAN      NOT NULL DEFAULT true,
  "allowsDigital"    BOOLEAN      NOT NULL DEFAULT true,
  "publishedAt"      TIMESTAMP(3),
  "publishedById"    TEXT,
  "createdById"      TEXT         NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "consent_terms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "consent_terms_companyId_slug_key"
  ON "consent_terms"("companyId", "slug");

CREATE INDEX IF NOT EXISTS "consent_terms_companyId_status_idx"
  ON "consent_terms"("companyId", "status");

CREATE INDEX IF NOT EXISTS "consent_terms_companyId_templateType_idx"
  ON "consent_terms"("companyId", "templateType");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_terms_companyId_fkey') THEN
    ALTER TABLE "consent_terms"
      ADD CONSTRAINT "consent_terms_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_terms_publishedById_fkey') THEN
    ALTER TABLE "consent_terms"
      ADD CONSTRAINT "consent_terms_publishedById_fkey"
      FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_terms_createdById_fkey') THEN
    ALTER TABLE "consent_terms"
      ADD CONSTRAINT "consent_terms_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

-- ============================================================
-- consent_term_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS "consent_term_versions" (
  "id"            TEXT         NOT NULL,
  "termId"        TEXT         NOT NULL,
  "version"       INTEGER      NOT NULL,
  "content"       TEXT         NOT NULL,
  "changeLog"     TEXT,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById" TEXT         NOT NULL,
  CONSTRAINT "consent_term_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "consent_term_versions_termId_version_key"
  ON "consent_term_versions"("termId", "version");

CREATE INDEX IF NOT EXISTS "consent_term_versions_termId_publishedAt_idx"
  ON "consent_term_versions"("termId", "publishedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_term_versions_termId_fkey') THEN
    ALTER TABLE "consent_term_versions"
      ADD CONSTRAINT "consent_term_versions_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "consent_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_term_versions_publishedById_fkey') THEN
    ALTER TABLE "consent_term_versions"
      ADD CONSTRAINT "consent_term_versions_publishedById_fkey"
      FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

-- ============================================================
-- consent_term_inventory_links (M:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS "consent_term_inventory_links" (
  "termId"      TEXT         NOT NULL,
  "inventoryId" TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_term_inventory_links_pkey" PRIMARY KEY ("termId", "inventoryId")
);

CREATE INDEX IF NOT EXISTS "consent_term_inventory_links_inventoryId_idx"
  ON "consent_term_inventory_links"("inventoryId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_term_inventory_links_termId_fkey') THEN
    ALTER TABLE "consent_term_inventory_links"
      ADD CONSTRAINT "consent_term_inventory_links_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "consent_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_term_inventory_links_inventoryId_fkey') THEN
    ALTER TABLE "consent_term_inventory_links"
      ADD CONSTRAINT "consent_term_inventory_links_inventoryId_fkey"
      FOREIGN KEY ("inventoryId") REFERENCES "data_inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- ============================================================
-- consent_records (evidência de aceite)
-- ============================================================
CREATE TABLE IF NOT EXISTS "consent_records" (
  "id"               TEXT         NOT NULL,
  "termId"           TEXT         NOT NULL,
  "versionId"        TEXT         NOT NULL,
  "titularEmail"     TEXT,
  "titularCpf"       TEXT,
  "titularName"      TEXT,
  "ip"               TEXT         NOT NULL,
  "userAgent"        TEXT         NOT NULL,
  "contentChecksum"  TEXT         NOT NULL,
  "acceptedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"        TIMESTAMP(3),
  "revocationReason" TEXT,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "consent_records_termId_acceptedAt_idx"
  ON "consent_records"("termId", "acceptedAt");

CREATE INDEX IF NOT EXISTS "consent_records_termId_titularEmail_idx"
  ON "consent_records"("termId", "titularEmail");

CREATE INDEX IF NOT EXISTS "consent_records_termId_titularCpf_idx"
  ON "consent_records"("termId", "titularCpf");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_records_termId_fkey') THEN
    ALTER TABLE "consent_records"
      ADD CONSTRAINT "consent_records_termId_fkey"
      FOREIGN KEY ("termId") REFERENCES "consent_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consent_records_versionId_fkey') THEN
    ALTER TABLE "consent_records"
      ADD CONSTRAINT "consent_records_versionId_fkey"
      FOREIGN KEY ("versionId") REFERENCES "consent_term_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;
