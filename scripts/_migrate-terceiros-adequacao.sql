-- ============================================================
-- Migração: Adequação de Terceiros (Etapa 16 / Checkpoint 14 — H1)
-- ============================================================
-- Adiciona suporte a "campanha de adequação" pra contratos vigentes
-- pré-LGPD: status do ciclo de adequação + data do contrato original
-- (separada da `contractSignedAt` que vai virar a data do termo aditivo).
--
-- Idempotente.
-- ============================================================

BEGIN;

ALTER TABLE "operators"
  ADD COLUMN IF NOT EXISTS "lgpdComplianceStatus" TEXT NOT NULL DEFAULT 'NAO_AVALIADO',
  ADD COLUMN IF NOT EXISTS "contractOriginalDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "operators_companyId_lgpdComplianceStatus_idx"
  ON "operators"("companyId", "lgpdComplianceStatus");

COMMIT;

\echo '=== Verificação ==='
SELECT 'operators.lgpdComplianceStatus',
  EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name='operators' AND column_name='lgpdComplianceStatus')
UNION ALL
SELECT 'operators.contractOriginalDate',
  EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name='operators' AND column_name='contractOriginalDate');
