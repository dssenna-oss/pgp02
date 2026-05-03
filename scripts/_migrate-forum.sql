-- ============================================================
-- Migração: Fórum + Mensagens Diretas
-- ============================================================
-- Cria 3 tabelas:
--   * forum_posts        — posts públicos + DMs (recipientId distingue)
--   * forum_replies      — respostas em árvore plana (1 nível)
--   * forum_post_reads   — marca quem leu o que (pra "não lidos")
--
-- Visibilidade:
--   - Posts públicos (recipientId NULL): toda a org
--   - Posts privados (recipientId preenchido): autor + destinatário
--
-- Permissões aplicadas na API:
--   - Discussion: qualquer user cria
--   - Announcement: só DPO
--   - Pin/unpin: só DPO
--   - Edit/delete próprio: todos
--   - Edit/delete de outro: só DPO
--
-- Idempotente — pode rodar várias vezes sem efeito colateral.
-- ============================================================

-- ====================
-- forum_posts
-- ====================
CREATE TABLE IF NOT EXISTS "forum_posts" (
  "id"           TEXT PRIMARY KEY,
  "companyId"    TEXT NOT NULL,
  "authorId"     TEXT NOT NULL,
  "recipientId"  TEXT,
  "type"         TEXT NOT NULL DEFAULT 'DISCUSSION',
  "category"     TEXT,
  "title"        VARCHAR(200) NOT NULL,
  "content"      TEXT NOT NULL,
  "pinned"       BOOLEAN NOT NULL DEFAULT false,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_companyId_fkey') THEN
    ALTER TABLE "forum_posts"
      ADD CONSTRAINT "forum_posts_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_authorId_fkey') THEN
    ALTER TABLE "forum_posts"
      ADD CONSTRAINT "forum_posts_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_posts_recipientId_fkey') THEN
    ALTER TABLE "forum_posts"
      ADD CONSTRAINT "forum_posts_recipientId_fkey"
      FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "forum_posts_companyId_recipientId_idx"
  ON "forum_posts"("companyId", "recipientId");
CREATE INDEX IF NOT EXISTS "forum_posts_companyId_pinned_createdAt_idx"
  ON "forum_posts"("companyId", "pinned", "createdAt");
CREATE INDEX IF NOT EXISTS "forum_posts_companyId_category_idx"
  ON "forum_posts"("companyId", "category");
CREATE INDEX IF NOT EXISTS "forum_posts_authorId_idx"
  ON "forum_posts"("authorId");
CREATE INDEX IF NOT EXISTS "forum_posts_recipientId_idx"
  ON "forum_posts"("recipientId");

-- ====================
-- forum_replies
-- ====================
CREATE TABLE IF NOT EXISTS "forum_replies" (
  "id"        TEXT PRIMARY KEY,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_postId_fkey') THEN
    ALTER TABLE "forum_replies"
      ADD CONSTRAINT "forum_replies_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_replies_authorId_fkey') THEN
    ALTER TABLE "forum_replies"
      ADD CONSTRAINT "forum_replies_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "forum_replies_postId_idx"
  ON "forum_replies"("postId");
CREATE INDEX IF NOT EXISTS "forum_replies_authorId_idx"
  ON "forum_replies"("authorId");

-- ====================
-- forum_post_reads
-- ====================
CREATE TABLE IF NOT EXISTS "forum_post_reads" (
  "id"     TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_post_reads_postId_fkey') THEN
    ALTER TABLE "forum_post_reads"
      ADD CONSTRAINT "forum_post_reads_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'forum_post_reads_userId_fkey') THEN
    ALTER TABLE "forum_post_reads"
      ADD CONSTRAINT "forum_post_reads_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "forum_post_reads_postId_userId_key"
  ON "forum_post_reads"("postId", "userId");
CREATE INDEX IF NOT EXISTS "forum_post_reads_userId_idx"
  ON "forum_post_reads"("userId");
