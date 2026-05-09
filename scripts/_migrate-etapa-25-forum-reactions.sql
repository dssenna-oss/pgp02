-- ============================================================
-- Etapa 25 — ForumReaction (reações em posts do fórum)
-- ============================================================
-- Adiciona tabela de reações com 1 reação por (post, user).
-- Idempotente — pode rodar múltiplas vezes sem erro.

-- Cria tabela `forum_reactions`
CREATE TABLE IF NOT EXISTS "forum_reactions" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "emoji"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "forum_reactions_pkey" PRIMARY KEY ("id")
);

-- Constraint única: 1 reação por (post, user)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_reactions_postId_userId_key'
  ) THEN
    ALTER TABLE "forum_reactions"
      ADD CONSTRAINT "forum_reactions_postId_userId_key" UNIQUE ("postId", "userId");
  END IF;
END $$;

-- FKs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_reactions_postId_fkey'
  ) THEN
    ALTER TABLE "forum_reactions"
      ADD CONSTRAINT "forum_reactions_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_reactions_userId_fkey'
  ) THEN
    ALTER TABLE "forum_reactions"
      ADD CONSTRAINT "forum_reactions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Índices auxiliares (postId já tem index pelo unique constraint, mas
-- adicionamos um pra userId pra lookup reverso eficiente)
CREATE INDEX IF NOT EXISTS "forum_reactions_postId_idx"
  ON "forum_reactions"("postId");
CREATE INDEX IF NOT EXISTS "forum_reactions_userId_idx"
  ON "forum_reactions"("userId");
