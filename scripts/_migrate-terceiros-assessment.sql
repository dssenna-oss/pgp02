-- ============================================================
-- Migração: Avaliação de Terceiros (Etapa 14 / Checkpoint 14 — G2)
-- ============================================================
-- Cria a tabela `operator_assessments` pra suportar o fluxo de
-- avaliação do terceiro via formulário público (52 perguntas).
--
-- Idempotente.
-- ============================================================

BEGIN;

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

COMMIT;

\echo '=== Verificação ==='
SELECT 'operator_assessments (table)' AS check, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='operator_assessments') AS exists
UNION ALL
SELECT 'operator_assessments.publicToken', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='operator_assessments' AND column_name='publicToken');
