-- ============================================================
-- Migração: PSI — Política de Segurança da Informação (Etapa 23 / Checkpoint 26)
-- ============================================================
-- Cria as tabelas pra documentar a Política de Segurança da Informação
-- — documento institucional formal cumprindo LGPD Art. 50 §1º (programa
-- de governança) e referenciando ISO/IEC 27001/27002 + NIST CSF.
--
-- Estrutura paralela ao RIPD (Etapa 12), Políticas (Etapa 11) e LIA
-- (Etapa 20). Workflow Contribuidor → DPO com versionamento.
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) psis — Documento PSI institucional (7 seções em JSON)
-- ============================================================

CREATE TABLE IF NOT EXISTS "psis" (
  "id"                  TEXT PRIMARY KEY,
  "companyId"           TEXT NOT NULL,
  "title"               TEXT NOT NULL,
  -- "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "ARQUIVADO"
  "status"              TEXT NOT NULL DEFAULT 'RASCUNHO',
  -- Conteúdo das 7 seções (estrutura PsiData em psi-helpers.ts)
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
  -- Slug único pra URL pública /psi/<companySlug>/<psiSlug>
  "publicSlug"          TEXT,
  -- Auditoria
  "createdById"         TEXT NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "psis_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "psis_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "psis_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION
);

CREATE INDEX IF NOT EXISTS "psis_companyId_status_idx"
  ON "psis"("companyId", "status");
CREATE INDEX IF NOT EXISTS "psis_companyId_createdById_idx"
  ON "psis"("companyId", "createdById");
CREATE UNIQUE INDEX IF NOT EXISTS "psis_publicSlug_key"
  ON "psis"("publicSlug");

-- ============================================================
-- 2) psi_versions — snapshots de cada aprovação
-- ============================================================

CREATE TABLE IF NOT EXISTS "psi_versions" (
  "id"           TEXT PRIMARY KEY,
  "psiId"        TEXT NOT NULL,
  -- Número da versão (1, 2, 3, ...)
  "version"      INTEGER NOT NULL,
  -- Conteúdo congelado (mesma estrutura JSON de psis.data)
  "content"      JSONB NOT NULL,
  -- Changelog opcional descrito pelo DPO ao aprovar
  "changeLog"    TEXT,
  -- Quando foi aprovada e por quem
  "approvedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" TEXT NOT NULL,

  CONSTRAINT "psi_versions_psiId_fkey"
    FOREIGN KEY ("psiId") REFERENCES "psis"("id") ON DELETE CASCADE,
  CONSTRAINT "psi_versions_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "psi_versions_psiId_version_key"
  ON "psi_versions"("psiId", "version");
CREATE INDEX IF NOT EXISTS "psi_versions_psiId_approvedAt_idx"
  ON "psi_versions"("psiId", "approvedAt");

COMMIT;
