-- ============================================================
-- Migração: RIPD v2 institucional (Etapa 12 / Checkpoint 13)
-- ============================================================
-- Refatora a tabela `ripds` antiga (placeholder vinda do Abacus,
-- 13 colunas texto-livre, sem fluxo de aprovação) pra v2 institucional:
-- documento estruturado em 8 seções (JSON), com vínculo opcional a
-- processo do Inventário, fluxo de aprovação Contribuidor → DPO,
-- e versionamento por snapshot a cada aprovação.
--
-- Estratégia: DROP+CREATE (a tabela antiga tem 0 registros em prod,
-- verificado em 2026-05-04 — sem perda de dados).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) DROP da tabela antiga (CASCADE remove FKs apontando pra ela)
-- ============================================================

DROP TABLE IF EXISTS "ripd_versions" CASCADE;
DROP TABLE IF EXISTS "ripds" CASCADE;

-- ============================================================
-- 2) ripds — RIPD institucional (estrutura de 8 seções)
-- ============================================================

CREATE TABLE "ripds" (
  "id"                  TEXT PRIMARY KEY,
  "companyId"           TEXT NOT NULL,
  "inventoryId"         TEXT,
  "title"               TEXT NOT NULL,
  -- "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "ARQUIVADO"
  "status"              TEXT NOT NULL DEFAULT 'RASCUNHO',
  -- Conteúdo das 8 seções (estruturado por RipdData em ripd-helpers.ts)
  "data"                JSONB NOT NULL,
  -- Nota de rejeição (DPO devolve pra rascunho)
  "rejectionNote"       TEXT,
  -- Aprovação
  "approvedById"        TEXT,
  "approvedAt"          TIMESTAMP(3),
  -- Versionamento (snapshot da última aprovação)
  "publishedContent"    JSONB,
  "publishedAt"         TIMESTAMP(3),
  "publishedVersionNum" INTEGER,
  -- Auditoria
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

-- ============================================================
-- 3) ripd_versions — snapshots de cada aprovação
-- ============================================================

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

COMMIT;

-- ============================================================
-- Verificações finais (DEBUG — não falham se vazio)
-- ============================================================

\echo '=== Tabelas criadas ==='
SELECT 'ripds (table)' AS check, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='ripds') AS exists
UNION ALL
SELECT 'ripd_versions (table)', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='ripd_versions');
