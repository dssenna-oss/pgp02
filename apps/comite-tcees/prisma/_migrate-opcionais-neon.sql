-- =============================================================================
-- Lote "ideias opcionais" (2026-06-02) — custo por entrega (item 5).
-- Rodar no Neon → SQL Editor. Aditivo e idempotente.
-- (Os demais itens do lote não exigem mudança de banco.)
-- =============================================================================

ALTER TABLE "entregas" ADD COLUMN IF NOT EXISTS "custo" DOUBLE PRECISION;
