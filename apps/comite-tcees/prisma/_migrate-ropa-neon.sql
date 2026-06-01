-- ============================================================
-- ROPA (Art. 37) — campos novos no Inventário (data_inventories)
-- Idempotente. Rodar no Neon ANTES de publicar o código do ROPA.
-- ============================================================

ALTER TABLE data_inventories ADD COLUMN IF NOT EXISTS "categoriasTitulares"   TEXT;
ALTER TABLE data_inventories ADD COLUMN IF NOT EXISTS "fonteDados"            TEXT;
ALTER TABLE data_inventories ADD COLUMN IF NOT EXISTS "destinatariosInternos" TEXT;
ALTER TABLE data_inventories ADD COLUMN IF NOT EXISTS "transfInternacional"   TEXT;
ALTER TABLE data_inventories ADD COLUMN IF NOT EXISTS "criterioDescarte"      TEXT;

-- conferência: deve listar as 5 colunas novas
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'data_inventories'
   AND column_name IN ('categoriasTitulares','fonteDados','destinatariosInternos','transfInternacional','criterioDescarte')
 ORDER BY column_name;
