-- ============================================================
-- Migração: GAP Analysis (Checkpoint 9) — Etapa 8
-- ============================================================
-- Cria 2 tabelas:
--   * gap_answers   — 1 linha por (companyId, controlCode); cada linha
--                     replica 1 LINHA do template oficial (XLSX)
--   * gap_snapshots — versões congeladas das respostas (decisão 2c)
--
-- Substitui a tabela legada `gap_analyses` (placeholder Abacus que
-- nunca foi usado de verdade — DROP seguro com IF EXISTS).
--
-- Catálogo dos 119 controles fica em código (`lib/gap-catalog.ts`),
-- gerado a partir de `scripts/_gap-modelo-em-branco.xlsx` pelo script
-- `scripts/generate-gap-catalog.ts`.
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

-- Drop do placeholder Abacus (se existir)
DROP TABLE IF EXISTS "gap_analyses" CASCADE;

-- ====================
-- gap_answers
-- ====================
CREATE TABLE IF NOT EXISTS "gap_answers" (
  "id"             TEXT PRIMARY KEY,
  "companyId"      TEXT NOT NULL,
  "controlCode"    TEXT NOT NULL,
  "cenarioAtual"   TEXT,
  "mapeamento"     TEXT,
  "aderencia"      TEXT,
  "pontoMelhoria"  TEXT,
  "autoSuggested"  BOOLEAN NOT NULL DEFAULT false,
  "answeredById"   TEXT,
  "answeredAt"     TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_answers_companyId_fkey') THEN
    ALTER TABLE "gap_answers"
      ADD CONSTRAINT "gap_answers_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_answers_answeredById_fkey') THEN
    ALTER TABLE "gap_answers"
      ADD CONSTRAINT "gap_answers_answeredById_fkey"
      FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "gap_answers_companyId_controlCode_key"
  ON "gap_answers"("companyId", "controlCode");
CREATE INDEX IF NOT EXISTS "gap_answers_companyId_mapeamento_idx"
  ON "gap_answers"("companyId", "mapeamento");
CREATE INDEX IF NOT EXISTS "gap_answers_companyId_aderencia_idx"
  ON "gap_answers"("companyId", "aderencia");

-- ====================
-- gap_snapshots
-- ====================
CREATE TABLE IF NOT EXISTS "gap_snapshots" (
  "id"          TEXT PRIMARY KEY,
  "companyId"   TEXT NOT NULL,
  "label"       VARCHAR(120) NOT NULL,
  "notes"       TEXT,
  "payload"     JSONB NOT NULL,
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_snapshots_companyId_fkey') THEN
    ALTER TABLE "gap_snapshots"
      ADD CONSTRAINT "gap_snapshots_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gap_snapshots_createdById_fkey') THEN
    ALTER TABLE "gap_snapshots"
      ADD CONSTRAINT "gap_snapshots_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "gap_snapshots_companyId_createdAt_idx"
  ON "gap_snapshots"("companyId", "createdAt");
