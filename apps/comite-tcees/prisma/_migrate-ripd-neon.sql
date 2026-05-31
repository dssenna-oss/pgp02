-- Fase 6 — RIPD: tabelas novas a aplicar no Neon PROD ANTES do deploy do código
-- (a Central de Instrumentos passa a consultar prisma.ripd via execucao page).
-- Rodar no Neon SQL Editor do projeto comite-tcees. Aditivo e idempotente.

CREATE TABLE IF NOT EXISTS "ripds" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "data" JSONB NOT NULL,
    "rejectionNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedContent" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedVersionNum" INTEGER,
    "instrumentoId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ripds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ripd_versions" (
    "id" TEXT NOT NULL,
    "ripdId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "changeLog" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    CONSTRAINT "ripd_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ripds_status_idx" ON "ripds"("status");
CREATE INDEX IF NOT EXISTS "ripds_inventoryId_idx" ON "ripds"("inventoryId");
CREATE INDEX IF NOT EXISTS "ripd_versions_ripdId_approvedAt_idx" ON "ripd_versions"("ripdId", "approvedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ripd_versions_ripdId_version_key" ON "ripd_versions"("ripdId", "version");

DO $$ BEGIN
  ALTER TABLE "ripds" ADD CONSTRAINT "ripds_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "data_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ripd_versions" ADD CONSTRAINT "ripd_versions_ripdId_fkey"
    FOREIGN KEY ("ripdId") REFERENCES "ripds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
