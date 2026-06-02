-- =============================================================================
-- Tarefas + responsável por processo (atribuição do inventário a membros)
-- Rodar no Neon → SQL Editor ANTES de fazer o deploy do código.
-- Aditivo e idempotente (pode rodar mais de uma vez sem erro).
-- =============================================================================

-- 1) Tabela de tarefas
CREATE TABLE IF NOT EXISTS "tarefas" (
  "id"              TEXT PRIMARY KEY,
  "titulo"          TEXT NOT NULL,
  "descricao"       TEXT,
  "responsavelId"   TEXT NOT NULL,
  "responsavelNome" TEXT NOT NULL,
  "criadoPorNome"   TEXT,
  "inventoryId"     TEXT,
  "prazo"           TIMESTAMP(3),
  "prioridade"      TEXT NOT NULL DEFAULT 'MEDIA',
  "status"          TEXT NOT NULL DEFAULT 'A_FAZER',
  "concluidaEm"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "tarefas_responsavelId_idx" ON "tarefas" ("responsavelId");
CREATE INDEX IF NOT EXISTS "tarefas_inventoryId_idx" ON "tarefas" ("inventoryId");

-- FK opcional para o processo (ao excluir o processo, a tarefa fica sem vínculo)
DO $$ BEGIN
  ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_inventoryId_fkey"
    FOREIGN KEY ("inventoryId") REFERENCES "data_inventories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Responsável pelo preenchimento de cada processo do Inventário
ALTER TABLE "data_inventories" ADD COLUMN IF NOT EXISTS "responsavelId"   TEXT;
ALTER TABLE "data_inventories" ADD COLUMN IF NOT EXISTS "responsavelNome" TEXT;
