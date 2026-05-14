-- ============================================================
-- Migração: Maturidade Cibernética — NIST CSF (Etapa 21 / Checkpoint 22)
-- ============================================================
-- Cria as tabelas pra avaliação de práticas de segurança da informação
-- usando o framework NIST CSF v1.1 (5 funções × ~16 categorias × ~80
-- subcategorias). Estrutura paralela ao GAP Analysis (Etapa 8).
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) cyber_answers — 1 linha por controle respondido
-- ============================================================

CREATE TABLE IF NOT EXISTS "cyber_answers" (
  "id"            TEXT PRIMARY KEY,
  "companyId"     TEXT NOT NULL,
  "controlCode"   TEXT NOT NULL,
  -- "ADERENTE" | "PARCIAL" | "NAO_ADERENTE" | "NAO_APLICA" | "DELEGADO_TI"
  "aderencia"     TEXT NOT NULL,
  "pontoMelhoria" TEXT,
  "evidence"      TEXT,
  -- "GAP" | "INCIDENTES" | "CAPACITACAO" | "TERCEIROS" | NULL
  "evidenceFrom"  TEXT,
  "delegatedToId" TEXT,
  "delegatedAt"   TIMESTAMP(3),
  "delegatedDue"  TIMESTAMP(3),
  "answeredById"  TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cyber_answers_companyId_fkey') THEN
    ALTER TABLE "cyber_answers" ADD CONSTRAINT "cyber_answers_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cyber_answers_delegatedToId_fkey') THEN
    ALTER TABLE "cyber_answers" ADD CONSTRAINT "cyber_answers_delegatedToId_fkey"
      FOREIGN KEY ("delegatedToId") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cyber_answers_answeredById_fkey') THEN
    ALTER TABLE "cyber_answers" ADD CONSTRAINT "cyber_answers_answeredById_fkey"
      FOREIGN KEY ("answeredById") REFERENCES "users"(id) ON DELETE NO ACTION;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cyber_answers_companyId_controlCode_key"
  ON "cyber_answers"("companyId", "controlCode");
CREATE INDEX IF NOT EXISTS "cyber_answers_companyId_aderencia_idx"
  ON "cyber_answers"("companyId", "aderencia");
CREATE INDEX IF NOT EXISTS "cyber_answers_delegatedToId_idx"
  ON "cyber_answers"("delegatedToId");

-- ============================================================
-- 2) cyber_snapshots — versões congeladas pra histórico
-- ============================================================

CREATE TABLE IF NOT EXISTS "cyber_snapshots" (
  "id"          TEXT PRIMARY KEY,
  "companyId"   TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "answers"     JSONB NOT NULL,
  "score"       JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cyber_snapshots_companyId_fkey') THEN
    ALTER TABLE "cyber_snapshots" ADD CONSTRAINT "cyber_snapshots_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cyber_snapshots_createdById_fkey') THEN
    ALTER TABLE "cyber_snapshots" ADD CONSTRAINT "cyber_snapshots_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "cyber_snapshots_companyId_createdAt_idx"
  ON "cyber_snapshots"("companyId", "createdAt");

COMMIT;

\echo '=== Tabelas criadas ==='
SELECT 'cyber_answers (table)' AS check, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='cyber_answers') AS exists
UNION ALL
SELECT 'cyber_snapshots (table)', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='cyber_snapshots');
