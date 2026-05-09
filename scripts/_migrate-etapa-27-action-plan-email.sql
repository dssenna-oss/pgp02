-- ============================================================
-- Etapa 27 — Toggle de email pra ações atrasadas no Plano (DPO-only)
-- ============================================================
-- Adiciona 1 boolean opt-out pra DPOs receberem digest diário do
-- Plano de Ação. Default true (DPO já tem responsabilidade
-- institucional, faz sentido receber por padrão).
-- Idempotente — pode rodar múltiplas vezes sem erro.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailNotifyActionPlan" BOOLEAN NOT NULL DEFAULT true;
