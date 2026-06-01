-- ============================================================
-- Notícias/Artigos — anexo (PDF ou URL). Colunas novas em articles.
-- Idempotente. Rodar no Neon ANTES de publicar o código.
-- ============================================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS "anexoTipo" TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS "anexoUrl"  TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS "anexoNome" TEXT;

-- conferência: deve listar as 3 colunas novas
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'articles' AND column_name IN ('anexoTipo','anexoUrl','anexoNome')
 ORDER BY column_name;
