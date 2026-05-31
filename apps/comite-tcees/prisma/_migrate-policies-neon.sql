-- Fase 6 — Editor de Políticas: tabelas novas a aplicar no Neon PROD
-- ANTES do deploy do código (a página da Central de Instrumentos passa a
-- consultar prisma.policy). Rodar no Neon SQL Editor do projeto comite-tcees.
-- Aditivo e idempotente (IF NOT EXISTS): não toca tabelas existentes.

CREATE TABLE IF NOT EXISTS "policies" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "currentContent" TEXT NOT NULL,
    "publishedContent" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "instrumentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "policy_versions" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changeLog" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedBy" TEXT,
    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "policies_slug_key" ON "policies"("slug");
CREATE INDEX IF NOT EXISTS "policies_type_idx" ON "policies"("type");
CREATE INDEX IF NOT EXISTS "policies_status_idx" ON "policies"("status");
CREATE INDEX IF NOT EXISTS "policy_versions_policyId_publishedAt_idx" ON "policy_versions"("policyId", "publishedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "policy_versions_policyId_version_key" ON "policy_versions"("policyId", "version");

-- FK (envolto em DO para ser idempotente — ADD CONSTRAINT não tem IF NOT EXISTS)
DO $$ BEGIN
  ALTER TABLE "policy_versions"
    ADD CONSTRAINT "policy_versions_policyId_fkey"
    FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
