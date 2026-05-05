-- ============================================================
-- Etapa 18 — Capacitação LGPD (Checkpoint 18)
-- ============================================================
-- Cria a tabela `capacitacao_eventos` para registro temporal de evidências
-- de capacitações promovidas pela organização (Art. 41§2º I, 50, 6º VIII,
-- 52§1º VIII LGPD).
--
-- Idempotente: pode rodar 2x sem erro.
-- ============================================================

CREATE TABLE IF NOT EXISTS "capacitacao_eventos" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "companyId"       TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "description"     TEXT,
  "eixo"            TEXT NOT NULL,
  "type"            TEXT NOT NULL,
  "audience"        TEXT NOT NULL,
  "scheduledAt"     TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "status"          TEXT NOT NULL DEFAULT 'PLANEJADO',
  "recurrence"      TEXT NOT NULL DEFAULT 'UNICO',
  "evidenceUrl"     TEXT,
  "evidenceFileName" TEXT,
  "attendeesCount"  INTEGER,
  "notes"           TEXT,
  "operatorId"      TEXT,
  "incidentId"      TEXT,
  "createdById"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'capacitacao_eventos_companyId_fkey') THEN
    ALTER TABLE "capacitacao_eventos" ADD CONSTRAINT "capacitacao_eventos_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'capacitacao_eventos_operatorId_fkey') THEN
    ALTER TABLE "capacitacao_eventos" ADD CONSTRAINT "capacitacao_eventos_operatorId_fkey"
      FOREIGN KEY ("operatorId") REFERENCES "operators"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'capacitacao_eventos_incidentId_fkey') THEN
    ALTER TABLE "capacitacao_eventos" ADD CONSTRAINT "capacitacao_eventos_incidentId_fkey"
      FOREIGN KEY ("incidentId") REFERENCES "incidents"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'capacitacao_eventos_createdById_fkey') THEN
    ALTER TABLE "capacitacao_eventos" ADD CONSTRAINT "capacitacao_eventos_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "capacitacao_eventos_companyId_status_idx"
  ON "capacitacao_eventos"("companyId", "status");
CREATE INDEX IF NOT EXISTS "capacitacao_eventos_companyId_scheduledAt_idx"
  ON "capacitacao_eventos"("companyId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "capacitacao_eventos_companyId_eixo_idx"
  ON "capacitacao_eventos"("companyId", "eixo");
CREATE INDEX IF NOT EXISTS "capacitacao_eventos_companyId_audience_idx"
  ON "capacitacao_eventos"("companyId", "audience");
CREATE INDEX IF NOT EXISTS "capacitacao_eventos_operatorId_idx"
  ON "capacitacao_eventos"("operatorId");
CREATE INDEX IF NOT EXISTS "capacitacao_eventos_incidentId_idx"
  ON "capacitacao_eventos"("incidentId");
