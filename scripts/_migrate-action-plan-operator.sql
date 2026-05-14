-- ============================================================
-- Migração: refOperatorId no Plano de Ação (Etapa 15 / Checkpoint 14 — G4)
-- ============================================================
-- Adiciona o ref polimórfico `refOperatorId` em `action_plans` pra
-- suportar a nova origem `OPERADOR` (ações vindas da Gestão de
-- Terceiros — contratos vencidos, sem cláusulas, score baixo, etc.).
--
-- Idempotente.
-- ============================================================

BEGIN;

ALTER TABLE "action_plans"
  ADD COLUMN IF NOT EXISTS "refOperatorId" TEXT;

CREATE INDEX IF NOT EXISTS "action_plans_companyId_refOperatorId_idx"
  ON "action_plans"("companyId", "refOperatorId");

COMMIT;

\echo '=== Verificação ==='
SELECT 'action_plans.refOperatorId',
  EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name='action_plans' AND column_name='refOperatorId');
