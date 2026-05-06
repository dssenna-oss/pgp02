-- ============================================================
-- Migração: Plano de Ação ↔ Maturidade Cibernética (Etapa 22 / CP22 Fatia 3)
-- ============================================================
-- Adiciona refCyberCode em action_plans pra rastrear ações geradas
-- automaticamente a partir de controles NIST CSF não aderentes.
-- Idempotente.
-- ============================================================

BEGIN;

ALTER TABLE "action_plans"
  ADD COLUMN IF NOT EXISTS "refCyberCode" TEXT;

CREATE INDEX IF NOT EXISTS "action_plans_companyId_refCyberCode_idx"
  ON "action_plans"("companyId", "refCyberCode");

COMMIT;

\echo '=== Coluna criada ==='
SELECT 'action_plans.refCyberCode' AS check,
  EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='action_plans' AND column_name='refCyberCode') AS exists;
