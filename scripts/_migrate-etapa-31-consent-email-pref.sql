-- ============================================================
-- Etapa 31 — Toggle de email pra aceite/revogação de Termo de Consentimento
-- ============================================================
-- Adiciona 1 boolean opt-out pra DPOs receberem notificação em tempo real
-- a cada aceite ou revogação coletado num Termo de Consentimento da
-- organização. Default true (DPO já tem responsabilidade de acompanhar
-- a base legal Consentimento).
-- Idempotente — pode rodar múltiplas vezes sem erro.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailNotifyConsent" BOOLEAN NOT NULL DEFAULT true;
