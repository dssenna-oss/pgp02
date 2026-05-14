-- Etapa 29 — Aviso de Privacidade por Serviço (2026-05-10)
--
-- Adiciona 2 tabelas novas pra suportar geração de Aviso de Privacidade
-- granular (1 por DataInventory aprovado). Espelha o padrão de
-- versionamento das Políticas (policies + policy_versions).
--
-- Sem ALTER em tabelas existentes — apenas CREATE. Aditiva e segura
-- pra aplicar enquanto prod está rodando (sem downtime).
--
-- Aplicação:
--   - DEV LOCAL: aplicado via `prisma db execute --file <este arquivo>`
--   - NEON PROD: rodar manualmente no Neon SQL Editor
--     (https://console.neon.tech/app/projects/<id>/sql) ANTES de fazer
--     deploy no Vercel — senão prod buildaria Prisma Client com colunas
--     que o banco não tem (incidente 2026-05-11 → não repetir).

-- ============================================================
-- service_privacy_notices
-- ============================================================
CREATE TABLE IF NOT EXISTS "service_privacy_notices" (
  "id"                          TEXT         NOT NULL,
  "companyId"                   TEXT         NOT NULL,
  "dataInventoryId"             TEXT         NOT NULL,
  "slug"                        TEXT         NOT NULL,
  "status"                      TEXT         NOT NULL DEFAULT 'RASCUNHO',
  "currentContent"              TEXT         NOT NULL,
  "publishedContent"            TEXT,
  "currentVersion"              INTEGER      NOT NULL DEFAULT 0,
  "includedSections"            JSONB        NOT NULL,
  "additionalNotes"             TEXT,
  "lastSyncedFromInventoryAt"   TIMESTAMP(3) NOT NULL,
  "forcedDespiteNotApproved"    BOOLEAN      NOT NULL DEFAULT false,
  "publishedAt"                 TIMESTAMP(3),
  "publishedById"               TEXT,
  "createdById"                 TEXT         NOT NULL,
  "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_privacy_notices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_privacy_notices_dataInventoryId_key"
  ON "service_privacy_notices"("dataInventoryId");

CREATE UNIQUE INDEX IF NOT EXISTS "service_privacy_notices_companyId_slug_key"
  ON "service_privacy_notices"("companyId", "slug");

CREATE INDEX IF NOT EXISTS "service_privacy_notices_companyId_status_idx"
  ON "service_privacy_notices"("companyId", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notices_companyId_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notices"
      ADD CONSTRAINT "service_privacy_notices_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notices_dataInventoryId_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notices"
      ADD CONSTRAINT "service_privacy_notices_dataInventoryId_fkey"
      FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notices_publishedById_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notices"
      ADD CONSTRAINT "service_privacy_notices_publishedById_fkey"
      FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notices_createdById_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notices"
      ADD CONSTRAINT "service_privacy_notices_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;

-- ============================================================
-- service_privacy_notice_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS "service_privacy_notice_versions" (
  "id"            TEXT         NOT NULL,
  "noticeId"      TEXT         NOT NULL,
  "version"       INTEGER      NOT NULL,
  "content"       TEXT         NOT NULL,
  "changeLog"     TEXT,
  "publishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedById" TEXT         NOT NULL,
  CONSTRAINT "service_privacy_notice_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_privacy_notice_versions_noticeId_version_key"
  ON "service_privacy_notice_versions"("noticeId", "version");

CREATE INDEX IF NOT EXISTS "service_privacy_notice_versions_noticeId_publishedAt_idx"
  ON "service_privacy_notice_versions"("noticeId", "publishedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notice_versions_noticeId_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notice_versions"
      ADD CONSTRAINT "service_privacy_notice_versions_noticeId_fkey"
      FOREIGN KEY ("noticeId") REFERENCES "service_privacy_notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_privacy_notice_versions_publishedById_fkey'
  ) THEN
    ALTER TABLE "service_privacy_notice_versions"
      ADD CONSTRAINT "service_privacy_notice_versions_publishedById_fkey"
      FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;
