-- ============================================================
-- Migração: LIA — Avaliação de Legítimo Interesse (Etapa 20 / Checkpoint 21)
-- ============================================================
-- Cria as tabelas pra documentar a avaliação de Art. 7º IX LGPD —
-- modelo institucional em 3 etapas (Finalidade · Necessidade ·
-- Balanceamento) com fluxo Contribuidor → DPO e versionamento.
--
-- Estrutura paralela ao RIPD (Etapa 12) e Políticas (Etapa 11).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) lias — LIA institucional (3 etapas em JSON)
-- ============================================================

CREATE TABLE IF NOT EXISTS "lias" (
  "id"                  TEXT PRIMARY KEY,
  "companyId"           TEXT NOT NULL,
  "inventoryId"         TEXT,
  "title"               TEXT NOT NULL,
  -- "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "ARQUIVADO"
  "status"              TEXT NOT NULL DEFAULT 'RASCUNHO',
  -- Conteúdo das 3 etapas (estruturado por LiaData em lia-helpers.ts)
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

  CONSTRAINT "lias_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "lias_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "data_inventories"("id") ON DELETE SET NULL,
  CONSTRAINT "lias_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "lias_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "lias_companyId_status_idx"
  ON "lias"("companyId", "status");
CREATE INDEX IF NOT EXISTS "lias_companyId_createdById_idx"
  ON "lias"("companyId", "createdById");
CREATE INDEX IF NOT EXISTS "lias_inventoryId_idx"
  ON "lias"("inventoryId");

-- ============================================================
-- 2) lia_versions — snapshots de cada aprovação
-- ============================================================

CREATE TABLE IF NOT EXISTS "lia_versions" (
  "id"           TEXT PRIMARY KEY,
  "liaId"        TEXT NOT NULL,
  "version"      INTEGER NOT NULL,
  "content"      JSONB NOT NULL,
  "changeLog"    TEXT,
  "approvedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" TEXT NOT NULL,

  CONSTRAINT "lia_versions_liaId_fkey"
    FOREIGN KEY ("liaId") REFERENCES "lias"("id") ON DELETE CASCADE,
  CONSTRAINT "lia_versions_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "lia_versions_liaId_version_key"
  ON "lia_versions"("liaId", "version");
CREATE INDEX IF NOT EXISTS "lia_versions_liaId_approvedAt_idx"
  ON "lia_versions"("liaId", "approvedAt");

COMMIT;

-- ============================================================
-- Verificações finais (DEBUG — não falham se vazio)
-- ============================================================

\echo '=== Tabelas criadas ==='
SELECT 'lias (table)' AS check, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='lias') AS exists
UNION ALL
SELECT 'lia_versions (table)', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='lia_versions');
