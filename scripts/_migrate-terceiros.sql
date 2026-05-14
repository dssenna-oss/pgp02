-- ============================================================
-- Migração: Gestão de Terceiros (Etapa 13 / Checkpoint 14 — G1)
-- ============================================================
-- Cria as tabelas `operators` + `operator_process_links` pra suportar
-- a metodologia de gestão de risco de terceiros (inspirada nos
-- materiais da Denise — consultoria PGP).
--
-- Estrutura:
--   - 1 Operator = 1 terceiro/fornecedor (com contrato embutido)
--   - 1 OperatorProcessLink = vínculo M:N entre Operator e
--     DataInventory (qual processo o operador trata)
--
-- Idempotente — pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) operators — entidade jurídica do terceiro + contrato
-- ============================================================

CREATE TABLE IF NOT EXISTS "operators" (
  "id"                              TEXT PRIMARY KEY,
  "companyId"                       TEXT NOT NULL,

  -- Identificação
  "name"                            TEXT NOT NULL,
  "tradeName"                       TEXT,
  "cnpj"                            TEXT,
  "country"                         TEXT DEFAULT 'Brasil',
  "operatorType"                    TEXT,
  "description"                     TEXT,
  "notes"                           TEXT,

  -- Posição na relação
  "relationType"                    TEXT NOT NULL DEFAULT 'INDEFINIDO',
  "classificationAnswers"           JSONB,

  -- Contato do DPO do terceiro
  "thirdPartyDpoName"               TEXT,
  "thirdPartyDpoEmail"              TEXT,
  "thirdPartyDpoPhone"              TEXT,

  -- Responsável interno (User da Company)
  "responsibleId"                   TEXT,

  -- Termo de Confidencialidade
  "confidentialityTermSignedAt"     TIMESTAMP(3),
  "confidentialityTermAttachment"   TEXT,

  -- Contrato
  "contractLabel"                   TEXT,
  "contractSignedAt"                TIMESTAMP(3),
  "contractExpiresAt"               TIMESTAMP(3),
  "contractLastReviewedAt"          TIMESTAMP(3),
  "contractStatus"                  TEXT NOT NULL DEFAULT 'SEM_CONTRATO',

  -- Régua de risco do contrato (6 critérios ANPD)
  "largaEscala"                     BOOLEAN NOT NULL DEFAULT false,
  "afetaTitulares"                  BOOLEAN NOT NULL DEFAULT false,
  "novasTecnologias"                BOOLEAN NOT NULL DEFAULT false,
  "vigilanciaPublica"               BOOLEAN NOT NULL DEFAULT false,
  "decisaoAutomatizada"             BOOLEAN NOT NULL DEFAULT false,
  "dadosSensiveis"                  BOOLEAN NOT NULL DEFAULT false,
  "contractRiskClass"               TEXT NOT NULL DEFAULT 'BAIXO',

  -- Cláusula recomendada (calculada)
  "recommendedClause"               TEXT NOT NULL DEFAULT 'INDEFINIDO',

  -- Cláusulas presentes no contrato atual
  "hasPrivacyClause"                BOOLEAN NOT NULL DEFAULT false,
  "hasIncidentClause"               BOOLEAN NOT NULL DEFAULT false,
  "incidentNotificationDays"        INTEGER,
  "permitsSubcontracting"           BOOLEAN NOT NULL DEFAULT false,
  "permitsInternationalTransfer"    BOOLEAN NOT NULL DEFAULT false,
  "isStandardMinute"                BOOLEAN NOT NULL DEFAULT false,

  -- Anexos (Vercel Blob paths)
  "contractAttachments"             JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Auditoria
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

-- ============================================================
-- 2) operator_process_links — vínculo Operator ↔ DataInventory
-- ============================================================

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

COMMIT;

-- ============================================================
-- Verificações finais
-- ============================================================

\echo '=== Tabelas criadas ==='
SELECT 'operators (table)' AS check, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='operators') AS exists
UNION ALL
SELECT 'operators.contractRiskClass', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operators' AND column_name='contractRiskClass')
UNION ALL
SELECT 'operator_process_links (table)', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='operator_process_links');
