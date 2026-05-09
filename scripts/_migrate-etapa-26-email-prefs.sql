-- ============================================================
-- Etapa 26 — Preferências de notificação por email no User
-- ============================================================
-- Adiciona 3 booleans pra opt-in/opt-out de tipos de notificação.
-- Idempotente — pode rodar múltiplas vezes sem erro.

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailNotifyDm" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailNotifyAnnouncements" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailNotifyTaskDue" BOOLEAN NOT NULL DEFAULT false;
