-- ============================================================
-- Comunicação — Notícias/Artigos (tabela articles)
-- Idempotente. Rodar no Neon ANTES de publicar o código.
-- ============================================================

CREATE TABLE IF NOT EXISTS articles (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'NOTICIA',
  resumo      TEXT,
  conteudo    TEXT NOT NULL DEFAULT '',
  "capaUrl"   TEXT,
  autor       TEXT,
  status      TEXT NOT NULL DEFAULT 'RASCUNHO',
  "publicadoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "articles_status_idx" ON articles (status);

-- conferência: deve retornar 1 (tabela existe)
SELECT count(*) AS tabela_articles_ok FROM information_schema.tables WHERE table_name = 'articles';
