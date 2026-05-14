-- ============================================================
-- Migração: GAP Analysis — campo `notes` (Etapa 9 / Polimento C5)
-- ============================================================
-- Adiciona `notes` (texto livre) no model `GapAnswer`. Espaço pra o
-- DPO registrar contexto interno por controle (links, decisões em
-- andamento, etc.) — separado dos 4 campos formais do template.
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

ALTER TABLE "gap_answers"
  ADD COLUMN IF NOT EXISTS "notes" TEXT;
