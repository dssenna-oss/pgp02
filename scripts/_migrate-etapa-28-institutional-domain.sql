-- ============================================================
-- Etapa 28 — Domínio institucional na Company
-- ============================================================
-- Adiciona campo opcional `institutionalDomain` (ex: "tcees.tc.br")
-- pra alimentar o auto-discovery de URLs no modal de
-- "Pré-preencher por Carta de Serviços" (Fatia 2026-05-11).
--
-- Idempotente — pode rodar múltiplas vezes sem erro.
-- Aditivo, opcional, sem default — não quebra nada existente.

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "institutionalDomain" TEXT;
