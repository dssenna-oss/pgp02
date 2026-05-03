-- ============================================================
-- Migração: Tarefas pessoais + Marcadores (próxima feature)
-- ============================================================
-- Cria 2 tabelas:
--   * tasks         — caderno pessoal de cada usuário
--   * task_markers  — tags customizáveis por usuário
--
-- Visibilidade: privada (cada user vê só as próprias). Aviso visual
-- de prazo e contador na sidebar (sem email).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

-- ====================
-- task_markers
-- ====================
CREATE TABLE IF NOT EXISTS "task_markers" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name"      VARCHAR(60) NOT NULL,
  "color"     TEXT NOT NULL DEFAULT 'slate',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_markers_userId_fkey') THEN
    ALTER TABLE "task_markers"
      ADD CONSTRAINT "task_markers_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_markers_companyId_fkey') THEN
    ALTER TABLE "task_markers"
      ADD CONSTRAINT "task_markers_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "task_markers_userId_name_key"
  ON "task_markers"("userId", "name");
CREATE INDEX IF NOT EXISTS "task_markers_userId_idx"
  ON "task_markers"("userId");

-- ====================
-- tasks
-- ====================
CREATE TABLE IF NOT EXISTS "tasks" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "companyId"       TEXT NOT NULL,
  "title"           VARCHAR(200) NOT NULL,
  "description"     TEXT,
  "status"          TEXT NOT NULL DEFAULT 'A_FAZER',
  "priority"        TEXT NOT NULL DEFAULT 'MEDIA',
  "dueDate"         TIMESTAMP(3),
  "markers"         TEXT,
  "dataInventoryId" TEXT,
  "completedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_userId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_companyId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_dataInventoryId_fkey') THEN
    ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_dataInventoryId_fkey"
      FOREIGN KEY ("dataInventoryId") REFERENCES "data_inventories"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "tasks_userId_status_idx"
  ON "tasks"("userId", "status");
CREATE INDEX IF NOT EXISTS "tasks_userId_dueDate_idx"
  ON "tasks"("userId", "dueDate");
CREATE INDEX IF NOT EXISTS "tasks_companyId_idx"
  ON "tasks"("companyId");
