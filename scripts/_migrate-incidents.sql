-- ============================================================
-- Etapa 17 — Incidentes refatorado (Checkpoint 16)
-- ============================================================
-- Substitui o módulo Incidentes legado (placeholder do template Abacus
-- original) pela estrutura definitiva: workflow de 7 estados, severidade
-- ALTO/MEDIO/BAIXO, datas-chave (occurredAt/detectedAt/anpdNotifiedAt/
-- subjectsNotifiedAt/closedAt), histórico de comunicações, plug Plano
-- de Ação (refIncidentId), auditoria (createdById/closedById).
--
-- Idempotente: pode rodar 2x sem erro. As migrações de COLUNAS usam
-- IF NOT EXISTS; as transformações de DADO usam UPDATE WHERE com filtros
-- que param de existir após a primeira aplicação.
--
-- Mapeamento legado → novo:
--   detectionDate           → detectedAt (rename, mantém valor)
--   anpdReportDate          → anpdNotifiedAt (rename, mantém valor)
--   affectedData (text)     → affectedDataTypes (rename, mantém valor)
--   affectedSubjects (int)  → affectedSubjectsCount (rename, mantém valor)
--   cause (text)            → rootCause (rename, mantém valor)
--   containmentActions      → containmentMeasures (rename)
--   correctiveActions       → correctiveMeasures (rename)
--   preventiveActions       → DROP (consolidado em correctiveMeasures)
--   reportDate              → DROP (createdAt já marca registro)
--   reportedToAnpd (bool)   → DROP (derivado: anpdNotifiedAt IS NOT NULL)
--   status legado → mapeado abaixo via UPDATE
--   severity legado → mapeado abaixo via UPDATE
-- ============================================================

BEGIN;

-- ----- 1. Renomear colunas existentes -----

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='detectionDate') THEN
    ALTER TABLE "incidents" RENAME COLUMN "detectionDate" TO "detectedAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='anpdReportDate') THEN
    ALTER TABLE "incidents" RENAME COLUMN "anpdReportDate" TO "anpdNotifiedAt";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='affectedData') THEN
    ALTER TABLE "incidents" RENAME COLUMN "affectedData" TO "affectedDataTypes";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='affectedSubjects') THEN
    ALTER TABLE "incidents" RENAME COLUMN "affectedSubjects" TO "affectedSubjectsCount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='cause') THEN
    ALTER TABLE "incidents" RENAME COLUMN "cause" TO "rootCause";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='containmentActions') THEN
    ALTER TABLE "incidents" RENAME COLUMN "containmentActions" TO "containmentMeasures";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='incidents' AND column_name='correctiveActions') THEN
    ALTER TABLE "incidents" RENAME COLUMN "correctiveActions" TO "correctiveMeasures";
  END IF;
END $$;

-- ----- 2. Adicionar colunas novas (idempotente) -----

ALTER TABLE "incidents"
  ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subjectsNotifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hasSensitiveData" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "affectedSubjectsCategories" TEXT,
  ADD COLUMN IF NOT EXISTS "attackVector" TEXT,
  ADD COLUMN IF NOT EXISTS "affectedSystems" TEXT,
  ADD COLUMN IF NOT EXISTS "affectedOperators" TEXT,
  ADD COLUMN IF NOT EXISTS "riskAssessment" TEXT,
  ADD COLUMN IF NOT EXISTS "securityMeasuresInPlace" TEXT,
  ADD COLUMN IF NOT EXISTS "delayJustification" TEXT,
  ADD COLUMN IF NOT EXISTS "closureNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "closedById" TEXT;

-- ----- 3. Mapear status legado → novo -----

UPDATE "incidents" SET "status" = 'DETECTADO'
  WHERE "status" IN ('Aberto', 'aberto', 'Pendente', 'pendente');
UPDATE "incidents" SET "status" = 'EM_ANALISE'
  WHERE "status" IN ('Em análise', 'Em analise', 'Em Análise', 'em_analise');
UPDATE "incidents" SET "status" = 'EM_CONTENCAO'
  WHERE "status" IN ('Em contenção', 'Em Contenção', 'em_contencao');
UPDATE "incidents" SET "status" = 'ENCERRADO'
  WHERE "status" IN ('Resolvido', 'Fechado', 'Encerrado', 'resolvido', 'fechado');
UPDATE "incidents" SET "status" = 'FALSO_POSITIVO'
  WHERE "status" IN ('Falso positivo', 'falso_positivo');
-- Default seguro pra qualquer status legado não mapeado
UPDATE "incidents" SET "status" = 'DETECTADO'
  WHERE "status" NOT IN (
    'DETECTADO', 'EM_ANALISE', 'EM_CONTENCAO', 'COMUNICADO_ANPD',
    'COMUNICADO_TITULARES', 'ENCERRADO', 'FALSO_POSITIVO'
  );

-- ----- 4. Mapear severity legado → novo -----

UPDATE "incidents" SET "severity" = 'ALTO'
  WHERE "severity" IN ('Alta', 'alta', 'Crítica', 'Critica', 'critica', 'Critical');
UPDATE "incidents" SET "severity" = 'MEDIO'
  WHERE "severity" IN ('Média', 'Media', 'media', 'Medium');
UPDATE "incidents" SET "severity" = 'BAIXO'
  WHERE "severity" IN ('Baixa', 'baixa', 'Low');
-- Default seguro
UPDATE "incidents" SET "severity" = 'MEDIO'
  WHERE "severity" NOT IN ('ALTO', 'MEDIO', 'BAIXO');

-- ----- 5. Mapear incidentType legado → enum interno -----

UPDATE "incidents" SET "incidentType" = 'VAZAMENTO'
  WHERE "incidentType" ILIKE '%vazamento%';
UPDATE "incidents" SET "incidentType" = 'ACESSO_NAO_AUTORIZADO'
  WHERE "incidentType" ILIKE '%acesso%';
UPDATE "incidents" SET "incidentType" = 'PERDA'
  WHERE "incidentType" ILIKE '%perda%';
UPDATE "incidents" SET "incidentType" = 'ALTERACAO_INDEVIDA'
  WHERE "incidentType" ILIKE '%altera%';
UPDATE "incidents" SET "incidentType" = 'INDISPONIBILIDADE'
  WHERE "incidentType" ILIKE '%indisp%';
UPDATE "incidents" SET "incidentType" = 'OUTRO'
  WHERE "incidentType" NOT IN (
    'VAZAMENTO', 'ACESSO_NAO_AUTORIZADO', 'PERDA',
    'ALTERACAO_INDEVIDA', 'INDISPONIBILIDADE', 'OUTRO'
  );

-- ----- 6. Drop colunas legadas (consolidam-se em outras) -----

ALTER TABLE "incidents"
  DROP COLUMN IF EXISTS "preventiveActions",
  DROP COLUMN IF EXISTS "reportDate",
  DROP COLUMN IF EXISTS "reportedToAnpd";

-- ----- 7. Defaults novos do Prisma + drop NOT NULL nas colunas
--          que viraram opcionais no schema novo -----

ALTER TABLE "incidents"
  ALTER COLUMN "status" SET DEFAULT 'DETECTADO',
  ALTER COLUMN "severity" SET DEFAULT 'MEDIO';

-- O legado tinha `affectedData` NOT NULL; o schema novo torna o campo
-- (renomeado pra affectedDataTypes) opcional pra permitir registro
-- rápido de incidente em emergência.
ALTER TABLE "incidents"
  ALTER COLUMN "affectedDataTypes" DROP NOT NULL;

-- ----- 8. FKs de auditoria -----

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_createdById_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_closedById_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_closedById_fkey"
      FOREIGN KEY ("closedById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ----- 9. Índices -----

CREATE INDEX IF NOT EXISTS "incidents_companyId_status_idx"
  ON "incidents"("companyId", "status");
CREATE INDEX IF NOT EXISTS "incidents_companyId_severity_idx"
  ON "incidents"("companyId", "severity");
CREATE INDEX IF NOT EXISTS "incidents_companyId_detectedAt_idx"
  ON "incidents"("companyId", "detectedAt");

-- ----- 10. Tabela incident_communications -----

CREATE TABLE IF NOT EXISTS "incident_communications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "incidentId" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "channel" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_communications_incidentId_fkey') THEN
    ALTER TABLE "incident_communications" ADD CONSTRAINT "incident_communications_incidentId_fkey"
      FOREIGN KEY ("incidentId") REFERENCES "incidents"(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incident_communications_createdById_fkey') THEN
    ALTER TABLE "incident_communications" ADD CONSTRAINT "incident_communications_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "incident_communications_incidentId_idx"
  ON "incident_communications"("incidentId");

-- ----- 11. action_plans.refIncidentId -----

ALTER TABLE "action_plans"
  ADD COLUMN IF NOT EXISTS "refIncidentId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_refIncidentId_fkey') THEN
    ALTER TABLE "action_plans" ADD CONSTRAINT "action_plans_refIncidentId_fkey"
      FOREIGN KEY ("refIncidentId") REFERENCES "incidents"(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "action_plans_companyId_refIncidentId_idx"
  ON "action_plans"("companyId", "refIncidentId");

COMMIT;

-- ----- Verificação -----
\echo ''
\echo '=== Etapa 17 — Verificação ==='
SELECT 'incidents.detectedAt', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='detectedAt');
SELECT 'incidents.anpdNotifiedAt', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='anpdNotifiedAt');
SELECT 'incidents.hasSensitiveData', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='hasSensitiveData');
SELECT 'incidents.createdById', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='incidents' AND column_name='createdById');
SELECT 'incident_communications (table)', EXISTS (SELECT 1 FROM information_schema.tables
  WHERE table_name='incident_communications');
SELECT 'action_plans.refIncidentId', EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='action_plans' AND column_name='refIncidentId');
